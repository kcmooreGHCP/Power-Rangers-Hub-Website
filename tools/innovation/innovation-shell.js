(function () {
  "use strict";

  const boundaryLabels = {
    local: "Browser-only · files stay local",
    demo: "Browser-only demo · connect to publish",
    internal: "Internal access may be required",
    connected: "Licensed connection required"
  };

  function setShellHeight(shell) {
    document.documentElement.style.setProperty(
      "--innovation-shell-height",
      `${Math.ceil(shell.getBoundingClientRect().height)}px`
    );
  }

  function markCurrentPage(shell) {
    const current = location.pathname.split("/").pop() || "index.html";
    shell.querySelectorAll("[data-shell-page]").forEach((link) => {
      if (link.getAttribute("href") === current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function buildMenu(shell) {
    const links = shell.querySelector(".innovation-shell__links");
    if (!links || links.closest(".innovation-shell__menu")) return;
    const menu = document.createElement("details");
    menu.className = "innovation-shell__menu";
    const summary = document.createElement("summary");
    summary.textContent = "Explore SET";
    menu.append(summary, links);
    shell.insertBefore(menu, shell.querySelector(".innovation-shell__boundary"));
    links.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => menu.removeAttribute("open"));
    });
    document.addEventListener("click", (event) => {
      if (menu.open && !menu.contains(event.target)) menu.removeAttribute("open");
    });
  }

  function loadExpert() {
    if (!document.querySelector('link[href$="set-expert.css"]')) {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = "set-expert.css";
      document.head.append(stylesheet);
    }
    if (!document.querySelector('script[src$="set-expert.js"]')) {
      const script = document.createElement("script");
      script.src = "set-expert.js";
      script.defer = true;
      document.head.append(script);
    }
  }

  function labelPlaceholderLinks(root) {
    const links = [
      ...(root.matches?.('a[href="#"]') ? [root] : []),
      ...root.querySelectorAll('a[href="#"]')
    ];
    links.forEach((link) => {
      if (link.classList.contains("innovation-skip-link")) return;
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.setAttribute("aria-disabled", "true");
      link.classList.add("innovation-placeholder-link");
      if (!link.querySelector(".innovation-placeholder-label")) {
        const label = document.createElement("small");
        label.className = "innovation-placeholder-label";
        label.textContent = "Future connection";
        link.append(label);
      }
    });
    root.querySelectorAll('a[target="_blank"]').forEach((link) => {
      link.rel = `${link.rel || ""} noopener noreferrer`.trim().split(/\s+/).filter((value, index, all) => all.indexOf(value) === index).join(" ");
    });
  }

  function associateLabels() {
    document.querySelectorAll("label:not([for])").forEach((label, index) => {
      const control = label.querySelector("input, select, textarea") ||
        (label.nextElementSibling?.matches("input, select, textarea") ? label.nextElementSibling : null);
      if (!control) return;
      if (!control.id) control.id = `innovation-field-${index + 1}`;
      label.htmlFor = control.id;
    });
  }

  function init() {
    const shell = document.querySelector("[data-innovation-shell]");
    if (!shell) return;

    buildMenu(shell);
    markCurrentPage(shell);
    setShellHeight(shell);
    const boundary = shell.querySelector("[data-shell-boundary]");
    const boundaryKey = document.body.dataset.boundary || "internal";
    if (boundary) boundary.textContent = boundaryLabels[boundaryKey] || boundaryKey;

    const main = document.querySelector("main") ||
      [...document.body.children].find((node) => !node.matches?.(".innovation-shell, .innovation-skip-link"));
    if (main && !main.id) main.id = "innovation-content";

    associateLabels();
    labelPlaceholderLinks(document);

    new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) labelPlaceholderLinks(node);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });

    if ("ResizeObserver" in window) {
      new ResizeObserver(() => setShellHeight(shell)).observe(shell);
    } else {
      window.addEventListener("resize", () => setShellHeight(shell), { passive: true });
    }
    loadExpert();
  }

  window.innovationCopyText = async function (text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
