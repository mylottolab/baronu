// 바로너 앱 전화 알림을 더한 판 (2026-11-03) — 이 줄부터 파일 끝까지 통째로 붙여 넣으세요
// =====================================================================
// Alias Next-Gen — alias-push-call Edge Function
// 2026-09-08 · FCM 3단계
// 2026-09-15 🔴 FCM 이 뭐라고 답했는지 로그에 남깁니다
//
// 하는 일은 하나입니다.
//   전화를 건 사람이 이 함수를 부르면, 상대 폰으로 알림을 쏩니다.
//   그러면 상대가 앱을 안 보고 있어도 잠금화면에 전화가 뜹니다.
//
// 순서
//   ① 부른 사람이 누구인지 확인한다 (로그인 토큰)
//   ② peer_push_tokens() 로 "이어져 있는 상대의 기기 번호" 를 받는다
//   ③ 구글에게 잠깐 쓸 출입증을 받는다
//   ④ 기기마다 알림을 쏜다
//
// 🔴 service_role 열쇠를 쓰지 않습니다.
//   peer_public_key 와 같은 방식으로, 부른 사람의 로그인 토큰 그대로
//   함수를 부릅니다. 그 함수 안에서 "정말 이어진 사이인가" 를 검사하므로,
//   남의 링크 번호를 넣어도 아무것도 안 나옵니다.
//
// ⚠ 죽은 기기 번호는 조용히 지웁니다. 앱을 지웠다 깔면 번호가 바뀌는데,
//   옛 번호를 그냥 두면 매번 헛되이 쏘게 됩니다.
//
// 🔴🔴 2026-10-10 — 아이폰 전화(VoIP) 신설
//   아이폰은 앱이 꺼져 있을 때 전화를 울리려면 **애플로 직접** "전화 알림"을
//   보내야 합니다(Firebase 로는 안 됩니다). 아이폰 앱이 따로 받은 "전화용 기기
//   번호"(16진수 64자)는 여기서 애플로 보내고, 나머지(안드로이드 · 아이폰 일반 알림)는
//   지금처럼 Firebase 로 보냅니다.
//   비밀값(Supabase → Edge Functions → Secrets):
//     APNS_KEY_P8   애플 알림 열쇠 파일(AuthKey_….p8) 내용 전체
//     APNS_KEY_ID   열쇠 번호 (예: 9NT924SMWB)
//     APNS_TEAM_ID  팀 번호   (예: HS9245SM63)
//   셋 중 하나라도 없으면 아이폰 전화만 건너뛰고 안드로이드는 그대로 갑니다.
//
// 🔴🔴 2026-09-15 — 전에는 FCM 이 거절해도 **아무 말을 안 했습니다.**
//   거절 이유가 돌려주는 값에는 담겼는데 로그에는 안 남아서, 알림이
//   안 와도 어디가 막혔는지 알 수가 없었습니다(함정 76).
//   이제 쏠 때마다 답을 남깁니다.
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

/* ── 구글 출입증 ─────────────────────────────────────────────────
   구글에 알림을 보내려면 한 시간짜리 출입증이 필요합니다.
   서비스 계정 열쇠로 서명한 쪽지를 내밀면 구글이 내어줍니다.
   ⚠ 매번 받으면 느립니다. 받아두고 55분 동안 다시 씁니다.
------------------------------------------------------------------ */
let cachedToken: string | null = null;
let cachedUntil = 0;

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const raw = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'pkcs8', raw.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  );
}

async function getGoogleToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < cachedUntil) return cachedToken;

  const enc = new TextEncoder();
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned =
    b64url(enc.encode(JSON.stringify(header))) + '.' +
    b64url(enc.encode(JSON.stringify(claim)));

  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(unsigned));
  const jwt = unsigned + '.' + b64url(new Uint8Array(sig));

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const out = await res.json();
  if (!out.access_token) {
    /* 🔴 2026-09-15 — 열쇠가 잘못됐을 때 여기서 걸립니다.
       구글이 준 이유를 그대로 남깁니다. */
    console.error('[push] 🔴 구글 출입증 실패:', JSON.stringify(out));
    throw new Error('구글 출입증을 못 받았습니다: ' + JSON.stringify(out));
  }
  console.log('[push] 구글 출입증 받았습니다');
  cachedToken = out.access_token;
  cachedUntil = now + 3300;   // 55분
  return cachedToken!;
}

