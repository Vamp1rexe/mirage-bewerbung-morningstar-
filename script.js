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
      tiles.forEach(function (t, i) {
        var hit = f === 'all' || t.getAttribute('data-c') === f;
        t.style.transitionDelay = (i * 30) + 'ms';
        t.classList.toggle('off', !hit);
      });
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
})();
