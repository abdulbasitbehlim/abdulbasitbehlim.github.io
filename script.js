(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Theme
  const themeButton = $("#themeToggle");
  const themeIcon = $("#themeIcon");
  const themeColorMeta = $('meta[name="theme-color"]');

  function applyTheme(theme, savePreference = false) {
    const nextTheme = theme === "light" ? "light" : "dark";
    const isLight = nextTheme === "light";
    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;

    if (themeButton) {
      themeButton.setAttribute("aria-pressed", String(isLight));
      themeButton.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
      themeButton.title = isLight ? "Switch to dark mode" : "Switch to light mode";
    }
    if (themeIcon) themeIcon.textContent = isLight ? "☾" : "☀";
    if (themeColorMeta) themeColorMeta.setAttribute("content", isLight ? "#f4f7fc" : "#050812");

    if (savePreference) {
      try { localStorage.setItem("abb-theme", nextTheme); } catch (error) {}
    }
  }

  let initialTheme = root.dataset.theme || "dark";
  try { initialTheme = localStorage.getItem("abb-theme") || initialTheme; } catch (error) {}
  applyTheme(initialTheme);

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
  }

  // Mobile navigation
  const menu = $("#mainNav");
  const menuButton = $("#menuButton");
  const menuLabel = $("#menuLabel");

  function setMenu(openMenu, restoreFocus = false) {
    if (!menu || !menuButton) return;
    menu.classList.toggle("open", openMenu);
    menuButton.setAttribute("aria-expanded", String(openMenu));
    if (menuLabel) menuLabel.textContent = openMenu ? "Close" : "Menu";
    if (restoreFocus) menuButton.focus();
  }

  if (menu && menuButton) {
    menuButton.addEventListener("click", () => {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });

    $$("a", menu).forEach(link => link.addEventListener("click", () => setMenu(false)));

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && menu.classList.contains("open")) setMenu(false, true);
    });

    ["click", "focusin"].forEach(eventType => {
      document.addEventListener(eventType, event => {
        if (menu.classList.contains("open") && !event.target.closest(".site-header")) setMenu(false);
      });
    });

    window.matchMedia("(max-width:800px)").addEventListener("change", () => setMenu(false));
  }

  // Motion control (home page)
  const motionButton = $("#motionToggle");
  const motionLabel = $("#motionLabel");
  let pauseRequested = false;
  try { pauseRequested = localStorage.getItem("abb-pause-motion") === "true"; } catch (error) {}

  function syncMotion() {
    const paused = reducedMotion.matches || pauseRequested;
    root.classList.toggle("motion-paused", paused);

    if (!motionButton) return;
    motionButton.hidden = false;
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.disabled = reducedMotion.matches;
    motionButton.title = reducedMotion.matches ? "Your device has reduced motion enabled." : "";

    if (motionLabel) {
      motionLabel.textContent = reducedMotion.matches ? "Reduced motion" : paused ? "Resume motion" : "Pause motion";
    }

    const icon = $(".motion-icon", motionButton);
    if (icon) icon.textContent = paused ? "▷" : "Ⅱ";

    if (paused) $$(".reveal-pending").forEach(element => element.classList.remove("reveal-pending"));
  }

  if (motionButton) {
    motionButton.addEventListener("click", () => {
      pauseRequested = !pauseRequested;
      try { localStorage.setItem("abb-pause-motion", String(pauseRequested)); } catch (error) {}
      syncMotion();
    });
  }

  reducedMotion.addEventListener("change", syncMotion);
  syncMotion();

  document.addEventListener("visibilitychange", () => {
    root.classList.toggle("tab-inactive", document.hidden);
  });

  // Reveal animation
  if ("IntersectionObserver" in window && !root.classList.contains("motion-paused")) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-pending");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });

    $$(".reveal").forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight) element.classList.add("reveal-pending");
      observer.observe(element);
    });
  }

  // Project filtering (Work page)
  const filterButtons = $$("[data-filter]");
  const projectCards = $$(".project-card");
  const projectFilters = $(".project-filters");
  const projectCount = $("#projectCount");

  function filterProjects(filterName) {
    if (!filterButtons.length || !projectCards.length) return;
    if (!filterButtons.some(button => button.dataset.filter === filterName)) return;

    let visible = 0;
    projectCards.forEach(card => {
      const show = filterName === "all" || card.dataset.category === filterName;
      card.hidden = !show;
      if (show) {
        visible += 1;
        card.classList.remove("reveal-pending");
      }
    });

    filterButtons.forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === filterName));
    });

    if (projectCount) {
      projectCount.textContent = `${String(visible).padStart(2, "0")} ${visible === 1 ? "PROJECT" : "PROJECTS"}`;
    }
  }

  if (projectFilters && filterButtons.length && projectCards.length) {
    projectFilters.hidden = false;
    filterButtons.forEach(button => button.addEventListener("click", () => filterProjects(button.dataset.filter)));
    const requestedFilter = new URLSearchParams(window.location.search).get("filter");
    filterProjects(requestedFilter || "all");
  }

  // Scroll progress and sticky-header state
  const header = $("#siteHeader");
  const progress = $("#scrollProgress");
  let scrollUpdateRequested = false;

  function syncScroll() {
    const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maximumScroll > 0 ? Math.max(0, Math.min(1, window.scrollY / maximumScroll)) : 0;
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    if (header) header.classList.toggle("scrolled", window.scrollY > 20);
    scrollUpdateRequested = false;
  }

  function queueScrollUpdate() {
    if (scrollUpdateRequested) return;
    window.requestAnimationFrame(syncScroll);
    scrollUpdateRequested = true;
  }

  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  window.addEventListener("resize", queueScrollUpdate);
  $$("details").forEach(detail => detail.addEventListener("toggle", queueScrollUpdate));

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(queueScrollUpdate);
    resizeObserver.observe(document.body);
  }
  syncScroll();

  // Copy email (Contact page)
  const copyButton = $("#copyEmail");
  const copyStatus = $("#copyStatus");
  const email = "abdulbasitbehlim3@gmail.com";

  if (copyButton) {
    copyButton.hidden = false;
    copyButton.addEventListener("click", async () => {
      let copied = false;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
          copied = true;
        }
      } catch (error) {
        copied = false;
      }

      if (!copied) {
        const temporaryTextArea = document.createElement("textarea");
        temporaryTextArea.value = email;
        temporaryTextArea.setAttribute("readonly", "");
        temporaryTextArea.style.cssText = "position:fixed;left:-9999px;top:0";
        document.body.appendChild(temporaryTextArea);
        temporaryTextArea.select();
        try { copied = document.execCommand("copy"); } catch (error) { copied = false; }
        temporaryTextArea.remove();
        copyButton.focus();
      }

      if (copyStatus) {
        copyStatus.textContent = copied
          ? "Email copied. Let’s start a conversation."
          : `Select and copy the address above: ${email}`;
      }
    });
  }

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();