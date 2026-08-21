(function () {
  "use strict";

  var STORAGE_KEY = "setLoopLeadershipDemo.sharePointLinks.v1";
  var ROLE_KEY = "setLoopLeadershipDemo.role.v1";
  var TOTAL_SECONDS = 330;

  var chapters = [
    {
      title: "One Front Door",
      duration: 30,
      narration:
        "SET Loop begins with a clean promise: one front door, exact store, exact work. A person enters once, resumes the current workspace, and reaches the right task without hunting through disconnected folders. The experience keeps a hard line between what is working locally, what is being demonstrated, and what is designed next. It does not replace source authority. It makes that authority usable and visible."
    },
    {
      title: "Field Connector + Role Views",
      duration: 45,
      narration:
        "The Store Operations Field Connector turns enterprise direction into a usable week for the selected store, district, region, or Home Office partner. The same governed work is shown at the right altitude: the store sees approved actions and proof; DM and RM leaders see readiness, blockers, and focused support; Home Office sees scope, ownership, and unresolved exceptions. This is a SharePoint demonstration, not a claim that permissions, publishing, or live feeds are complete. The point is to evaluate one source supporting different views without rebuilding the work."
    },
    {
      title: "SET Operations Studio",
      duration: 35,
      narration:
        "SET Operations Studio holds the shared context behind those views. The user chooses the store and floorset once, then calendar, source status, and workload signals move together. Found, matched, and approved remain different states, so missing authority cannot be mistaken for complete direction. The workload view stages an accountable conversation; it does not approve labor or move people. That decision stays with the responsible owners."
    },
    {
      title: "Beauty Studio",
      duration: 30,
      narration:
        "Beauty Studio applies the pattern to Beauty's faster, more specialized cadence. One prepared launch connects the selected store, fixture or movement direction, timing, assets, and support. The store receives one understandable execution story while Beauty and Store Operations retain ownership and exception visibility underneath. This is a focused working pilot, not a claim of fleet readiness."
    },
    {
      title: "SET IRL",
      duration: 35,
      narration:
        "SET IRL closes the gap between planned work and physical execution. The store captures proof, timing, questions, and practical context at the point of work. That evidence can support coaching, follow-up, future workload planning, and the next launch. The interaction shown here is designed next: enterprise capture, retention, routing, and analytics are not represented as live. AI can help organize the evidence. People still review and decide."
    },
    {
      title: "Floorset Factory",
      duration: 70,
      narration:
        "Floorset Factory moves the hardest Brand Guide work into a visual workflow. The team chooses the approved space plan or line map, keeps asset folders and simple filenames intact, and positions real fixture assemblies on the floor. A round table remains a table with its bunks. A Parsons remains its complete assembly. Images attach to the visible fixture with simple names such as Cabinet 1 or Surface 2, while Blue Yonder identifiers, grouping, lineage, and metadata stay underneath. The path is short: set up, map assets, prepare the Brand Guide, then review. The same visual decision is reused downstream instead of being re-entered page by page in InDesign. Source calibration and final approvals remain accountable owner decisions."
    },
    {
      title: "Brand Guide / Release Gate",
      duration: 50,
      narration:
        "Mapping only matters if the work carries forward. The result is a populated store-facing execution page, not a blank shell. The mapped image, fixture name, placement context, and approved direction move into the Brand Guide package. Before release, the Factory reconciles what was expected, registered, placed, current, and approved. Green is earned by evidence, not a filename. Missing or conflicting work stays in the Home Office exception layer and out of the store-facing guide. Stores see released direction; administrators retain lineage, evidence, exceptions, and approval history."
    },
    {
      title: "Enterprise Loop",
      duration: 35,
      narration:
        "The enterprise value is the loop: plan, map, build, execute, prove, learn, then improve the next launch. SET Loop does not claim every enterprise connection exists today. It provides working local proof, a clear SharePoint demonstration, and a governed next operating model. The decision is specific: authorize one owner-approved Beauty floorset in one approved test store, measured on time, clarity, exceptions, and rework."
    }
  ];

  var roleConfig = {
    store: {
      name: "Store",
      context: "Store view",
      headline: "My store. My week. Clear priorities."
    },
    field: {
      name: "DM–RM",
      context: "District / region view",
      headline: "Readiness, exceptions, and focused support."
    },
    home: {
      name: "Home Office",
      context: "Home Office view",
      headline: "Build once. Govern clearly. Learn continuously."
    }
  };

  var state = {
    chapter: 0,
    role: "store",
    presenter: false,
    chapterElapsed: 0,
    frame: 0,
    lastFrame: 0,
    links: {
      store: "",
      field: "",
      home: ""
    }
  };

  var elements = {};
  var toastTimer = 0;

  function queryElements() {
    elements.reveal = document.querySelector("[data-reveal]");
    elements.enterTour = document.querySelector("[data-enter-tour]");
    elements.enterPresenter = document.querySelector("[data-enter-presenter]");
    elements.stage = document.querySelector("#tour");
    elements.chapterSections = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));
    elements.chapterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-go]"));
    elements.previous = document.querySelector("[data-previous]");
    elements.next = document.querySelector("[data-next]");
    elements.presenterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-presenter]"));
    elements.presenterLabels = Array.prototype.slice.call(document.querySelectorAll("[data-presenter-label]"));
    elements.roleButtons = Array.prototype.slice.call(document.querySelectorAll("[data-role]"));
    elements.rolePanels = Array.prototype.slice.call(document.querySelectorAll("[data-role-panel]"));
    elements.rolePanelLinks = Array.prototype.slice.call(document.querySelectorAll("[data-role-panel-link]"));
    elements.roleContext = document.querySelector("[data-role-context-label]");
    elements.roleHeadline = document.querySelector("[data-role-headline]");
    elements.roleLinkButton = document.querySelector("[data-open-role-link]");
    elements.roleLinkLabel = document.querySelector("[data-role-link-label]");
    elements.linksModal = document.querySelector("[data-links-modal]");
    elements.linksForm = document.querySelector("[data-links-form]");
    elements.linksOpen = Array.prototype.slice.call(document.querySelectorAll("[data-links-open]"));
    elements.linksClose = document.querySelector("[data-links-close]");
    elements.clearLinks = document.querySelector("[data-clear-links]");
    elements.linksError = document.querySelector("[data-links-error]");
    elements.copyNarration = Array.prototype.slice.call(document.querySelectorAll("[data-copy-narration]"));
    elements.currentNumber = document.querySelector("[data-current-number]");
    elements.currentTitle = document.querySelector("[data-current-title]");
    elements.currentTime = document.querySelector("[data-current-time]");
    elements.footerProgress = document.querySelector("[data-footer-progress]");
    elements.railProgress = document.querySelector("[data-rail-progress]");
    elements.toast = document.querySelector("[data-toast]");
  }

  function safeReadStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeWriteStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function safeRemoveStorage(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      return;
    }
  }

  function loadSavedState() {
    var savedRole = safeReadStorage(ROLE_KEY);
    var savedLinks = safeReadStorage(STORAGE_KEY);

    if (savedRole && roleConfig[savedRole]) {
      state.role = savedRole;
    }

    if (savedLinks) {
      try {
        var parsed = JSON.parse(savedLinks);
        ["store", "field", "home"].forEach(function (role) {
          if (typeof parsed[role] === "string") {
            state.links[role] = parsed[role];
          }
        });
      } catch (error) {
        state.links = { store: "", field: "", home: "" };
      }
    }
  }

  function chapterStartTime(index) {
    return chapters.slice(0, index).reduce(function (total, chapter) {
      return total + chapter.duration;
    }, 0);
  }

  function formatTime(seconds) {
    var bounded = Math.max(0, Math.min(TOTAL_SECONDS, Math.floor(seconds)));
    var minutes = Math.floor(bounded / 60);
    var remainder = bounded % 60;
    return String(minutes).padStart(2, "0") + ":" + String(remainder).padStart(2, "0");
  }

  function totalElapsed() {
    return Math.min(TOTAL_SECONDS, chapterStartTime(state.chapter) + state.chapterElapsed);
  }

  function updateProgress() {
    var elapsed = totalElapsed();
    var percentage = (elapsed / TOTAL_SECONDS) * 100;
    elements.currentTime.textContent = formatTime(elapsed);
    elements.footerProgress.style.width = percentage + "%";
    elements.railProgress.style.height = percentage + "%";
  }

  function setChapter(index, options) {
    var settings = options || {};
    var nextIndex = Math.max(0, Math.min(chapters.length - 1, index));

    if (nextIndex === state.chapter && !settings.force) {
      if (settings.resetTime) {
        state.chapterElapsed = 0;
        updateProgress();
      }
      return;
    }

    elements.chapterSections.forEach(function (section, sectionIndex) {
      var active = sectionIndex === nextIndex;
      section.classList.toggle("is-active", active);
      section.hidden = !active;
      section.setAttribute("aria-hidden", active ? "false" : "true");
    });

    elements.chapterButtons.forEach(function (button, buttonIndex) {
      if (buttonIndex === nextIndex) {
        button.setAttribute("aria-current", "step");
        button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      } else {
        button.removeAttribute("aria-current");
      }
    });

    state.chapter = nextIndex;
    state.chapterElapsed = settings.preserveTime ? state.chapterElapsed : 0;

    elements.currentNumber.textContent = String(nextIndex + 1).padStart(2, "0");
    elements.currentTitle.textContent = chapters[nextIndex].title;
    elements.previous.disabled = nextIndex === 0;
    elements.next.innerHTML =
      nextIndex === chapters.length - 1
        ? 'Restart tour <span aria-hidden="true">↻</span>'
        : 'Next chapter <span aria-hidden="true">→</span>';

    updateProgress();

    if (settings.focus) {
      elements.stage.focus({ preventScroll: true });
    }
  }

  function nextChapter() {
    if (state.chapter === chapters.length - 1) {
      setPresenter(false);
      setChapter(0, { resetTime: true, focus: true });
      return;
    }
    setChapter(state.chapter + 1, { resetTime: true, focus: true });
  }

  function previousChapter() {
    if (state.chapter > 0) {
      setChapter(state.chapter - 1, { resetTime: true, focus: true });
    }
  }

  function presenterTick(timestamp) {
    if (!state.presenter) {
      return;
    }

    if (!state.lastFrame) {
      state.lastFrame = timestamp;
    }

    var delta = Math.min(0.25, (timestamp - state.lastFrame) / 1000);
    state.lastFrame = timestamp;
    state.chapterElapsed += delta;

    if (state.chapterElapsed >= chapters[state.chapter].duration) {
      if (state.chapter === chapters.length - 1) {
        state.chapterElapsed = chapters[state.chapter].duration;
        updateProgress();
        setPresenter(false);
        showToast("The 5:30 leadership story is complete.");
        return;
      }
      setChapter(state.chapter + 1, { resetTime: true, focus: false });
    }

    updateProgress();
    state.frame = window.requestAnimationFrame(presenterTick);
  }

  function setPresenter(enabled) {
    state.presenter = Boolean(enabled);
    state.lastFrame = 0;

    elements.presenterButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", state.presenter ? "true" : "false");
    });
    elements.presenterLabels.forEach(function (label) {
      label.textContent = state.presenter ? "Pause" : "Auto-play";
    });

    if (state.presenter) {
      window.cancelAnimationFrame(state.frame);
      state.frame = window.requestAnimationFrame(presenterTick);
    } else {
      window.cancelAnimationFrame(state.frame);
    }
  }

  function enterTour(presenter) {
    elements.reveal.classList.add("is-closed");
    elements.reveal.setAttribute("aria-hidden", "true");
    document.body.classList.add("tour-entered");
    elements.stage.focus({ preventScroll: true });
    if (presenter) {
      setPresenter(true);
    }
  }

  function setRole(role) {
    if (!roleConfig[role]) {
      return;
    }

    state.role = role;
    safeWriteStorage(ROLE_KEY, role);

    elements.roleButtons.forEach(function (button) {
      var selected = button.getAttribute("data-role") === role;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    elements.rolePanels.forEach(function (panel, index) {
      var selected = panel.getAttribute("data-role-panel") === role;
      panel.classList.toggle("is-selected", selected);
      panel.style.order = selected ? "0" : String(index + 1);
    });

    elements.roleContext.textContent = roleConfig[role].context;
    elements.roleHeadline.textContent = roleConfig[role].headline;
    refreshLinkButtons();
  }

  function isValidUrl(value) {
    if (!value) {
      return true;
    }
    try {
      var parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch (error) {
      return false;
    }
  }

  function linkInput(role) {
    return elements.linksForm.querySelector('[name="' + role + '"]');
  }

  function openLinksModal(preferredRole) {
    ["store", "field", "home"].forEach(function (role) {
      linkInput(role).value = state.links[role] || "";
    });
    elements.linksError.textContent = "";

    if (typeof elements.linksModal.showModal === "function") {
      if (!elements.linksModal.open) {
        elements.linksModal.showModal();
      }
    } else {
      elements.linksModal.setAttribute("open", "");
    }

    window.setTimeout(function () {
      var input = linkInput(preferredRole || state.role);
      if (input) {
        input.focus();
      }
    }, 30);
  }

  function closeLinksModal() {
    if (typeof elements.linksModal.close === "function") {
      elements.linksModal.close();
    } else {
      elements.linksModal.removeAttribute("open");
    }
  }

  function saveLinks(event) {
    event.preventDefault();
    var nextLinks = {
      store: linkInput("store").value.trim(),
      field: linkInput("field").value.trim(),
      home: linkInput("home").value.trim()
    };

    var invalidRole = ["store", "field", "home"].find(function (role) {
      return !isValidUrl(nextLinks[role]);
    });

    if (invalidRole) {
      elements.linksError.textContent =
        "Enter a complete http or https URL for " + roleConfig[invalidRole].name + ", or leave it blank.";
      linkInput(invalidRole).focus();
      return;
    }

    state.links = nextLinks;
    var saved = safeWriteStorage(STORAGE_KEY, JSON.stringify(state.links));
    refreshLinkButtons();
    closeLinksModal();
    showToast(saved ? "Demo links saved in this browser." : "Links are available for this session; browser storage is unavailable.");
  }

  function clearLinks() {
    state.links = { store: "", field: "", home: "" };
    ["store", "field", "home"].forEach(function (role) {
      linkInput(role).value = "";
    });
    safeRemoveStorage(STORAGE_KEY);
    refreshLinkButtons();
    elements.linksError.textContent = "";
    showToast("Saved demo links cleared.");
  }

  function openRoleLink(role) {
    var requestedRole = role || state.role;
    var url = state.links[requestedRole];

    if (!url) {
      openLinksModal(requestedRole);
      return;
    }

    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    showToast("Opening the " + roleConfig[requestedRole].name + " demonstration.");
  }

  function refreshLinkButtons() {
    var currentName = roleConfig[state.role].name;
    var currentHasLink = Boolean(state.links[state.role]);

    elements.roleLinkLabel.textContent =
      (currentHasLink ? "Open " : "Add ") + currentName + " demo link";

    elements.rolePanelLinks.forEach(function (button) {
      var role = button.getAttribute("data-role-panel-link");
      button.textContent = state.links[role] ? "Open demo" : "Add link";
      button.setAttribute(
        "aria-label",
        (state.links[role] ? "Open " : "Add ") + roleConfig[role].name + " SharePoint demo link"
      );
    });
  }

  function narrationText() {
    var elapsed = 0;
    var lines = [
      "SET LOOP — 5:30 LEADERSHIP GUIDED TOUR",
      "Working proof, SharePoint demonstration, and designed next state",
      ""
    ];

    chapters.forEach(function (chapter, index) {
      var start = elapsed;
      elapsed += chapter.duration;
      lines.push(
        String(index + 1).padStart(2, "0") +
          "  " +
          chapter.title.toUpperCase() +
          "  [" +
          formatTime(start) +
          "–" +
          formatTime(elapsed) +
          "]"
      );
      lines.push(chapter.narration);
      lines.push("");
    });

    lines.push(
      "STATUS LANGUAGE",
      "WORKING LOCAL — demonstrated in the offline SET Resource Center.",
      "SHAREPOINT DEMO — a leadership demonstration; not a claim of live enterprise integration.",
      "DESIGNED NEXT — a defined future interaction that requires owners, access, governance, and validation."
    );

    return lines.join("\n");
  }

  function fallbackCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    var copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    document.body.removeChild(textarea);
    return copied;
  }

  function copyNarration() {
    var text = narrationText();

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          showToast("The complete 5:30 narration is copied.");
        })
        .catch(function () {
          showToast(fallbackCopy(text) ? "The complete 5:30 narration is copied." : "Copy was blocked by the browser.");
        });
      return;
    }

    showToast(fallbackCopy(text) ? "The complete 5:30 narration is copied." : "Copy was blocked by the browser.");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(function () {
      elements.toast.classList.remove("is-visible");
    }, 2800);
  }

  function isTypingTarget(target) {
    return Boolean(
      target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
    );
  }

  function isInteractiveTarget(target) {
    return Boolean(
      target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "SUMMARY" ||
          target.getAttribute("role") === "button")
    );
  }

  function bindEvents() {
    elements.enterTour.addEventListener("click", function () {
      enterTour(false);
    });
    elements.enterPresenter.addEventListener("click", function () {
      enterTour(true);
    });

    elements.chapterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setChapter(Number(button.getAttribute("data-go")), { resetTime: true, focus: true });
      });
    });

    elements.previous.addEventListener("click", previousChapter);
    elements.next.addEventListener("click", nextChapter);

    elements.presenterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setPresenter(!state.presenter);
      });
    });

    elements.roleButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setRole(button.getAttribute("data-role"));
      });
    });

    elements.linksOpen.forEach(function (button) {
      button.addEventListener("click", function () {
        openLinksModal(state.role);
      });
    });
    elements.linksClose.addEventListener("click", closeLinksModal);
    elements.linksForm.addEventListener("submit", saveLinks);
    elements.clearLinks.addEventListener("click", clearLinks);

    elements.roleLinkButton.addEventListener("click", function () {
      openRoleLink(state.role);
    });

    elements.rolePanelLinks.forEach(function (button) {
      button.addEventListener("click", function () {
        openRoleLink(button.getAttribute("data-role-panel-link"));
      });
    });

    elements.copyNarration.forEach(function (button) {
      button.addEventListener("click", copyNarration);
    });

    document.addEventListener("keydown", function (event) {
      var revealOpen = !elements.reveal.classList.contains("is-closed");

      if (revealOpen) {
        if (event.key === "Tab") {
          var revealActions = [elements.enterTour, elements.enterPresenter];
          var currentIndex = revealActions.indexOf(document.activeElement);
          var nextIndex = event.shiftKey
            ? (currentIndex <= 0 ? revealActions.length - 1 : currentIndex - 1)
            : (currentIndex + 1) % revealActions.length;
          event.preventDefault();
          revealActions[nextIndex].focus();
        } else if (event.key === "Escape") {
          event.preventDefault();
          enterTour(false);
        }
        return;
      }

      if (isTypingTarget(event.target) || elements.linksModal.open) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        nextChapter();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        previousChapter();
      } else if (event.key === " " && !isInteractiveTarget(event.target)) {
        event.preventDefault();
        setPresenter(!state.presenter);
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && state.presenter) {
        setPresenter(false);
        showToast("Auto-play paused when the tab left view.");
      }
    });
  }

  function init() {
    queryElements();
    loadSavedState();
    bindEvents();
    setRole(state.role);
    setChapter(0, { force: true, resetTime: true });
    elements.enterTour.focus({ preventScroll: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
