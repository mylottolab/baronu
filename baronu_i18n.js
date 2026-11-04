/* 바로너 — 영어 · 주간/야간 (2026-11-05)
   ■ 영어: 부름과 같은 언어 칸(alias_lang_v1)을 씁니다 → 대화 · 통화 화면(부름 것)도 함께 영어.
     핫라인 화면들(nureum_*)의 한글은 이 파일이 영어로 바꿔 보여 줍니다(화면 코드는 그대로).
   ■ 주간/야간: [🌙] · [☀️]. 고르기 전에는 폰 설정을 따릅니다. 대화 화면 모드(alias_theme_v1)도 함께.
   ⚠ <head> 에서 nureum.css 다음에 부릅니다. */
(function(){
  'use strict';
  var LK = 'alias_lang_v1', TK = 'baronu_theme';
  function get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v){ try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  var pref = get(LK);
  var EN = pref === 'en' || (pref !== 'kr' && !/^ko/i.test(navigator.language || 'ko'));
  document.documentElement.lang = EN ? 'en' : 'ko';

  var t = get(TK);
  if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
  var DARK = t ? t === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);

  window.BN = window.BN || {};
  BN.en = EN; BN.dark = DARK;
  BN.controls = function(host){
    if (!host || host.querySelector('.bn-ctl')) return;
    var box = document.createElement('span'); box.className = 'bn-ctl';
    box.style.cssText = 'display:inline-flex;gap:6px;flex:none;margin-left:auto';
    function mk(txt, fn, label){ var b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label);
      b.style.cssText = 'height:40px;min-width:40px;padding:0 9px;border:none;border-radius:999px;background:rgba(127,127,127,.18);color:inherit;font:inherit;font-size:13.5px;font-weight:900;cursor:pointer';
      b.onclick = fn; return b; }
    box.appendChild(mk(DARK ? '☀️' : '🌙', async function(){
      var to = DARK ? 'light' : 'dark'; set(TK, to);
      try {   // 대화 화면(부름 테마)도 같은 모드로
        var o = JSON.parse(get('alias_theme_v1') || '{}'); o.mode = to; if (!o.color) o.color = 'baronu';
        if (window.AL && AL.saveTheme) await AL.saveTheme(Object.assign({}, AL.THEME_DEFAULT || {}, o)); else set('alias_theme_v1', JSON.stringify(o));
      } catch (e) {}
      location.reload();
    }, DARK ? 'Day mode' : 'Night mode'));
    box.appendChild(mk(EN ? 'KO' : 'EN', async function(){
      try { if (window.AL && AL.setLang) await AL.setLang(EN ? 'kr' : 'en'); else set(LK, EN ? 'kr' : 'en'); } catch (e) { set(LK, EN ? 'kr' : 'en'); }
      location.reload();
    }, EN ? '한국어로' : 'English'));
    var me = host.querySelector('#meBtn');
    if (me) { box.style.marginLeft = '0'; host.insertBefore(box, me); me.style.marginLeft = '6px'; }
    else host.appendChild(box);
  };
  function addCtl(){ BN.controls(document.querySelector('.nu-top')); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addCtl); else addCtl();

  if (!EN) return;

  var D = [
    ['바로너 — 한 사람과 바로 통하는 핫라인', 'Baronu — a hotline to one person'],
    ['정한 한 사람과 바로 통하는 나만의 핫라인.', 'Your own hotline to one chosen person.'],
    ['전화 · 영상 · 문자 · 사진, 서로 전화번호는 보이지 않아요.', 'Call, video, chat and photos — no phone numbers shared.'],
    ['이 휴대폰에서만 쓰는 계정이에요. 휴대폰을 바꿔도 남게 하려면 →', 'This account lives only on this phone. To keep it when you change phones →'],
    ['계정 지키기 (아이디 만들기)', 'Protect account (create ID)'], ['계정 지키기', 'Protect account'],
    ['아직 핫라인이 없어요.', 'No hotlines yet.'],
    ['아래 [＋ 새 핫라인 만들기]로 소중한 한 사람을 이어 보세요.', 'Tap [＋ New hotline] below to connect with someone special.'],
    ['＋ 새 핫라인 만들기', '＋ New hotline'], ['새 핫라인 만들기', 'New hotline'],
    ['받은 코드 · QR로 짝 맺기', 'Pair with a code · QR'], ['받은 코드 · QR로 바로 연결', 'Connect with a code · QR'],
    ['🖨 QR 카드 찍기', '🖨 Scan QR card'],
    ['월 1,650원 · 12개월 16,500원 ·', '₩1,650/month · ₩16,500/12 months ·'],
    ['약관', 'Terms'], ['개인정보', 'Privacy'], ['환불', 'Refunds'],
    ['바로너 QR이 아니에요.', 'This is not a Baronu QR code.'], ['QR을 읽지 못했어요.', "Couldn't read the QR."],
    ['짝 기다리는 중', 'Waiting to pair'], ['이용권 필요', 'Plan needed'], ['연장 필요', 'Renewal needed'],
    ['핫라인을 불러오지 못했습니다.', "Couldn't load hotlines."], ['로그인이 필요합니다.', 'Please sign in.'],
    ['별칭을 먼저 하나 만들어 주세요.', 'Please create a display name first.'], ['이름을 1~20자로 적어 주세요.', 'Name must be 1–20 characters.'],
    ['짝을 기다리는 핫라인이 5개 있습니다. 먼저 짝을 맺거나 지워 주세요.', 'You have 5 hotlines waiting to pair. Pair or delete one first.'],
    ['그 코드를 찾지 못했습니다. 코드를 다시 확인해 주세요.', "Code not found. Please check it."],
    ['이미 짝을 맺은 코드입니다. 새 코드를 받아 주세요.', 'This code was already used. Please get a new one.'],
    ['코드 시간이 지났습니다(10분). 보내신 분께 새 코드를 받아 주세요.', 'The code expired (10 min). Ask for a new one.'],
    ['내가 만든 코드입니다. 상대 휴대폰에서 넣어 주세요.', "That's your own code. Enter it on the other phone."],
    ['연결이 아직 안 됐습니다. 잠시 뒤 다시 눌러 주세요.', 'Not connected yet. Try again in a moment.'],
    ['이미 짝을 맺은 핫라인입니다.', 'This hotline is already paired.'],
    ['남은 기간이 한 달보다 길 때만 당겨 쓸 수 있습니다.', 'You can borrow only when more than a month remains.'],
    ['인터넷 연결이 잠깐 끊겼어요. 와이파이나 데이터를 확인하고 다시 눌러 주세요.', 'Connection dropped. Check Wi-Fi or data and try again.'],
    ['인터넷 연결이 잠깐 끊겼어요. 다시 눌러 주세요.', 'Connection dropped. Please try again.'],
    ['한 사람과, 바로 통하는 핫라인', 'A hotline to one person'],
    ['바로너는 정해진 한 사람과만 쓰는 직통 연결입니다. 핫라인마다 바탕화면 아이콘이 생기고, 누르면 그 사람에게 바로 전화 · 영상 · 사진 · 문자를 보낼 수 있어요. 서로 전화번호는 보이지 않습니다.',
     'Baronu is a direct line to one chosen person. Each hotline gets a home-screen icon — tap it to call, video, send photos or chat right away. No phone numbers are shared.'],
    ['가입 없이', 'No sign-up —'], ['바로 시작할 수 있어요. 아이디는 나중에 만들어도 됩니다.', 'start right away. You can create an ID later.'],
    ['가입 없이 바로 시작', 'Start without signing up'], ['계정이 있어요 · 로그인', 'I have an account · Sign in'],
    ['시작하지 못했어요:', "Couldn't start:"],
    ['지금은 이 휴대폰에서만 쓰는 계정이에요. 아이디 · 비밀번호를 만들어 두면 휴대폰을 바꿔도 핫라인 · 이용권이 그대로 남아요.', 'This account lives only on this phone. Create an ID and password to keep your hotlines and plans when you change phones.'],
    ['아이디 (닉네임)', 'ID (nickname)'], ['비밀번호 (8자 이상)', 'Password (8+ characters)'], ['나중에', 'Later'],
    ['비밀번호는 8자 이상으로 해 주세요.', 'Password must be 8+ characters.'], ['이미 있는 아이디예요. 다른 아이디로 해 주세요.', 'That ID is taken. Please choose another.'],
    ['계정을 지켰어요', 'Account protected'], ['이제 아이디', 'You can now sign in on any phone with'], ['로 어느 휴대폰에서든 들어올 수 있어요.', '.'],
    ['비밀번호를 잊었을 때 쓰는', 'This is your'], ['복구 코드', 'recovery code'], ['입니다. 사진을 찍거나 적어 두세요. 다시 보여 드리지 않아요.', ' for a forgotten password. Save it — it won\'t be shown again.'],
    ['적어 뒀어요', 'Saved it'], ['아이콘을 놓을까요?', 'Add a home-screen icon?'],
    ['놓아 두면 다음부터는 앱을 찾을 필요 없이 아이콘만 누르시면 됩니다.', 'Next time, just tap the icon — no need to find the app.'],
    ['네, 놓을게요', 'Yes, add it'], ['아이콘 놓기', 'Add icon'],
    ['이 사람에게 보일 내 별칭', 'My display name for this person'], ['(이름 · 갤러리가 이걸로 보여요)', '(your name and photos show under it)'],
    ['화면을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.', "Couldn't load. Please reopen in a moment."],
    ['이 휴대폰에서만 쓰는 계정', 'An account on this phone only'],
    ['이에요. 휴대폰을 바꾸거나 앱을 지우면 핫라인이 사라질 수 있어요.', '. Changing phones or deleting the app may lose your hotlines.'],
    ['로그인:', 'Signed in:'], ['이용약관 · 개인정보 · 환불', 'Terms · Privacy · Refunds'], ['로그아웃할까요?', 'Log out?'],
    ['가입 없이 쓰는 계정은 로그아웃하면 다시 들어올 수 없어요. 핫라인도 다시 맺어야 해요.\n\n그래도 로그아웃할까요? (먼저 [계정 지키기]를 권해요)',
     "Accounts without sign-up can't sign back in after logging out, and hotlines must be paired again.\n\nLog out anyway? (We recommend [Protect account] first.)"],
    ['바로너 처음 화면', 'Baronu home'], ['이용권 고르기', 'Choose a plan'],
    ['전화하기', 'Call'], ['영상통화', 'Video'], ['사진 보내기', 'Photo'], ['대화하기', 'Chat'], ['전체 메뉴', 'All menu'],
    ['기본 용량을 다 썼어요. 문자 · 사진은 그대로 됩니다.', "monthly allowance is used up. Chat and photos still work."],
    ['용량 추가 · 당겨 쓰기', 'Add more · borrow'], ['용량을 다 썼어요. 문자 · 사진은 그대로 됩니다.', 'allowance is used up. Chat and photos still work.'],
    ['핫라인을 만든 분이 용량을 늘릴 수 있어요.', 'The hotline owner can add more.'], ['만든 분께 문자로 부탁하기', 'Ask the owner in chat'],
    ['용량을 다 썼어요', 'allowance used up'], ['이용 기간이 끝났어요', 'Your plan has ended'],
    ['이 핫라인은 만든 분이 이용권을 냅니다. 만든 분께 연장을 부탁해 주세요.', 'The person who created this hotline pays for it. Please ask them to renew.'],
    ['대화방 열기', 'Open chat'], ['동영상 · 파일', 'Video · files'], ['유튜브 같이 보기', 'Watch YouTube together'], ['음악 같이 듣기', 'Listen to music together'],
    ['음성 메시지', 'Voice message'], ['이용 현황 · 연장', 'Usage · renew'], ['바탕화면에 놓기', 'Add to home screen'],
    ['QR 카드 만들기 (냉장고 · 지갑)', 'Make a QR card (fridge · wallet)'], ['이 핫라인 설정', 'Hotline settings'],
    ['앱을 열면 이 사람부터 ✓', 'Open to this person ✓'], ['앱을 열면 이 사람부터', 'Open to this person'],
    ['해제했어요', 'Turned off'], ['정했어요', 'Done'], ['앱을 열면 핫라인 목록이 나와요.', 'The app will open to your hotline list.'],
    ['이제 바로너 앱을 열면', 'Baronu will now open straight to'], ['전화 화면이 바로 나와요.', "'s call screen."],
    ['녹음 · 녹화는 통화 화면에서 상대가 허락할 때만 됩니다.', 'Recording works only when the other person allows it on the call screen.'],
    ['접기', 'Fold'], ['사진 (바탕화면 아이콘 · 이 화면 위쪽에 나와요)', 'Photo (shown on the icon and at the top)'],
    ['사진 고르기', 'Choose photo'], ['사진 빼기', 'Remove photo'], ['내 휴대폰에 보일 이름', 'Name shown on my phone'], ['아이콘 글자', 'Icon letter'],
    ['이 사람 전화는 자동으로 받기', 'Auto-answer calls from this person'], ['받는 쪽 휴대폰에서 직접 켜야 합니다. (앱 다음 판부터 작동)', 'Must be turned on by the receiving phone. (Next app version)'],
    ['이 핫라인 끊기', 'End this hotline'], ['사진을 저장하지 못했습니다. 다른 사진으로 해 보세요.', "Couldn't save the photo. Try another one."],
    ['사진을 바꿨어요', 'Photo updated'],
    ['핫라인을 끊을까요?\n두 사람 모두 이 아이콘으로 더는 연결되지 않습니다.', 'End this hotline?\nNeither of you will be able to connect through it.'],
    ['\n남은 이용 기간은 돌려받지 못합니다.', '\nRemaining plan time is not refunded.'],
    ['끊긴 핫라인', 'Ended hotline'], ['이 핫라인은 더는 쓸 수 없어요', 'This hotline can no longer be used'],
    ['이 아이콘은 지워 주세요. 바로너 처음 화면에서 새 핫라인을 만들 수 있어요.', 'Please delete this icon. You can create a new hotline from the Baronu home screen.'],
    ['지금 연결할 수 있어요', 'Ready to connect'], ['이용권이 필요해요', 'Plan needed'],
    ['💞 우리 둘 앨범', '💞 Our album'], ['우리 둘 앨범', 'Our album'], ['(두 사람만 봐요)', '(only you two)'],
    ['의 사진첩 보기', "'s photos"], ['내 사진첩 꾸미기', 'Edit my photos'], ['내 사진첩을', 'My photos for'], ['에게:', ':'],
    ['🔓 보이기', '🔓 Visible'], ['🔒 숨기기', '🔒 Hidden'],
    ['은 이 핫라인의 두 사람만 봐요. 둘만의 추억은 여기에 넣으세요.', ' is seen only by the two of you. Keep your memories here.'],
    ['은 내 별칭의 사진첩이라, 보이기로 둔 모든 핫라인 상대에게 똑같이 보여요. 핫라인마다 보이기 · 숨기기를 따로 정할 수 있어요.', ' belong to your display name and are shown to every hotline set to Visible. Choose per hotline.'],
    ['님이 이 핫라인에는 사진첩을 숨겨 두었어요. 둘만의 사진은', ' has hidden their photos on this hotline. Share photos in'],
    ['에서 함께 보세요.', ' instead.'], ['님이 아직 사진첩을 꾸미지 않았어요.', " hasn't added photos yet."],
    ['내 사진첩을 찾지 못했습니다.', "Couldn't find your photos."], ['바꾸지 못했어요. 잠시 뒤 다시 해 주세요.', "Couldn't change. Try again shortly."],
    ['내 사진첩', 'My photos'], ['사진첩', 'Photos'], ['불러오지 못했습니다.', "Couldn't load."],
    ['새 핫라인 · 바로너', 'New hotline · Baronu'], ['바탕화면에 이 모양으로 아이콘이 생겨요.', 'Your home-screen icon will look like this.'],
    ['누구와 쓰시나요? (내 휴대폰에 보일 이름)', 'Who is it with? (name shown on my phone)'], ['예: 엄마, 우리 자기, 김 반장', 'e.g. Mom, Honey, Boss'],
    ['아이콘 글자 (한 글자, 비우면 이름 첫 글자)', 'Icon letter (one letter; blank = first letter)'],
    ['상대에게 보일 내 이름', 'My name shown to them'], ['예: 큰아들', 'e.g. Son'],
    ['핫라인 만들고 짝 맺기 코드 받기', 'Create hotline and get pairing code'],
    ['은 핫라인을 만든 분이 냅니다. 핫라인 1개 · 1개월권 1,650원 · 12개월권 16,500원(부가세 포함). 짝을 맺은 뒤에 고르시면 됩니다.',
     ' are paid by the creator. Per hotline: 1 month ₩1,650 · 12 months ₩16,500 (VAT incl.). Choose after pairing.'],
    ['상대 휴대폰의 바로너로 이 QR을 찍어 주세요', 'Scan this QR with Baronu on the other phone'],
    ['만나서 찍기 어려우면 아래 코드를 보내세요', "Not together? Send this code instead"],
    ['새 코드 받기', 'New code'], ['카톡 · 문자로 보내기', 'Send by message'], ['코드 복사', 'Copy code'],
    ['옆에 계신가요? 상대 폰 대신 설정해 주기', 'Together? Set up their phone for them'],
    ['상대가 코드를 넣으면 이 화면이 저절로 바뀝니다. 상대 휴대폰에는', 'This screen updates when they enter the code. The other phone needs the'],
    ['앱(또는 baronu.kr)이 있으면 됩니다.', 'app (or baronu.kr).'],
    ['연결됐어요!', 'Connected!'], ['이제 이 핫라인의 이용권을 고르고, 바탕화면에 아이콘을 놓으세요.', 'Now choose a plan and add the icon to your home screen.'],
    ['바탕화면에 아이콘 놓기', 'Add home-screen icon'], ['핫라인 화면 열기', 'Open hotline'], ['🖨 냉장고 · 지갑용 QR 카드 만들기', '🖨 Make a fridge · wallet QR card'],
    ['누구와 쓰실지 이름을 적어 주세요.', 'Please enter who it is with.'], ['상대에게 보일 내 이름을 적어 주세요.', 'Please enter your name for them.'],
    ['휴대폰의 바로너로 이 QR을 찍어 주세요', "should scan this QR with Baronu"], ['코드 시간이 지났어요.', 'The code expired.'],
    ['와(과) 연결됐어요!', ' — connected!'], ['짝 맺기 · 바로너', 'Pair · Baronu'], ['짝 맺기', 'Pair'],
    ['상대 휴대폰에 나온 QR을 찍거나, 받은 코드를 넣어 주세요.', 'Scan the QR on their phone, or enter the code you received.'],
    ['QR 찍기', 'Scan QR'], ['복사해 둔 코드 붙여넣기', 'Paste copied code'], ['받은 코드', 'Code'],
    ['바로너로 연결하자고 해요', 'wants to connect on Baronu'], ['님이 바로너로 연결하자고 해요', ' wants to connect on Baronu'],
    ['연결해도 서로 전화번호는 보이지 않아요. 요금은 핫라인을 만든 분이 냅니다.', "No phone numbers are shared. The creator pays."],
    ['전화를 받으려면 바로너 앱이 있어야 해요.', 'You need the Baronu app to receive calls.'],
    ['바로너 앱 설치하고 연결', 'Install Baronu and connect'], ['이 화면에서 바로 연결 (컴퓨터 · 시험용)', 'Connect here (computer · testing)'],
    ['연결하기', 'Connect'], ['이름 · 색 바꾸기', 'Name · color'], ['이 분을 뭐라고 부를까요? (내 휴대폰에 보일 이름)', 'What do you call them? (shown on my phone)'],
    ['예: 아들, 우리 자기, 사장님', 'e.g. Son, Honey, Boss'], ['예: 엄마', 'e.g. Mom'], ['계정이 있으세요?', 'Have an account?'], ['로그인하고 연결', 'Sign in and connect'],
    ['바탕화면에 아이콘을 놓으면, 다음부터는 아이콘만 누르시면 됩니다.', 'Add the icon and just tap it next time.'],
    ['코드를 넣어 주세요.', 'Please enter the code.'], ['님과 연결하기', ' — connect'], ['이 분을 뭐라고 부를지 적어 주세요.', 'Please enter what you call them.'],
    ['QR을 읽지 못했습니다. 코드를 직접 넣어 주세요.', "Couldn't read the QR. Please type the code."],
    ['이용 현황 · 바로너', 'Usage · Baronu'], ['이번 달 기본 용량', "This month's allowance"], ['사진 · 동영상 · 파일 보관', 'Photo · video · file storage'],
    ['모자라면 ① 추가 구입 (이번 달만)', 'Need more? ① Buy extra (this month)'], ['모자라면 ② 다음 달 것 당겨 쓰기', "Need more? ② Borrow next month's"],
    ['남은 기간이 한 달 줄어들고, 이번 달 용량이 한 달치 늘어요', "Your plan shortens by a month and this month's allowance doubles"],
    ['기간 늘리기 · 핫라인 1개 기준', 'Extend · per hotline'], ['1개월권', '1 month'], ['12개월권', '12 months'], ['2달 덤', '+2 months'],
    ['결제하기', 'Pay'], ['핫라인을 만든 사람', 'the hotline creator'],
    ['이 냅니다(부가세 포함). 핫라인마다 따로 계산하고, 짝 맺은 상대는 내지 않아요.', ' pays (VAT incl.), per hotline. The paired person pays nothing.'],
    ['요금은', 'Fees:'], ['요금', 'Fees'], ['합계', 'Total'], ['1개월권 · 12개월권을 골라 주세요', 'Choose 1 or 12 months'],
    ['핫라인 · 이용 현황', 'Hotline · usage'], ['이용 현황', 'Usage'], ['이용권 없음', 'No plan'], ['거의 다 썼어요 · 남은', 'Almost used up · left'], ['다 썼어요', 'Used up'],
    ['이 핫라인은', 'For this hotline,'], ['만든 분', 'the creator'], ['이 이용권을 냅니다. 기간 연장 · 용량 추가는 만든 분이 할 수 있어요.', ' pays. Only they can extend or add more.'],
    ['남은 기간이 한 달보다 길 때 쓸 수 있어요', 'Available when more than a month remains'],
    ['다음 달 것을 당겨 쓸까요?\n이번 달 용량이 한 달치 늘고, 남은 기간이 한 달 줄어듭니다.', "Borrow next month's allowance?\nThis month doubles and your plan shortens by a month."],
    ['당겨 썼어요. 이번 달 용량이 늘었습니다.', "Borrowed. This month's allowance increased."],
    ['이미 넣어 드린 결제입니다.', 'Already applied.'], ['결제가 끝났어요. 이용권을 넣어 드렸습니다.', 'Payment complete. Your plan is active.'],
    ['취소 · 환불된 결제를 정리했습니다.', 'Cleared a canceled/refunded payment.'], ['결제가 아직 확정되지 않았습니다. 확정되면 저절로 들어갑니다.', 'Payment pending. It will apply automatically.'],
    ['결제를 마치지 못했습니다.', "Payment wasn't completed."], ['결제를 마치지 못했습니다', "Payment wasn't completed"],
    ['1개월권이나 12개월권을 골라 주세요.', 'Please choose 1 or 12 months.'],
    ['한 번에 한 종류만 살 수 있어요. 1개월권이나 12개월권 중 하나만 골라 주세요.', 'One type at a time — choose 1 month or 12 months.'],
    ['이용권은 계정에 담겨요. 휴대폰을 바꾸거나 앱을 지워도 이용권이 남도록, 결제 전에 아이디 · 비밀번호를 만들어 주세요(30초).', 'Plans belong to your account. Create an ID and password before paying so it survives a phone change (30 seconds).'],
    ['결제창을 여는 중…', 'Opening payment…'], ['결제를 마치면 이 화면이 저절로 바뀝니다.', 'This screen updates when payment completes.'],
    ['음성 +300분', 'Voice +300 min'], ['영상 +100분', 'Video +100 min'], ['저장 +1GB', 'Storage +1GB'],
    ['카드 결제', 'Card payment'], ['구매자 이름', 'Buyer name'], ['휴대폰 번호 (선택)', 'Phone (optional)'], ['카드로 결제', 'Pay by card'],
    ['해외 카드 · PayPal', 'International card · PayPal'], ['구매자 이름을 적어 주세요.', 'Please enter the buyer name.'],
    ['한 번에 1장씩 살 수 있어요. 더 사면 기간이 이어 붙어요.', 'One at a time; more purchases extend the plan.'],
    ['여러 장은 결제창에서 수량을 고르세요. 산 만큼 기간이 이어 붙어요.', 'Choose quantity in the payment window; each adds time.'],
    ['우리 둘 앨범 · 바로너', 'Our album · Baronu'], ['이 앨범은', 'Only'], ['두 사람만', 'you two'], ['봐요. 둘 다 사진을 넣을 수 있어요.', ' see this album. Both can add photos.'],
    ['사진 넣는 중…', 'Adding photos…'], ['＋', '＋'], ['사진 넣기', 'Add photos'],
    ['보관 용량이 다 찼어요. [이용 현황]에서 보관 용량을 늘리거나 다음 달 몫을 당겨 쓸 수 있어요.', 'Storage is full. Add storage or borrow next month under [Usage].'],
    ['사진 한 장을 넣지 못했어요.', "Couldn't add a photo."], ['내가 넣은 사진', 'Added by me'], ['이(가) 넣은 사진', ' added this'],
    ['한마디 남기기', 'Add a note'], ['⬇ 내 휴대폰에 저장', '⬇ Save to phone'],
    ['이 사진을 지울까요? 두 사람 모두에게서 사라져요.', 'Delete this photo for both of you?'],
    ['QR 카드 · 바로너', 'QR card · Baronu'], ['QR 카드', 'QR card'], ['🖨 인쇄하기', '🖨 Print'],
    ['짝을 맺은 핫라인만 카드를 만들 수 있어요.', 'Only paired hotlines can have a card.'],
    ['바로너 · 한 사람과 바로', 'Baronu · one tap to one person'],
    ['광고 문의', 'Advertise'], ['바로너 광고 문의', 'Advertise on Baronu'], ['이 자리에', 'Your ad'], ['광고하세요', 'here'], ['광고', 'Ads'],
    ['지우기', 'Delete'], ['저장', 'Save'], ['취소', 'Cancel'], ['확인', 'OK'], ['닫기', 'Close'], ['더 보기', 'More'], ['뒤로', 'Back'],
    ['알겠어요', 'Got it'], ['로그아웃', 'Log out'], ['로그인', 'Sign in'], ['갤러리', 'Photos'], ['사진', 'Photos'], ['음성통화', 'Voice'],
    ['이번 달', 'This month'], ['색', 'Color'], ['계정', 'Account'], ['상대', 'Them'], ['핫라인', 'hotline'], ['바로너', 'Baronu'], ['⚙ 나', '⚙ Me'], ['나 (설정)', 'Me (settings)'],
  ];
  D.sort(function(a, b){ return b[0].length - a[0].length; });
  var HAS = /[가-힣]/;
  function tr(s){
    if (!s || !HAS.test(s)) return s;
    var EX = { '나': 'Me', '나 ': 'Me' }; if (EX[s.trim()]) return s.replace(s.trim(), EX[s.trim()]);
    var o = s;
    for (var i = 0; i < D.length; i++) if (o.indexOf(D[i][0]) >= 0) o = o.split(D[i][0]).join(D[i][1]);
    o = o.replace(/([\d,]+)원/g, '₩$1').replace(/(\d+)분/g, '$1 min').replace(/(\d+)장/g, '$1').replace(/(\d+)개월/g, '$1 mo')
         .replace(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g, '$1-$2-$3').replace(/(\d+)\s*초/g, '$1s')
         .replace(/(\d{4}-\d{1,2}-\d{1,2})\s*까지/g, 'until $1').replace(/([\d.]+\s*(GB|MB))\s*까지/g, 'up to $1');
    return o;
  }
  window.BN.tr = tr;
  function skip(el){ return el.closest && el.closest('.nu-ico,.nu-tile b,b#name,.al-it .who,[data-noi18n]'); }
  function walk(root){
    if (!root) return;
    if (root.nodeType === 3) { if (root.parentNode && skip(root.parentNode)) return; var t = tr(root.nodeValue); if (t !== root.nodeValue) root.nodeValue = t; return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA)$/.test(root.nodeName) || skip(root)) return;
    ['placeholder', 'aria-label', 'title'].forEach(function(a){ var v = root.getAttribute && root.getAttribute(a); if (v && HAS.test(v)) root.setAttribute(a, tr(v)); });
    for (var c = root.firstChild; c; c = c.nextSibling) walk(c);
  }
  function run(){
    document.title = tr(document.title);
    walk(document.body);
    new MutationObserver(function(ms){
      ms.forEach(function(m){
        if (m.type === 'characterData') walk(m.target);
        else if (m.type === 'attributes') { var v = m.target.getAttribute(m.attributeName); if (v && HAS.test(v) && !skip(m.target)) m.target.setAttribute(m.attributeName, tr(v)); }
        else m.addedNodes.forEach(walk);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title'] });
  }
  var A = window.alert, C = window.confirm, P = window.prompt;
  window.alert = function(m){ return A.call(window, tr(String(m))); };
  window.confirm = function(m){ return C.call(window, tr(String(m))); };
  window.prompt = function(m, d){ return P.call(window, tr(String(m)), d); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