/* ── 알림 한 대 쏘기 ───────────────────────────────────────────── */
async function sendOne(projectId: string, accessToken: string, token: string, payload: any) {
  const res = await fetch(
    'https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: Object.assign({ token: token }, payload) }),
    },
  );
  const out = await res.json().catch(() => ({}));

  /* 🔴 2026-09-15 — 답을 반드시 남깁니다.
     기기 번호는 앞 12자만 남깁니다. 통째로 남기면 로그가 지저분하고,
     그 자체가 남의 폰을 가리키는 값이라 굳이 다 적을 필요가 없습니다. */
  const head = String(token).slice(0, 12) + '…';
  if (res.ok) {
    console.log('[push] ✓ 보냈습니다 (' + head + ')');
  } else {
    console.error('[push] 🔴 거절당했습니다 (' + head + ') 코드 ' + res.status +
      ' — ' + JSON.stringify(out).slice(0, 400));
  }
  return { ok: res.ok, status: res.status, out: out };
}

/* ── 🔴 2026-10-10 아이폰 전화(VoIP) — 애플로 직접 ─────────────────── */
const IOS_BUNDLE = 'com.weaveapp.alias';
/* 🔴 2026-11-03 — 바로너 앱(com.weaveapp.baronu)도 같은 서버를 씁니다. 애플이 "다른 앱 번호"(DeviceTokenNotForTopic)라 하면 바로너 앱 번호로 한 번 더 */
const ALT_BUNDLE = 'com.weaveapp.baronu';

/* 아이폰 "전화용 기기 번호" 는 16진수 64자입니다. Firebase 번호는 ':' 가 들어 있어 구별됩니다. */
function isVoipToken(r: any): boolean {
  const t = String(r && r.push_token || '');
  return /^[0-9a-f]{64,200}$/i.test(t) || (r && r.platform === 'ios_voip');
}

let apnsJwt: string | null = null;
let apnsJwtAt = 0;

