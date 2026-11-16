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

  /* ---------------------------------------------------------------- Hero: counters */
  onReady(() => {
    if (reduceMotion) return;
    $$('[data-count]').forEach((el) => {
      const target = +el.dataset.count;
      const start = performance.now();
      const dur = 1400;
      const tick = (t) => {
        const p = Math.min(1, (t - start) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      setTimeout(() => requestAnimationFrame(tick), 700);
    });
  });

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
  const SECTIONS = { about: 'about', arsenal: 'arsenal', skills: 'arsenal', experience: 'experience', projects: 'projects', certs: 'certifications', certifications: 'certifications', research: 'research', resume: 'resume', contact: 'contact', home: 'top', top: 'top' };

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
          '# write-ups',
          '- DOM-Based XSS in AI Chat-Bot',
          '- Missing CAPTCHA Configuration in Signup Flow',
          '- Logout Without Revocation: A Session Token Analysis',
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
    const cd = lower.match(/^(?:cd|goto|open)\s+(?:~\/)?([a-z]+)\/?$/);
    if (cd && SECTIONS[cd[1]]) {
      print(`<span class="t-dim">→ navigating to ~/${escapeHTML(cd[1])}</span>`, 't-out');
      await sleep(reduceMotion ? 0 : 250);
      scrollToEl($('#' + SECTIONS[cd[1]]));
      return;
    }
    if (lower === 'cd' || lower === 'cd ~' || lower === 'cd ..') { print('<span class="t-dim">usage: cd about | arsenal | experience | projects | certs | research | resume | contact</span>', 't-out'); return; }

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

    // Autoplay intro once the page is ready
    onReady(async () => {
      term.body.innerHTML = '';
      if (reduceMotion) {
        await run('whoami');
        await run('cat skills.txt');
      } else {
        await sleep(900);
        await execute('whoami', { typed: true, auto: true });
        await sleep(650);
        await execute('cat skills.txt', { typed: true, auto: true });
        if (!term.autoplay) return;
      }
      print('<span class="t-dim">type</span> <span class="t-hi">help</span> <span class="t-dim">or run</span> <span class="t-g">./initialize_portfolio.sh</span>');
    });
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
            ctx.fillStyle = `rgba(0, 255, 157, ${a.toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(120, 220, 185, ${a.toFixed(3)})`;
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
