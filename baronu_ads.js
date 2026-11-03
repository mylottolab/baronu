/* 바로너 — 타일 광고 (2026-11-03)
   광고는 바로카 관리 화면에서 한꺼번에 올립니다("싣는 곳: 바로너"). 바로너는 부름 서버를 쓰지만,
   광고 목록만은 에일리어스콜(바로카) 서버에서 읽어 옵니다(로그인 필요 없음 · 공개 목록).
   ⚠ 첫 화면 · 이용 현황에만 씁니다. 대화 · 통화 · 핫라인 화면에는 넣지 않습니다(유료 메신저).
   쓰는 법: <div class="bn-ads" data-n="2"></div> 를 두고 이 파일을 부르면 채웁니다.
           넓은 화면(1000px 이상)에서는 양옆 여백에 세로 타일을 저절로 붙입니다. */
(function(){
  'use strict';
  var URL_ = 'https://qmwaraittiurkynszjts.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtd2FyYWl0dGl1cmt5bnN6anRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODQ5OTUsImV4cCI6MjEwMjM2MDk5NX0.9Qr2vFzDCSKS54N6C5QN44BvCzIPTMQyVz7nX3GqT9Y';
  var CONTACT = 'weapps.kr@gmail.com';

  var css = document.createElement('style');
  css.textContent = [
    '.bn-ads{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
    '.bn-ads:empty{display:none}',
    '.bn-ads-h{font-size:12.5px;font-weight:800;color:var(--nu-sub,#5F5A7A);margin:4px 4px -6px}',
    '.bn-ad{position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:112px;border-radius:22px;overflow:hidden;text-decoration:none;color:#17132B;background:#fff;padding:12px;box-shadow:0 6px 22px rgba(74,43,224,.10)}',
    '.bn-ad img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
    '.bn-ad.img::after{content:"";position:absolute;inset:40% 0 0 0;background:linear-gradient(transparent,rgba(0,0,0,.55))}',
    '.bn-ad .t{position:relative;z-index:1;font-weight:900;font-size:14.5px;line-height:1.3}',
    '.bn-ad .s{position:relative;z-index:1;font-size:12px;opacity:.8;margin-top:2px}',
    '.bn-ad.img .t,.bn-ad.img .s{color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}',
    '.bn-ad .ad{position:absolute;top:9px;right:9px;z-index:1;font-size:10px;font-weight:900;padding:2px 6px;border-radius:999px;background:rgba(23,19,43,.6);color:#fff}',
    '.bn-ad.empty{background:transparent;box-shadow:none;border:2px dashed var(--nu-line,#DCD5FA);color:var(--nu-sub,#5F5A7A);align-items:center;justify-content:center;text-align:center}',
    '.bn-rail{display:none;position:fixed;top:24px;width:190px;flex-direction:column;gap:10px;z-index:1}',
    '@media (min-width:1000px){.bn-rail{display:flex}.bn-rail .bn-ad{min-height:150px}}'
  ].join('\n');
  document.head.appendChild(css);

  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  async function call(fn, args){
    var r = await fetch(URL_ + '/rest/v1/rpc/' + fn, { method: 'POST',
      headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    var t = await r.text(); return t ? JSON.parse(t) : null;
  }
  function tile(a){
    var img = a.image ? '<img alt="" loading="lazy" src="' + esc(a.image) + '">' : '';
    return '<a class="bn-ad' + (a.image ? ' img' : '') + '" data-ad="' + esc(a.id) + '" href="' + esc(a.link || '#') + '" target="_blank" rel="noopener sponsored"' +
      (a.image ? '' : ' style="background:' + esc(a.bg || '#fff') + '"') + '>' + img +
      '<span class="ad">AD</span><span class="t">' + esc(a.title) + '</span>' + (a.sub ? '<span class="s">' + esc(a.sub) + '</span>' : '') + '</a>';
  }
  function empty(){
    return '<a class="bn-ad empty" href="mailto:' + CONTACT + '?subject=' + encodeURIComponent('바로너 광고 문의') + '"><span class="t">이 자리에<br>광고하세요</span><span class="s">광고 문의</span></a>';
  }

  async function run(){
    var boxes = Array.prototype.slice.call(document.querySelectorAll('.bn-ads'));
    if (!boxes.length) return;
    /* 넓은 화면: 양옆 여백 */
    var host = document.querySelector('.nu');
    if (host && window.innerWidth >= 1000) {
      ['left', 'right'].forEach(function(side){
        var r = document.createElement('aside'); r.className = 'bn-ads bn-rail'; r.setAttribute('data-n', '3');
        r.style[side] = 'max(16px, calc(50% - 454px))'; r.style.gridTemplateColumns = '1fr';
        document.body.appendChild(r); boxes.push(r);
      });
    }
    var list = [];
    try { list = (await call('baroka_ads_list', { p_app: 'baronu' })) || []; } catch (e) { list = []; }
    var seen = {};
    boxes.forEach(function(box, bi){
      var want = Number(box.getAttribute('data-n') || 2);
      var mine = list.length ? list.slice((bi * want) % list.length).concat(list).slice(0, Math.min(want, list.length)) : [];
      var h = mine.map(function(a){
        if (!seen[a.id]) { seen[a.id] = 1; call('baroka_ad_hit', { p_id: a.id, p_click: false }).catch(function(){}); }
        return tile(a);
      }).join('');
      for (var i = mine.length; i < Math.min(want, 2); i++) h += empty();
      box.innerHTML = h;
      var head = box.previousElementSibling;
      if (head && head.classList.contains('bn-ads-h')) head.style.display = '';
      box.querySelectorAll('[data-ad]').forEach(function(el){
        el.addEventListener('click', function(){ call('baroka_ad_hit', { p_id: el.getAttribute('data-ad'), p_click: true }).catch(function(){}); });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
