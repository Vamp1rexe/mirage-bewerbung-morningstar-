(function () {
  'use strict';
  var doc = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Intro ---------- */
  var intro = document.getElementById('intro');
  var pctEl = intro && intro.querySelector('.intro-pct b');
  var bar = intro && intro.querySelector('.intro-bar');
  var pct = 0, loaded = false, started = performance.now();

  window.addEventListener('load', function () { loaded = true; });
  setTimeout(function () { loaded = true; }, 3500);

  function tickIntro() {
    var elapsed = performance.now() - started;
    var target = loaded ? 100 : Math.min(90, elapsed / 18);
    pct += (target - pct) * (loaded ? 0.12 : 0.08);
    if (loaded && 100 - pct < 0.6) pct = 100;
    if (pctEl) pctEl.textContent = Math.round(pct);
    if (bar) bar.style.width = pct + '%';
    if (pct >= 100 && elapsed > 1100) return finishIntro();
    requestAnimationFrame(tickIntro);
  }
  function finishIntro() {
    if (intro) intro.classList.add('done');
    body.classList.remove('is-loading');
    setTimeout(function () { body.classList.add('ready'); startCounters(document.querySelector('.hero')); }, 350);
    setTimeout(function () { if (intro) intro.remove(); }, 1400);
  }
  document.querySelectorAll('[data-in]').forEach(function (el) { el.style.setProperty('--i', el.getAttribute('data-in')); });
  if (reduce || !intro) finishIntro(); else requestAnimationFrame(tickIntro);

  /* ---------- Counters ---------- */
  function startCounters(scope) {
    if (!scope) return;
    scope.querySelectorAll('.count:not(.done)').forEach(function (el) {
      el.classList.add('done');
      var to = parseFloat(el.getAttribute('data-to')) || 0;
      if (reduce) { el.textContent = to; return; }
      var t0 = performance.now(), dur = 1600 + Math.min(to, 1000) * 0.6;
      (function step(now) {
        var p = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(to * e);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ---------- Scroll reveal ---------- */
  var groups = new Map();
  document.querySelectorAll('[data-rv]').forEach(function (el) {
    var sec = el.closest('section') || body;
    var n = groups.get(sec) || 0;
    el.style.setProperty('--d', Math.min(n, 8) * 0.08 + 's');
    groups.set(sec, n + 1);
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target.__rv || en.target;
        el.classList.add('in');
        startCounters(el);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    document.querySelectorAll('[data-rv]').forEach(function (el) {
      var ln = el.parentElement && el.parentElement.classList.contains('ln') ? el.parentElement : null;
      if (ln) { ln.__rv = el; io.observe(ln); } else io.observe(el);
    });
  } else {
    document.querySelectorAll('[data-rv]').forEach(function (el) { el.classList.add('in'); });
    startCounters(document);
  }

  /* ---------- Scroll-driven bits ---------- */
  var nav = document.querySelector('.nav');
  var prog = document.querySelector('.progress i');
  var drift = document.querySelectorAll('[data-drift]');
  var tlLine = document.querySelector('.tl-line i');
  var tl = document.querySelector('.tl');
  var reelImg = document.querySelector('.reel-frame img');
  var reel = document.querySelector('.reel-frame');
  var links = Array.prototype.slice.call(document.querySelectorAll('#menu a'));
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var lastY = window.scrollY, ticking = false;

  function onScroll() {
    var y = window.scrollY, vh = window.innerHeight;
    var max = doc.scrollHeight - vh;
    if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

    nav.classList.toggle('solid', y > 40);
    if (!menu.classList.contains('open')) nav.classList.toggle('hide', y > lastY && y > 300);
    lastY = y;

    if (!reduce) {
      drift.forEach(function (el) {
        el.style.transform = 'translate3d(' + (y * parseFloat(el.getAttribute('data-drift'))) + 'px,0,0)';
      });
      if (reel) {
        var r = reel.getBoundingClientRect();
        var p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
        reelImg.style.setProperty('--z', (1.18 - p * 0.18).toFixed(3));
      }
    }
    if (tl && tlLine) {
      var b = tl.getBoundingClientRect();
      var tp = Math.max(0, Math.min(1, (vh * 0.7 - b.top) / b.height));
      tlLine.style.setProperty('--p', tp.toFixed(3));
    }

    var cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * 0.45) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  links.forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  onScroll();

  /* ---------- Tabs filter ---------- */
  var tabs = document.querySelectorAll('.tabs button');
  var tiles = document.querySelectorAll('.tile');
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-f');
      tabs.forEach(function (b) { var on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      var shown = [];
      tiles.forEach(function (t) {
        var hit = f === 'all' || t.getAttribute('data-c') === f;
        t.classList.remove('pop');
        t.classList.toggle('off', !hit);
        if (hit) shown.push(t);
      });
      void document.body.offsetHeight;
      shown.forEach(function (t, i) { t.style.setProperty('--pd', (i * 70) + 'ms'); t.classList.add('pop'); });
      if (window.__devBox) shown.forEach(function (t, i) { setTimeout(function () { window.__devBox(t); }, 420 + i * 90); });
      if (window.__devType) window.__devType('f-' + f);
    });
  });

  /* ---------- Spotlight on tiles ---------- */
  if (finePointer) {
    tiles.forEach(function (t) {
      t.addEventListener('pointermove', function (e) {
        var r = t.getBoundingClientRect();
        t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        t.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Star cursor trail ---------- */
  var cv = document.getElementById('trail');
  if (cv && finePointer && !reduce) {
    var ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var parts = [], running = false, lx = -1, ly = -1;
    var size = function () { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); window.addEventListener('resize', size);
    window.addEventListener('pointermove', function (e) {
      var dx = e.clientX - lx, dy = e.clientY - ly;
      if (lx >= 0 && dx * dx + dy * dy < 140) return;
      lx = e.clientX; ly = e.clientY;
      parts.push({ x: lx, y: ly, vx: (Math.random() - .5) * .8, vy: Math.random() * .6 + .2, r: Math.random() * 2.2 + 1.4, a: 1, rot: Math.random() * 3, hue: Math.random() < .5 ? '95,182,255' : '31,134,255' });
      if (parts.length > 60) parts.shift();
      if (!running) { running = true; requestAnimationFrame(draw); }
    });
    var star = function (x, y, r, rot) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
      for (var i = 0; i < 8; i++) { var rr = i % 2 ? r * .35 : r * 1.6, ang = i * Math.PI / 4; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
      ctx.closePath(); ctx.fill(); ctx.restore();
    };
    var draw = function () {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy; p.a -= .022; p.rot += .04;
        if (p.a <= 0) { parts.splice(i, 1); continue; }
        ctx.fillStyle = 'rgba(' + p.hue + ',' + p.a + ')';
        ctx.shadowColor = 'rgba(31,134,255,' + p.a + ')'; ctx.shadowBlur = 10;
        star(p.x, p.y, p.r, p.rot);
      }
      if (parts.length) requestAnimationFrame(draw); else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    };
  }

  /* =========================================================
     LIVE-CODING: Typewriter, Auswahlrahmen, Cursor, Code-Fenster
     ========================================================= */
  if (!reduce) {
    /* ---- Typewriter für Überschriften ---- */
    function prepType(root) {
      var nodes = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
      var parts = nodes.map(function (n) {
        var on = document.createElement('span'), off = document.createElement('span');
        off.className = 'tw-off'; off.textContent = n.nodeValue;
        n.parentNode.insertBefore(on, n); n.parentNode.insertBefore(off, n); n.parentNode.removeChild(n);
        return { on: on, off: off, text: off.textContent };
      });
      root.__tw = parts;
    }
    function runType(root, speed) {
      var parts = root.__tw; if (!parts || root.__typed) return; root.__typed = true;
      var caret = document.createElement('span'); caret.className = 'tw-caret';
      var pi = 0, ci = 0;
      (function step() {
        var p = parts[pi]; if (!p) { setTimeout(function () { caret.remove(); }, 1400); return; }
        ci++;
        p.on.textContent = p.text.slice(0, ci); p.off.textContent = p.text.slice(ci);
        p.on.after(caret);
        if (ci >= p.text.length) { pi++; ci = 0; }
        setTimeout(step, speed + Math.random() * speed);
      })();
    }
    var titles = Array.prototype.slice.call(document.querySelectorAll('.title, .chain-h, .contact-card p'));
    titles.forEach(prepType);
    var heroName = document.querySelector('.hero-name');
    if (heroName) prepType(heroName);
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runType(e.target, 38); tio.unobserve(e.target); } });
    }, { threshold: 0.3 });
    titles.forEach(function (t) { tio.observe(t); });
    var waitReady = setInterval(function () {
      if (body.classList.contains('ready')) { clearInterval(waitReady); setTimeout(function () { runType(heroName, 45); }, 500); }
    }, 100);

    /* ---- Auswahlrahmen + Cursor ---- */
    var dev = document.createElement('div'); dev.id = 'dev'; body.appendChild(dev);
    var cur = document.createElement('div'); cur.className = 'ghost-cur';
    cur.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 2l7 19 2.6-7.4L20 11z" fill="#1f86ff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg><span>Lucian</span>';
    dev.appendChild(cur);
    var curTimer;
    function label(el) {
      var tag = el.tagName.toLowerCase();
      var cls = (el.className && typeof el.className === 'string') ? el.className.split(/\s+/).filter(function (c) { return c && c !== 'in' && c !== 'on'; })[0] : '';
      return '<' + tag + (cls ? '.' + cls : '') + '>';
    }
    function box(el) {
      if (!el.isConnected) return;
      var r = el.getBoundingClientRect();
      if (r.width < 30 || r.height < 16) return;
      var ty = 0, m = getComputedStyle(el).transform;
      if (m && m !== 'none') { var v = m.match(/-?[\d.]+/g); if (v) ty = parseFloat(v[v.length - 1]) || 0; }
      var x = r.left + window.scrollX, y = r.top + window.scrollY - ty;
      var b = document.createElement('div'); b.className = 'sel';
      b.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
      b.innerHTML = '<i></i><i></i><i></i><i></i><b></b><em></em>';
      b.querySelector('b').textContent = label(el);
      b.querySelector('em').textContent = Math.round(r.width) + ' × ' + Math.round(r.height);
      dev.appendChild(b);
      cur.classList.add('on');
      cur.style.transform = 'translate(' + (x + r.width - 8) + 'px,' + (y + r.height - 6) + 'px)';
      clearTimeout(curTimer); curTimer = setTimeout(function () { cur.classList.remove('on'); }, 2600);
      setTimeout(function () { b.classList.add('out'); setTimeout(function () { b.remove(); }, 520); }, 1300);
    }
    window.__devBox = box;
    var boxSel = '.hero-visual,.hero-stats,.tabs,.tile,.big-num,.row,.tl-row,.chain,.reel-frame,.letter,.steps li,.quote,.val,.contact-list li,.contact-card,.foot-title';
    var bio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, d = parseFloat(el.style.getPropertyValue('--d')) || 0;
        setTimeout(function () { box(el); }, d * 1000 + 120);
        bio.unobserve(el);
      });
    }, { threshold: 0.25 });
    var startBoxes = setInterval(function () {
      if (!body.classList.contains('ready')) return;
      clearInterval(startBoxes);
      document.querySelectorAll(boxSel).forEach(function (el) { bio.observe(el); });
    }, 150);

    /* ---- Code-Fenster ---- */
    var snippets = {
      top: ['<!-- Bewerbung · Mirage DE 01 -->', '<section class="hero">', '  <p class="script">Hallo, ich bin</p>', '  <h1>Lucian Morningstar.</h1>', '  <p class="role">Administrator / Stufe 2</p>', '  <img src="assets/avatar.webp">', '</section>'],
      profil: ['<section id="info">', '  <h2>Info <b>Blatt.</b></h2>', '  <dl class="tiles">', '    <dt>Name</dt>      <dd>Noxiryn</dd>', '    <dt>Alter</dt>     <dd>18 Jahre</dd>', '    <dt>Discord</dt>   <dd>noxiryn.tv</dd>', '    <dt>IC-Name</dt>   <dd>Lucian Morningstar</dd>', '    <dt>Cheating-Bans</dt> <dd>Keine</dd>', '  </dl>', '</section>'],
      zeiten: ['/* Online-Zeiten */', '.woche {', '  start: 17:00;', '  ende: 22:00;     /* 5 Std. */', '}', '.wochenende {', '  start: 12:00;', '  ende: 02:00/03:00; /* 10–20 Std. */', '}'],
      werdegang: ['const erfahrung = {', '  rp: "GrandRP, Majestic, Narco City u. a.",', '  admin: { server: "StageV", jahre: 2 },', '  fib: {', '    dn: 23, rang: 26,', '    titel: "Chief of Integrity",', '    vorgesetzter: "DN 01 · Jonas Rak"', '  }', '};'],
      motivation: ['<article class="brief">', '  <p>Hallo liebes Admin-Team,</p>', '  <p>… Position <b>Administrator Stufe 2</b> …</p>', '  <ul class="staerken">', '    <li>Abläufe vereinfachen</li>', '    <li>Schnell eingearbeitet</li>', '    <li>Ruhe unter Druck</li>', '  </ul>', '</article>'],
      haltung: ['const zusatz = [', '  "Regelwerk",', '  "Vorbereitung",', '  "Verantwortung"', '];', '', 'zusatz.forEach(p => render(p));'],
      fazit: ['<section id="fazit">', '  <h2>Fazit.</h2>', '  <p>Über ein Gespräch würde ich mich', '     sehr freuen …</p>', '  <cite>Lucian Morningstar</cite>', '</section>', '<!-- deploy: done ✓ -->']
    };
    snippets['f-all'] = ['// Filter: Alle', 'tiles.forEach(t => t.show());'];
    snippets['f-ooc'] = ['// Filter: OOC', 'tiles', '  .filter(t => t.type === "ooc")', '  .forEach(t => t.show());', '// Name · Alter · Discord'];
    snippets['f-ic'] = ['// Filter: IC', 'tiles', '  .filter(t => t.type === "ic")', '  .forEach(t => t.show());', '// Lucian Morningstar · ID'];
    snippets['f-req'] = ['// Filter: Voraussetzungen', 'tiles', '  .filter(t => t.type === "req")', '  .forEach(t => t.show());', '// Kontolevel · Bans · Regelbrüche'];
    var files = { 'f-all': 'script.js', 'f-ooc': 'script.js', 'f-ic': 'script.js', 'f-req': 'script.js', top: 'index.html', profil: 'index.html', zeiten: 'style.css', werdegang: 'script.js', motivation: 'index.html', haltung: 'script.js', fazit: 'index.html' };
    function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function hl(t) {
      var ci = t.search(/\/\*|<!--|\/\//);
      var code = ci >= 0 ? t.slice(0, ci) : t, cm = ci >= 0 ? t.slice(ci) : '';
      var re = /("[^"]*")|(<\/?)([a-zA-Z0-9]+)|\b(class|src|id)(?==)|\b(const|forEach|render)\b|^(\s*)([a-z-]+)(?=:)/g;
      var out = '', last = 0, m;
      while ((m = re.exec(code))) {
        out += esc(code.slice(last, m.index));
        if (m[1]) out += '<span class="st">' + esc(m[1]) + '</span>';
        else if (m[3]) out += esc(m[2]) + '<span class="tg">' + m[3] + '</span>';
        else if (m[4]) out += '<span class="at">' + m[4] + '</span>';
        else if (m[5]) out += '<span class="tg">' + m[5] + '</span>';
        else if (m[7]) out += m[6] + '<span class="pr">' + m[7] + '</span>';
        last = re.lastIndex;
        if (m[0] === '') re.lastIndex++;
      }
      out += esc(code.slice(last));
      if (cm) out += '<span class="cm">' + esc(cm) + '</span>';
      return out;
    }
    var ide = document.createElement('div'); ide.className = 'ide'; ide.setAttribute('role', 'region'); ide.setAttribute('aria-label', 'Live-Code');
    ide.innerHTML = '<div class="ide-bar"><span class="dots">' +
      '<button type="button" data-a="close" title="Schließen" aria-label="Code-Fenster schließen">×</button>' +
      '<button type="button" data-a="min" title="Minimieren" aria-label="Code-Fenster minimieren">–</button>' +
      '<button type="button" data-a="max" title="Vergrößern" aria-label="Code-Fenster vergrößern">+</button>' +
      '</span><span class="ide-file">index.html</span><span class="ide-live">live</span></div><div class="ide-body"></div>';
    var launch = document.createElement('button'); launch.type = 'button'; launch.className = 'ide-launch';
    launch.setAttribute('aria-label', 'Code-Fenster öffnen'); launch.innerHTML = '&lt;/&gt;';
    body.appendChild(ide); body.appendChild(launch); body.classList.add('has-ide');
    var ideBody = ide.querySelector('.ide-body'), ideFile = ide.querySelector('.ide-file');
    function ideState(st) {
      ide.classList.toggle('min', st === 'min');
      ide.classList.toggle('max', st === 'max');
      ide.classList.toggle('closed', st === 'closed');
      launch.classList.toggle('show', st === 'closed');
      body.classList.toggle('has-ide', st !== 'closed');
      try { localStorage.setItem('ideState', st); } catch (e) {}
      if (st === 'max') { var o = ideBody.scrollHeight - ideBody.clientHeight; ideBody.scrollTop = o > 0 ? o : 0; }
    }
    ide.querySelectorAll('.dots button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var a = btn.getAttribute('data-a');
        if (a === 'close') ideState('closed');
        else if (a === 'min') ideState(ide.classList.contains('min') ? 'normal' : 'min');
        else ideState(ide.classList.contains('max') ? 'normal' : 'max');
      });
    });
    ide.querySelector('.ide-bar').addEventListener('dblclick', function () { ideState(ide.classList.contains('max') ? 'normal' : 'max'); });
    launch.addEventListener('click', function () { ideState('normal'); });
    try { var saved = localStorage.getItem('ideState'); if (saved) ideState(saved); } catch (e) {}
    var job = 0, curKey = null;
    function typeSnippet(key) {
      if (key === curKey || !snippets[key]) return; curKey = key;
      var my = ++job, lines = snippets[key];
      ideFile.textContent = files[key];
      ideBody.innerHTML = '';
      var li = 0, ci = 0, row, span;
      (function step() {
        if (my !== job) return;
        if (li >= lines.length) { if (row) row.classList.add('cur'); return; }
        if (ci === 0) {
          if (row) { row.classList.remove('cur'); span.innerHTML = hl(lines[li - 1]); }
          row = document.createElement('div'); row.className = 'ide-line cur';
          row.innerHTML = '<u>' + (li + 1) + '</u><span></span>'; span = row.lastChild;
          ideBody.appendChild(row);
          var over = ideBody.scrollHeight - ideBody.clientHeight; if (over > 0) ideBody.scrollTop = over;
        }
        var line = lines[li];
        ci = Math.min(line.length, ci + 1 + (Math.random() < .3 ? 1 : 0));
        span.textContent = line.slice(0, ci);
        if (ci >= line.length) { li++; ci = 0; if (li >= lines.length) { span.innerHTML = hl(line); } setTimeout(step, 90); }
        else setTimeout(step, 14 + Math.random() * 26);
      })();
    }
    window.__devType = function (k) { curKey = null; typeSnippet(k); };
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) typeSnippet(e.target.id); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    var startIde = setInterval(function () {
      if (!body.classList.contains('ready')) return;
      clearInterval(startIde);
      setTimeout(function () { ide.classList.add('show'); typeSnippet('top'); }, 900);
      document.querySelectorAll('main section[id]').forEach(function (sec) { sio.observe(sec); });
    }, 150);
  }
})();