async function getApnsJwt(): Promise<string | null> {
  const p8 = Deno.env.get('APNS_KEY_P8') || '';
  // 🔴 따옴표 · 빈칸 · 줄바꿈이 섞여 들어와도 영문 · 숫자만 남깁니다
  const kid = (Deno.env.get('APNS_KEY_ID') || '').replace(/[^A-Za-z0-9]/g, '');
  const team = (Deno.env.get('APNS_TEAM_ID') || '').replace(/[^A-Za-z0-9]/g, '');
  if (!p8 || !kid || !team) {
    console.warn('[voip] ⚠ APNS_KEY_P8 · APNS_KEY_ID · APNS_TEAM_ID 중 없는 것이 있습니다. 아이폰 전화를 건너뜁니다.');
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (apnsJwt && now - apnsJwtAt < 50 * 60) return apnsJwt;   // 애플은 20분~60분 사이에 새로 만들라고 합니다

  /* 붙여넣다 줄바꿈이 사라져도 읽히도록, 머리 · 꼬리 · 빈칸을 모두 걷어냅니다 */
  const b64 = p8.replace(/-----[A-Z ]+-----/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
  /* 🔴 2026-10-10 — 어떤 재료로 만드는지 남깁니다(비밀은 남기지 않음).
     열쇠 길이는 애플 알림 열쇠면 보통 200 자입니다. */
  console.log('[voip] 출입증 재료: team=' + team + ' / key=' + kid + ' / 열쇠 길이=' + b64.length);
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', raw.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

  const enc = new TextEncoder();
  const unsigned = b64url(enc.encode(JSON.stringify({ alg: 'ES256', kid: kid }))) + '.' +
                   b64url(enc.encode(JSON.stringify({ iss: team, iat: now })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned));
  apnsJwt = unsigned + '.' + b64url(new Uint8Array(sig));
  apnsJwtAt = now;
  console.log('[voip] 애플 출입증을 만들었습니다 (key=' + kid + ')');
  return apnsJwt;
}

/* 한 대 보내기. 정식(TestFlight · 앱스토어) 주소로 먼저, "모르는 번호" 면 시험용 주소로 한 번 더. */
async function sendVoip(jwt: string, token: string, data: any, sandbox = false, topic = IOS_BUNDLE): Promise<{ ok: boolean; status: number; out: any }> {
  const host = sandbox ? 'https://api.sandbox.push.apple.com' : 'https://api.push.apple.com';
  const res = await fetch(host + '/3/device/' + token, {
    method: 'POST',
    headers: {
      'authorization': 'bearer ' + jwt,
      'apns-topic': topic + '.voip',
      'apns-push-type': 'voip',
      'apns-priority': '10',
      // 40초 안에 못 전하면 버립니다 — 다 끝난 전화가 늦게 울리지 않게
      'apns-expiration': String(Math.floor(Date.now() / 1000) + 40),
      'content-type': 'application/json',
    },
    body: JSON.stringify(Object.assign({ aps: {} }, data)),
  });
  const text = await res.text().catch(() => '');
  let out: any = {};
  try { out = text ? JSON.parse(text) : {}; } catch (_) { out = { raw: text.slice(0, 200) }; }
  const head = String(token).slice(0, 10) + '…';
  if (res.ok) {
    console.log('[voip] ✓ 애플로 보냈습니다 (' + head + (sandbox ? ' · 시험용' : '') + ')');
  } else {
    console.error('[voip] 🔴 애플이 거절 (' + head + ') ' + res.status + ' — ' + JSON.stringify(out).slice(0, 200));
    if (res.status === 403 && out && out.reason === 'InvalidProviderToken') {
      // 출입증이 틀렸습니다 — 다음 번엔 새로 만들게 버립니다
      apnsJwt = null;
      console.error('[voip] 🔴 애플: 출입증이 틀렸습니다. APNS_KEY_P8 이 AuthKey_' + ((Deno.env.get('APNS_KEY_ID') || '').replace(/[^A-Za-z0-9]/g, '')) +
        '.p8 파일 내용인지, APNS_TEAM_ID 가 맞는지 확인하세요.');
    }
    if (!sandbox && res.status === 400 && out && out.reason === 'BadDeviceToken') {
      return await sendVoip(jwt, token, data, true, topic);
    }
    if (res.status === 400 && out && out.reason === 'DeviceTokenNotForTopic' && topic === IOS_BUNDLE) {
      return await sendVoip(jwt, token, data, sandbox, ALT_BUNDLE);
    }
  }
  return { ok: res.ok, status: res.status, out: out };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: CORS });
  }

  try {
    /* ── ① 부른 사람 확인 ── */
    const auth = req.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'not_logged_in' }), { status: 401, headers: CORS });
    }

    const body = await req.json();
    const linkId = body.linkId;
    if (!linkId) {
      return new Response(JSON.stringify({ error: 'linkId 가 필요합니다.' }), { status: 400, headers: CORS });
    }

    /* 부른 사람의 토큰 그대로 씁니다. 그래야 함수 안의 auth.uid() 가 그 사람이 됩니다. */
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: auth } },
    });

    /* ── ② 상대 기기 번호 ── */
    const tk = await sb.rpc('peer_push_tokens', { p_link_id: linkId });
    if (tk.error) {
      console.error('[push] 🔴 기기 번호를 못 읽었습니다:', JSON.stringify(tk.error));
      throw tk.error;
    }

    const allRows = (tk.data || []).filter((r: any) => r.push_token);
    /* 🔴 2026-10-10 — 아이폰 전화용 번호는 따로 떼어 애플로 보냅니다 */
    const voipRows = allRows.filter((r: any) => isVoipToken(r));
    const rows = allRows.filter((r: any) => !isVoipToken(r));
    console.log('[push] 보낼 기기 ' + rows.length + '대 (+ 아이폰 전화 ' + voipRows.length + '대)');

    /* ── 아이폰 전화 ── 1:1 전화와 그 거두기(부재중)만. 그룹 · 메시지는 일반 알림으로 갑니다. */
    let voipSent = 0;
    /* 🔴 2026-10-10 저녁 — "끊겼어요(cancel)" 는 VoIP 로 보내지 않습니다.
       애플 규칙상 VoIP 를 받으면 무조건 전화 화면을 띄워야 해서, 이미 닫힌 뒤에 오면
       아이폰이 잠깐 다시 울렸습니다. 끊김은 아래 일반 알림(Firebase)으로 갑니다. */
    if (voipRows.length && body.callId && !body.group && !body.cancel) {
      try {
        const jwt = await getApnsJwt();
        if (jwt) {
          const vdata = body.cancel
            ? { kind: 'missed', call_id: String(body.callId || ''), link_id: String(linkId) }
            : {
                kind: 'call',
                link_id: String(linkId),
                call_id: String(body.callId || ''),
                session_token: String(body.sessionToken || ''),
                call_type: String(body.callType || 'voice'),
                who: String(body.who || ''),
              };
          for (const r of voipRows) {
            const o = await sendVoip(jwt, r.push_token, vdata);
            if (o.ok) voipSent++;
          }
        }
      } catch (e) {
        // 아이폰 쪽이 실패해도 안드로이드 전화는 계속 갑니다
        console.error('[voip] 🔴 아이폰 전화 보내기 실패:', String((e as Error).message ?? e));
      }
    }

    if (!rows.length) {
      // 상대가 앱을 안 깔았거나 알림을 껐습니다. 잘못이 아닙니다.
      console.warn('[push] ⚠ 보낼 기기가 없습니다. link=' + String(linkId));
      return new Response(JSON.stringify({ ok: true, sent: voipSent, note: voipSent ? 'voip_only' : 'no_devices' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    /* ── ③ 구글 출입증 ── */
    const raw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT 가 설정되지 않았습니다.');

    let sa: any;
    try {
      sa = JSON.parse(raw);
    } catch (e) {
      /* 🔴 2026-09-15 — 붙여넣다 글자가 깨지면 여기서 걸립니다.
         이것도 전에는 조용히 500 으로 끝났습니다. */
      console.error('[push] 🔴 FIREBASE_SERVICE_ACCOUNT 를 못 읽었습니다(JSON 아님). 길이=' + raw.length);
      throw new Error('FIREBASE_SERVICE_ACCOUNT 가 올바른 JSON 이 아닙니다');
    }

    /* 어느 열쇠를 쓰고 있는지 남깁니다. 비밀이 아닌 값만 남깁니다.
       열쇠를 바꿨는데 옛것이 돌고 있으면 여기서 바로 보입니다. */
    console.log('[push] 열쇠: project=' + sa.project_id +
      ' / key_id=' + String(sa.private_key_id).slice(0, 8) + '…');

    const accessToken = await getGoogleToken(sa);

    /* ── ④ 쏘기 ──
       ⚠ data 안의 값은 모두 글자여야 합니다. 숫자를 넣으면 구글이 거절합니다.
       ⚠ priority high 여야 잠금화면에서 폰이 깨어납니다. normal 이면
         배터리 절약 때문에 한참 뒤에 오거나 아예 안 옵니다. */
    const isCall = !!body.callId;

    /* 🔴 2026-09-09 신설 — 알림 거두기
       A 가 끊었을 때 부릅니다. 알림은 한 번 보내면 스스로 안 사라지므로,
       같은 표(tag) 로 조용한 알림을 덮어씌워 "부재중 전화" 로 바꿉니다. */
    const cancel = !!body.cancel;

    /* 🔴 2026-10-12 — 받은 뒤에 끊긴 것인지는 calls 표의 answered_at 으로 봅니다.
       (끊는 쪽은 받기 전에 끊어도 'completed' 라고 보내는 경우가 있어 그 말만 믿을 수 없습니다) */
    let answered = false;
    if (cancel && body.callId) {
      try {
        const c = await sb.from('calls').select('answered_at').eq('id', String(body.callId)).maybeSingle();
        answered = !!(c.data && c.data.answered_at);
        console.log('[push] 끊김 — 받은 통화였나: ' + answered + (c.error ? ' (읽기 오류: ' + c.error.message + ')' : ''));
      } catch (e) { console.warn('[push] calls 표를 못 읽었습니다', e); }
    }

    /* 🔴 2026-09-09 신설 — 여럿이 하는 통화
       1:1 은 "걸고 받는" 것이라 전화벨을 울립니다.
       여럿은 "방에 들어가는" 것이라 받는 사람이 정해져 있지 않습니다. */
    const isGroup = !!body.group;

    const title = body.title || (cancel
      ? '부재중 전화'
      : (isGroup ? '그룹 통화가 시작되었습니다'
        : (isCall ? '전화가 왔습니다' : '새 메시지')));
    const bodyText = body.body || (cancel
      ? '전화가 끊어졌습니다'
      : (isGroup ? '눌러서 들어가세요'
        : (body.who ? body.who : 'Alias')));

    /* 어느 화면으로 보낼지 알려줍니다. 폰이 이 글자를 보고 갈라집니다. */
    const kind = cancel ? 'missed'
      : (isGroup ? 'gcall' : (isCall ? 'call' : 'message'));

    /* 표가 같아야 앞의 알림을 덮어씁니다. 이게 알림 거두기의 핵심입니다. */
    const tag = isGroup ? ('gcall-' + String(linkId))
      : (isCall ? ('call-' + String(body.callId || linkId))
        : ('msg-' + String(linkId)));

    const channel = cancel ? 'silent'
      : (isGroup ? 'messages' : (isCall ? 'calls' : 'messages'));

    /* 🔴 2026-09-10 — 1:1 전화만은 notification 없이 data 만 보냅니다.
       notification 을 함께 보내면 구글이 알림을 자기가 만들어버려서
       우리 자바 코드(CallMessagingService)가 아예 안 불립니다. */
    const fullScreenCall = isCall && !cancel && !isGroup;

    /* 🔴 2026-09-10 고침 — 부재중(거두기)도 data 만 보냅니다. */
    const dataOnly = fullScreenCall || cancel;

    const payload: any = dataOnly
      ? {
          data: {
            kind: cancel ? 'missed' : 'call',
            link_id: String(linkId),
            call_id: String(body.callId || ''),
            session_token: String(body.sessionToken || ''),
            call_type: String(body.callType || 'voice'),
            who: String(body.who || ''),
          },
          android: { priority: 'HIGH' },
          /* 🔴 2026-10-10 아이폰 — 끊김(부재중)은 알림으로 보이고, 앱을 깨워 울리던 전화 화면을 닫게 합니다.
             1:1 전화 자체(cancel 아님)는 아이폰에 일반 알림으로는 아무것도 띄우지 않습니다(VoIP 가 맡음). */
          ...(cancel ? {
            apns: {
              headers: { 'apns-priority': '10', 'apns-push-type': 'alert' },
              payload: { aps: {
                /* 🔴 2026-10-12 — 받고 나서 끊은 것(answered_at 있음)은 "통화 종료", 받기 전에 끊긴 것만 "부재중 전화" */
                alert: answered
                  ? { title: '통화 종료', body: '통화가 끝났습니다' }
                  : { title: '부재중 전화', body: String(body.who || '') ? (String(body.who) + ' 님의 전화') : '받지 못한 전화가 있습니다' },
                'content-available': 1,
                'thread-id': 'call-' + String(body.callId || linkId),
              } },
            },
          } : {}),
        }
      : {
          notification: { title: title, body: bodyText },
          data: {
            kind: kind,
            link_id: String(linkId),
            call_id: String(body.callId || ''),
            session_token: cancel ? '' : String(body.sessionToken || ''),
            call_type: String(body.callType || 'voice'),
          },
          android: {
            priority: 'NORMAL',
            notification: {
              sound: cancel ? '' : 'default',
              channel_id: channel,
              tag: tag,
              notification_priority: 'PRIORITY_LOW',
            },
          },
        };

    console.log('[push] 종류=' + kind + ' / data만=' + dataOnly);

    const results: any[] = [];
    let sent = 0;
    const dead: string[] = [];

    for (const r of rows) {
      const out = await sendOne(sa.project_id, accessToken, r.push_token, payload);
      if (out.ok) {
        sent++;
      } else {
        /* 죽은 번호는 표에서 지워둡니다. 앱을 지웠다 깔면 번호가 바뀝니다. */
        const code = out.out && out.out.error && out.out.error.status;
        if (code === 'NOT_FOUND' || code === 'UNREGISTERED' || code === 'INVALID_ARGUMENT') {
          dead.push(r.push_token);
        }
      }
      results.push({ ok: out.ok, status: out.status, err: out.ok ? null : out.out });
    }

    console.log('[push] 끝: ' + sent + '/' + rows.length + ' 성공');

    if (dead.length) {
      console.warn('[push] ⚠ 죽은 번호 ' + dead.length + '개 — devices 표를 정리하세요');
    }

    return new Response(JSON.stringify({ ok: true, sent: sent + voipSent, tried: rows.length + voipRows.length, voip: voipSent, results: results }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    // ⚠ 오류를 뭉뚱그리면 원인을 못 찾습니다. 그대로 보여줍니다.
    console.error('[alias-push-call] 🔴 오류:', err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
