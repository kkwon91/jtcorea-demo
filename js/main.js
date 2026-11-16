// JT COREA — 공통 동작(머리 고정 색, 메뉴, 영상 창, 멤버 인사 영상, 나타나기, 굿즈 고르기)
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

  // 멤버 카드: 올리면(휴대폰은 누르면) 인사 영상
  var canHover = window.matchMedia('(hover:hover)').matches;
  doc.querySelectorAll('.mem[data-clip]').forEach(function (card) {
    var v = card.querySelector('video');
    function on() {
      if (!v.src) v.src = card.getAttribute('data-clip');
      card.classList.add('is-on');
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    function off() { card.classList.remove('is-on'); v.pause(); }
    if (canHover) {
      card.addEventListener('mouseenter', on); card.addEventListener('mouseleave', off);
    } else {
      card.addEventListener('click', function () {
        var was = card.classList.contains('is-on');
        doc.querySelectorAll('.mem.is-on').forEach(function (c) { c.classList.remove('is-on'); var x = c.querySelector('video'); if (x) x.pause(); });
        if (!was) on();
      });
    }
  });

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
