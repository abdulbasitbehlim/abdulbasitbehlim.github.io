/* Dependency-free enhancements. Content and links also work without JavaScript. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Theme preference: cinematic dark by default, with a persistent light-mode option.
  const themeButton = $('#themeToggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  function applyTheme(theme, save = false) {
    const next = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = next;
    root.style.colorScheme = next;
    const isLight = next === 'light';
    if (themeButton) {
      themeButton.setAttribute('aria-pressed', String(isLight));
      themeButton.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      themeButton.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
      $('#themeLabel').textContent = isLight ? 'Dark' : 'Light';
      $('#themeIcon').textContent = isLight ? '☾' : '☀';
    }
    if (themeColorMeta) themeColorMeta.setAttribute('content', isLight ? '#f4f7fc' : '#050812');
    if (save) { try { localStorage.setItem('abb-theme', next); } catch (_) {} }
  }
  let initialTheme = root.dataset.theme || 'dark';
  try { initialTheme = localStorage.getItem('abb-theme') || initialTheme; } catch (_) {}
  applyTheme(initialTheme);
  if (themeButton) themeButton.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  const menu = $('#mainNav'), menuButton = $('#menuButton');
  function setMenu(open, restoreFocus = false) {
    menu.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    $('#menuLabel').textContent = open ? 'Close' : 'Menu';
    if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false, true); });
  ['click', 'focusin'].forEach(type => document.addEventListener(type, e => {
    if (menu.classList.contains('open') && !e.target.closest('.site-header')) setMenu(false);
  }));
  matchMedia('(max-width:800px)').addEventListener('change', () => setMenu(false));

  let pauseRequested = false;
  try { pauseRequested = localStorage.getItem('abb-pause-motion') === 'true'; } catch (_) {}
  const motionButton = $('#motionToggle');
  motionButton.hidden = false;
  function syncMotion() {
    const paused = reducedMotion.matches || pauseRequested;
    root.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    $('#motionLabel').textContent = reducedMotion.matches ? 'Reduced motion' : (paused ? 'Resume motion' : 'Pause motion');
    motionButton.disabled = reducedMotion.matches;
    motionButton.title = reducedMotion.matches ? 'Your device has reduced motion enabled.' : '';
    motionButton.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
    if (paused) $$('.reveal-pending').forEach(el => el.classList.remove('reveal-pending'));
  }
  motionButton.addEventListener('click', () => {
    pauseRequested = !pauseRequested;
    try { localStorage.setItem('abb-pause-motion', String(pauseRequested)); } catch (_) {}
    syncMotion();
  });
  reducedMotion.addEventListener('change', syncMotion);
  syncMotion();
  document.addEventListener('visibilitychange', () => root.classList.toggle('tab-inactive', document.hidden));
  if ('IntersectionObserver' in window && !root.classList.contains('motion-paused')) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('reveal-pending'); observer.unobserve(entry.target); }
    }), { threshold: .06 });
    $$('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight) el.classList.add('reveal-pending');
      observer.observe(el);
    });
  }

  const filterButtons = $$('[data-filter]'), cards = $$('.project-card');
  $('.project-filters').hidden = false;
  function filterProjects(filter) {
    if (!filterButtons.some(b => b.dataset.filter === filter)) return;
    let count = 0;
    cards.forEach(card => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.hidden = !show;
      if (show) { count++; card.classList.remove('reveal-pending'); }
    });
    filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
    $('#projectCount').textContent = `${String(count).padStart(2, '0')} ${count === 1 ? 'PROJECT' : 'PROJECTS'}`;
  }
  filterButtons.forEach(b => b.addEventListener('click', () => filterProjects(b.dataset.filter)));
  $$('[data-research-filter]').forEach(a => a.addEventListener('click', () => filterProjects(a.dataset.researchFilter)));

  const header = $('#siteHeader'), progress = $('#scrollProgress');
  const navLinks = [...menu.querySelectorAll('a[href^="#"]')];
  const sections = navLinks.map(a => $(a.getAttribute('href')));
  let ticking = false;
  function syncScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
    header.classList.toggle('scrolled', scrollY > 20);
    let current = -1;
    sections.forEach((section, i) => { if (section.getBoundingClientRect().top <= 180) current = i; });
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 3) current = navLinks.length - 1;
    navLinks.forEach((a, i) => { if (i === current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    ticking = false;
  }
  function queueScroll() { if (!ticking) { requestAnimationFrame(syncScroll); ticking = true; } }
  addEventListener('scroll', queueScroll, {passive:true});
  addEventListener('resize', queueScroll);
  document.querySelector('details').addEventListener('toggle', queueScroll);
  if ('ResizeObserver' in window) new ResizeObserver(queueScroll).observe(document.body);
  syncScroll();

  const copyButton = $('#copyEmail'), email = 'abdulbasitbehlim3@gmail.com';
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    let copied = false;
    try { if (navigator.clipboard && isSecureContext) { await navigator.clipboard.writeText(email); copied = true; } } catch (_) {}
    if (!copied) {
      const temp = document.createElement('textarea');
      temp.value = email; temp.setAttribute('readonly', ''); temp.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(temp); temp.select();
      try { copied = document.execCommand('copy'); } catch (_) {}
      temp.remove(); copyButton.focus();
    }
    $('#copyStatus').textContent = copied ? 'Email copied. Let’s start a conversation.' : `Select and copy the address above: ${email}`;
  });
  $('#year').textContent = new Date().getFullYear();
})();
