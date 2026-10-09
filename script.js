(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function isSmall() { return window.innerWidth <= 820; }

  /* ---------- Text in Buchstaben teilen (Hero-Titel) ---------- */
  var idx = 0;
  $$('[data-split]').forEach(function (el) {
    var t = el.textContent;
    el.setAttribute('aria-label', t);
    el.textContent = '';
    t.split('').forEach(function (ch) {
      var s = doc.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', idx++);
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
    });
  });

  /* ---------- Brief in Wörter teilen (Scroll-Highlight) ---------- */
  var words = [];
  function wrap(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var parts = n.textContent.split(/(\s+)/);
        var frag = doc.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); }
          else {
            var s = doc.createElement('span');
            s.className = 'w';
            s.textContent = p;
            frag.appendChild(s);
            words.push({ el: s, y: 0, on: false });
          }
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1) { wrap(n); }
    });
  }
  $$('.letter p:not(.sign)').forEach(wrap);
  function measureWords() {
    var sy = window.pageYOffset;
    words.forEach(function (w) { w.y = w.el.getBoundingClientRect().top + sy; });
  }

  /* ---------- Zähler ---------- */
  function runCount(el) {
    if (el._done) return; el._done = true;
    var to = parseFloat(el.getAttribute('data-to'));
    var from = parseFloat(el.getAttribute('data-from') || 0);
    if (reduce) { el.textContent = to; return; }
    var dur = parseFloat(el.getAttribute('data-dur')) || 1800, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var yearEl = $('.year');
  var yearSpan = yearEl && $('span', yearEl);
  function runYear() {
    if (!yearSpan || reduce) return;
    var to = 2026, from = 2000, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1800), e = 1 - Math.pow(1 - p, 4);
      yearSpan.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step); else yearSpan.textContent = 2026;
    }
    yearSpan.textContent = from;
    requestAnimationFrame(step);
  }
  $$('.cnt').forEach(function (c) { c.textContent = '0'; });

  /* ---------- Einblenden beim Scrollen ---------- */
  var revealEls = $$('.reveal, .sh, .stag');
  function show(el) {
    if (el.classList.contains('sh')) el.classList.add('vis'); else el.classList.add('in');
    $$('.cnt', el).forEach(runCount);
  }
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(show);
    words.forEach(function (w) { w.el.classList.add('lit'); });
  }

  /* ---------- Ladescreen ---------- */
  var loader = $('#loader');
  var pctEl = loader && $('.pct', loader);
  var fillEl = loader && $('.fill', loader);
  var crit = $$('img[data-critical]');
  var loaded = 0;
  crit.forEach(function (img) {
    if (img.complete) loaded++;
    else { img.addEventListener('load', function () { loaded++; }); img.addEventListener('error', function () { loaded++; }); }
  });
  var finished = false;
  function finish() {
    if (finished) return; finished = true;
    body.classList.remove('is-loading');
    body.classList.add('ready');
    if (loader) { loader.classList.add('hide'); setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 1000); }
    setTimeout(runYear, 900);
    measureWords(); onScroll();
  }
  if (!loader || reduce) { finish(); }
  else {
    var start = performance.now(), prog = 0;
    (function tick(now) {
      var t = (now - start) / 1500;
      var cap = loaded < crit.length ? 0.9 : 1;
      prog = Math.min(cap, Math.max(prog, t));
      if (fillEl) fillEl.style.transform = 'scaleX(' + prog + ')';
      if (pctEl) pctEl.textContent = Math.round(prog * 100);
      if (prog >= 1 || now - start > 5000) { setTimeout(finish, 250); return; }
      requestAnimationFrame(tick);
    })(start);
    setTimeout(finish, 6500);
  }

  /* ---------- Menü (Handy) ---------- */
  var burger = $('.nav-toggle'), nav = $('#menu');
  function closeMenu() {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Menü öffnen');
  }
  burger.addEventListener('click', function () {
    var o = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    burger.setAttribute('aria-label', o ? 'Menü schließen' : 'Menü öffnen');
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Scroll-Logik (gebündelt) ---------- */
  var topbar = $('.topbar i'), railFill = $('.rail-line i');
  var railLinks = $$('.rail a'), navLinks = $$('.nav nav a');
  var secIds = ['top', 'info', 'zeiten', 'erfahrung', 'ueber-mich', 'zusatz', 'fazit'];
  var secEls = secIds.map(function (id) { return doc.getElementById(id); });
  var heroInner = $('.hero-inner'), hero = $('.hero');
  var parEls = $$('[data-speed]');
  var banner = $('.banner'), bannerImg = banner && $('img', banner);
  var marquee = $('.marquee');
  var lastY = window.pageYOffset, vel = 0, ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.pageYOffset, vh = window.innerHeight;
    var max = Math.max(1, root.scrollHeight - vh);
    var p = clamp(y / max, 0, 1);
    if (topbar) topbar.style.transform = 'scaleX(' + p + ')';
    if (railFill) railFill.style.transform = 'scaleY(' + p + ')';

    if (!reduce) {
      /* Hero blendet beim Scrollen aus */
      if (heroInner && y < vh * 1.4) {
        var hp = clamp(y / (vh * 0.9), 0, 1);
        heroInner.style.opacity = String(1 - hp * 0.95);
        heroInner.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0) scale(' + (1 - hp * 0.08).toFixed(3) + ')';
      }
      /* Parallax */
      parEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var sp = parseFloat(el.getAttribute('data-speed')) || 0;
        el.style.setProperty('--py', ((r.top + r.height / 2 - vh / 2) * sp).toFixed(1) + 'px');
      });
      if (banner && bannerImg) {
        var br = banner.getBoundingClientRect();
        if (br.bottom > -100 && br.top < vh + 100 && !isSmall()) {
          var off = (br.top + br.height / 2 - vh / 2) * -0.1;
          bannerImg.style.setProperty('--py', clamp(off, -40, 40).toFixed(1) + 'px');
        }
      }
      /* Laufband reagiert auf Scroll-Tempo */
      vel = clamp((y - lastY) * 0.12, -10, 10);
      lastY = y;
      if (marquee) marquee.style.setProperty('--skew', (-vel).toFixed(2) + 'deg');
    }

    /* Brief: Wörter leuchten nacheinander auf */
    var th = y + vh * 0.72;
    for (var i = 0; i < words.length; i++) {
      var on = words[i].y < th;
      if (on !== words[i].on) { words[i].on = on; words[i].el.classList.toggle('lit', on); }
    }

    /* Aktiver Abschnitt */
    var mid = y + vh * 0.4, cur = 0;
    secEls.forEach(function (s, k) { if (s && s.getBoundingClientRect().top + y <= mid) cur = k; });
    railLinks.forEach(function (a, k) { a.classList.toggle('on', k === cur); });
    navLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + secIds[cur]); });
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', function () { measureWords(); req(); if (window.innerWidth > 820) closeMenu(); });
  window.addEventListener('load', function () { measureWords(); req(); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { measureWords(); req(); });
  /* Marquee fängt sich nach dem Scrollen wieder */
  setInterval(function () { if (marquee && Math.abs(window.pageYOffset - lastY) < 1) marquee.style.setProperty('--skew', '0deg'); }, 250);
  measureWords();
  onScroll();

  /* ---------- Maus-Effekte (nur Desktop) ---------- */
  if (fine && !reduce) {
    var glow = $('.cursor-glow');
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy;
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (glow) glow.classList.add('on');
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
    doc.addEventListener('mouseleave', function () { if (glow) glow.classList.remove('on'); });
    (function loop() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      if (glow) glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();

    /* Spotlight + 3D-Neigung */
    $$('.spot').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty('--mx', x + 'px');
        el.style.setProperty('--my', y + 'px');
        if (el.classList.contains('tilt')) {
          el.style.setProperty('--ry', (((x / r.width) - 0.5) * 9).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((0.5 - (y / r.height)) * 9).toFixed(2) + 'deg');
        }
      });
      el.addEventListener('mouseleave', function () {
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });

    /* Magnetische Buttons */
    $$('.mag').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Partikel-Hintergrund ---------- */
  var mouse = { x: 0, y: 0 };
  var cv = $('#fx');
  if (cv && cv.getContext && !reduce) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, ps = [], run = true;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(clamp((W * H) / 20000, 22, 80));
      if (isSmall()) n = Math.min(n, 30);
      ps = [];
      for (var i = 0; i < n; i++) ps.push(make(true));
    }
    function make(init) {
      var feather = Math.random() < 0.22;
      return {
        x: Math.random() * W, y: init ? Math.random() * H : H + 20,
        r: feather ? 2 + Math.random() * 3 : 0.6 + Math.random() * 1.9,
        vy: -(0.12 + Math.random() * 0.5), vx: (Math.random() - 0.5) * 0.18,
        z: 0.3 + Math.random() * 0.9, a: 0.25 + Math.random() * 0.6,
        tw: Math.random() * 6.28, f: feather, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02
      };
    }
    function draw() {
      if (!run) return;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.x += p.vx + Math.sin(p.tw) * 0.12; p.y += p.vy * (1 + vel * 0.15); p.tw += 0.02; p.rot += p.vr;
        if (p.y < -30 || p.x < -30 || p.x > W + 30) { ps[i] = make(false); continue; }
        var px = p.x + mouse.x * 40 * p.z, py = p.y + mouse.y * 40 * p.z;
        var al = p.a * (0.6 + 0.4 * Math.sin(p.tw * 2));
        if (p.f) {
          ctx.save(); ctx.translate(px, py); ctx.rotate(p.rot);
          ctx.fillStyle = 'rgba(150,190,255,' + (al * 0.7) + ')';
          ctx.shadowColor = 'rgba(79,140,255,.9)'; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.ellipse(0, 0, p.r * 0.8, p.r * 3.2, 0, 0, 6.283); ctx.fill();
          ctx.restore();
        } else {
          var g = ctx.createRadialGradient(px, py, 0, px, py, p.r * 5);
          g.addColorStop(0, 'rgba(190,220,255,' + al + ')');
          g.addColorStop(0.35, 'rgba(79,140,255,' + (al * 0.45) + ')');
          g.addColorStop(1, 'rgba(79,140,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, p.r * 5, 0, 6.283); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener('resize', resize);
    doc.addEventListener('visibilitychange', function () {
      run = !doc.hidden; if (run) requestAnimationFrame(draw);
    });
    requestAnimationFrame(draw);
  }
})();
