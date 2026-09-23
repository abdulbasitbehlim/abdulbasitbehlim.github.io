

(() => {
  "use strict";
  // Small Helper Functions

  const root = document.documentElement;
  root.classList.add("js");

  // Find the first element that matches a CSS selector.
  function findElement(selector) {
    return document.querySelector(selector);
  }

  // Find all elements that match a CSS selector and return a normal array.
  function findAllElements(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  // Check whether the user's device prefers reduced motion.
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  // Light / Dark Theme

  const themeButton = findElement("#themeToggle");
  const themeColorMeta = document.querySelector(
    'meta[name="theme-color"]'
  );

  function applyTheme(theme, savePreference = false) {
    let nextTheme = "dark";

    if (theme === "light") {
      nextTheme = "light";
    }

    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;

    const isLightTheme = nextTheme === "light";

    if (themeButton) {
      themeButton.setAttribute(
        "aria-pressed",
        String(isLightTheme)
      );

      if (isLightTheme) {
        themeButton.setAttribute(
          "aria-label",
          "Switch to dark mode"
        );
        themeButton.title = "Switch to dark mode";
        findElement("#themeLabel").textContent = "Dark";
        findElement("#themeIcon").textContent = "☾";
      } else {
        themeButton.setAttribute(
          "aria-label",
          "Switch to light mode"
        );
        themeButton.title = "Switch to light mode";
        findElement("#themeLabel").textContent = "Light";
        findElement("#themeIcon").textContent = "☀";
      }
    }

    if (themeColorMeta) {
      if (isLightTheme) {
        themeColorMeta.setAttribute("content", "#f4f7fc");
      } else {
        themeColorMeta.setAttribute("content", "#050812");
      }
    }

    if (savePreference) {
      try {
        localStorage.setItem("abb-theme", nextTheme);
      } catch (error) {
      }
    }
  }

  // Start with the theme already placed on the HTML element.
  let initialTheme = root.dataset.theme || "dark";

  // If a saved preference exists, use it.
  try {
    initialTheme =
      localStorage.getItem("abb-theme") || initialTheme;
  } catch (error) {
  }

  applyTheme(initialTheme);

  if (themeButton) {
    themeButton.addEventListener("click", function () {
      let nextTheme;

      if (root.dataset.theme === "dark") {
        nextTheme = "light";
      } else {
        nextTheme = "dark";
      }

      applyTheme(nextTheme, true);
    });
  }
  // Mobile Navigation Menu

  const menu = findElement("#mainNav");
  const menuButton = findElement("#menuButton");

  function setMenu(openMenu, restoreFocus = false) {
    menu.classList.toggle("open", openMenu);

    menuButton.setAttribute(
      "aria-expanded",
      String(openMenu)
    );

    if (openMenu) {
      findElement("#menuLabel").textContent = "Close";
    } else {
      findElement("#menuLabel").textContent = "Menu";
    }

    if (restoreFocus) {
      menuButton.focus();
    }
  }

  menuButton.addEventListener("click", function () {
    const isCurrentlyOpen =
      menuButton.getAttribute("aria-expanded") === "true";

    setMenu(!isCurrentlyOpen);
  });

  // Close the menu after a navigation link is selected.
  const menuLinks = menu.querySelectorAll("a");

  menuLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  // Escape closes the menu and returns keyboard focus to the button.
  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Escape" &&
      menu.classList.contains("open")
    ) {
      setMenu(false, true);
    }
  });

  // Clicking or tabbing outside the header closes the open menu.
  const outsideEvents = ["click", "focusin"];

  outsideEvents.forEach(function (eventType) {
    document.addEventListener(eventType, function (event) {
      const menuIsOpen = menu.classList.contains("open");
      const eventIsInsideHeader =
        event.target.closest(".site-header");

      if (menuIsOpen && !eventIsInsideHeader) {
        setMenu(false);
      }
    });
  });

  // Reset the menu if the page crosses the mobile breakpoint.
  const mobileMediaQuery =
    window.matchMedia("(max-width:800px)");

  mobileMediaQuery.addEventListener("change", function () {
    setMenu(false);
  });
  // Motion / Animation Control

  let pauseRequested = false;

  try {
    pauseRequested =
      localStorage.getItem("abb-pause-motion") === "true";
  } catch (error) {
    pauseRequested = false;
  }

  const motionButton = findElement("#motionToggle");
  motionButton.hidden = false;

  function syncMotion() {
    const deviceRequestsReducedMotion = reducedMotion.matches;
    const motionIsPaused =
      deviceRequestsReducedMotion || pauseRequested;

    root.classList.toggle(
      "motion-paused",
      motionIsPaused
    );

    motionButton.setAttribute(
      "aria-pressed",
      String(motionIsPaused)
    );

    if (deviceRequestsReducedMotion) {
      findElement("#motionLabel").textContent =
        "Reduced motion";
    } else if (motionIsPaused) {
      findElement("#motionLabel").textContent =
        "Resume motion";
    } else {
      findElement("#motionLabel").textContent =
        "Pause motion";
    }

    motionButton.disabled = deviceRequestsReducedMotion;

    if (deviceRequestsReducedMotion) {
      motionButton.title =
        "Your device has reduced motion enabled.";
    } else {
      motionButton.title = "";
    }

    const motionIcon =
      motionButton.querySelector(".motion-icon");

    if (motionIsPaused) {
      motionIcon.textContent = "▷";
    } else {
      motionIcon.textContent = "Ⅱ";
    }

    if (motionIsPaused) {
      const pendingElements =
        findAllElements(".reveal-pending");

      pendingElements.forEach(function (element) {
        element.classList.remove("reveal-pending");
      });
    }
  }

  motionButton.addEventListener("click", function () {
    pauseRequested = !pauseRequested;

    try {
      localStorage.setItem(
        "abb-pause-motion",
        String(pauseRequested)
      );
    } catch (error) {
    }

    syncMotion();
  });

  reducedMotion.addEventListener("change", syncMotion);

  syncMotion();

  // Pause some visual work while the browser tab is inactive.
  document.addEventListener(
    "visibilitychange",
    function () {
      root.classList.toggle(
        "tab-inactive",
        document.hidden
      );
    }
  );
  // Scroll Reveal Animation

  const observerSupported =
    "IntersectionObserver" in window;

  const motionIsCurrentlyPaused =
    root.classList.contains("motion-paused");

  if (observerSupported && !motionIsCurrentlyPaused) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.remove(
              "reveal-pending"
            );

            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.06
      }
    );

    const revealElements = findAllElements(".reveal");

    revealElements.forEach(function (element) {
      const elementTop =
        element.getBoundingClientRect().top;

      if (elementTop > window.innerHeight) {
        element.classList.add("reveal-pending");
      }

      observer.observe(element);
    });
  }
  // Project Filtering

  const filterButtons =
    findAllElements("[data-filter]");

  const projectCards =
    findAllElements(".project-card");

  findElement(".project-filters").hidden = false;

  function filterProjects(filterName) {
    const filterExists = filterButtons.some(
      function (button) {
        return button.dataset.filter === filterName;
      }
    );

    if (!filterExists) {
      return;
    }

    let visibleProjectCount = 0;

    projectCards.forEach(function (card) {
      const categoryMatches =
        card.dataset.category === filterName;

      const showCard =
        filterName === "all" || categoryMatches;

      card.hidden = !showCard;

      if (showCard) {
        visibleProjectCount =
          visibleProjectCount + 1;

        card.classList.remove("reveal-pending");
      }
    });

    filterButtons.forEach(function (button) {
      const isSelected =
        button.dataset.filter === filterName;

      button.setAttribute(
        "aria-pressed",
        String(isSelected)
      );
    });

    const paddedCount = String(
      visibleProjectCount
    ).padStart(2, "0");

    let projectWord = "PROJECTS";

    if (visibleProjectCount === 1) {
      projectWord = "PROJECT";
    }

    findElement("#projectCount").textContent =
      `${paddedCount} ${projectWord}`;
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      filterProjects(button.dataset.filter);
    });
  });

  const researchFilterLinks =
    findAllElements("[data-research-filter]");

  researchFilterLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      filterProjects(link.dataset.researchFilter);
    });
  });
  // Scroll Progress + Active Navigation

  const header = findElement("#siteHeader");
  const progress = findElement("#scrollProgress");

  const navigationLinks = Array.from(
    menu.querySelectorAll('a[href^="#"]')
  );

  const navigationSections =
    navigationLinks.map(function (link) {
      const sectionSelector =
        link.getAttribute("href");

      return findElement(sectionSelector);
    });

  let scrollUpdateRequested = false;

  function syncScroll() {
    const maximumScroll =
      document.documentElement.scrollHeight -
      window.innerHeight;

    let scrollRatio = 0;

    if (maximumScroll > 0) {
      scrollRatio =
        window.scrollY / maximumScroll;

      scrollRatio = Math.max(
        0,
        Math.min(1, scrollRatio)
      );
    }

    progress.style.transform =
      `scaleX(${scrollRatio})`;

    header.classList.toggle(
      "scrolled",
      window.scrollY > 20
    );

    let currentSectionIndex = -1;

    navigationSections.forEach(
      function (section, index) {
        const sectionTop =
          section.getBoundingClientRect().top;

        if (sectionTop <= 180) {
          currentSectionIndex = index;
        }
      }
    );

    const pageBottomReached =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 3;

    if (pageBottomReached) {
      currentSectionIndex =
        navigationLinks.length - 1;
    }

    navigationLinks.forEach(
      function (link, index) {
        if (index === currentSectionIndex) {
          link.setAttribute(
            "aria-current",
            "location"
          );
        } else {
          link.removeAttribute("aria-current");
        }
      }
    );

    scrollUpdateRequested = false;
  }

  function queueScrollUpdate() {
    if (scrollUpdateRequested) {
      return;
    }

    window.requestAnimationFrame(syncScroll);
    scrollUpdateRequested = true;
  }

  window.addEventListener(
    "scroll",
    queueScrollUpdate,
    {
      passive: true
    }
  );

  window.addEventListener(
    "resize",
    queueScrollUpdate
  );

  const journeyDetails =
    document.querySelector("details");

  journeyDetails.addEventListener(
    "toggle",
    queueScrollUpdate
  );

  if ("ResizeObserver" in window) {
    const resizeObserver =
      new ResizeObserver(queueScrollUpdate);

    resizeObserver.observe(document.body);
  }

  syncScroll();
  // Copy Email Button

  const copyButton = findElement("#copyEmail");
  const email = "abdulbasitbehlim3@gmail.com";

  copyButton.hidden = false;

  copyButton.addEventListener(
    "click",
    async function () {
      let copied = false;

      try {
        if (
          navigator.clipboard &&
          window.isSecureContext
        ) {
          await navigator.clipboard.writeText(email);
          copied = true;
        }
      } catch (error) {
        copied = false;
      }

      if (!copied) {
        const temporaryTextArea =
          document.createElement("textarea");

        temporaryTextArea.value = email;
        temporaryTextArea.setAttribute(
          "readonly",
          ""
        );

        temporaryTextArea.style.cssText =
          "position:fixed;left:-9999px;top:0";

        document.body.appendChild(
          temporaryTextArea
        );

        temporaryTextArea.select();

        try {
          copied =
            document.execCommand("copy");
        } catch (error) {
          copied = false;
        }

        temporaryTextArea.remove();
        copyButton.focus();
      }

      if (copied) {
        findElement("#copyStatus").textContent =
          "Email copied. Let’s start a conversation.";
      } else {
        findElement("#copyStatus").textContent =
          `Select and copy the address above: ${email}`;
      }
    }
  );
  // Footer Year

  const currentYear = new Date().getFullYear();

  findElement("#year").textContent =
    currentYear;
})();
