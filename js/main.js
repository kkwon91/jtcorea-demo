// JT COREA — 공통 동작(머리 고정 색, 메뉴, 영상 창, 멤버 소개 창, 첫 화면 신호 화면, 나타나기, 회사 숫자, 굿즈 고르기, 오디션 지원서)
(function () {
  var doc = document, root = doc.documentElement;

  // 머리: 내려가면 바탕색
  var hd = doc.getElementById('hd');
  if (hd && !hd.classList.contains('hd--fixed-solid')) {
    var onScroll = function () { hd.classList.toggle('is-solid', window.scrollY > 40); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  // 휴대폰 메뉴
  var burger = doc.getElementById('burger'), nav = doc.getElementById('nav');
  if (burger && nav) {
    var setMenu = function (open) {
      root.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      if (hd && open) hd.classList.add('is-solid');
    };
    burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  // 영상 창(유튜브)
  var modal = doc.getElementById('modal'), frame = doc.getElementById('modalFrame'), lastFocus = null;
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open'); frame.innerHTML = '';
    if (lastFocus) lastFocus.focus();
  }
  if (modal) {
    doc.addEventListener('click', function (e) {
      var t = e.target.closest('[data-yt]');
      if (!t) return;
      e.preventDefault(); lastFocus = t;
      frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + t.getAttribute('data-yt') +
        '?autoplay=1&rel=0&playsinline=1" title="영상" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
      modal.classList.add('is-open');
      doc.getElementById('modalX').focus();
    });
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.id === 'modalX') closeModal(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }

  // 멤버 카드: 누르면 소개 화면(아티스트 소개서의 멤버 쪽)
  var mm = doc.getElementById('memModal');
  if (mm) {
    var mmImg = doc.getElementById('mmImg'), mmName = doc.getElementById('mmName'), mmView = doc.getElementById('mmView');
    var mems = [].slice.call(doc.querySelectorAll('.mem-more[data-mem]')), cur = 0, mmFocus = null;
    var show = function (i) {
      cur = (i + mems.length) % mems.length;
      var b = mems[cur];
      mmImg.src = 'assets/members/profile/' + b.getAttribute('data-mem') + '.jpg';
      mmImg.alt = b.getAttribute('data-ko') + ' 소개 화면(아티스트 소개서 2026)';
      mmName.textContent = b.getAttribute('data-name');
    };
    var closeMem = function () { mm.classList.remove('is-open'); if (mmFocus) mmFocus.focus(); };
    // 휴대폰에서는 그림이 화면보다 넓다 — 인물이 있는 가운데 오른쪽에서 시작
    mmImg.addEventListener('load', function () { mmView.scrollLeft = (mmView.scrollWidth - mmView.clientWidth) * 0.62; });
    mems.forEach(function (b, i) {
      b.addEventListener('click', function () { mmFocus = b; show(i); mm.classList.add('is-open'); doc.getElementById('mmX').focus(); });
    });
    doc.getElementById('mmPrev').addEventListener('click', function () { show(cur - 1); });
    doc.getElementById('mmNext').addEventListener('click', function () { show(cur + 1); });
    mm.addEventListener('click', function (e) { if (e.target === mm || e.target.id === 'mmX') closeMem(); });
    doc.addEventListener('keydown', function (e) {
      if (!mm.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeMem();
      else if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  // 첫 화면 신호 화면: 멤버별 출발지 좌표를 훑고 → 서울 좌표로 맞추고 → 일곱 신호를 연결
  var sig = doc.getElementById('sig');
  if (sig && sig.hasAttribute('data-boot')) {
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) sig.removeAttribute('data-boot');
    else (function () {
      var city = doc.getElementById('sigCity'), geo = doc.getElementById('sigGeo'), st = doc.getElementById('sigSt');
      var rows = [].slice.call(sig.querySelectorAll('.sig-rows li'));
      var lines = [].slice.call(sig.querySelectorAll('.sig-l'));
      var end = sig.querySelector('.sig-end');
      var SEOUL = geo.textContent, steps = [];
      lines.forEach(function (el) { el.setAttribute('data-t', el.textContent); el.textContent = ''; });
      var wait = function (ms) { steps.push(function (next) { setTimeout(next, ms); }); };
      var type = function (el) {
        steps.push(function (next) {
          var full = el.getAttribute('data-t'), n = 0;
          el.classList.add('on');
          (function tick() { n++; el.textContent = full.slice(0, n); if (n < full.length) setTimeout(tick, 16); else next(); })();
        });
      };
      st.textContent = 'SCANNING'; city.textContent = 'ORIGIN'; geo.textContent = '--.----°N ---.----°E';
      wait(500); type(lines[0]); wait(150);
      rows.forEach(function (li) {
        steps.push(function (next) {
          li.classList.add('on');
          city.textContent = li.getAttribute('data-city'); geo.textContent = li.getAttribute('data-geo');
          setTimeout(next, 190);
        });
      });
      wait(250); type(lines[1]);
      steps.push(function (next) { // 숫자가 흔들리다 왼쪽부터 서울 좌표로 굳는다
        var k = 0, N = 18;
        st.textContent = 'TUNING'; city.textContent = 'SEOUL';
        (function tick() {
          k++;
          var lock = Math.floor(SEOUL.length * k / N);
          geo.textContent = SEOUL.replace(/\d/g, function (d, i) { return i < lock ? d : String(Math.floor(Math.random() * 10)); });
          if (k < N) setTimeout(tick, 50); else { geo.textContent = SEOUL; st.textContent = 'LOCKED'; next(); }
        })();
      });
      wait(200); type(lines[2]);
      rows.forEach(function (li) { steps.push(function (next) { li.classList.add('ok'); setTimeout(next, 70); }); });
      steps.push(function (next) { end.classList.add('on'); sig.removeAttribute('data-boot'); next(); });
      (function run(i) { if (i < steps.length) steps[i](function () { run(i + 1); }); })(0);
    })();
  }

  // 나타나기
  var rv = doc.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && rv.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  // 회사: 오디션 숫자가 화면에 들어오면 0에서 올라간다
  var nums = [].slice.call(doc.querySelectorAll('[data-n]'));
  if (nums.length && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    var fmt = function (el, v) { el.textContent = el.getAttribute('data-comma') ? v.toLocaleString('en-US') : String(v); };
    nums.forEach(function (el) { if (/,/.test(el.textContent)) el.setAttribute('data-comma', '1'); });
    var nio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        nio.unobserve(en.target);
        var el = en.target, to = +el.getAttribute('data-n'), t0 = null, D = 900;
        (function step(t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
          fmt(el, Math.round(to * e));
          if (k < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { nio.observe(el); });
  }

  // 굿즈 01: 아이디카드 — 멤버를 누르면 카드가 바뀐다
  var idcImg = doc.getElementById('idcImg');
  if (idcImg) {
    var pks = [].slice.call(doc.querySelectorAll('[data-mem-btn]')), ci = 0;
    var stage = doc.getElementById('idcStage'), idcName = doc.getElementById('idcName'), idcNo = doc.getElementById('idcNo');
    var pcs = [].slice.call(doc.querySelectorAll('.pcard'));
    var setMem = function (i, byUser) {
      ci = (i + pks.length) % pks.length;
      var btn = pks[ci], key = btn.getAttribute('data-mem-btn');
      idcImg.src = 'assets/goods/idcard/' + key + '.webp';
      idcImg.alt = btn.getAttribute('data-ko') + ' 아이디카드';
      idcName.textContent = btn.getAttribute('data-name');
      idcNo.textContent = ('0' + (ci + 1)).slice(-2) + ' / 0' + pks.length;
      pks.forEach(function (x) { x.classList.toggle('is-on', x === btn); x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'); });
      pcs.forEach(function (c) { c.classList.toggle('is-pick', !!byUser && c.getAttribute('data-mem') === key); });
      if (byUser) { stage.classList.remove('is-swap'); void stage.offsetWidth; stage.classList.add('is-swap'); }
    };
    pks.forEach(function (x, i) { x.addEventListener('click', function () { setMem(i, true); }); });
    doc.getElementById('idcPrev').addEventListener('click', function () { setMem(ci - 1, true); });
    doc.getElementById('idcNext').addEventListener('click', function () { setMem(ci + 1, true); });
    // 굿즈 02: 포토카드 — 누르면 뒤집힌다
    pcs.forEach(function (c) {
      c.addEventListener('click', function () {
        var on = c.classList.toggle('is-flip');
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
        c.querySelector('.pcard-nm i').textContent = on ? '뒤' : '앞';
      });
    });
  }

  // 굿즈: 종류 고르기
  var grid = doc.getElementById('gdGrid');
  if (grid) {
    var cat = 'all';
    var cards = [].slice.call(grid.querySelectorAll('.gd'));
    var empty = doc.getElementById('gdEmpty'), count = doc.getElementById('gdCount');
    var apply = function () {
      var n = 0;
      cards.forEach(function (c) {
        var show = cat === 'all' || c.getAttribute('data-cat') === cat;
        c.hidden = !show; if (show) n++;
      });
      if (empty) empty.hidden = n > 0;
      if (count) count.textContent = n;
    };
    doc.querySelectorAll('[data-cat-btn]').forEach(function (b) {
      b.addEventListener('click', function () {
        cat = b.getAttribute('data-cat-btn');
        doc.querySelectorAll('[data-cat-btn]').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        apply();
      });
    });
    apply();
  }

  // 오디션 지원서: 빠진 칸을 짚어 주고, 접수 서버가 켜져 있으면 글 → 사진·영상(조각) → 끝맺음 순서로 보낸다.
  //   접수 서버에 이 사이트가 없거나 답이 없으면 시안 화면 그대로(아무 데도 전송하지 않음).
  var form = doc.getElementById('apForm');
  if (form) {
    var OPS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://127.0.0.1:8798/' : 'https://jtops.dbartera.com/';
    var OPS_SITE = 'jtcorea';
    var official = /(^|\.)jtcoreaent\.com$/.test(location.hostname);
    // 공식 주소에서 실제 접수를 여는 스위치. 2026-11-26 사용자 지시로 켬(구글 폼 대신 이 지원서로 받는다). false 로 바꾸면 공식 주소에서 지원서 칸 대신 '열 수 없음' 안내만 보인다.
    var OPEN = true;
    // 시험 접수: 공식 주소가 아닌 곳, 또는 공식 주소에 ?test=1 을 붙여 연 경우. 보낸 지원서는 '시험'으로 표시된다.
    var testMode = !official || /[?&]test=1(&|$)/.test(location.search);
    var live = false, sending = false;
    var post = function (o) { return fetch(OPS, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(o) }).then(function (r) { return r.json(); }); };
    // 공식 주소에서는 시안 화면을 보이지 않는다: 접수 서버가 받을 수 있으면 지원서, 아니면 '지금 열 수 없음' 안내(다시 열기·문의 메일).
    var wait = function (on) {
      if (!official) return;
      [].forEach.call(doc.querySelectorAll('.ap-demo[data-demo]'), function (x) { x.hidden = true; });
      doc.getElementById('apPrep').hidden = !on; doc.getElementById('apWait').hidden = !on; form.hidden = true;
      var steps = doc.querySelector('.ap-side ol, aside ol'); if (steps) steps.hidden = on; // 칸이 안 보일 때는 단계 목록도 숨긴다
    };
    if (official) { form.hidden = true; [].forEach.call(doc.querySelectorAll('.ap-demo[data-demo]'), function (x) { x.hidden = true; }); }
    (official && !OPEN && !testMode ? Promise.reject() : fetch(OPS + '?a=status&site=' + OPS_SITE)).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.ok || j.status !== 'active') return wait(true);
      // 이 주소에서 보낸 글을 서버가 받는지 먼저 확인한다(출처가 등록돼 있지 않으면 답을 못 받는다). 아무것도 저장하지 않는 물음.
      return post({ a: 'applyDone', site: OPS_SITE, id: '-', key: '-' }).then(function () {
        live = true;
        [].forEach.call(doc.querySelectorAll('.ap-demo[data-demo]'), function (x) { x.hidden = true; });
        if (official) { wait(false); form.hidden = false; }
        if (testMode) doc.getElementById('apTest').hidden = false;
      });
    }).catch(function () { wait(true); });
    // 올릴 수 있는 파일(서버와 같은 기준): 칸 → [개수, 한 개 최대 MB]
    var EXT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', m4v: 'video/x-m4v' };
    var LIM = { intro: [1, 500], face: [1, 30], body: [1, 30], skill: [3, 500] };
    var typeOf = function (f) {
      var t = (f.type || '').toLowerCase(), k;
      for (k in EXT) if (EXT[k] === t) return t;
      var m = /\.([a-z0-9]+)$/i.exec(f.name);
      return (m && EXT[m[1].toLowerCase()]) || '';
    };
    var fileWhy = function (el) {
      var lim = LIM[el.name], img = el.name === 'face' || el.name === 'body', i, f, t;
      if (!lim || !el.files.length) return '';
      if (el.files.length > lim[0]) return '영상은 ' + lim[0] + '개까지 올릴 수 있습니다.';
      for (i = 0; i < el.files.length; i++) {
        f = el.files[i]; t = typeOf(f);
        if (!t || (t.indexOf('image/') === 0) !== img) return img ? '사진은 JPG·PNG·WEBP·HEIC 파일로 올려 주세요.' : '영상은 MP4·MOV·WEBM 파일로 올려 주세요.';
        if (f.size > lim[1] * 1048576) return img ? '사진은 한 장에 ' + lim[1] + 'MB까지 올릴 수 있습니다.' : '영상은 한 개에 ' + lim[1] + 'MB까지 올릴 수 있습니다.';
      }
      return '';
    };
    var sets = [].slice.call(form.querySelectorAll('.ap-fs'));
    var steps = [].slice.call(doc.querySelectorAll('#apSteps li'));
    var err = doc.getElementById('apErr'), done = doc.getElementById('apDone');
    var MSG = { name: '이름을 적어 주세요.', birth: '생년월일을 골라 주세요.', nationality: '국적을 적어 주세요.', residence: '사는 나라와 도시를 적어 주세요.',
      email: '이메일 주소를 적어 주세요.', contact: '연락이 닿는 번호나 계정을 적어 주세요.', guardian: '보호자 이름을 적어 주세요.', guardianContact: '보호자 연락처를 적어 주세요.',
      intro: '자기소개 영상을 올려 주세요.', face: '정면 클로즈업 사진을 올려 주세요.', body: '전신 사진을 올려 주세요.', skill: '지원 분야 영상을 올려 주세요.',
      okRule: '주의사항 확인에 표시해 주세요.', okPrivacy: '개인정보 수집·이용 동의에 표시해 주세요.', okGuardian: '보호자 동의에 표시해 주세요.' };
    var why = function (el) {
      var v = el.validity;
      if (v.customError) return el.validationMessage;
      if (el.name === 'birth' && (v.rangeUnderflow || v.rangeOverflow)) return '2010년생부터 2013년생까지 지원할 수 있습니다.';
      if (el.name === 'email' && v.typeMismatch) return '이메일 주소 형식을 확인해 주세요.';
      return MSG[el.name] || '이 칸을 채워 주세요.';
    };
    var catOk = function (fs) { var g = fs.querySelector('[data-need-one]'); return !g || !!g.querySelector('input:checked'); };
    var setOk = function (fs) {
      var ok = catOk(fs);
      [].forEach.call(fs.querySelectorAll('input'), function (el) { if (!el.checkValidity()) ok = false; });
      return ok;
    };
    var sync = function () { sets.forEach(function (fs, i) { if (steps[i]) steps[i].classList.toggle('ok', setOk(fs)); }); };
    var box = function (el) { return el.closest('.f, .up, .ck'); };
    var clear = function (el) {
      var b = box(el); if (!b) return;
      b.classList.remove('is-err');
      var m = b.querySelector('.f-e'); if (m) m.remove();
    };
    var size = function (n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB'; };
    form.addEventListener('input', function (e) { clear(e.target); sync(); });
    form.addEventListener('change', function (e) {
      var el = e.target;
      clear(el);
      if (el.name === 'category') el.closest('.ap-cat').classList.remove('is-err');
      if (el.type === 'file') {  // 고른 파일 이름을 보여 주고, 형식·크기를 미리 본다
        el.setCustomValidity(fileWhy(el));
        var up = el.closest('.up'), st = up.querySelector('.up-s'), fl = el.files;
        up.classList.toggle('has', fl.length > 0);
        st.textContent = '';
        if (!fl.length) st.textContent = st.getAttribute('data-empty');
        else {
          if (fl.length === 1 && /^image\//.test(fl[0].type)) {
            var im = doc.createElement('img'); im.alt = ''; im.src = URL.createObjectURL(fl[0]);
            im.onload = function () { URL.revokeObjectURL(im.src); };
            st.appendChild(im);
          }
          st.appendChild(doc.createTextNode(fl.length === 1 ? fl[0].name + ' · ' + size(fl[0].size) : '파일 ' + fl.length + '개'));
        }
      }
      sync();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null, n = 0;
      [].forEach.call(form.querySelectorAll('.is-err'), function (b) { b.classList.remove('is-err'); });
      [].forEach.call(form.querySelectorAll('.f-e'), function (m) { m.remove(); });
      sets.forEach(function (fs) {
        [].forEach.call(fs.querySelectorAll('input'), function (el) {
          if (el.checkValidity()) return;
          n++; if (!first) first = el;
          var b = box(el); if (!b) return;
          b.classList.add('is-err');
          var m = doc.createElement('span'); m.className = 'f-e'; m.textContent = why(el);
          b.appendChild(m);
        });
        var g = fs.querySelector('[data-need-one]');
        if (g && !catOk(fs)) { n++; g.classList.add('is-err'); if (!first) first = g.querySelector('input'); }
      });
      if (first) {
        err.hidden = false;
        err.textContent = '빠졌거나 다시 봐야 할 칸이 ' + n + '곳 있습니다. 주황색으로 표시한 칸을 확인해 주세요.';
        first.focus();
        (first.closest('.f, .up, .ck, .ap-cat') || first).scrollIntoView({ block: 'center' });
        return;
      }
      err.hidden = true;
      if (!live) {  // 시안: 전송 없이 다음 화면만 보여 준다
        form.hidden = true; done.hidden = false;
        done.focus(); done.scrollIntoView({ block: 'start' });
        return;
      }
      if (!sending) send();
    });
    var btn = form.querySelector('button[type=submit]'), prog = doc.getElementById('apProg'), progT = doc.getElementById('apProgT'), bar = doc.getElementById('apBar');
    var FAIL = { busy: '지금은 접수가 몰려 있습니다. 잠시 뒤 다시 보내 주세요.', full: '지금은 파일을 받을 수 없습니다. 아래 오디션 문의 메일로 알려 주세요.', closed: '지금은 지원서를 받지 않습니다.',
      type: '사진·영상 파일 형식을 확인해 주세요.', size: '사진·영상 파일 크기를 확인해 주세요.', invalid: '적은 내용을 다시 확인해 주세요.' };
    var send = function () {
      var data = { category: [], test: testMode ? 1 : 0, page: location.pathname.slice(-60) }, list = [], total = 0, sent = 0, id, key, chunk;
      ['name', 'birth', 'nationality', 'residence', 'email', 'contact', 'guardian', 'guardianContact'].forEach(function (k) { data[k] = form.elements[k].value.trim(); });
      [].forEach.call(form.querySelectorAll('[name=category]:checked'), function (c) { data.category.push(c.value); });
      var g = form.querySelector('[name=gender]:checked'); if (g) data.gender = g.value;
      ['okRule', 'okPrivacy', 'okGuardian'].forEach(function (k) { data[k] = form.elements[k].checked; });
      ['intro', 'face', 'body', 'skill'].forEach(function (k) { [].forEach.call(form.elements[k].files, function (f, i) { list.push({ k: k, i: i, f: f }); total += f.size; }); });
      var paint = function (label) {
        var pct = total ? Math.min(100, Math.floor(sent / total * 100)) : 0;
        progT.textContent = label || ('사진·영상을 올리는 중입니다 · ' + pct + '% · 이 화면을 닫지 말아 주세요');
        bar.style.width = pct + '%';
      };
      var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
      var sendFile = function (x) {
        var off = 0, tries = 0;
        var step = function () {
          if (off >= x.f.size) return Promise.resolve();
          var u = OPS + 'up?site=' + OPS_SITE + '&id=' + id + '&key=' + encodeURIComponent(key) + '&k=' + x.k + '&i=' + x.i + '&off=' + off;
          return fetch(u, { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: x.f.slice(off, Math.min(x.f.size, off + chunk)) })
            .then(function (r) { return r.json(); })
            .then(function (j) {
              if (j.ok || (j.err === 'offset' && tries++ < 5)) { sent += j.size - off; off = j.size; if (j.ok) tries = 0; paint(); return step(); }
              throw j;
            }, function (e) { if (tries++ < 4) return wait(1500 * tries).then(step); throw e; });  // 끊기면 잠시 뒤 같은 자리부터 다시
        };
        return step();
      };
      sending = true; btn.disabled = true; prog.hidden = false; err.hidden = true; paint('지원서를 보내는 중입니다');
      post({ a: 'apply', site: OPS_SITE, data: data, files: list.map(function (x) { return { k: x.k, name: x.f.name, type: typeOf(x.f), size: x.f.size }; }) })
        .then(function (j) {
          if (!j.ok) throw j;
          id = j.id; key = j.key; chunk = j.chunk; paint();
          return list.reduce(function (p, x) { return p.then(function () { return sendFile(x); }); }, Promise.resolve());
        })
        .then(function () { paint('마무리하는 중입니다'); return post({ a: 'applyDone', site: OPS_SITE, id: id, key: key }); })
        .then(function (j) {  // 서버가 저장했다고 답한 뒤에만 접수 안내를 보여 준다
          if (!j.ok) throw j;
          sending = false; prog.hidden = true;
          doc.getElementById('apDoneT').textContent = '지원서를 받았습니다';
          doc.getElementById('apDoneP').textContent = '접수 번호는 ' + j.id + '입니다. 결과는 개별로 연락드립니다.' + (testMode ? ' 지금은 시험 운영 중이라 이 지원서는 시험용으로만 저장됩니다.' : '');
          doc.getElementById('apBack').textContent = 'JT COREA 홈으로';
          form.reset(); sync(); form.hidden = true; done.hidden = false;
          done.focus({ preventScroll: true }); done.scrollIntoView({ block: 'center' });
        })
        .catch(function (e) {
          sending = false; btn.disabled = false; prog.hidden = true;
          err.hidden = false;
          err.textContent = (e && FAIL[e.err]) || '지원서를 보내지 못했습니다. 인터넷 연결을 확인하고 다시 보내 주세요. 적은 내용은 그대로 남아 있습니다.';
          err.scrollIntoView({ block: 'center' });
        });
    };
    window.addEventListener('beforeunload', function (e) { if (sending) { e.preventDefault(); e.returnValue = ''; } });
    doc.getElementById('apBack').addEventListener('click', function () {
      if (live) { location.href = 'index.html'; return; }
      done.hidden = true; form.hidden = false; form.scrollIntoView({ block: 'start' });
    });
    sync();
  }
})();
