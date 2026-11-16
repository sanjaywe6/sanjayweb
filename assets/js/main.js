/* ==========================================================================
   Sanjay Gupta — Portfolio interactions (vanilla JS, no dependencies)
   ========================================================================== */
(() => {
  'use strict';
  window.__sgReady = true;

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const scrollToEl = (el) => el && el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  const CONFIG = {
    email: 'sg493436@gmail.com',
  };

  /* ---------------------------------------------------------------- Storage */
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  /* ---------------------------------------------------------------- Colour themes */
  // Themes are CSS palettes keyed by <html data-theme>. Canvases read the accent via accent().
  const THEMES = {
    blood: { name: 'Blood.exe', label: 'red' },
    cyber: { name: 'Cyber.exe', label: 'blue' },
    matrix: { name: 'Matrix.exe', label: 'green' },
  };
  const DEFAULT_THEME = 'cyber';
  const readRGB = (prop) => getComputedStyle(root).getPropertyValue(prop).trim().split(/[\s,]+/).map(Number);
  let ACCENT = { a: readRGB('--accent-rgb'), b: readRGB('--accent-2-rgb') };
  const accent = () => ACCENT;
  const currentTheme = () => (THEMES[root.dataset.theme] ? root.dataset.theme : DEFAULT_THEME);

  function setTheme(id, { save = true, animate = true } = {}) {
    if (!THEMES[id]) return false;
    if (animate && !reduceMotion) {
      root.classList.add('theme-switching');
      clearTimeout(setTheme.t);
      setTheme.t = setTimeout(() => root.classList.remove('theme-switching'), 520);
    }
    root.dataset.theme = id;
    if (save) { try { localStorage.setItem('sg-theme', id); } catch { /* ignore */ } }
    ACCENT = { a: readRGB('--accent-rgb'), b: readRGB('--accent-2-rgb') };
    const btn = $('#theme-btn');
    const name = $('#theme-name');
    if (name) name.textContent = THEMES[id].name;
    if (btn) btn.setAttribute('aria-label', `Colour theme: ${THEMES[id].name}. Change theme`);
    $$('[data-theme-opt]').forEach((o) => o.setAttribute('aria-checked', String(o.dataset.themeOpt === id)));
    window.dispatchEvent(new CustomEvent('themechange', { detail: { id } }));
    return true;
  }
  setTheme(currentTheme(), { save: false, animate: false });

  (() => {
    const btn = $('#theme-btn');
    const menu = $('#theme-menu');
    if (!btn || !menu) return;
    const opts = $$('[data-theme-opt]', menu);
    const open = () => {
      menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
      (opts.find((o) => o.getAttribute('aria-checked') === 'true') || opts[0]).focus();
    };
    const close = (focusBtn = true) => {
      if (menu.hidden) return;
      menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
    };
    btn.addEventListener('click', () => (menu.hidden ? open() : close()));
    opts.forEach((o) => o.addEventListener('click', () => {
      setTheme(o.dataset.themeOpt);
      close();
      toast(`theme → ${THEMES[o.dataset.themeOpt].name}`);
    }));
    menu.addEventListener('keydown', (e) => {
      const i = opts.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') close(false);
    });
    document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('#theme')) close(false); });
  })();

  /* ---------------------------------------------------------------- Boot */
  const readyCallbacks = [];
  const onReady = (fn) => readyCallbacks.push(fn);
  function markReady() {
    root.classList.add('boot-done', 'is-ready');
    readyCallbacks.forEach((fn) => fn());
  }
  if (reduceMotion || store.get('sg-booted')) {
    root.classList.add('no-boot');
    requestAnimationFrame(markReady);
  } else {
    store.set('sg-booted', '1');
    setTimeout(markReady, 1250);
  }

  /* ---------------------------------------------------------------- Toast */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }

  /* ---------------------------------------------------------------- Nav */
  const nav = $('#nav');
  const navLinks = $$('[data-nav]');
  const indicator = $('.nav__indicator');
  let activeId = null;

  const onScrollNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  function moveIndicator() {
    const link = navLinks.find((a) => a.getAttribute('href') === '#' + activeId);
    navLinks.forEach((a) => a.classList.toggle('is-active', a === link));
    if (!link || !indicator || link.offsetParent === null) { indicator && indicator.classList.remove('is-on'); return; }
    indicator.style.width = link.offsetWidth - 20 + 'px';
    indicator.style.transform = `translateX(${link.offsetLeft + 10}px)`;
    indicator.classList.add('is-on');
  }

  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { activeId = e.target.id; moveIndicator(); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => so.observe(s));
  }
  window.addEventListener('resize', moveIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

  /* ---------------------------------------------------------------- Mobile menu */
  const burger = $('#burger');
  const menu = $('#mobile-menu');
  const menuLinks = menu ? $$('a', menu) : [];
  menuLinks.forEach((a, i) => a.style.setProperty('--i', i));
  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    menu.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('is-locked');
    setTimeout(() => menuLinks[0] && menuLinks[0].focus(), 60);
  }
  function closeMenu(restoreFocus = true) {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('is-locked');
    setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 300);
    if (restoreFocus) burger.focus();
  }
  if (burger && menu) {
    burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
    menuLinks.forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = $(a.getAttribute('href'));
      closeMenu(false);
      requestAnimationFrame(() => scrollToEl(target));
    }));
    document.addEventListener('keydown', (e) => {
      if (!menuOpen) return;
      if (e.key === 'Escape') closeMenu();
      if (e.key === 'Tab') {
        const items = [burger, ...menuLinks];
        const i = items.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    window.addEventListener('resize', () => { if (menuOpen && window.innerWidth > 960) closeMenu(false); });
  }

  /* ---------------------------------------------------------------- Reveal on scroll */
  const revealEls = $$('.reveal');
  const revealCallbacks = new Map();
  if ('IntersectionObserver' in window && !reduceMotion) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        const cb = revealCallbacks.get(e.target);
        if (cb) cb();
        ro.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => ro.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }
  const whenRevealed = (el, fn) => {
    if (!el) return;
    if (el.classList.contains('is-in')) fn(); else revealCallbacks.set(el, fn);
  };

  /* ---------------------------------------------------------------- Counters (each counts 0 → value when it scrolls into view) */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const counters = $$('[data-count]');
    counters.forEach((el) => { el.textContent = '0'; });
    const countUp = (el) => {
      const target = +el.dataset.count;
      const dur = 1200 + Math.min(800, target * 2);   // bigger numbers run a little longer
      let start = 0;
      const tick = (t) => {
        if (!start) start = t;
        const p = Math.min(1, (t - start) / dur);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 250);
    };
    onReady(() => {
      const co = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          co.unobserve(e.target);
          countUp(e.target);
        });
      }, { threshold: 1, rootMargin: '0px 0px -8% 0px' });
      counters.forEach((el) => co.observe(el));
    });
  }

  /* ---------------------------------------------------------------- Hero: role rotator */
  const roleEl = $('#role-rotator');
  if (roleEl && !reduceMotion) {
    const roles = ['Security Analyst', 'Red Teaming Consultant', 'Penetration Tester', 'Application Security Engineer', 'Bug Bounty Hunter', 'Software Developer'];
    const glyphs = '!<>-_\\/[]{}=+*^?#01';
    let idx = 0;
    const scramble = (to) => new Promise((resolve) => {
      const from = roleEl.textContent;
      const len = Math.max(from.length, to.length);
      const queue = Array.from({ length: len }, (_, i) => {
        const startF = Math.floor(Math.random() * 14);
        return { from: from[i] || '', to: to[i] || '', start: startF, end: startF + 8 + Math.floor(Math.random() * 14) };
      });
      let frame = 0;
      const step = () => {
        let out = ''; let done = 0;
        queue.forEach((q) => {
          if (frame >= q.end) { done++; out += q.to; }
          else if (frame >= q.start) out += `<span class="t-dim">${escapeHTML(glyphs[Math.floor(Math.random() * glyphs.length)])}</span>`;
          else out += escapeHTML(q.from);
        });
        roleEl.innerHTML = out;
        if (done === queue.length) { roleEl.textContent = to; resolve(); return; }
        frame++;
        requestAnimationFrame(step);
      };
      step();
    });
    onReady(() => {
      setInterval(() => {
        if (document.hidden) return;
        idx = (idx + 1) % roles.length;
        scramble(roles[idx]);
      }, 3000);
    });
  }

  /* ---------------------------------------------------------------- Portrait: face breaking into bytes */
  // The right side of the face is eroded along a jagged edge. Pixel blocks break off that edge,
  // turn into hex/binary glyphs (coloured from the photo, shifting to green) and stream away to
  // the right in a continuous loop. Cursor near the bytes scatters them; hovering speeds it up.
  (() => {
    const stage = $('#portrait-stage');
    const img = $('#portrait-img');
    if (!stage || !img) return;
    const integrityEl = $('#portrait-integrity');
    const HEX = '0123456789ABCDEF';
    const glyph = () => (Math.random() < 0.55
      ? (Math.random() < 0.5 ? '0' : '1')
      : HEX[(Math.random() * 16) | 0] + HEX[(Math.random() * 16) | 0]);
    const rand = (a, b) => a + Math.random() * (b - a);
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    const canvas = document.createElement('canvas');
    canvas.className = 'portrait__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');

    let W = 0; let H = 0; let dpr = 1;
    let box = null;              // image rect inside the stage (CSS px)
    let src = null;              // photo scaled to device pixels
    let base = null;             // eroded photo (static layer)
    let particles = [];
    let built = false;

    // Jagged dissolve edge: x position (CSS px) where the face starts breaking, per y.
    // It follows the vertical centre line of the face (nose bridge / lips sit at ~46% of the photo width),
    // with only a small jag so the left half stays whole and the right half turns to code.
    const EDGE = 0.46;
    const edgeX = (y) => {
      const yn = (y - box.y) / box.h;
      const band = Math.floor(y / 6);
      const hash = Math.abs(Math.sin(band * 12.9898) * 43758.5453) % 1;
      const jag = 0.012 * Math.sin(yn * 23) + 0.008 * Math.sin(yn * 57 + 1.3) + 0.014 * (hash - 0.5);
      return box.x + box.w * (EDGE + 0.008 * yn + jag);
    };

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const sr = stage.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      W = sr.width; H = sr.height;
      if (!W || !H || !ir.width) return false;
      box = { x: ir.left - sr.left, y: ir.top - sr.top, w: ir.width, h: ir.height };
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Photo at device resolution
      src = document.createElement('canvas');
      src.width = Math.round(box.w * dpr); src.height = Math.round(box.h * dpr);
      const sctx = src.getContext('2d');
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(img, 0, 0, src.width, src.height);
      let pixels = null;
      try { pixels = sctx.getImageData(0, 0, src.width, src.height).data; } catch { pixels = null; } // file:// taints canvas
      const sample = (x, y) => {
        if (!pixels) {
          const ex = (x - (box.x + box.w * 0.5)) / (box.w * 0.47);
          const ey = (y - (box.y + box.h * 0.45)) / (box.h * 0.5);
          return ex * ex + ey * ey < 1 ? [170, 225, 200, 255] : [0, 0, 0, 0];
        }
        const px = Math.min(src.width - 1, Math.max(0, Math.round((x - box.x) * dpr)));
        const py = Math.min(src.height - 1, Math.max(0, Math.round((y - box.y) * dpr)));
        const i = (py * src.width + px) * 4;
        return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
      };

      // Static eroded layer
      base = document.createElement('canvas');
      base.width = canvas.width; base.height = canvas.height;
      const b = base.getContext('2d');
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.drawImage(src, box.x, box.y, box.w, box.h);
      b.globalCompositeOperation = 'destination-out';
      const FADE = Math.max(28, box.w * 0.08);
      for (let y = box.y; y < box.y + box.h; y += 3) {
        const ex = edgeX(y);
        for (let k = 0; k < 8; k++) {
          b.fillStyle = `rgba(0,0,0,${(k + 1) / 8})`;
          b.fillRect(ex + (k * FADE) / 8, y, FADE / 8 + 0.6, 3);
        }
        b.fillStyle = '#000';
        b.fillRect(ex + FADE, y, W, 3);
      }
      // Broken pixel blocks along the edge
      const CELL = 7;
      for (let y = box.y; y < box.y + box.h; y += CELL) {
        const ex = edgeX(y);
        for (let x = ex - 10; x < ex + 26; x += CELL) {
          const r = Math.random();
          if (r < 0.3) { b.fillStyle = '#000'; b.fillRect(x, y, CELL, CELL); }
          else if (r < 0.42) { b.fillStyle = 'rgba(0,0,0,.55)'; b.fillRect(x, y, CELL, CELL); }
        }
      }
      // Bottom fade (matches the <img> mask)
      const g = b.createLinearGradient(0, box.y + box.h * 0.9, 0, box.y + box.h);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      b.fillStyle = g; b.fillRect(0, box.y + box.h * 0.9, W, box.h * 0.1 + 2);
      // Energised edge: tint some surviving cells near the break in the theme's accent colours
      b.globalCompositeOperation = 'source-atop';
      const tintA = `rgba(${accent().a.join(',')},0.35)`;
      const tintB = `rgba(${accent().b.join(',')},0.35)`;
      for (let y = box.y; y < box.y + box.h * 0.85; y += CELL) {
        const ex = edgeX(y);
        for (let x = ex - 14; x < ex + 20; x += CELL) {
          if (Math.random() < 0.16) {
            b.fillStyle = Math.random() < 0.7 ? tintA : tintB;
            b.fillRect(x, y, CELL, CELL);
          }
        }
      }
      b.globalCompositeOperation = 'source-over';

      // Particles: one per sampled cell on the broken side of the face
      particles = [];
      const PC = W < 420 ? 7 : 6;
      for (let y = box.y; y < box.y + box.h * 0.9; y += PC) {
        const ex = edgeX(y);
        for (let x = ex - 8; x < box.x + box.w; x += PC) {
          const [r, g2, bl, a] = sample(x + PC / 2, y + PC / 2);
          if (a < 150) continue;
          const depth = clamp01((x - ex + 8) / (box.w * 0.54));
          if (Math.random() > (depth < 0.2 ? 0.7 : 0.42)) continue;   // a wider code half, so slightly sparser
          particles.push({
            hx: x, hy: y, r, g: g2, b: bl, depth,
            t: Math.random(),
            speed: rand(0.09, 0.24),
            dist: rand(70, 210) * (0.55 + depth * 0.9),
            ang: rand(-0.6, 0.28),
            wob: rand(0, Math.PI * 2),
            chunk: depth < 0.22,
            ch: glyph(),
          });
        }
      }
      return true;
    }

    const pointer = { x: -1e4, y: -1e4 };
    let boost = 1; let boostTarget = 1;
    let glitchUntil = 0; let nextGlitch = 0; let glitchY = 0; let glitchH = 0; let glitchDX = 0;

    function draw(now, dt) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.drawImage(base, 0, 0, W, H);

      // Occasional horizontal glitch slice
      if (!reduceMotion && now > nextGlitch) {
        glitchUntil = now + rand(90, 160);
        nextGlitch = now + rand(2400, 5200);
        glitchY = box.y + rand(0.1, 0.75) * box.h; glitchH = rand(6, 22); glitchDX = rand(-10, 10);
        if (integrityEl) integrityEl.textContent = String(Math.round(rand(54, 66)));
      }
      if (now < glitchUntil) {
        const sy = glitchY * dpr; const sh = glitchH * dpr;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(base, 0, sy, base.width, sh, glitchDX, glitchY, W, glitchH);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = `rgb(${accent().a.join(',')})`;
        ctx.fillRect(box.x, glitchY, box.w, 1);
      }

      ctx.font = '600 10px "Geist Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const PC = W < 420 ? 7 : 6;
      const R = 70; const R2 = R * R;
      const [ar, ag, ab] = accent().a;
      const fr = 25 + ar * 0.35; const fg = 25 + ag * 0.35; const fb = 25 + ab * 0.35;   // brightness floor
      for (const p of particles) {
        p.t += dt * p.speed * boost;
        if (p.t >= 1) { p.t -= 1; p.ch = glyph(); }
        else if (Math.random() < 0.01) p.ch = glyph();
        const t = p.t;
        const e = t * t * 0.65 + t * 0.35;
        let x = p.hx + Math.cos(p.ang) * p.dist * e;
        let y = p.hy + Math.sin(p.ang) * p.dist * e + Math.sin(t * 6 + p.wob) * 3 * t;
        // cursor scatter
        const dx = x - pointer.x; const dy = y - pointer.y; const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1; const f = (1 - d / R) * 26;
          x += (dx / d) * f; y += (dy / d) * f;
        }
        let a = Math.pow(1 - t, 1.25);
        if (t < 0.05) a *= t / 0.05;
        if (p.chunk && t < 0.32) {
          // a real block of the photo breaking off
          ctx.globalAlpha = a;
          ctx.drawImage(src, (p.hx - box.x) * dpr, (p.hy - box.y) * dpr, PC * dpr, PC * dpr, x, y, PC, PC);
        } else {
          const m = clamp01(t * 1.7 + p.depth * 0.6);
          // photo colour -> theme accent as the byte flies away
          const r = Math.round(Math.max(fr, p.r + (ar - p.r) * m));
          const g = Math.round(Math.max(fg, p.g + (ag - p.g) * m));
          const bl = Math.round(Math.max(fb, p.b + (ab - p.b) * m));
          ctx.globalAlpha = a * 0.95;
          ctx.fillStyle = `rgb(${r},${g},${bl})`;
          ctx.fillText(p.ch, x + PC / 2, y + PC / 2);
        }
      }
      ctx.globalAlpha = 1;
    }

    let running = false; let visible = true; let last = 0;
    const loop = (now) => {
      if (!running) return;
      requestAnimationFrame(loop);
      if (document.hidden || !visible) { last = now; return; }
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      boost += (boostTarget - boost) * Math.min(1, dt * 4);
      draw(now, dt);
    };

    function init() {
      if (!build()) return;
      if (!built) { stage.appendChild(canvas); built = true; }
      stage.classList.add('is-live');
      if (reduceMotion) { draw(0, 0); return; }
      if (!running) { running = true; requestAnimationFrame(loop); }
    }

    if (!reduceMotion) {
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      }, { passive: true });
      stage.addEventListener('pointerenter', () => { boostTarget = 1.9; });
      stage.addEventListener('pointerleave', () => { boostTarget = 1; pointer.x = pointer.y = -1e4; });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(stage);
      }
    }

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(init, 150); });
    window.addEventListener('themechange', () => { if (built) init(); });   // re-tint the broken edge
    const start = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(init);
    if (img.complete && img.naturalWidth) start();
    else img.addEventListener('load', start, { once: true });
  })();

  /* ---------------------------------------------------------------- Portrait: cyber chakra + face scan */
  // Behind the face: concentric rings ("chakra") rotating in alternating directions. Nodes on the rings
  // pass data packets to each other and flash when one arrives. In front: a scan line sweeps the face and
  // locks onto facial regions; each lock sends a packet out to the rings. Speeds up on hover, pauses
  // off-screen / in background tabs. Reduced motion: one static frame with every region locked.
  (() => {
    const stage = $('#portrait-stage');
    const img = $('#portrait-img');
    if (!stage || !img) return;
    const mk = (cls) => { const c = document.createElement('canvas'); c.className = cls; c.setAttribute('aria-hidden', 'true'); return c; };
    const back = mk('portrait__chakra');
    const front = mk('portrait__scan');
    stage.insertBefore(back, stage.firstChild);
    stage.appendChild(front);
    const bctx = back.getContext('2d');
    const fctx = front.getContext('2d');

    const TAU = Math.PI * 2;
    const rand = (a, b) => a + Math.random() * (b - a);
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const HEX = '0123456789ABCDEF';
    const hex2 = () => HEX[(Math.random() * 16) | 0] + HEX[(Math.random() * 16) | 0];
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const MONO = '"Geist Mono", ui-monospace, monospace';

    // Facial regions as fractions of the photo (646×849): centre x/y and box width/height.
    // EYE_R sits on the half that has turned to code, so its lock "fails".
    const FEATURES = [
      { id: 'FOREHEAD', x: 0.464, y: 0.318, w: 0.30, h: 0.09 },
      { id: 'EYE_L', x: 0.286, y: 0.483, w: 0.18, h: 0.085 },
      { id: 'EYE_R', x: 0.62, y: 0.483, w: 0.18, h: 0.085, lost: true },
      { id: 'NOSE', x: 0.449, y: 0.583, w: 0.13, h: 0.11 },
      { id: 'MOUTH', x: 0.457, y: 0.69, w: 0.24, h: 0.075 },
      { id: 'JAW', x: 0.449, y: 0.83, w: 0.40, h: 0.08 },
      { id: 'EAR_L', x: 0.085, y: 0.612, w: 0.075, h: 0.15 },
    ];
    const MESH = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4], [1, 6], [6, 5], [4, 5], [1, 4], [2, 4]];

    // Rings: radius as a fraction of R, angular speed (rad/s, sign = direction), style, node count
    const rings = [
      { r: 1.00, speed: 0.05, kind: 'ticks', n: 3 },
      { r: 0.93, speed: -0.08, kind: 'glyphs', n: 0 },
      { r: 0.86, speed: 0.15, kind: 'segments', n: 4 },
      { r: 0.79, speed: -0.22, kind: 'dashes', n: 3 },
      { r: 0.72, speed: 0.10, kind: 'core', n: 2 },
    ].map((d) => ({
      ...d,
      a: rand(0, TAU),
      nodes: Array.from({ length: d.n }, (_, i) => ({ base: (i / d.n) * TAU + rand(-0.4, 0.4), flash: 0 })),
      glyphs: d.kind === 'glyphs' ? Array.from({ length: 44 }, hex2) : null,
    }));
    const nodeRings = rings.filter((r) => r.nodes.length);
    const segRing = rings.find((r) => r.kind === 'segments');

    let W = 0; let H = 0; let dpr = 1; let R = 0;
    let C = { x: 0, y: 0 };
    let box = null;
    let feats = [];

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cr = back.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      W = cr.width; H = cr.height;
      if (!W || !H || !ir.width) return false;
      [back, front].forEach((c) => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      box = { x: ir.left - cr.left, y: ir.top - cr.top, w: ir.width, h: ir.height };
      C = { x: box.x + box.w * 0.455, y: box.y + box.h * 0.5 };   // centred on the face
      R = box.h * 0.5;
      feats = FEATURES.map((f) => ({
        ...f, cx: box.x + f.x * box.w, cy: box.y + f.y * box.h, bw: f.w * box.w, bh: f.h * box.h,
        t0: -1, conf: (94 + Math.random() * 5.6).toFixed(1),
      }));
      return true;
    }

    const angDist = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    const nodeAngle = (ring, node) => node.base + ring.a;
    const nodePos = (ring, node) => {
      const ang = nodeAngle(ring, node); const rr = ring.r * R;
      return { x: C.x + Math.cos(ang) * rr, y: C.y + Math.sin(ang) * rr };
    };
    const nearestNode = (ring, ang) => ring.nodes.reduce((best, nd) => (angDist(nodeAngle(ring, nd), ang) < angDist(nodeAngle(ring, best), ang) ? nd : best));

    /* -- packets: short curved hops between ring nodes (behind the face) or from a facial region to a ring (in front) */
    const packets = [];
    function spawnRingPacket() {
      const i = (Math.random() * nodeRings.length) | 0;
      let j = i + (Math.random() < 0.5 ? 1 : -1);
      if (j < 0 || j >= nodeRings.length) j = i === 0 ? 1 : i - 1;
      const ra = nodeRings[i]; const rb = nodeRings[j];
      const na = ra.nodes[(Math.random() * ra.nodes.length) | 0];
      const nb = nearestNode(rb, nodeAngle(ra, na));   // hop to the closest node so the path stays around the rim
      na.flash = Math.max(na.flash, 0.6);
      packets.push({ layer: 'back', from: () => nodePos(ra, na), to: () => nodePos(rb, nb), hit: nb, t: 0, dur: rand(0.9, 1.6), hue: Math.random() < 0.7 ? 'a' : 'b' });
    }
    function spawnFeaturePacket(f) {
      const ang = Math.atan2(f.cy - C.y, f.cx - C.x);
      const nb = nearestNode(segRing, ang);
      packets.push({ layer: 'front', from: () => ({ x: f.cx, y: f.cy }), to: () => nodePos(segRing, nb), hit: nb, t: 0, dur: rand(0.8, 1.2), hue: f.lost ? 'b' : 'a' });
    }
    const bez = (p0, c, p1, t) => {
      const u = 1 - t;
      return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y };
    };
    function drawPacket(ctx, p) {
      const p0 = p.from(); const p1 = p.to();
      const mx = (p0.x + p1.x) / 2; const my = (p0.y + p1.y) / 2;
      const c = { x: mx + (mx - C.x) * 0.25, y: my + (my - C.y) * 0.25 };   // bow outward from the centre
      const col = p.hue === 'a' ? accent().a : accent().b;
      ctx.strokeStyle = rgba(col, 0.14 * (1 - p.t * 0.5));
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo(c.x, c.y, p1.x, p1.y); ctx.stroke();
      for (let k = 6; k >= 0; k--) {
        const q = bez(p0, c, p1, Math.max(0, p.t - k * 0.025));
        ctx.fillStyle = rgba(col, (1 - k / 7) * 0.95);
        ctx.beginPath(); ctx.arc(q.x, q.y, k === 0 ? 2.3 : 1.4, 0, TAU); ctx.fill();
      }
    }

    /* -- back layer: the rings */
    let clock = 0;
    function drawBack() {
      const A = accent().a; const B = accent().b;
      bctx.clearRect(0, 0, W, H);
      const glow = bctx.createRadialGradient(C.x, C.y, R * 0.3, C.x, C.y, R * 1.1);
      glow.addColorStop(0, rgba(A, 0)); glow.addColorStop(0.72, rgba(A, 0.06)); glow.addColorStop(1, rgba(A, 0));
      bctx.fillStyle = glow;
      bctx.beginPath(); bctx.arc(C.x, C.y, R * 1.1, 0, TAU); bctx.fill();

      bctx.save();
      bctx.translate(C.x, C.y);
      for (const ring of rings) {
        const r = ring.r * R;
        bctx.save();
        bctx.rotate(ring.a);
        if (ring.kind === 'ticks') {
          for (let i = 0; i < 120; i++) {
            const major = i % 10 === 0; const mid = i % 5 === 0;
            const len = major ? 10 : mid ? 6 : 3;
            const ang = (i / 120) * TAU;
            bctx.strokeStyle = rgba(A, major ? 0.55 : mid ? 0.32 : 0.18);
            bctx.lineWidth = major ? 1.4 : 1;
            bctx.beginPath();
            bctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
            bctx.lineTo(Math.cos(ang) * (r - len), Math.sin(ang) * (r - len));
            bctx.stroke();
          }
          bctx.font = `500 8px ${MONO}`; bctx.textAlign = 'center'; bctx.textBaseline = 'middle';
          bctx.fillStyle = rgba(A, 0.4);
          for (let i = 0; i < 12; i++) {
            bctx.save(); bctx.rotate((i / 12) * TAU); bctx.translate(r + 9, 0); bctx.rotate(Math.PI / 2);
            bctx.fillText(String(i * 30).padStart(3, '0'), 0, 0); bctx.restore();
          }
        } else if (ring.kind === 'glyphs') {
          bctx.font = `500 9px ${MONO}`; bctx.textAlign = 'center'; bctx.textBaseline = 'middle';
          const n = ring.glyphs.length; const hot = Math.floor(clock * 7) % n;
          for (let i = 0; i < n; i++) {
            const d = Math.min(Math.abs(i - hot), n - Math.abs(i - hot));
            bctx.fillStyle = d < 3 ? rgba(A, 0.95 - d * 0.22) : rgba(B, 0.26);
            bctx.save(); bctx.rotate((i / n) * TAU); bctx.translate(r, 0); bctx.rotate(Math.PI / 2);
            bctx.fillText(ring.glyphs[i], 0, 0); bctx.restore();
          }
        } else if (ring.kind === 'segments') {
          bctx.strokeStyle = rgba(A, 0.12); bctx.lineWidth = 1;
          bctx.beginPath(); bctx.arc(0, 0, r - 5, 0, TAU); bctx.stroke();
          bctx.lineWidth = 3; bctx.lineCap = 'round';
          for (let i = 0; i < 6; i++) {
            const s = (i / 6) * TAU;
            bctx.strokeStyle = i % 2 ? rgba(B, 0.5) : rgba(A, 0.62);
            bctx.beginPath(); bctx.arc(0, 0, r, s + 0.08, s + (TAU / 6) * (i % 3 === 0 ? 0.72 : 0.5)); bctx.stroke();
          }
          bctx.lineCap = 'butt';
        } else if (ring.kind === 'dashes') {
          bctx.setLineDash([2, 6]); bctx.strokeStyle = rgba(B, 0.45); bctx.lineWidth = 1.2;
          bctx.beginPath(); bctx.arc(0, 0, r, 0, TAU); bctx.stroke();
          bctx.setLineDash([]);
          bctx.strokeStyle = rgba(A, 0.3); bctx.lineWidth = 7;   // sweeping radar arc
          bctx.beginPath(); bctx.arc(0, 0, r, 0, 0.55); bctx.stroke();
        } else {
          bctx.strokeStyle = rgba(A, 0.2); bctx.lineWidth = 1;
          bctx.beginPath(); bctx.arc(0, 0, r, 0, TAU); bctx.stroke();
          bctx.strokeStyle = rgba(A, 0.08);   // {12/5} star: the chakra's geometry
          bctx.beginPath();
          for (let i = 0; i <= 12; i++) {
            const ang = ((i * 5) % 12) / 12 * TAU;
            const x = Math.cos(ang) * r; const y = Math.sin(ang) * r;
            if (i === 0) bctx.moveTo(x, y); else bctx.lineTo(x, y);
          }
          bctx.stroke();
        }
        // nodes ride on their ring
        for (const nd of ring.nodes) {
          const x = Math.cos(nd.base) * r; const y = Math.sin(nd.base) * r;
          bctx.save(); bctx.translate(x, y); bctx.rotate(Math.PI / 4);
          bctx.fillStyle = rgba(A, 0.6 + nd.flash * 0.4);
          bctx.fillRect(-2.6, -2.6, 5.2, 5.2);
          bctx.restore();
          if (nd.flash > 0.02) {
            bctx.strokeStyle = rgba(A, nd.flash * 0.7); bctx.lineWidth = 1;
            bctx.beginPath(); bctx.arc(x, y, 4 + (1 - nd.flash) * 14, 0, TAU); bctx.stroke();
          }
        }
        bctx.restore();
      }
      bctx.restore();
      for (const p of packets) if (p.layer === 'back') drawPacket(bctx, p);
    }

    /* -- front layer: scan line, facial-region locks and mesh */
    const CYCLE = 7.5; const SWEEP = 2.6;
    let cycleIdx = -1;
    const strength = (f, ct, still) => {
      if (still) return 1;
      if (f.t0 < 0) return 0;
      return clamp01((clock - f.t0) / 0.3) * clamp01((CYCLE - ct) / 0.6);
    };
    function drawFront(still) {
      const A = accent().a; const B = accent().b;
      fctx.clearRect(0, 0, W, H);
      const ct = clock % CYCLE;
      const ci = Math.floor(clock / CYCLE);
      if (ci !== cycleIdx) { cycleIdx = ci; feats.forEach((f) => { f.t0 = -1; f.conf = (94 + Math.random() * 5.6).toFixed(1); }); }

      // scan line
      if (!still) {
        const p = clamp01(ct / SWEEP);
        if (p < 1) {
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          const top = box.y + box.h * 0.22; const bot = box.y + box.h * 0.92;
          const sy = top + (bot - top) * e;
          const x0 = box.x + box.w * 0.03; const x1 = box.x + box.w * 0.97;
          const band = fctx.createLinearGradient(0, sy - 46, 0, sy);
          band.addColorStop(0, rgba(A, 0)); band.addColorStop(1, rgba(A, 0.13));
          fctx.fillStyle = band; fctx.fillRect(x0, sy - 46, x1 - x0, 46);
          fctx.strokeStyle = rgba(A, 0.75); fctx.lineWidth = 1;
          fctx.beginPath(); fctx.moveTo(x0, sy); fctx.lineTo(x1, sy); fctx.stroke();
          for (const f of feats) {
            if (f.t0 < 0 && sy >= f.cy) { f.t0 = clock; spawnFeaturePacket(f); }
          }
        }
      }

      // mesh between regions
      const S = feats.map((f) => strength(f, ct, still));
      fctx.lineWidth = 1;
      for (const [i, j] of MESH) {
        const a = feats[i]; const b = feats[j];
        fctx.strokeStyle = rgba(A, 0.07 + 0.22 * Math.min(S[i], S[j]));
        fctx.beginPath(); fctx.moveTo(a.cx, a.cy); fctx.lineTo(b.cx, b.cy); fctx.stroke();
      }

      // region locks (small portraits get shorter labels so they don't collide)
      const compact = box.w < 380;
      fctx.font = `600 ${compact ? 8 : 9.5}px ${MONO}`; fctx.textBaseline = 'alphabetic'; fctx.textAlign = 'left';
      feats.forEach((f, i) => {
        const s = S[i];
        const col = f.lost ? B : A;
        fctx.fillStyle = rgba(col, 0.35 + s * 0.5);
        fctx.beginPath(); fctx.arc(f.cx, f.cy, 1.8, 0, TAU); fctx.fill();
        if (s <= 0.01) return;
        let alpha = s * 0.9;
        if (f.lost && Math.random() < 0.18) alpha *= 0.25;   // the code-side eye glitches
        const k = 1 + (1 - clamp01((clock - f.t0) / 0.3)) * 0.6 * (still ? 0 : 1);
        const hw = (f.bw * k) / 2; const hh = (f.bh * k) / 2; const L = Math.min(f.bw, f.bh) * 0.32;
        fctx.strokeStyle = rgba(col, alpha); fctx.lineWidth = 1.4;
        fctx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          const x = f.cx + sx * hw; const y = f.cy + sy * hh;
          fctx.moveTo(x - sx * L, y); fctx.lineTo(x, y); fctx.lineTo(x, y - sy * L);
        }
        fctx.stroke();
        fctx.strokeStyle = rgba(col, alpha * 0.7); fctx.lineWidth = 1;   // centre crosshair
        fctx.beginPath();
        fctx.moveTo(f.cx - 5, f.cy); fctx.lineTo(f.cx - 2, f.cy); fctx.moveTo(f.cx + 2, f.cy); fctx.lineTo(f.cx + 5, f.cy);
        fctx.moveTo(f.cx, f.cy - 5); fctx.lineTo(f.cx, f.cy - 2); fctx.moveTo(f.cx, f.cy + 2); fctx.lineTo(f.cx, f.cy + 5);
        fctx.stroke();
        if (compact && f.id === 'EAR_L') return;
        const full = compact ? (f.lost ? `${f.id} ✕` : f.id) : f.lost ? `${f.id} · SIGNAL LOST` : `${f.id} ${f.conf}%`;
        const shown = still ? full : full.slice(0, Math.ceil(clamp01((clock - f.t0) / 0.5) * full.length));
        if (!shown) return;
        const tx = f.cx - hw; const ty = f.cy - hh - 6;
        const tw = fctx.measureText(shown).width;
        fctx.fillStyle = `rgba(8,11,16,${0.62 * s})`;
        fctx.fillRect(tx - 3, ty - (compact ? 8.5 : 10), tw + 6, compact ? 11 : 13);
        fctx.fillStyle = rgba(col, Math.min(1, alpha + 0.1));
        fctx.fillText(shown, tx, ty);
      });

      for (const p of packets) if (p.layer === 'front') drawPacket(fctx, p);
    }

    /* -- simulation */
    let spawnIn = 0.3;
    function step(dt, boost) {
      clock += dt;
      for (const ring of rings) {
        ring.a += ring.speed * dt * boost;
        for (const nd of ring.nodes) nd.flash = Math.max(0, nd.flash - dt * 1.4);
        if (ring.glyphs && Math.random() < dt * 6) ring.glyphs[(Math.random() * ring.glyphs.length) | 0] = hex2();
      }
      spawnIn -= dt * boost;
      if (spawnIn <= 0) { spawnRingPacket(); spawnIn = rand(0.22, 0.6); }
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.t += (dt * boost) / p.dur;
        if (p.t >= 1) { p.hit.flash = 1; packets.splice(i, 1); }
      }
    }

    let running = false; let visible = true; let last = 0; let boost = 1; let boostTarget = 1;
    const loop = (now) => {
      if (!running) return;
      requestAnimationFrame(loop);
      if (document.hidden || !visible) { last = now; return; }
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      boost += (boostTarget - boost) * Math.min(1, dt * 3);
      step(dt, boost);
      drawBack();
      drawFront(false);
    };

    function init() {
      if (!layout()) return;
      if (reduceMotion) { drawBack(); drawFront(true); return; }
      if (!running) { running = true; requestAnimationFrame(loop); }
    }

    if (!reduceMotion) {
      stage.addEventListener('pointerenter', () => { boostTarget = 2; });
      stage.addEventListener('pointerleave', () => { boostTarget = 1; });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(stage);
      }
    }
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(init, 150); });
    window.addEventListener('themechange', () => { if (reduceMotion && box) { drawBack(); drawFront(true); } });
    const start = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(init);
    if (img.complete && img.naturalWidth) start();
    else img.addEventListener('load', start, { once: true });
  })();

  /* ---------------------------------------------------------------- Resume (shared on request only) */
  function resumeMailto() {
    const subject = encodeURIComponent('Resume request');
    const body = encodeURIComponent('Hi Sanjay,\n\nCould you share the latest copy of your resume?\n\nThanks,');
    return `mailto:${CONFIG.email}?subject=${subject}&body=${body}`;
  }

  /* ---------------------------------------------------------------- Terminal */
  const term = {
    body: $('#term-body'),
    form: $('#term-form'),
    input: $('#term-in'),
    history: [],
    hIndex: -1,
    busy: false,
    autoplay: true,
  };

  const PROMPT = '<span class="t-prompt">sanjay@sec:~$</span>';
  const SECTIONS = { about: 'about', arsenal: 'arsenal', skills: 'arsenal', experience: 'experience', projects: 'projects', writeups: 'writeups', articles: 'writeups', certs: 'certifications', certifications: 'certifications', research: 'research', resume: 'resume', contact: 'contact', home: 'top', top: 'top' };

  function print(html, cls = '') {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.innerHTML = html;
    term.body.appendChild(p);
    term.body.scrollTop = term.body.scrollHeight;
    return p;
  }
  const echo = (cmd) => print(`${PROMPT} <span class="t-hi">${escapeHTML(cmd)}</span>`);
  // lines: strings (plain lines) or [key, value] pairs (rendered as aligned grid rows)
  const block = (lines, keyWidth) => {
    const p = print(lines.map((l) => (Array.isArray(l)
      ? `<span class="t-row"><span class="t-k">${l[0]}</span><span>${l[1]}</span></span>`
      : `<span class="t-line">${l || '&nbsp;'}</span>`)).join(''), 't-out');
    if (keyWidth) p.style.setProperty('--kw', keyWidth);
    return p;
  };

  const COMMANDS = {
    help: {
      desc: 'list available commands',
      run() {
        const rows = Object.entries(COMMANDS)
          .filter(([, c]) => !c.hidden)
          .map(([name, c]) => [escapeHTML(name), `<span class="t-dim">${escapeHTML(c.desc)}</span>`]);
        block(['<span class="t-hi">available commands</span>', ...rows, '', '<span class="t-dim">tip: ↑/↓ for history, tab to autocomplete</span>'], '27ch');
      },
    },
    whoami: {
      desc: 'who is behind this terminal',
      run() {
        block([
          '<span class="t-hi">Sanjay Gupta</span>',
          'Security Analyst · Red Team · Penetration Testing · Application Security',
          '<span class="t-dim">CEH certified · 3+ years across VAPT, AppSec and security engineering</span>',
          '<span class="t-g">100+</span> government apps tested · <span class="t-g">500+</span> findings · <span class="t-g">20+</span> bug bounty findings',
          '<span class="t-dim">currently:</span> VAPT &amp; Red Teaming Consultant @ Nangia &amp; Co LLP',
        ]);
      },
    },
    'cat skills.txt': {
      desc: 'core skills by domain',
      run() {
        block([
          ['offensive', 'web/api pentesting · network vapt · AD assessment · privesc'],
          ['appsec', 'OWASP Top 10 · WSTG · API Top 10 · IDOR/BOLA · SSRF · XSS'],
          ['frameworks', 'MITRE ATT&amp;CK · PTES · CVSS · NIST · CIS · ASVS'],
          ['tooling', 'burp · metasploit · nmap · nuclei · bloodhound · impacket'],
          ['code', 'python · bash · powershell · c/c++ · javascript · sql'],
          ['stack', 'django · fastapi · flask · docker · nginx · postgresql'],
        ], '11ch');
      },
    },
    './initialize_portfolio.sh': {
      desc: 'boot the full portfolio',
      async run() {
        const steps = [
          ['<span class="t-c">[*]</span> resolving operator profile', 260],
          ['<span class="t-c">[*]</span> loading modules: recon · exploit · report', 320],
          ['<span class="t-c">[*]</span> mounting ~/experience.log (5 entries)', 280],
          ['<span class="t-c">[*]</span> indexing certifications', 260],
        ];
        for (const [line, ms] of steps) { print(line); await sleep(reduceMotion ? 0 : ms); }
        const bar = print('<span class="t-dim">[</span><span class="t-bar" style="width:0"></span><span class="t-dim">]</span> <span class="pct">0%</span>');
        const barEl = $('.t-bar', bar); const pct = $('.pct', bar);
        const W = 160;
        for (let i = 0; i <= 20; i++) {
          barEl.style.width = (W * i) / 20 + 'px';
          pct.textContent = i * 5 + '%';
          if (!reduceMotion) await sleep(40);
        }
        print('<span class="t-g">[✓] portfolio initialized.</span> <span class="t-dim">routing to ~/about …</span>', 't-out');
        await sleep(reduceMotion ? 0 : 700);
        scrollToEl($('#about'));
      },
    },
    ls: {
      desc: 'list files',
      run() {
        block(['<span class="t-c">projects/</span>  <span class="t-c">certs/</span>  about.txt  skills.txt  experience.log  findings.md  contact.txt  <span class="t-g">initialize_portfolio.sh</span>']);
      },
    },
    'cat about.txt': {
      desc: 'short bio',
      run() {
        block([
          'Cybersecurity professional with 3+ years across VAPT, application security and security engineering. Started as a full stack developer and sysadmin, moved into offensive security, and now tests web apps, APIs, networks and infrastructure for enterprise and public-sector environments.',
        ]);
      },
    },
    'cat experience.log': {
      desc: 'career timeline',
      run() {
        block([
          ['2026 → now', 'VAPT &amp; Red Teaming Consultant · Nangia &amp; Co LLP'],
          ['2025 → now', 'Bug Bounty Hunter · HackerOne'],
          ['2023 → 2026', 'System &amp; Security Engineer · IIT Tirupati Navavishkar I-Hub Foundation'],
          ['2023', 'Security Analyst · V &amp; M Enterprises'],
          ['2021 → 2022', 'Full Stack Developer · The Gurkul'],
        ], '12ch');
      },
    },
    'ls projects': {
      desc: 'selected projects',
      run() {
        block([
          '<span class="t-g">malwarelens/</span>            malware analysis &amp; threat intel (python, django)',
          '<span class="t-g">security-automation/</span>    recon, discovery, validation, log analysis',
          '<span class="t-g">enterprise-apps/</span>        security for 100+ internal applications',
          '<span class="t-g">exam-platform/</span>          django/react platform, 800+ concurrent users',
        ]);
      },
    },
    'cat certs.txt': {
      desc: 'certifications',
      run() {
        block([
          '<span class="t-g">●</span> Certified Ethical Hacker (CEH) — EC-Council',
          '<span class="t-dim">●</span> CEH training, Grade A — Edureka',
          '<span class="t-dim">●</span> Ethical Hacking &amp; Cyber Security workshop — IIT Hyderabad',
          '<span class="t-dim">●</span> HACK_IITK CTF 2024 — C3iHub, IIT Kanpur',
          '<span class="t-dim">●</span> Cybrary — 17-course IT &amp; Cybersecurity Foundation',
          '<span class="t-dim">●</span> Python (Basic) — HackerRank',
        ]);
      },
    },
    'cat findings.md': {
      desc: 'published research',
      run() {
        block([
          '# stats',
          '- government VAPT: 100+ applications tested, 500+ findings reported',
          '- bug bounty: 15+ real-world applications, 20+ findings',
          '',
          '# write-ups',
          '- From Mobile Number Enumeration to Full Account Takeover',
          '- From an Exposed SOAP Endpoint to Confirmed Time-Based SQL Injection',
          '- From GitHub Recon to High-Severity PII Disclosure',
          '- How Historical Web Archives Exposed a Hidden Django Admin',
          '- DOM-Based XSS in AI Chat-Bot',
          '<span class="t-dim">  …12 in total, run</span> cd writeups',
          '<span class="t-dim">reported classes: IDOR · XSS · auth flaws · JWT · info disclosure · logic</span>',
        ]);
      },
    },
    'cat contact.txt': {
      desc: 'how to reach me',
      run() {
        block([
          ['email', `<a class="t-link" href="mailto:${CONFIG.email}">${CONFIG.email}</a>`],
          ['linkedin', '<a class="t-link" href="https://www.linkedin.com/in/sanjay-g101" target="_blank" rel="noopener noreferrer">in/sanjay-g101</a>'],
          ['github', '<a class="t-link" href="https://github.com/sanjaywe6" target="_blank" rel="noopener noreferrer">github.com/sanjaywe6</a>'],
          ['web', '<a class="t-link" href="https://sanjayg.online" target="_blank" rel="noopener noreferrer">sanjayg.online</a>'],
        ], '10ch');
      },
    },
    resume: {
      desc: 'request my resume',
      run() {
        print(`<span class="t-a">[i]</span> my resume is shared on request. <a class="t-link" href="${resumeMailto()}">email ${CONFIG.email}</a>`, 't-out');
      },
    },
    'cd <section>': {
      desc: 'jump to a section (about, projects, certs…)',
      run() {},
    },
    theme: {
      desc: 'switch colour theme: theme blood | cyber | matrix',
      run() {
        const cur = currentTheme();
        block([
          '<span class="t-hi">available themes</span>',
          ...Object.entries(THEMES).map(([id, t]) => [
            `${id === cur ? '<span class="t-g">●</span>' : '<span class="t-dim">○</span>'} ${t.name}`,
            `<span class="t-dim">${t.label}${id === cur ? ' (active)' : ''} · run</span> theme ${id}`,
          ]),
        ], '14ch');
      },
    },
    history: { desc: 'command history', run() { block(term.history.length ? term.history.map((h, i) => `  <span class="t-dim">${String(i + 1).padStart(3)}</span>  ${escapeHTML(h)}`) : ['<span class="t-dim">no history yet</span>']); } },
    date: { desc: 'print current date', run() { print(escapeHTML(new Date().toString()), 't-out'); } },
    clear: { desc: 'clear the screen', run() { term.body.innerHTML = ''; } },
    // hidden fun
    sudo: { hidden: true, run() { print('<span class="t-r">[sudo] permission denied:</span> nice try. this incident will be reported. 😉', 't-out'); } },
    'rm -rf /': { hidden: true, run() { print('<span class="t-r">rm: refusing to operate on "/":</span> this system is hardened.', 't-out'); } },
    nmap: { hidden: true, run() { print('<span class="t-a">[!]</span> unauthorized scanning is not my style. try <span class="t-hi">cat findings.md</span>', 't-out'); } },
    exit: { hidden: true, run() { print('<span class="t-dim">logout… just kidding, the session persists. try</span> <span class="t-hi">cat contact.txt</span>', 't-out'); } },
  };

  const ALIASES = {
    skills: 'cat skills.txt', about: 'cat about.txt', experience: 'cat experience.log', projects: 'ls projects',
    certs: 'cat certs.txt', certifications: 'cat certs.txt', findings: 'cat findings.md', research: 'cat findings.md',
    contact: 'cat contact.txt', socials: 'cat contact.txt', 'cat resume.pdf': 'resume', 'open resume.pdf': 'resume', cv: 'resume',
    'initialize_portfolio.sh': './initialize_portfolio.sh', 'sh initialize_portfolio.sh': './initialize_portfolio.sh',
    'bash initialize_portfolio.sh': './initialize_portfolio.sh', init: './initialize_portfolio.sh', cls: 'clear', '?': 'help', 'ls -la': 'ls', 'ls -l': 'ls', 'ls certs': 'cat certs.txt',
  };

  const COMPLETIONS = [
    ...Object.keys(COMMANDS).filter((k) => !COMMANDS[k].hidden && !k.includes('<')),
    ...Object.keys(SECTIONS).map((s) => 'cd ' + s), 'echo ',
    ...Object.keys(THEMES).map((t) => 'theme ' + t),
  ];

  async function run(raw) {
    const input = raw.trim();
    echo(input);
    if (!input) return;
    term.history.push(input);
    term.hIndex = term.history.length;

    const lower = input.toLowerCase().replace(/\s+/g, ' ');
    if (lower.startsWith('echo ')) { print(escapeHTML(input.slice(5)), 't-out'); return; }
    if (lower.startsWith('sudo')) { COMMANDS.sudo.run(); return; }
    const th = lower.match(/^(?:theme\s+|\.\/)(blood|cyber|matrix)(?:\.exe)?$/);
    if (th) {
      setTheme(th[1]);
      print(`<span class="t-g">[✓]</span> loaded ${THEMES[th[1]].name}`, 't-out');
      return;
    }
    if (lower.startsWith('theme ')) { print('<span class="t-r">unknown theme.</span> <span class="t-dim">try</span> theme blood | cyber | matrix', 't-out'); return; }
    const cd = lower.match(/^(?:cd|goto|open)\s+(?:~\/)?([a-z]+)\/?$/);
    if (cd && SECTIONS[cd[1]]) {
      print(`<span class="t-dim">→ navigating to ~/${escapeHTML(cd[1])}</span>`, 't-out');
      await sleep(reduceMotion ? 0 : 250);
      scrollToEl($('#' + SECTIONS[cd[1]]));
      return;
    }
    if (lower === 'cd' || lower === 'cd ~' || lower === 'cd ..') { print('<span class="t-dim">usage: cd about | arsenal | research | projects | writeups | experience | certs | resume | contact</span>', 't-out'); return; }

    const key = COMMANDS[lower] ? lower : ALIASES[lower];
    const cmd = key && COMMANDS[key];
    if (cmd && key !== 'cd <section>') { await cmd.run(); return; }
    print(`<span class="t-r">command not found:</span> ${escapeHTML(input.split(' ')[0])} <span class="t-dim">— type</span> <span class="t-hi">help</span>`, 't-out');
  }

  // Commands run one at a time; anything submitted while another command is running is queued.
  let queue = Promise.resolve();
  function execute(cmd, { typed = false, auto = false } = {}) {
    queue = queue.then(async () => {
      if (auto && !term.autoplay) return;
      term.busy = true;
      try {
        if (typed && !reduceMotion) {
          term.input.value = '';
          for (const ch of cmd) {
            if (auto && !term.autoplay) { term.input.value = ''; return; }
            term.input.value += ch;
            await sleep(38 + Math.random() * 45);
          }
          await sleep(180);
        }
        term.input.value = '';
        await run(cmd);
      } catch (err) {
        print(`<span class="t-r">error:</span> ${escapeHTML(err.message || err)}`, 't-out');
      } finally {
        term.busy = false;
      }
    });
    return queue;
  }

  if (term.body && term.form && term.input) {
    term.form.addEventListener('submit', (e) => {
      e.preventDefault();
      term.autoplay = false;
      const v = term.input.value;
      term.input.value = '';
      execute(v);
    });

    term.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (term.hIndex > 0) term.hIndex--;
        term.input.value = term.history[term.hIndex] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (term.hIndex < term.history.length) term.hIndex++;
        term.input.value = term.history[term.hIndex] || '';
      } else if (e.key === 'Tab') {
        const v = term.input.value.toLowerCase();
        if (!v) return;
        e.preventDefault();
        const matches = COMPLETIONS.filter((c) => c.startsWith(v));
        if (matches.length === 1) term.input.value = matches[0];
        else if (matches.length > 1) print(`<span class="t-dim">${matches.map(escapeHTML).join('   ')}</span>`);
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault(); term.body.innerHTML = '';
      }
    });
    term.input.addEventListener('focus', () => { term.autoplay = false; });

    // Click anywhere in the terminal focuses the prompt (unless selecting text / clicking links)
    $('#terminal').addEventListener('click', (e) => {
      if (e.target.closest('a') || String(window.getSelection())) return;
      term.input.focus({ preventScroll: true });
    });

    $$('[data-cmd]').forEach((btn) => btn.addEventListener('click', () => {
      term.autoplay = false;
      execute(btn.dataset.cmd, { typed: true });
    }));

    // Autoplay intro once the terminal scrolls into view
    onReady(() => whenRevealed($('.hero__terminal'), async () => {
      term.body.innerHTML = '';
      if (reduceMotion) {
        await run('whoami');
        await run('cat skills.txt');
      } else {
        await sleep(500);
        await execute('whoami', { typed: true, auto: true });
        await sleep(650);
        await execute('cat skills.txt', { typed: true, auto: true });
        if (!term.autoplay) return;
      }
      print('<span class="t-dim">type</span> <span class="t-hi">help</span> <span class="t-dim">or run</span> <span class="t-g">./initialize_portfolio.sh</span>');
    }));
  }

  /* ---------------------------------------------------------------- Arsenal grep */
  const grepIn = $('#grep-in');
  const grepStatus = $('#grep-status');
  const arsenal = $('#arsenal-grid');
  if (grepIn && arsenal) {
    const cats = $$('.arsenal__cat', arsenal);
    const filter = () => {
      const q = grepIn.value.trim().toLowerCase();
      arsenal.classList.toggle('is-filtering', !!q);
      let count = 0;
      cats.forEach((cat) => {
        let catHit = false;
        $$('.tags li', cat).forEach((li) => {
          const hit = !!q && li.textContent.toLowerCase().includes(q);
          li.classList.toggle('is-match', hit);
          if (hit) { count++; catHit = true; }
        });
        cat.classList.toggle('has-match', catHit);
      });
      grepStatus.textContent = q ? (count ? `${count} match${count > 1 ? 'es' : ''}` : 'no matches') : '';
    };
    grepIn.addEventListener('input', filter);
    grepIn.addEventListener('keydown', (e) => { if (e.key === 'Escape') { grepIn.value = ''; filter(); } });
  }

  /* ---------------------------------------------------------------- Pointer effects */
  if (finePointer && !reduceMotion) {
    const glow = $('#cursor-glow');
    let mx = 0; let my = 0; let raf = 0; let spotEl = null; let sx = 0; let sy = 0;
    const frame = () => {
      raf = 0;
      if (glow) glow.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (spotEl) {
        const r = spotEl.getBoundingClientRect();
        spotEl.style.setProperty('--mx', `${sx - r.left}px`);
        spotEl.style.setProperty('--my', `${sy - r.top}px`);
      }
    };
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY; sx = e.clientX; sy = e.clientY;
      spotEl = e.target instanceof Element ? e.target.closest('[data-spotlight]') : null;
      if (glow && !glow.classList.contains('is-on')) glow.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
    document.addEventListener('pointerleave', () => glow && glow.classList.remove('is-on'));
  }

  /* ---------------------------------------------------------------- Byte field (background) */
  // Columns of hex/binary bytes stream slowly down the page at low opacity. Bytes near the
  // cursor are gently attracted toward it (and brighten), then ease back when it moves away.
  // One canvas, ~30fps, paused when the tab is hidden. Reduced motion: static field, no motion.
  (() => {
    const host = $('.ambient');
    if (!host) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'ambient__bytes';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, $('#cursor-glow') || null);
    const ctx = canvas.getContext('2d');

    const HEX = '0123456789ABCDEF';
    const RADIUS = 190;          // attraction radius (px)
    const PULL = 0.42;           // how far toward the cursor a byte travels at the centre (0-1)
    const EASE = 10;            // easing speed (higher = snappier); kept low for a slow pull
    const FONT = '500 12px "Geist Mono", ui-monospace, monospace';
    const FRAME_MS = 1000 / 30;

    const rand = (a, b) => a + Math.random() * (b - a);
    const glyph = () => {
      const r = Math.random();
      if (r < 0.55) return Math.random() < 0.5 ? '0' : '1';
      return HEX[(Math.random() * 16) | 0] + HEX[(Math.random() * 16) | 0];
    };

    let W = 0; let H = 0; let dpr = 1;
    let cols = [];
    const pointer = { x: -9999, y: -9999, active: false };

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const colGap = W < 700 ? 34 : 30;
      const rowGap = 26;
      const rows = Math.ceil(H / rowGap) + 2;
      cols = [];
      for (let x = colGap / 2; x < W; x += colGap) {
        const items = [];
        for (let r = 0; r < rows; r++) {
          items.push({
            y: r * rowGap - rowGap,
            ch: Math.random() < 0.28 ? '' : glyph(),   // gaps make the streams feel organic
            base: rand(0.04, 0.1),                       // low resting opacity
            ox: 0, oy: 0, hi: 0,
          });
        }
        cols.push({ x: x + rand(-3, 3), speed: rand(6, 22), span: rows * rowGap, rowGap, items });
      }
    };

    // Colours follow the active theme: bright accent near the cursor, desaturated accent at rest
    let hot = ''; let dim = '';
    const setColours = () => {
      const [r, g, b] = accent().a;
      hot = `${r}, ${g}, ${b}`;
      dim = [r, g, b].map((v, i) => Math.round(v * 0.45 + [130, 150, 160][i] * 0.55)).join(', ');
    };
    setColours();
    window.addEventListener('themechange', () => { setColours(); draw(); });

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.font = FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const col of cols) {
        for (const it of col.items) {
          if (!it.ch) continue;
          const a = it.base + it.hi * 0.6;
          if (it.hi > 0.04) {
            ctx.fillStyle = `rgba(${hot}, ${a.toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(${dim}, ${a.toFixed(3)})`;
          }
          ctx.fillText(it.ch, col.x + it.ox, it.y + it.oy);
        }
      }
    };

    const step = (dt) => {
      const s = dt / 1000;
      const k = 1 - Math.exp(-EASE * s);            // frame-rate independent easing
      const R2 = RADIUS * RADIUS;
      for (const col of cols) {
        const dy = col.speed * s;
        for (const it of col.items) {
          it.y += dy;
          if (it.y > H + col.rowGap) {                // wrap to the top with a fresh byte
            it.y -= col.span;
            it.ch = Math.random() < 0.28 ? '' : glyph();
          } else if (it.ch && Math.random() < 0.0025) {
            it.ch = glyph();                          // occasional flicker / bit flip
          }
          let tx = 0; let ty = 0; let th = 0;
          if (pointer.active && it.ch) {
            const ddx = pointer.x - col.x;
            const ddy = pointer.y - it.y;
            const d2 = ddx * ddx + ddy * ddy;
            if (d2 < R2) {
              const f = 1 - Math.sqrt(d2) / RADIUS;   // 0 at edge -> 1 at cursor
              const pull = f * f * PULL;
              tx = ddx * pull; ty = ddy * pull; th = f;
            }
          }
          it.ox += (tx - it.ox) * k;
          it.oy += (ty - it.oy) * k;
          it.hi += (th - it.hi) * k;
        }
      }
    };

    build();
    draw();
    let resizeT;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => { build(); draw(); }, 120);
    });

    if (reduceMotion) return;   // static field only

    if (finePointer) {
      window.addEventListener('pointermove', (e) => {
        pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
      }, { passive: true });
      document.addEventListener('pointerleave', () => { pointer.active = false; });
      window.addEventListener('blur', () => { pointer.active = false; });
    }

    let last = 0; let acc = 0;
    const loop = (t) => {
      requestAnimationFrame(loop);
      if (document.hidden) { last = t; return; }
      const dt = Math.min(100, t - (last || t));
      last = t;
      acc += dt;
      if (acc < FRAME_MS) return;
      step(acc);
      acc = 0;
      draw();
    };
    requestAnimationFrame(loop);
  })();

  /* ---------------------------------------------------------------- Timeline progress */
  const timeline = $('#timeline');
  const progress = timeline && $('.timeline__progress span', timeline);
  if (timeline && progress) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.62 - r.top) / r.height));
      progress.style.setProperty('--p', reduceMotion ? 1 : p.toFixed(4));
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------------------------------------------------------------- Project visuals */
  const heights = [34, 46, 40, 58, 52, 70, 63, 78, 72, 88, 82, 96];
  $$('.viz-bars i').forEach((bar, i) => bar.style.setProperty('--h', heights[i % heights.length] + '%'));

  const stagger = (items, ms) => items.forEach((li, i) => setTimeout(() => li.classList.add('is-hit'), reduceMotion ? 0 : 300 + i * ms));
  $$('.project').forEach((proj) => {
    const ioc = $$('.viz-ioc li', proj);
    const pipe = $$('.viz-pipe li', proj);
    whenRevealed(proj, () => { stagger(ioc, 380); stagger(pipe, 320); });
  });

  /* ---------------------------------------------------------------- Write-ups carousel */
  // Clones the cards once so the track loops seamlessly, then moves it with rAF so the flow can change
  // direction smoothly. The side arrows work like prev/next: ‹ brings earlier cards in (flow right), › brings
  // later cards in (flow left), each with a short push that way. It eases to a
  // stop on hover/focus, via the pause button, and while off-screen.
  // Reduced motion: no auto-flow; the row scrolls natively and the arrows step one card at a time.
  (() => {
    const car = $('#wcar');
    const track = car && $('.wcar__track', car);
    const toggle = $('#wcar-toggle');
    const arrows = $$('[data-wcar-dir]');
    if (!track) return;

    const cardStep = () => { const c = $('.wcard', track); return c ? c.getBoundingClientRect().width + 16 : 320; };
    arrows.forEach((b) => { b.hidden = false; });

    if (reduceMotion) {
      arrows.forEach((b) => b.addEventListener('click', () => car.scrollBy({ left: cardStep() * -Number(b.dataset.wcarDir), behavior: 'auto' })));
      return;
    }

    $$('.wcard', track).forEach((li) => {
      const clone = li.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      $$('a', clone).forEach((a) => a.setAttribute('tabindex', '-1'));
      track.appendChild(clone);
    });
    car.scrollLeft = 0;
    car.classList.add('is-live');

    const SPEED = 45;        // cruising speed, px per second
    const EASE = 3;          // how quickly velocity settles (per second)
    let dir = -1;            // -1 = cards flow left, 1 = cards flow right
    let x = 0; let v = 0; let half = 0;
    let hovered = false; let paused = false; let visible = true;
    const measure = () => { half = track.scrollWidth / 2 + 8; };   // one full set + half the gap
    measure();
    window.addEventListener('resize', measure);

    car.addEventListener('pointerenter', () => { hovered = true; });
    car.addEventListener('pointerleave', () => { hovered = false; });
    car.addEventListener('focusin', () => { hovered = true; });
    car.addEventListener('focusout', () => { hovered = car.matches(':hover'); });

    arrows.forEach((b) => b.addEventListener('click', () => {
      dir = Number(b.dataset.wcarDir);
      v += dir * cardStep() * EASE;   // push roughly one card in that direction, then settle
      arrows.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    }));

    let last = 0;
    const loop = (t) => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      if (!visible || document.hidden || !half) return;
      const target = hovered || paused ? 0 : dir * SPEED;
      v += (target - v) * Math.min(1, dt * EASE);
      if (Math.abs(v) < 0.01 && target === 0) return;
      x += v * dt;
      if (x <= -half) x += half; else if (x > 0) x -= half;   // wrap within one set either way
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    };
    requestAnimationFrame(loop);

    if (toggle) {
      const label = $('[data-wcar-label]', toggle);
      const icon = $('path', toggle);
      toggle.hidden = false;
      toggle.addEventListener('click', () => {
        paused = !paused;
        car.classList.toggle('is-paused', paused);
        toggle.setAttribute('aria-pressed', String(paused));
        label.textContent = paused ? 'play' : 'pause';
        icon.setAttribute('d', paused ? 'M8 5v14l11-7z' : 'M9 5v14M15 5v14');
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(car);
      // Covers are lazy; once the section is near, load them all so cards sliding in from the side are never blank.
      const pre = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        pre.disconnect();
        $$('img[loading="lazy"]', track).forEach((img) => { img.loading = 'eager'; });
      }, { rootMargin: '800px 0px' });
      pre.observe(car);
    }
  })();

  /* ---------------------------------------------------------------- Certificate collection toggle */
  const colToggle = $('#collection-toggle');
  const colList = $('#collection-list');
  if (colToggle && colList) {
    const total = $$('li', colList).length;
    colToggle.addEventListener('click', () => {
      const open = colList.classList.toggle('is-open');
      colToggle.setAttribute('aria-expanded', String(open));
      $('[data-label]', colToggle).textContent = open ? 'Show fewer' : `Show all ${total}`;
      if (!open) colList.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    });
  }

  /* ---------------------------------------------------------------- Lightbox */
  const lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    const img = $('#lb-img');
    const title = $('#lb-title');
    const meta = $('#lb-meta');
    const count = $('#lb-count');
    const triggers = $$('[data-lightbox]');
    const items = [];
    const indexBySrc = new Map();
    triggers.forEach((t) => {
      const src = t.dataset.lightbox;
      if (!indexBySrc.has(src)) {
        indexBySrc.set(src, items.length);
        items.push({ src, title: t.dataset.title || '', issuer: t.dataset.issuer || '', date: t.dataset.date || '' });
      }
    });
    let current = 0;
    let lastTrigger = null;

    const show = (i) => {
      current = (i + items.length) % items.length;
      const it = items[current];
      img.classList.add('is-loading');
      const pre = new Image();
      pre.onload = pre.onerror = () => { img.src = it.src; img.classList.remove('is-loading'); };
      pre.src = it.src;
      img.alt = `${it.title} certificate${it.issuer ? ' issued by ' + it.issuer : ''}`;
      title.textContent = it.title;
      meta.textContent = [it.issuer, it.date].filter(Boolean).join(' · ');
      count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
      // Preload neighbours
      [current + 1, current - 1].forEach((n) => { const p = new Image(); p.src = items[(n + items.length) % items.length].src; });
    };

    const open = (trigger) => {
      lastTrigger = trigger;
      show(indexBySrc.get(trigger.dataset.lightbox));
      lb.showModal();
      document.body.classList.add('is-locked');
      $('#lb-close').focus();
    };
    const close = () => { if (lb.open) lb.close(); };

    triggers.forEach((t) => t.addEventListener('click', () => open(t)));
    $('#lb-close').addEventListener('click', close);
    $('#lb-prev').addEventListener('click', () => show(current - 1));
    $('#lb-next').addEventListener('click', () => show(current + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    lb.addEventListener('close', () => {
      document.body.classList.remove('is-locked');
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    // Swipe on touch devices
    let tx = null;
    lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      tx = null;
    });
  } else if (lb) {
    // Very old browsers: open the full image directly
    $$('[data-lightbox]').forEach((t) => t.addEventListener('click', () => window.open(t.dataset.lightbox, '_blank', 'noopener')));
  }

  /* ---------------------------------------------------------------- Copy email */
  const copyBtn = $('#copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email;
      let ok = false;
      try { await navigator.clipboard.writeText(email); ok = true; } catch {
        const ta = document.createElement('textarea');
        ta.value = email; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        ta.remove();
      }
      const label = $('[data-copy-label]', copyBtn);
      if (ok) {
        copyBtn.classList.add('is-copied'); label.textContent = 'copied';
        toast('email copied to clipboard');
        setTimeout(() => { copyBtn.classList.remove('is-copied'); label.textContent = 'copy'; }, 2000);
      } else {
        toast(`copy failed: ${email}`);
      }
    });
  }

  /* ---------------------------------------------------------------- Footer */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
  const toTop = $('#back-to-top');
  if (toTop) toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    $('.nav__logo').focus({ preventScroll: true });
  });
})();
