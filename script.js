(function () {
  'use strict';
  var doc = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Start ---------- */
  document.querySelectorAll('[data-in]').forEach(function (el) { el.style.setProperty('--i', el.getAttribute('data-in')); });
  var canBuild = !reduce && 'IntersectionObserver' in window && !!window.Element.prototype.animate;
  if (!canBuild) {
    body.classList.remove('is-loading'); body.classList.add('ready', 'giant-on');
    setTimeout(function () { startCounters(document.querySelector('.hero')); }, 0);
  }

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
  var BUILD_SEL = '.tabs,.tile,.big-num,.row,.tl-row,.chain,.reel-frame,.letter,.steps li,.quote,.val,.contact-list li,.contact-card,.foot-title';
  if (canBuild) document.querySelectorAll(BUILD_SEL).forEach(function (el) { el.classList.add('bld'); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target.__rv || en.target;
        io.unobserve(en.target);
        if (el.classList.contains('bld')) { (window.__build ? window.__build(el) : (el.classList.add('in', 'built'), startCounters(el))); return; }
        el.classList.add('in');
        startCounters(el);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    document.querySelectorAll('[data-rv]').forEach(function (el) {
      var ln = el.parentElement && el.parentElement.classList.contains('ln') ? el.parentElement : null;
      if (ln) { ln.__rv = el; io.observe(ln); } else io.observe(el);
    });
    document.querySelectorAll(BUILD_SEL).forEach(function (el) { if (!el.hasAttribute('data-rv')) io.observe(el); });
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
    if (!document.getElementById('mnav').classList.contains('open')) nav.classList.toggle('hide', y > lastY && y > 300);
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
    var mcur = 0;
    document.querySelectorAll('#mnav a').forEach(function (a, i) { var t = document.querySelector(a.getAttribute('href')); if (t && t.getBoundingClientRect().top < vh * 0.45) mcur = i; });
    document.querySelectorAll('#mnav a').forEach(function (a, i) { a.classList.toggle('on', i === mcur); });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  var mnav = document.getElementById('mnav');
  var mlinks = Array.prototype.slice.call(mnav.querySelectorAll('a'));
  function setMenu(open) {
    mnav.classList.toggle('open', open);
    mnav.setAttribute('aria-hidden', !open);
    nav.classList.toggle('menu-open', open);
    if (open) nav.classList.remove('hide');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!mnav.classList.contains('open')); });
  mlinks.forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
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
      if (window.__rebuild) shown.forEach(function (t, i) { window.__rebuild(t, i); });
      else shown.forEach(function (t, i) { t.style.setProperty('--pd', (i * 70) + 'ms'); t.classList.add('pop'); });
      if (window.__devType && !document.querySelector('.ide').classList.contains('closed')) window.__devType('f-' + f);
    });
  });

  tiles.forEach(function (t) { t.classList.toggle('off', t.getAttribute('data-c') !== 'ooc'); });

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
  if (canBuild) {
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

    /* =========================================================
       BAU-CREW: Cursor-Schwarm, Hilfslinien, Platzhalter, Aufbau
       ========================================================= */
    var dev = document.createElement('div'); dev.id = 'dev'; dev.setAttribute('aria-hidden', 'true'); body.appendChild(dev);
    var mobile = window.innerWidth < 861;
    var COLORS = ['#7fd1ff', '#ff9ad5', '#ffe27a', '#9dffb0', '#b69bff', '#5fb6ff', '#ffffff', '#ffb38a'];
    var NC = mobile ? 9 : 16;
    var cursors = [];
    var vw0 = window.innerWidth, vh0 = window.innerHeight;
    for (var ci0 = 0; ci0 < NC; ci0++) {
      var cel = document.createElement('div'); cel.className = 'cur';
      var col = COLORS[ci0 % COLORS.length];
      cel.style.setProperty('--c', col);
      cel.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 2l7 19 2.6-7.4L20 11z" fill="' + col + '" stroke="#04060c" stroke-width="1.6" stroke-linejoin="round"/></svg>';
      dev.appendChild(cel);
      cursors.push({ el: cel, x: vw0 / 2 + (Math.random() - .5) * 60, y: vh0 / 2 + (Math.random() - .5) * 60, tx: 0, ty: 0, k: .08, busy: 0, next: 0, g: ci0 % 3, ph: Math.random() * 6.28, r: 70 + Math.random() * 110 });
    }
    var mode = 'swarm', t0 = performance.now();
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function loop(now) {
      var sy = window.scrollY, vw = window.innerWidth, vh = window.innerHeight, t = (now - t0) / 1000;
      for (var i = 0; i < cursors.length; i++) {
        var c = cursors[i];
        if (mode === 'swarm') {
          var a = t * (1.4 + c.g * .35) + c.g * 2.1 + c.ph * .15;
          var cx = vw / 2 + Math.cos(a) * (mobile ? 90 : 190) * (c.g === 1 ? -1 : 1);
          var cy = sy + vh / 2 + Math.sin(a * 1.3) * (mobile ? 120 : 110);
          c.tx = cx + Math.cos(c.ph + t * 3) * c.r * .25; c.ty = cy + Math.sin(c.ph + t * 2.6) * c.r * .2; c.k = .1;
        } else if (!c.busy && now > c.next) {
          c.tx = rnd(vw * .08, vw * .92); c.ty = sy + rnd(vh * .12, vh * .88); c.k = .035; c.next = now + rnd(900, 2600);
        }
        c.x += (c.tx - c.x) * c.k; c.y += (c.ty - c.y) * c.k;
        var wx = Math.sin(t * 2 + c.ph) * 1.5, wy = Math.cos(t * 1.7 + c.ph) * 1.5;
        c.el.style.transform = 'translate3d(' + (c.x + wx).toFixed(1) + 'px,' + (c.y + wy).toFixed(1) + 'px,0)';
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* ---- Statusleiste ---- */
    var hud = document.createElement('div'); hud.className = 'hud'; hud.setAttribute('aria-hidden', 'true');
    hud.innerHTML = '<span class="hud-dots"><i style="background:#7fd1ff"></i><i style="background:#ff9ad5"></i><i style="background:#ffe27a"></i><i style="background:#9dffb0"></i></span><b>' + NC + ' Agents</b><span class="hud-sep"></span><span class="hud-l"><b>0</b> / <span>0</span> Ebenen</span><span class="hud-s">scannt …</span>';
    body.appendChild(hud);
    var hudL = hud.querySelector('.hud-l b'), hudT = hud.querySelector('.hud-l span'), hudS = hud.querySelector('.hud-s');
    var layers = 0, hudTimer;
    function hudBusy(txt) { hud.classList.add('on'); hudS.textContent = txt || 'baut …'; clearTimeout(hudTimer); hudTimer = setTimeout(function () { hudS.textContent = 'fertig ✓'; hudTimer = setTimeout(function () { hud.classList.remove('on'); }, 1800); }, 1400); }
    function addLayers(n) { layers += n; hudL.textContent = layers; }

    /* ---- Aufbau eines Elements ---- */
    function rectOf(el) { var r = el.getBoundingClientRect(); return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height }; }
    function team(R, n) {
      var cx = R.x + R.w / 2, cy = R.y + R.h / 2;
      var pool = cursors.slice().sort(function (a, b) { return (a.busy - b.busy) || (Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy)); });
      var tm = pool.slice(0, n); tm.forEach(function (c) { c.busy++; c.k = .2; }); return tm;
    }
    function release(tm, R) { tm.forEach(function (c) { c.busy = Math.max(0, c.busy - 1); c.k = .06; c.tx = R.x + rnd(-40, R.w + 40); c.ty = R.y + rnd(-30, R.h + 30); c.next = performance.now() + rnd(500, 1500); }); }
    function tween(ms, fn) { return new Promise(function (res) { var s = performance.now(); (function f(n) { var p = Math.min(1, (n - s) / ms), e = 1 - Math.pow(1 - p, 3); fn(e, p); if (p < 1) requestAnimationFrame(f); else res(); })(s); }); }
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function tagOf(el) {
      var cls = (typeof el.className === 'string' ? el.className : '').split(/\s+/).filter(function (c) { return c && ['bld', 'in', 'on', 'built', 'building', 'off', 'pop'].indexOf(c) < 0; })[0];
      return '<' + el.tagName.toLowerCase() + (cls ? '.' + cls : (el.id ? '#' + el.id : '')) + '>';
    }
    var DROP = /\b(tile|tl-row|val)\b|^LI$/;
    var lcount = 0;
    function build(el, forceType) {
      if (el.__building || !el.isConnected) return Promise.resolve();
      var R = rectOf(el);
      if (R.w < 4 || R.h < 4) { el.classList.add('built', 'in'); return Promise.resolve(); }
      el.__building = true;
      var type = forceType || (DROP.test(el.className) || DROP.test(el.tagName) ? 'drop' : 'draw');
      var big = R.w * R.h > 160000;
      var ph = document.createElement('div'); ph.className = 'ph';
      ph.style.cssText = 'left:' + R.x + 'px;top:' + R.y + 'px;width:' + R.w + 'px;height:' + R.h + 'px;clip-path:inset(0 100% 100% 0)';
      ph.innerHTML = '<i></i><i></i><i></i><i></i><b></b><em></em>';
      ph.querySelector('b').textContent = tagOf(el);
      ph.querySelector('em').textContent = Math.round(R.w) + ' × ' + Math.round(R.h);
      dev.appendChild(ph);
      var tm = team(R, big ? 4 : (R.w > 300 ? 3 : 2)), lead = tm[0];
      lead.tx = R.x; lead.ty = R.y;
      tm.slice(1).forEach(function (c, i) { c.tx = R.x + R.w * (i % 2 ? .85 : .2); c.ty = R.y + R.h * (i % 2 ? .2 : .9); });
      hudBusy();
      var n = 3 + (lcount++ * 7) % 6;
      return wait(220).then(function () {
        lead.k = .35;
        return tween(big ? 380 : 260, function (e) {
          ph.style.clipPath = 'inset(0 ' + ((1 - e) * 100) + '% ' + ((1 - e) * 100) + '% 0)';
          lead.tx = R.x + R.w * e; lead.ty = R.y + R.h * e;
        });
      }).then(function () {
        ph.style.clipPath = 'none';
        el.classList.add('building');
        if (type === 'drop') {
          var fromX = (R.x + R.w / 2 < window.innerWidth / 2 ? -1 : 1) * rnd(60, 140), fromY = rnd(50, 110);
          lead.tx = R.x + R.w / 2 + fromX; lead.ty = R.y + R.h / 2 + fromY; lead.k = .5;
          ph.classList.add('filled');
          var an = el.animate([{ transform: 'translate(' + fromX + 'px,' + fromY + 'px) rotate(' + (fromX > 0 ? 4 : -4) + 'deg) scale(.9)', opacity: 0, boxShadow: '0 30px 60px rgba(0,0,0,.6)' },
            { transform: 'translate(' + fromX * .5 + 'px,' + fromY * .5 + 'px) rotate(' + (fromX > 0 ? 2 : -2) + 'deg) scale(1.03)', opacity: 1, offset: .45, boxShadow: '0 30px 60px rgba(0,0,0,.6)' },
            { transform: 'none', opacity: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
          tween(480, function (e) { lead.tx = R.x + R.w / 2 + fromX * (1 - e); lead.ty = R.y + R.h / 2 + fromY * (1 - e); });
          return an.finished;
        }
        var helpers = tm.slice(1);
        ph.classList.add('filled');
        return tween(big ? 520 : 340, function (e) {
          el.style.clipPath = 'inset(0 ' + ((1 - e) * 100).toFixed(2) + '% 0 0)';
          helpers.forEach(function (c, i) { c.tx = R.x + R.w * e; c.ty = R.y + R.h * ((i + 1) / (helpers.length + 1)); c.k = .4; });
        });
      }).then(function () {
        el.style.clipPath = '';
        el.classList.remove('building'); el.classList.add('built', 'in');
        startCounters(el);
        addLayers(n);
        ph.classList.add('out');
        setTimeout(function () { ph.remove(); }, 450);
        release(tm, R);
        el.__building = false;
        if (el.__onBuilt) el.__onBuilt();
      });
    }

    var booted = false, pending = [];
    window.__build = function (el) {
      if (!booted) { pending.push(el); return; }
      var d = parseFloat(el.style.getPropertyValue('--d')) || 0;
      setTimeout(function () { build(el); }, d * 900);
    };
    window.__rebuild = function (el, i) {
      el.classList.remove('built', 'in', 'pop');
      setTimeout(function () { build(el, 'drop'); }, i * 110);
    };

    /* ---- Boot-Sequenz (wie im Video) ---- */
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    var heroParts = ['.nav .logo', '#menu', '.nav-cta', '.burger', '.hero .script', '.hero-name', '.hero-role', '.hero-lead', '.hero-act', '.hero-visual', '.hero-stats li', '.hero-foot']
      .reduce(function (acc, s) { return acc.concat(Array.prototype.slice.call(document.querySelectorAll(s))); }, [])
      .filter(function (el) { return el.getClientRects().length; });
    heroParts.forEach(function (el) { el.classList.add('bld'); });
    var total = heroParts.length + document.querySelectorAll(BUILD_SEL).length;
    hudT.textContent = total * 6;
    var bootEl = document.createElement('div'); bootEl.id = 'boot'; bootEl.setAttribute('aria-hidden', 'true');
    bootEl.innerHTML = '<span>L</span>'; body.appendChild(bootEl);
    hud.classList.add('on');
    var guides = document.createElement('div'); guides.className = 'guides'; guides.setAttribute('aria-hidden', 'true');
    body.appendChild(guides);
    function makeGuides() {
      var html = '<div class="ruler"></div><div class="ruler v"></div>';
      var ys = {}, xs = {};
      heroParts.forEach(function (el) { var r = el.getBoundingClientRect(); ys[Math.round(r.top)] = 1; ys[Math.round(r.bottom)] = 1; xs[Math.round(r.left)] = 1; });
      var vy = Object.keys(ys).map(Number).filter(function (y) { return y > 0 && y < innerHeight; }).sort(function (a, b) { return a - b; });
      var vx = Object.keys(xs).map(Number).filter(function (x) { return x > 0 && x < innerWidth; }).slice(0, 4);
      vy.forEach(function (y, i) { html += '<i class="gl h" style="top:' + y + 'px;transition-delay:' + (i * 35) + 'ms"></i>'; if (i % 2 === 0) html += '<b class="gp" style="top:' + y + 'px;left:' + (vx[0] || 24) + 'px;transition-delay:' + (200 + i * 35) + 'ms">+</b><b class="gp" style="top:' + y + 'px;right:' + (vx[0] || 24) + 'px;transition-delay:' + (240 + i * 35) + 'ms">+</b>'; });
      vx.forEach(function (x, i) { html += '<i class="gl v" style="left:' + x + 'px;transition-delay:' + (80 + i * 60) + 'ms"></i>'; });
      guides.innerHTML = html;
      return vy.map(function (y, i) { return { x: vx[i % (vx.length || 1)] || 40, y: y }; });
    }
    function start() {
      setTimeout(function () {
        mode = 'cross'; dev.classList.add('cross'); bootEl.classList.add('out');
        hudS.textContent = 'Layout …';
        var pts = makeGuides();
        requestAnimationFrame(function () { guides.classList.add('on'); });
        cursors.forEach(function (c, i) { var p = pts[i % (pts.length || 1)] || { x: rnd(40, innerWidth - 40), y: rnd(80, innerHeight - 80) }; c.tx = p.x + rnd(-30, innerWidth * .6); c.ty = p.y + rnd(-6, 6); c.k = .12; c.next = performance.now() + 900; });
      }, 1250);
      setTimeout(function () {
        dev.classList.remove('cross'); mode = 'build';
        body.classList.add('ready'); body.classList.remove('is-loading');
        hudS.textContent = 'baut …';
        var heroName = document.querySelector('.hero-name');
        if (heroName) heroName.__onBuilt = function () { runType(heroName, 40); };
        var vis = document.querySelector('.hero-visual');
        if (vis) vis.__onBuilt = function () { body.classList.add('giant-on'); };
        heroParts.forEach(function (el, i) { setTimeout(function () { build(el); }, i * 120); });
        setTimeout(function () {
          guides.classList.add('out'); setTimeout(function () { guides.remove(); bootEl.remove(); }, 800);
          body.classList.add('giant-on');
          booted = true; pending.splice(0).forEach(window.__build);
        }, heroParts.length * 120 + 900);
      }, 2050);
    }
    var fontsReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, wait(1200)]) : wait(300);
    fontsReady.then(start);

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
      if (st !== 'closed' && !curKey) typeSnippet(curSec || 'top');
      if (st === 'max') { var o = ideBody.scrollHeight - ideBody.clientHeight; ideBody.scrollTop = o > 0 ? o : 0; }
    }
    ide.querySelectorAll('.dots button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var a = btn.getAttribute('data-a');
        if (a === 'close') { job++; curKey = null; ideState('closed'); }
        else if (a === 'min') ideState(ide.classList.contains('min') ? 'normal' : 'min');
        else ideState(ide.classList.contains('max') ? 'normal' : 'max');
      });
    });
    ide.querySelector('.ide-bar').addEventListener('dblclick', function () { ideState(ide.classList.contains('max') ? 'normal' : 'max'); });
    launch.addEventListener('click', function () { curKey = null; ideState('normal'); });
    ideState('closed');
    var job = 0, curKey = null, curSec = 'top';
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
      es.forEach(function (e) { if (e.isIntersecting) { curSec = e.target.id; if (!ide.classList.contains('closed')) typeSnippet(curSec); } });
    }, { rootMargin: '-45% 0px -45% 0px' });
    var startIde = setInterval(function () {
      if (!body.classList.contains('ready')) return;
      clearInterval(startIde);
      ide.classList.add('show');
      document.querySelectorAll('main section[id]').forEach(function (sec) { sio.observe(sec); });
    }, 150);
  }
})();
