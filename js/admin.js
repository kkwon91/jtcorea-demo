// JT COREA 관리자 — 오디션 지원서 목록·한 건 보기·상태·메모·지우기
// 로그인과 자료는 사이트 운영 서버가 맡는다(비밀번호는 서버만 안다). 받은 값은 모두 글자로만 넣는다(innerHTML 로 넣지 않음).
(function () {
  'use strict';
  var doc = document;
  var OPS = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://127.0.0.1:8798/' : 'https://ops.dbartera.com/';
  var SITE = 'jtcorea';
  var KEY = 'jtadm';
  var $ = function (id) { return doc.getElementById(id); };
  var el = function (tag, attrs, kids) {
    var n = doc.createElement(tag), k;
    for (k in attrs || {}) { if (k === 'text') n.textContent = attrs[k]; else if (k === 'on') n.addEventListener(attrs[k][0], attrs[k][1]); else if (attrs[k] != null) n.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); });
    return n;
  };
  var store = { get: function () { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } },
    set: function (v) { try { if (v) sessionStorage.setItem(KEY, JSON.stringify(v)); else sessionStorage.removeItem(KEY); } catch (e) { /* 저장 못 해도 이번 화면은 쓴다 */ } } };
  var post = function (o) { o.site = SITE; return fetch(OPS, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(o) }).then(function (r) { return r.json(); }); };
  var me = store.get(), apps = [], statuses = ['신규', '확인함', '연락함', '보류'];
  var view = { st: '전체', cat: '전체', q: '', open: null };
  var CAT = { vocal: 'VOCAL', rap: 'RAP', dance: 'DANCE' }, GENDER = { female: '여성', male: '남성', none: '밝히지 않음' };
  var FILE = { intro: '자기소개 영상', face: '정면 클로즈업 사진', body: '전신 사진', skill: '지원 분야 영상' };
  var when = function (iso, long) {
    var o = long ? { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' } : { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' };
    try { return new Date(iso).toLocaleString('ko-KR', o); } catch (e) { return String(iso).slice(0, 16); }
  };
  var size = function (n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB'; };

  // ── 로그인 ──
  var msg = function (t) { $('adMsg').hidden = !t; $('adMsg').textContent = t || ''; };
  var show = function (inside) {
    $('adLogin').hidden = inside; $('adMain').hidden = !inside; $('adMe').hidden = !inside;
    if (inside) $('adWho').textContent = me.id;
  };
  var logout = function (why) { me = null; store.set(null); apps = []; view.open = null; show(false); msg(why || ''); };
  var admin = function (o) {
    o.a = 'admin'; o.token = me && me.token;
    return post(o).then(function (j) { if (!j.ok && j.err === 'login') { logout('로그인 시간이 지났습니다. 다시 로그인해 주세요.'); throw j; } return j; });
  };
  $('adForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, go = $('adGo');
    go.disabled = true; msg('');
    post({ a: 'login', id: f.elements.id.value.trim(), pw: f.elements.pw.value }).then(function (j) {
      go.disabled = false;
      if (!j.ok) return msg(j.err === 'locked' ? '여러 번 틀려 잠시 잠겼습니다. 15분 뒤 다시 해 주세요.' : j.err === 'site' ? '접수 서버에 이 사이트가 아직 등록되지 않았습니다. 등록한 뒤에 로그인할 수 있습니다.' : j.err === 'closed' ? '지금은 운영이 멈춰 있습니다.' : '아이디나 비밀번호가 맞지 않습니다.');
      me = { id: f.elements.id.value.trim(), token: j.token }; store.set(me);
      f.elements.pw.value = '';
      show(true); load();
    }).catch(function () { go.disabled = false; msg('접수 서버에 닿지 않습니다. 잠시 뒤 다시 해 주세요.'); });
  });
  $('adOut').addEventListener('click', function () { logout(''); });

  // ── 목록 ──
  var match = function (a) {
    if (view.st !== '전체' && a.status !== view.st) return false;
    if (view.cat !== '전체' && (a.category || []).indexOf(view.cat) < 0) return false;
    if (view.q) { var t = [a.name, a.nationality, a.residence, a.id].join(' ').toLowerCase(); if (t.indexOf(view.q) < 0) return false; }
    return true;
  };
  var tabs = function () {
    var box = $('adTabs'); box.textContent = '';
    ['전체'].concat(statuses).forEach(function (s) {
      var n = s === '전체' ? apps.length : apps.filter(function (a) { return a.status === s; }).length;
      box.appendChild(el('button', { type: 'button', class: view.st === s ? 'is-on' : null, 'aria-pressed': view.st === s ? 'true' : 'false', on: ['click', function () { view.st = s; draw(); }] }, [s, el('b', { text: String(n) })]));
    });
    var cb = $('adCats'); cb.textContent = '';
    ['전체', 'vocal', 'rap', 'dance'].forEach(function (c) {
      cb.appendChild(el('button', { type: 'button', class: view.cat === c ? 'is-on' : null, 'aria-pressed': view.cat === c ? 'true' : 'false', on: ['click', function () { view.cat = c; draw(); }] }, [c === '전체' ? '모든 분야' : CAT[c]]));
    });
  };
  var chips = function (a) {
    var out = (a.category || []).map(function (c) { return el('span', { class: 'chip chip--' + c, text: CAT[c] || c }); });
    if (a.test) out.push(el('span', { class: 'chip chip--test', text: '시험' }));
    return out;
  };
  var draw = function () {
    tabs();
    var rows = $('adRows'), list = apps.filter(match); rows.textContent = '';
    list.forEach(function (a) {
      var tr = el('tr', { tabindex: '0', class: (a.status === '신규' ? 'is-new ' : '') + (view.open === a.id ? 'is-on' : ''), on: ['click', function () { open(a.id); }] }, [
        el('td', { class: 't', text: when(a.at) }),
        el('td', { class: 'n' }, [a.name, el('small', { text: a.id })]),
        el('td', { class: 'b', text: a.birth || '' }),
        el('td', { class: 'w', text: [a.nationality, a.residence].filter(Boolean).join(' · ') }),
        el('td', { class: 'c' }, chips(a)),
        el('td', { class: 's' }, [el('span', { class: 'st st--' + a.status, text: a.status })])
      ]);
      tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(a.id); } });
      rows.appendChild(tr);
    });
    var test = apps.filter(function (a) { return a.test; }).length;
    $('adSum').textContent = '받은 지원서 ' + apps.length + '건' + (test ? ' · 그중 시험 접수 ' + test + '건' : '') + (list.length !== apps.length ? ' · 지금 보이는 것 ' + list.length + '건' : '');
    $('adEmpty').hidden = list.length > 0;
    $('adEmpty').textContent = apps.length ? '고른 조건에 맞는 지원서가 없습니다.' : '아직 받은 지원서가 없습니다.';
  };
  var load = function () {
    return admin({ op: 'appList' }).then(function (j) {
      if (!j.ok) return;
      apps = j.apps || []; if (j.statuses) statuses = j.statuses;
      if (view.open && !apps.some(function (a) { return a.id === view.open; })) close();
      draw();
    }).catch(function (e) { if (!(e && e.err)) { $('adEmpty').hidden = false; $('adEmpty').textContent = '접수 서버에 닿지 않습니다. 잠시 뒤 새로 고침을 눌러 주세요.'; } });
  };
  $('adReload').addEventListener('click', load);
  $('adQ').addEventListener('input', function (e) { view.q = e.target.value.trim().toLowerCase(); draw(); });

  // ── 한 건 ──
  var close = function () { view.open = null; $('adDet').hidden = true; $('adDet').textContent = ''; doc.querySelector('.ad-split').classList.remove('has-det'); draw(); };
  var open = function (id) {
    var a = apps.filter(function (x) { return x.id === id; })[0]; if (!a) return;
    view.open = id; draw();
    var det = $('adDet'); det.textContent = ''; det.hidden = false; det.scrollTop = 0;
    doc.querySelector('.ad-split').classList.add('has-det');
    var row = function (k, v, href) { return v ? [el('dt', { text: k }), el('dd', {}, [href ? el('a', { href: href, text: v }) : v])] : []; };
    var flat = function (xs) { return [].concat.apply([], xs); };
    var sts = el('div', { class: 'ad-sts' }, statuses.map(function (s) {
      return el('button', { type: 'button', class: a.status === s ? 'is-on' : null, 'aria-pressed': a.status === s ? 'true' : 'false', on: ['click', function () {
        admin({ op: 'appStatus', id: id, status: s }).then(function (j) { if (j.ok) { a.status = s; open(id); } });
      }] }, [s]);
    }));
    var media = el('div', {}, [el('p', { class: 'ad-wait', text: '사진과 영상을 불러오는 중입니다' })]);
    var memo = el('textarea', { 'aria-label': '메모', maxlength: '2000' }); memo.value = a.memo || '';
    var saved = el('small', { text: '' });
    var del = el('button', { type: 'button', class: 'ad-btn ad-btn--del', text: '이 지원서 지우기' });
    del.addEventListener('click', function () {
      if (!del.classList.contains('is-sure')) { del.classList.add('is-sure'); del.textContent = '사진·영상까지 지웁니다. 한 번 더 누르면 지워집니다'; setTimeout(function () { del.classList.remove('is-sure'); del.textContent = '이 지원서 지우기'; }, 6000); return; }
      admin({ op: 'appDelete', id: id }).then(function (j) { if (j.ok) { apps = apps.filter(function (x) { return x.id !== id; }); close(); } });
    });
    det.appendChild(el('div', { class: 'ad-det-hd' }, [
      el('div', {}, [el('h2', { text: a.name }), el('p', { text: '접수 번호 ' + a.id + ' · ' + when(a.at, true) + (a.test ? ' · 시험 접수' : '') })]),
      el('button', { type: 'button', class: 'ad-x', 'aria-label': '닫기', text: '×', on: ['click', close] })
    ]));
    det.appendChild(el('div', { class: 'ad-sec' }, [el('h3', { text: '처리 상태' }), sts]));
    det.appendChild(el('div', { class: 'ad-sec' }, [el('h3', { text: '지원자' }), el('dl', { class: 'ad-dl' }, flat([
      row('생년월일', a.birth), row('성별', GENDER[a.gender] || ''), row('국적', a.nationality), row('사는 곳', a.residence),
      [el('dt', { text: '지원 분야' }), el('dd', {}, chips(a))]
    ]))]));
    det.appendChild(el('div', { class: 'ad-sec' }, [el('h3', { text: '연락처' }), el('dl', { class: 'ad-dl' }, flat([
      row('이메일', a.email, 'mailto:' + a.email), row('연락처', a.contact), row('보호자', a.guardian), row('보호자 연락처', a.guardianContact),
      row('동의한 시각', a.agreed ? when(a.agreed, true) : '')
    ]))]));
    det.appendChild(el('div', { class: 'ad-sec' }, [el('h3', { text: '사진과 영상' }), media]));
    det.appendChild(el('div', { class: 'ad-sec ad-memo' }, [el('h3', { text: '메모 (관리자만 봅니다)' }), memo,
      el('div', { class: 'ad-row' }, [el('button', { type: 'button', class: 'ad-btn', text: '메모 저장', on: ['click', function () {
        admin({ op: 'appMemo', id: id, memo: memo.value }).then(function (j) { saved.textContent = j.ok ? '저장했습니다' : '저장하지 못했습니다'; if (j.ok) a.memo = memo.value; });
      }] }), saved])]));
    det.appendChild(el('div', { class: 'ad-sec' }, [del]));
    // 사진·영상은 열 때마다 2시간짜리 주소를 받아 온다(열람 기록이 남는다)
    admin({ op: 'appOpen', id: id }).then(function (j) {
      if (view.open !== id) return;
      media.textContent = '';
      if (!j.ok) { media.appendChild(el('p', { class: 'ad-wait', text: '사진과 영상을 불러오지 못했습니다' })); return; }
      var fig = function (f, many) {
        var u = OPS + f.url, cap = el('figcaption', {}, [FILE[f.k] + (many ? ' ' + (f.i + 1) : ''), el('span', { text: size(f.size) })]);
        if (f.type.indexOf('image/') === 0) return el('figure', { class: 'ad-media' }, [cap, el('a', { href: u, target: '_blank', rel: 'noopener' }, [el('img', { src: u, alt: FILE[f.k], loading: 'lazy' })])]);
        return el('figure', { class: 'ad-media' }, [cap, el('video', { src: u, controls: '', preload: 'metadata', playsinline: '' })]);
      };
      var pics = j.files.filter(function (f) { return f.type.indexOf('image/') === 0; }), vids = j.files.filter(function (f) { return f.type.indexOf('image/') !== 0; });
      var skills = vids.filter(function (f) { return f.k === 'skill'; }).length;
      media.appendChild(el('div', { class: 'ad-pics' }, pics.map(function (f) { return fig(f); })));
      media.appendChild(el('div', { class: 'ad-vids', style: 'margin-top:14px' }, vids.map(function (f) { return fig(f, f.k === 'skill' && skills > 1); })));
    }).catch(function () {});
  };

  // ── 표로 내려받기 ──
  $('adCsv').addEventListener('click', function () {
    var cols = [['at', '접수 시각'], ['id', '접수 번호'], ['name', '이름'], ['birth', '생년월일'], ['gender', '성별'], ['nationality', '국적'], ['residence', '사는 곳'], ['category', '지원 분야'], ['email', '이메일'], ['contact', '연락처'], ['guardian', '보호자'], ['guardianContact', '보호자 연락처'], ['status', '상태'], ['memo', '메모'], ['test', '시험 접수']];
    var cell = function (v) { v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };  // 표 프로그램이 수식으로 읽지 않게
    var rows = apps.filter(match).map(function (a) {
      return cols.map(function (c) {
        var v = a[c[0]];
        if (c[0] === 'at') v = when(v, true); else if (c[0] === 'category') v = (v || []).map(function (x) { return CAT[x] || x; }).join(' · '); else if (c[0] === 'gender') v = GENDER[v] || ''; else if (c[0] === 'test') v = v ? '시험' : '';
        return cell(v);
      }).join(',');
    });
    var blob = new Blob(['﻿' + cols.map(function (c) { return cell(c[1]); }).join(',') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = el('a', { href: URL.createObjectURL(blob), download: 'jtcorea_audition_' + new Date().toISOString().slice(0, 10) + '.csv' });
    doc.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && view.open) close(); });
  if (me && me.token) { show(true); load(); } else show(false);
  // 접수 서버에 이 사이트가 있는지 먼저 본다(없으면 로그인해도 들어갈 수 없으니 미리 알린다)
  fetch(OPS + '?a=status&site=' + SITE).then(function (r) { return r.json(); }).then(function (j) {
    if (!me && !j.ok) msg('접수 서버에 이 사이트가 아직 등록되지 않았습니다. 등록한 뒤에 로그인할 수 있습니다.');
    else if (!me && j.status !== 'active') msg('지금은 운영이 멈춰 있습니다.');
  }).catch(function () { if (!me) msg('접수 서버에 닿지 않습니다. 잠시 뒤 다시 열어 주세요.'); });
})();
