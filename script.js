(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Motion preference: OS setting or the footer toggle ---- */
  let motionPaused = false;
  try { motionPaused = localStorage.getItem("abb-pause-motion") === "true"; } catch (e) {}
  const motionOff = () => reducedMotion.matches || motionPaused;
  const motionListeners = [];
  const motionButton = $("#motionToggle");

  function syncMotion() {
    const off = motionOff();
    root.classList.toggle("motion-off", off);
    if (motionButton) {
      motionButton.hidden = false;
      motionButton.disabled = reducedMotion.matches;
      motionButton.setAttribute("aria-pressed", String(off));
      motionButton.textContent = reducedMotion.matches ? "Reduced motion is on" : off ? "Play animations" : "Pause animations";
    }
    motionListeners.forEach(fn => fn(off));
  }
  if (motionButton) {
    motionButton.addEventListener("click", () => {
      motionPaused = !motionPaused;
      try { localStorage.setItem("abb-pause-motion", String(motionPaused)); } catch (e) {}
      syncMotion();
    });
  }
  reducedMotion.addEventListener("change", syncMotion);

  /* ---- Theme ---- */
  const themeButton = $("#themeToggle");
  const themeMeta = $('meta[name="theme-color"]');

  function applyTheme(theme, save) {
    const next = theme === "dark" ? "dark" : "light";
    root.dataset.theme = next;
    if (themeButton) {
      const label = next === "dark" ? "Switch to light mode" : "Switch to dark mode";
      themeButton.setAttribute("aria-label", label);
      themeButton.title = label;
    }
    if (themeMeta) themeMeta.setAttribute("content", next === "dark" ? "#060914" : "#e9eefb");
    if (save) { try { localStorage.setItem("abb-theme", next); } catch (e) {} }
    motionListeners.forEach(fn => fn(motionOff()));
  }
  applyTheme(root.dataset.theme);
  if (themeButton) {
    themeButton.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true));
  }

  /* ---- Mobile menu ---- */
  const header = $("#siteHeader");
  const nav = $("#mainNav");
  const menuButton = $("#menuButton");

  function setMenu(open, refocus) {
    if (!nav || !menuButton) return;
    nav.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (refocus) menuButton.focus();
  }
  if (nav && menuButton) {
    menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("open")) setMenu(false, true); });
    document.addEventListener("click", e => { if (nav.classList.contains("open") && !e.target.closest(".site-header")) setMenu(false); });
    window.matchMedia("(max-width: 860px)").addEventListener("change", () => setMenu(false));
  }

  /* ---- Scroll progress bar ---- */
  const progress = $("#scrollProgress");
  if (progress) {
    let queued = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      queued = false;
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
  }

  /* ---- Headline: words rise in one by one ---- */
  $$("[data-split]").forEach(heading => {
    if (motionOff()) return;
    heading.setAttribute("aria-label", heading.textContent.replace(/\s+/g, " ").trim());
    let i = 0;
    const split = node => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const outer = document.createElement("span");
            outer.className = "w";
            outer.setAttribute("aria-hidden", "true");
            const inner = document.createElement("span");
            inner.style.setProperty("--i", i++);
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          split(child);
        }
      });
    };
    split(heading);
  });

  /* ---- Reveal on scroll, with stagger inside groups ---- */
  const groups = ".now-list, .work-list, .exams, .kit, .profiles, .topics, .timeline, .entries, .projects, .facts";
  $$(groups).forEach(group => {
    Array.from(group.children).forEach((child, i) => {
      child.classList.add("rv");
      child.style.setProperty("--d", Math.min(i, 6));
    });
  });
  const reveals = $$(".rv");
  if ("IntersectionObserver" in window) {
    root.classList.add("js");
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("in"));
  }

  /* ---- Count-up numbers ---- */
  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const run = el => {
      const target = Number(el.dataset.count);
      if (motionOff() || !Number.isFinite(target)) { el.textContent = el.dataset.count; return; }
      const started = performance.now();
      const duration = 1400;
      const tick = now => {
        const t = Math.min(1, (now - started) / duration);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const co = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { run(entry.target); co.unobserve(entry.target); } });
    }, { threshold: 0.6 });
    counters.forEach(el => co.observe(el));
  }

  /* ---- Light that follows the pointer across glass panels ---- */
  if (window.matchMedia("(hover: hover)").matches) {
    $$(".project, .exam, .paper, .profile, .topic, .cta, .facts, .now-list, .kit, .entries, .timeline, .contact-card").forEach(card => {
      card.classList.add("spot");
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---- Rotating DNA helices ---- */
  $$("canvas.helix").forEach(canvas => {
    if (!canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    let width = 0, height = 0, visible = true, frame = null, angle = 0, last = 0;
    let colors = {};

    const readColors = () => {
      const cs = getComputedStyle(root);
      colors = {
        a: cs.getPropertyValue("--accent").trim() || "#2563eb",
        b: cs.getPropertyValue("--accent-2").trim() || "#7c3aed",
        c: cs.getPropertyValue("--accent-3").trim() || "#0891b2",
      };
    };
    const resize = () => {
      const r = { width: canvas.offsetWidth, height: canvas.offsetHeight };
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = r.width; height = r.height;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const n = 26;
      const radius = Math.min(width * 0.36, 150);
      const cx = width / 2;
      const items = [];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const y = 12 + t * (height - 24);
        const phase = angle + t * Math.PI * 3.2;
        const sway = Math.sin(angle * 0.6 + t * 3) * width * 0.05;
        for (let s = 0; s < 2; s++) {
          const p = phase + s * Math.PI;
          items.push({ x: cx + sway + Math.cos(p) * radius, y, z: Math.sin(p), s, i });
        }
      }
      // rungs first
      ctx.lineWidth = 1.2;
      for (let i = 0; i < n; i++) {
        const p1 = items[i * 2], p2 = items[i * 2 + 1];
        ctx.globalAlpha = 0.16 + 0.2 * Math.abs(p1.z);
        ctx.strokeStyle = i % 2 ? colors.a : colors.b;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      // beads, far to near
      items.sort((p, q) => p.z - q.z).forEach(p => {
        const depth = (p.z + 1) / 2;
        ctx.globalAlpha = 0.25 + depth * 0.7;
        ctx.fillStyle = p.s ? colors.b : (p.i % 5 === 0 ? colors.c : colors.a);
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.2 + depth * 4.2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const loop = now => {
      const dt = Math.min(50, now - (last || now));
      last = now;
      angle += dt * 0.0009;
      draw();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => { if (frame) { cancelAnimationFrame(frame); frame = null; } last = 0; };
    const sync = () => {
      stop();
      readColors();
      if (visible && !document.hidden && !motionOff()) frame = requestAnimationFrame(loop);
      else draw();
    };

    resize();
    window.addEventListener("resize", () => { resize(); sync(); });
    document.addEventListener("visibilitychange", sync);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(canvas);
    }
    motionListeners.push(sync);
    sync();
  });

  /* ---- First screen: the name as sand that scatters under the pointer ---- */
  const sandCanvas = $("#sand");
  const nameEl = $("#nameTitle");
  if (sandCanvas && nameEl && sandCanvas.getContext) {
    const section = sandCanvas.parentElement;
    const ctx = sandCanvas.getContext("2d");
    const pointer = { x: -9999, y: -9999, active: false };
    let W = 0, H = 0, grains = [], motes = [], palette = [], frame = null, visible = true, wakeUntil = 0, built = false;

    const readPalette = () => {
      const cs = getComputedStyle(root);
      const v = n => cs.getPropertyValue(n).trim();
      palette = [v("--ink") || "#0f172a", v("--accent") || "#2563eb", v("--accent-2") || "#7c3aed", v("--accent-3") || "#0891b2"];
    };

    const build = () => {
      const rect = section.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.round(rect.width); H = Math.round(rect.height);
      sandCanvas.width = W * dpr; sandCanvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // draw the name off-screen exactly where the real heading sits, then sample it
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const o = off.getContext("2d", { willReadFrequently: true });
      const style = getComputedStyle(nameEl);
      o.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      if ("letterSpacing" in o) o.letterSpacing = style.letterSpacing;
      o.textAlign = "center"; o.textBaseline = "middle"; o.fillStyle = "#000";
      $$("span", nameEl).forEach(word => {
        const r = word.getBoundingClientRect();
        o.fillText(word.textContent, r.left - rect.left + r.width / 2, r.top - rect.top + r.height / 2);
      });
      const data = o.getImageData(0, 0, W, H).data;
      const gap = W < 700 ? 2 : 3;
      const scatter = !built && !motionOff();
      grains = [];
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          if (data[(y * W + x) * 4 + 3] > 128) {
            const roll = Math.random();
            grains.push({
              hx: x + (Math.random() - 0.5), hy: y + (Math.random() - 0.5),
              x: scatter ? Math.random() * W : x, y: scatter ? H + Math.random() * 120 : y,
              vx: 0, vy: 0,
              s: gap === 2 ? 1.1 + Math.random() * 0.9 : 1.3 + Math.random() * 1.3,
              c: roll < 0.62 ? 0 : roll < 0.8 ? 1 : roll < 0.93 ? 2 : 3,
              k: 0.018 + Math.random() * 0.03,
            });
          }
        }
      }
      // loose "molecules" drifting behind the name
      const count = Math.round(Math.min(90, (W * H) / 14000));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: 1.2 + Math.random() * 2.6, c: 1 + Math.floor(Math.random() * 3),
      }));
      built = true;
      section.classList.toggle("sand-ready", grains.length > 0);
    };

    const step = animate => {
      ctx.clearRect(0, 0, W, H);
      const R = W < 700 ? 70 : 120, R2 = R * R;

      // molecules + bonds
      for (const m of motes) {
        if (animate) {
          m.x += m.vx; m.y += m.vy;
          if (m.x < -20) m.x = W + 20; else if (m.x > W + 20) m.x = -20;
          if (m.y < -20) m.y = H + 20; else if (m.y > H + 20) m.y = -20;
        }
        const dx = m.x - pointer.x, dy = m.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < R2 * 2.2 && d2 > 0.01) { const d = Math.sqrt(d2); m.x += (dx / d) * 1.4; m.y += (dy / d) * 1.4; }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < motes.length; i++) {
        for (let j = i + 1; j < motes.length; j++) {
          const a = motes[i], b = motes[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < 12000) {
            ctx.globalAlpha = 0.22 * (1 - d2 / 12000);
            ctx.strokeStyle = palette[a.c];
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const m of motes) {
        ctx.globalAlpha = 0.45; ctx.fillStyle = palette[m.c];
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.2832); ctx.fill();
      }

      // sand grains: pushed away by the pointer, pulled back home by a spring
      let moving = false;
      for (const g of grains) {
        const dx = g.x - pointer.x, dy = g.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 6;
          g.vx += (dx / d) * f + (Math.random() - 0.5) * 1.6;
          g.vy += (dy / d) * f + (Math.random() - 0.5) * 1.6;
        }
        g.vx += (g.hx - g.x) * g.k; g.vy += (g.hy - g.y) * g.k;
        g.vx *= 0.86; g.vy *= 0.86;
        g.x += g.vx; g.y += g.vy;
        if (!moving && (Math.abs(g.vx) > 0.02 || Math.abs(g.hx - g.x) > 0.3 || Math.abs(g.hy - g.y) > 0.3)) moving = true;
      }
      ctx.globalAlpha = 1;
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = palette[c];
        for (const g of grains) if (g.c === c) ctx.fillRect(g.x, g.y, g.s, g.s);
      }
      return moving;
    };

    const loop = () => {
      const ambient = !motionOff();
      const moving = step(ambient);
      const keep = visible && !document.hidden && (ambient || moving || performance.now() < wakeUntil);
      frame = keep ? requestAnimationFrame(loop) : null;
    };
    const wake = () => { wakeUntil = performance.now() + 1500; if (!frame && visible && !document.hidden) frame = requestAnimationFrame(loop); };

    const move = e => {
      const r = sandCanvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      wake();
    };
    section.addEventListener("pointermove", move);
    section.addEventListener("pointerdown", move);
    const leave = () => { pointer.x = pointer.y = -9999; wake(); };
    section.addEventListener("pointerleave", leave);
    section.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") leave(); });
    section.addEventListener("pointercancel", leave);

    const start = () => { readPalette(); build(); wake(); };
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(start);

    let resizeTimer = null, lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth === lastWidth && W) return; // ignore mobile address-bar height changes
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(start, 180);
    });
    document.addEventListener("visibilitychange", wake);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; wake(); }).observe(section);
    }
    motionListeners.push(() => { readPalette(); wake(); });
  }

  /* ---- Guide finder (home): scans a demo sequence for NGG PAM sites ---- */
  const guideSeq = $("#guideSeq");
  if (guideSeq) {
    const sequence = guideSeq.dataset.sequence || "";
    const sites = [];
    for (let i = 20; i + 2 < sequence.length; i++) {
      if (sequence[i + 1] === "G" && sequence[i + 2] === "G") sites.push(i);
    }

    const frag = document.createDocumentFragment();
    const end = text => { const s = document.createElement("span"); s.className = "end"; s.textContent = text; s.setAttribute("aria-hidden", "true"); return s; };
    frag.appendChild(end("5′"));
    const nts = sequence.split("").map(ch => {
      const s = document.createElement("span");
      s.className = "nt";
      s.textContent = ch;
      frag.appendChild(s);
      return s;
    });
    frag.appendChild(end("3′"));
    guideSeq.textContent = "";
    guideSeq.appendChild(frag);

    const meta = $("#guideMeta");
    const nextButton = $("#guideNext");
    let index = 0;
    let timer = null;

    function show(n) {
      if (!sites.length) return;
      index = (n + sites.length) % sites.length;
      const pam = sites[index];
      const start = pam - 20;
      nts.forEach((el, i) => {
        el.classList.toggle("sp", i >= start && i < pam);
        el.classList.toggle("pam", i >= pam && i < pam + 3);
      });
      const spacer = sequence.slice(start, pam);
      const gc = Math.round(100 * spacer.split("").filter(c => c === "G" || c === "C").length / 20);
      if (meta) {
        meta.innerHTML =
          `<span>Candidate <b>${index + 1}</b> of <b>${sites.length}</b></span>` +
          `<span>Position <b>${start + 1}–${pam}</b></span>` +
          `<span>PAM <b>${sequence.slice(pam, pam + 3)}</b></span>` +
          `<span>GC <b>${gc}%</b></span>`;
      }
    }

    let manual = false;
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() {
      stop();
      if (manual || motionOff() || sites.length < 2) return;
      timer = setInterval(() => { if (!document.hidden) show(index + 1); }, 2800);
    }

    if (nextButton) nextButton.addEventListener("click", () => { manual = true; stop(); show(index + 1); });
    motionListeners.push(start);
    show(0);
    start();
  }

  /* ---- Project filter (work) ---- */
  const filterButtons = $$("[data-filter]");
  const projects = $$(".project");
  const count = $("#projectCount");

  function filterProjects(name) {
    if (!filterButtons.some(b => b.dataset.filter === name)) name = "all";
    let visible = 0;
    projects.forEach(card => {
      const show = name === "all" || card.dataset.category === name;
      card.hidden = !show;
      if (show) visible += 1;
    });
    filterButtons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.filter === name)));
    if (count) count.textContent = `${visible} ${visible === 1 ? "project" : "projects"}`;
  }
  if (filterButtons.length && projects.length) {
    const filters = $(".filters");
    if (filters) filters.hidden = false;
    filterButtons.forEach(b => b.addEventListener("click", () => {
      filterProjects(b.dataset.filter);
      projects.forEach(card => { if (!card.hidden) card.classList.add("in"); });
    }));
    filterProjects(new URLSearchParams(window.location.search).get("filter") || "all");
  }

  /* ---- Copy buttons (email, citation) ---- */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) {}
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    area.remove();
    return ok;
  }

  $$("[data-copy]").forEach(button => {
    button.hidden = false;
    button.addEventListener("click", async () => {
      const source = button.dataset.copyFrom ? $(button.dataset.copyFrom) : null;
      const text = source ? source.textContent.trim().replace(/\s+/g, " ") : button.dataset.copy;
      const ok = await copyText(text);
      const status = button.dataset.status ? $(button.dataset.status) : null;
      if (status) {
        status.textContent = ok ? (button.dataset.done || "Copied.") : "Couldn’t copy — please select the text and copy it.";
        setTimeout(() => { status.textContent = ""; }, 4000);
      }
    });
  });

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  syncMotion();
})();
