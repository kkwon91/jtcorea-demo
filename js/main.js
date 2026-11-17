// JT COREA — 공통 동작(머리 고정 색, 메뉴, 영상 창, 멤버 소개 창, 첫 화면 신호 화면, 나타나기, 굿즈 고르기)
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

  // 굿즈: 종류·멤버 고르기
  var grid = doc.getElementById('gdGrid');
  if (grid) {
    var state = { cat: 'all', mem: 'all' };
    var cards = [].slice.call(grid.querySelectorAll('.gd'));
    var empty = doc.getElementById('gdEmpty'), count = doc.getElementById('gdCount');
    function apply() {
      var n = 0;
      cards.forEach(function (c) {
        var okCat = state.cat === 'all' || c.getAttribute('data-cat') === state.cat;
        var m = c.getAttribute('data-mem') || 'group';
        var okMem = state.mem === 'all' || m === state.mem || m === 'group'; // 멤버를 고르면 다른 멤버 포토카드만 숨김
        var show = okCat && okMem; c.hidden = !show; if (show) n++;
      });
      if (empty) empty.hidden = n > 0;
      if (count) count.textContent = n;
    }
    doc.querySelectorAll('[data-cat-btn]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.cat = b.getAttribute('data-cat-btn');
        doc.querySelectorAll('[data-cat-btn]').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        apply();
      });
    });
    doc.querySelectorAll('[data-mem-btn]').forEach(function (b) {
      b.addEventListener('click', function () {
        var m = b.getAttribute('data-mem-btn');
        state.mem = state.mem === m ? 'all' : m;
        doc.querySelectorAll('[data-mem-btn]').forEach(function (x) { var onx = x.getAttribute('data-mem-btn') === state.mem; x.classList.toggle('is-on', onx); x.setAttribute('aria-pressed', onx ? 'true' : 'false'); });
        apply();
        if (state.mem !== 'all') grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    apply();
  }
})();
