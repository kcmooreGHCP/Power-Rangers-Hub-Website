(function () {
  "use strict";

  var data = window.SET_RESOURCE_INDEX || {};
  var body = document.body;
  var lastFocus = null;
  var actionLastFocus = null;
  var presentationLastFocus = null;
  var activeModal = null;
  var slideIndex = 0;
  var activeStoreId = String((data.activeStore && data.activeStore.id) || "");

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setText(selector, value) {
    var element = $(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function setTextAll(selector, value) {
    $$(selector).forEach(function (element) {
      element.textContent = value;
    });
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeStoreId(value) {
    var match = String(value == null ? "" : value).match(/\d{3,5}/);
    if (!match) {
      return "";
    }
    return match[0].length <= 4 ? match[0].padStart(4, "0") : match[0];
  }

  function cleanStoreName(store) {
    var id = normalizeStoreId(store && store.id);
    var name = displayValue((store && (store.name || store.label)) || "Indexed store folder");
    if (id) {
      name = name.replace(
        new RegExp("^\\s*(?:store\\s*)?0*" + id + "(?:\\s*[-—/:]\\s*|\\s+)", "i"),
        ""
      );
    }
    return name || "Indexed store folder";
  }

  function activeStoreRecord() {
    var stores = safeArray(data.stores);
    var normalized = normalizeStoreId(activeStoreId);
    var match = stores.filter(function (store) {
      return normalizeStoreId(store.id) === normalized;
    })[0];
    if (match) {
      return match;
    }
    if (stores.some(function (store) { return normalizeStoreId(store.id) === "1392"; })) {
      return stores.filter(function (store) { return normalizeStoreId(store.id) === "1392"; })[0];
    }
    return stores[0] || { id: "", name: "Choose an indexed store" };
  }

  function latestMapForStore(store) {
    var id = normalizeStoreId(store && store.id);
    var maps = safeArray(data.latestMaps);
    var relevant = safeArray(data.relevantFiles || data.recentFiles);
    var direct;
    if (store && store.latestMap) {
      return store.latestMap;
    }
    if (data.latestMaps && !Array.isArray(data.latestMaps) && data.latestMaps[id]) {
      return data.latestMaps[id];
    }
    direct = maps.filter(function (map) {
      return normalizeStoreId(map.storeId || map.store) === id;
    })[0];
    if (direct) {
      return direct;
    }
    if (data.latestMap && normalizeStoreId(data.latestMap.storeId || data.latestMap.store) === id) {
      return data.latestMap;
    }
    return relevant.filter(function (item) {
      var kind = String(item.kind || item.sourceRole || "").toLowerCase();
      var path = displayValue(item.path || "");
      return normalizeStoreId(item.storeId || item.store) === id &&
        (/map/.test(kind) || (/working/i.test(path) && /\.(?:indd|pdf)$/i.test(path)));
    }).sort(function (left, right) {
      return (Number(right.modified) || 0) - (Number(left.modified) || 0);
    })[0] || null;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function displayValue(value) {
    var text = String(value == null ? "" : value);
    if (!/%[0-9A-Fa-f]{2}/.test(text)) {
      return text;
    }
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  }

  function formatDate(value) {
    if (!value) {
      return "Run REFRESH_SET_RESOURCE_CENTER.command to update";
    }
    var date = new Date(value);
    if (isNaN(date.getTime())) {
      return String(value);
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }

  function fileName(path) {
    var parts = displayValue(path).split("/");
    return parts[parts.length - 1] || path;
  }

  function titleFromFile(path) {
    return fileName(path)
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function initializeSnapshot() {
    var stores = safeArray(data.stores);
    var videos = safeArray(data.videos);
    var commands = safeArray(data.commands);
    var navigation = data.navigation || {};
    var evidence = data.evidence || {};
    var activeStore = activeStoreRecord() || {
      id: "",
      name: "Choose an indexed store"
    };
    activeStoreId = normalizeStoreId(activeStore.id);
    var latestMap = latestMapForStore(activeStore);

    setText("[data-workspace-label]", displayValue(data.workspaceName || "SET_8.19"));
    setText("[data-active-store]", normalizeStoreId(activeStore.id) || "—");
    setTextAll("[data-active-store-inline]", normalizeStoreId(activeStore.id) || "—");
    setText("[data-active-store-name]", cleanStoreName(activeStore));
    setText("[data-store-count]", String(stores.length));
    setText("[data-video-count]", String(videos.length));
    setText("[data-command-count]", String(commands.length));
    setText("[data-last-refresh]", formatDate(data.lastRefresh));
    setText("[data-evidence-source-decks]", String(evidence.sourceDecks || 59));
    setText("[data-evidence-total-videos]", String(evidence.totalVideos || 38));
    setText("[data-evidence-hero-videos]", String(evidence.heroVideos || 13));
    setText("[data-evidence-team-teasers]", String(evidence.teamTeasers || 10));
    setText(
      "[data-evidence-basis]",
      evidence.basis === "RECOVERED_INVENTORIES_2026_07_24"
        ? "Recovered inventories dated July 24, 2026"
        : displayValue(evidence.basis || "Recovered inventories dated July 24, 2026")
    );
    var floorsetInput = $("[data-prompt-form] [name='floorset']");
    if (floorsetInput && data.floorsetDate) {
      floorsetInput.value = displayValue(data.floorsetDate);
    }

    var mapLink = $("[data-action-link='map']");
    if (
      mapLink &&
      activeStore.id &&
      latestMap &&
      (latestMap.href || latestMap.folderHref)
    ) {
      var mapIsDirect = Boolean(latestMap.href);
      mapLink.href = latestMap.href || latestMap.folderHref;
      mapLink.removeAttribute("aria-disabled");
      mapLink.removeAttribute("tabindex");
      mapLink.firstChild.nodeValue =
        (mapIsDirect ? "Open " : "Browse for ") +
        fileName(latestMap.name || latestMap.path || latestMap.href) +
        " ";
    } else if (mapLink) {
      mapLink.removeAttribute("href");
      mapLink.setAttribute("aria-disabled", "true");
      mapLink.setAttribute("tabindex", "-1");
    }

    var auditLink = $("[data-action-link='audit']");
    if (auditLink && data.packageAudit && data.packageAudit.href) {
      auditLink.href = data.packageAudit.href;
      auditLink.removeAttribute("aria-disabled");
      auditLink.removeAttribute("tabindex");
    }

    setText(
      "[data-workspace-state]",
      navigation.ready ? "Links ready" : "Index needs refresh"
    );
    setText(
      "[data-navigation-state]",
      navigation.ready ? "Normal local links ready" : "Local index needs refresh"
    );
    setText(
      "[data-navigation-health]",
      navigation.message ||
        "Browser-safe files and folders use normal relative links. Commands and native authoring files remain Finder-only."
    );
  }

  function renderVideoCards() {
    var container = $("[data-video-cards]");
    if (!container) {
      return;
    }
    var videos = safeArray(data.videos).slice(0, 4);
    var placeholders = [
      {
        category: "Store team teaser",
        title: "Your store. Your floorset.",
        description: "60-second reveal: map → fixture → action.",
        folder: "01_STORE_TEAM_TEASERS"
      },
      {
        category: "Store walkthrough",
        title: "Open the complete guide",
        description: "Room-by-room execution and source guidance.",
        folder: "02_STORE_WALKTHROUGHS"
      },
      {
        category: "Leadership proof",
        title: "From files to store intelligence",
        description: "90-second working-proof narrative.",
        folder: "03_LEADERSHIP_DEMOS"
      },
      {
        category: "Training",
        title: "Run the local session workflow",
        description: "Start, pause, and record a handoff without editing native work.",
        folder: "04_TRAINING"
      }
    ];

    var cards = videos.length ? videos : placeholders;
    container.innerHTML = cards.map(function (video) {
      var isLive = Boolean(video.href);
      var tag = escapeHtml(displayValue(video.category || "Video"));
      var title = escapeHtml(titleFromFile(video.title || video.path));
      var description = escapeHtml(displayValue(video.description || "Local Clipchamp export"));
      var content =
        "<span>" + tag + "</span>" +
        "<h4>" + title + "</h4>" +
        "<p>" + description + "</p>" +
        "<b>" + (isLive ? "Play local video →" : "Drop MP4 in " + escapeHtml(video.folder || "04_VIDEOS")) + "</b>";
      if (isLive) {
        return '<a class="video-card" href="' + escapeHtml(video.href) + '">' + content + "</a>";
      }
      return '<article class="video-card is-placeholder">' + content + "</article>";
    }).join("");
  }

  function renderVideoLibrary() {
    var container = $("[data-video-library]");
    if (!container) {
      return;
    }
    var videos = safeArray(data.videos);
    if (!videos.length) {
      container.innerHTML =
        "<article><strong>No exports indexed yet</strong>" +
        "<p>Place MP4, MOV, M4V, or WEBM files inside 04_VIDEOS, then run REFRESH_SET_RESOURCE_CENTER.command from Finder.</p>" +
        "<b>Folders are already organized by audience.</b></article>" +
        "<article><strong>Recommended first file</strong>" +
        "<p>01_STORE_TEAM_TEASERS/SET_60_SECOND_STORE_TEASER.mp4</p>" +
        "<b>Use the storyboard shown on the start page.</b></article>";
      return;
    }
    container.innerHTML = videos.map(function (video) {
      var bodyHtml =
        "<strong>" + escapeHtml(titleFromFile(video.title || video.path)) + "</strong>" +
        "<p>" + escapeHtml(displayValue(video.category || "Local video")) + "</p>" +
        "<b>Open video →</b>";
      return '<a href="' + escapeHtml(video.href) + '">' + bodyHtml + "</a>";
    }).join("");
  }

  function renderStores() {
    var container = $("[data-store-browser]");
    var select = $("[data-store-select]");
    var stores = safeArray(data.stores);

    if (container) {
      container.innerHTML = stores.length
        ? stores.map(function (store) {
            var storeId = normalizeStoreId(store.id);
            return "<article><strong>Store " + escapeHtml(storeId || "—") + "</strong>" +
              "<p>" + escapeHtml(cleanStoreName(store)) + "</p>" +
              '<button type="button" data-select-store="' + escapeHtml(storeId) + '">' +
              (storeId === normalizeStoreId(activeStoreId) ? "Active in this page" : "Use this store in this page") +
              "</button>" +
              (store.href ? '<a href="' + escapeHtml(store.href) + '">Open folder →</a>' : "<span>Folder action not available</span>") +
              "</article>";
          }).join("")
        : "<article><strong>No store folders indexed</strong><p>Add or connect an approved store workspace, then run REFRESH_SET_RESOURCE_CENTER.command from Finder.</p><span>No synthetic store was added.</span></article>";
    }

    if (select) {
      select.innerHTML = '<option value="">Choose indexed store</option>' + stores.map(function (store) {
          return '<option value="' + escapeHtml(normalizeStoreId(store.id)) + '">' +
            escapeHtml((normalizeStoreId(store.id) || "—") + " — " + cleanStoreName(store)) +
            "</option>";
        }).join("");
      if (activeStoreId) {
        select.value = activeStoreId;
      }
    }
  }

  function modalFocusable(modal) {
    return $$(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      modal
    ).filter(function (element) {
      return !element.hidden && element.offsetParent !== null;
    });
  }

  function openModal(name, trigger) {
    var modal = $('[data-modal="' + name + '"]');
    if (!modal) {
      return;
    }
    closeModal();
    lastFocus = trigger || document.activeElement;
    activeModal = modal;
    modal.hidden = false;
    body.classList.add("modal-open");
    var focusable = modalFocusable(modal);
    if (focusable[0]) {
      focusable[0].focus();
    }
  }

  function closeModal() {
    if (!activeModal) {
      return;
    }
    activeModal.hidden = true;
    activeModal = null;
    body.classList.remove("modal-open");
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function showAction(title, message, options) {
    var sheet = $("[data-action-sheet]");
    if (!sheet) {
      return;
    }
    actionLastFocus = document.activeElement;
    setText("[data-action-title]", title);
    setText("[data-action-message]", message);
    var optionsContainer = $("[data-action-options]");
    var list = safeArray(options);
    optionsContainer.innerHTML = list.length
      ? list.map(function (option) {
          if (option.href) {
            return '<a href="' + escapeHtml(option.href) + '">' +
              "<span><strong>" + escapeHtml(option.label) + "</strong>" +
              (option.reason ? "<small>" + escapeHtml(option.reason) + "</small>" : "") +
              "</span><span>→</span></a>";
          }
          return "<button type=\"button\" aria-disabled=\"true\" data-blocked-action><span>" +
            escapeHtml(option.label) + "</span><span>" +
            escapeHtml(option.reason || "Unavailable") + "</span></button>";
        }).join("")
      : "<button type=\"button\" aria-disabled=\"true\" data-blocked-action><span>No matching approved command was indexed.</span><span>—</span></button>";
    $$("[data-blocked-action]", optionsContainer).forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
      });
    });
    sheet.hidden = false;
    var close = $("[data-close-action]", sheet);
    if (close) {
      close.focus();
    }
  }

  function closeAction() {
    var sheet = $("[data-action-sheet]");
    if (sheet) {
      sheet.hidden = true;
    }
    if (actionLastFocus && typeof actionLastFocus.focus === "function") {
      actionLastFocus.focus();
    }
  }

  function handleWorkflowAction(kind) {
    var controls = data.controls || {};
    var control = kind === "pause" ? controls.pause : controls.start;
    var expectedName = kind === "pause"
      ? "PAUSE_SET_LOOP_SESSION.command"
      : "START_SET_LOOP_SESSION.command";
    var commandReady = Boolean(
      control &&
      control.verified === true &&
      control.runMode === "FINDER_ONLY" &&
      displayValue(control.name || "") === expectedName &&
      control.folderHref
    );
    var title = kind === "pause"
      ? "Record pause + handoff"
      : "Start or resume SET session";
    var message;
    if (commandReady) {
      message =
        "This managed control is Finder-only. Open its exact location, then double-click the filename shown. Start refreshes the page and records an active session; Pause records a handoff and does not save or close InDesign.";
    } else {
      message =
        "The exact managed session control is missing or failed its package checksum. Reinstall this Resource Center before using the control; no similarly named command will be substituted.";
    }
    showAction(title, message, commandReady ? [{
        label: expectedName,
        href: control.folderHref,
        reason: control.folderHref
          ? "Finder-only · Browse location"
          : "Folder location unavailable"
      }] : []);
  }

  var promptQuestions = {
    changes: "What changed for this store?",
    fixtures: "Which fixtures are impacted, and what is the required action for each?",
    marketing: "What marketing moves are required for this store?",
    risks: "What approved readiness, inventory, asset, or timing evidence could block execution?",
    checklist: "Build a sequenced pre-open execution checklist for this store and role.",
    leadership: "Summarize verified fleet impact, unresolved exceptions, and supported labor risk.",
    floorset: "Compare same-day brand workload, identify supported shortage or capacity, and prepare the required leader approval path.",
    policy: "Check one proposed action only against the exact policy text supplied in Additional context."
  };

  function buildPrompt(form) {
    var values = new FormData(form);
    var role = values.get("role") || "Store manager";
    var store = values.get("store") || "NOT SELECTED";
    var floorset = values.get("floorset") || "NOT PROVIDED";
    var questionKey = values.get("question") || "changes";
    var context = values.get("context") || "None provided.";
    var question = promptQuestions[questionKey] || promptQuestions.changes;

    if (questionKey === "policy") {
      return [
        "PROPOSED ACTION + EXACT POLICY TEXT",
        context,
        "",
        "INSTRUCTION",
        "Review this proposed action only against the policy text I provide.",
        "Return exactly one line:",
        "WITHIN STATED BOUNDARY — [reason]",
        "REVIEW REQUIRED — [missing approval or fact]",
        "STOP — [specific conflict]",
        "Cite the policy clause or say NO POLICY PROVIDED.",
        "Do not predict discipline, infer permission, or take the action."
      ].join("\n");
    }

    return [
      "You are the SET Guide Assistant.",
      "",
      "ACTIVE CONTEXT",
      "Role: " + role,
      "Store: " + store,
      "Floorset / effective date: " + floorset,
      "Workflow authority: current approved RC12_9 / locked prototype and its registered derived files",
      "Additional context: " + context,
      "",
      "RULES",
      "1. Answer only from approved content supplied for this session and the active store context above.",
      "2. Do not invent or independently approve placement, assortment, capacity, inventory, labor, dates, ADA compliance, policy, or visual direction.",
      "3. Never infer an action for this store from a different store.",
      "4. Label evidence VERIFIED, PILOT, UNVERIFIED, or CONFLICTING; label an action REQUIRED only when a cited approved source explicitly requires it.",
      "5. Cite the source filename plus page, section, or registered record for every operational claim.",
      "6. When sources conflict, identify the conflict. Use a newer source only when its approval status and effective date are explicit.",
      "7. If evidence is missing or conflicting, say: “NOT VERIFIED — this is not confirmed in the approved sources.”",
      "8. Do not infer company access, approval, data deletion, retention, training treatment, or enterprise integration.",
      "9. Do not modify files or represent a proposed action as completed.",
      "",
      "ANSWER FORMAT",
      "- Direct answer",
      "- Required store actions",
      "- What changed",
      "- Open questions, missing evidence, or conflicts",
      "- Sources with filename and freshness",
      "",
      "USER QUESTION",
      question
    ].join("\n");
  }

  function copyText(text, outputElement, button) {
    function success() {
      var original = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(function () { button.textContent = original; }, 1400);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(success).catch(function () {
        outputElement.focus();
        outputElement.select();
        try {
          document.execCommand("copy");
          success();
        } catch (copyError) {
          button.textContent = "Select + copy";
        }
      });
      return;
    }

    outputElement.focus();
    outputElement.select();
    try {
      document.execCommand("copy");
      success();
    } catch (copyError) {
      button.textContent = "Select + copy";
    }
  }

  var slides = [
    {
      kicker: "01 / The store reality",
      title: "The problem is not a lack of direction.",
      body: "It is the distance between direction and store execution.",
      cards: [
        ["Find", "Maps, guides, email, learning, marketing, and product tools."],
        ["Translate", "What changed—and which part actually applies to this store?"],
        ["Rebuild", "Home office recreates recaps, checklists, and clarification loops."]
      ]
    },
    {
      kicker: "02 / The information already exists",
      title: "The work is there. <em>The connection is not.</em>",
      body: "Recovered working materials identify map geometry, fixture IDs, assortment, assets, marketing, readiness, time studies, and execution direction across separate files and systems. Each accountable source keeps its decision rights."
    },
    {
      kicker: "03 / The local proof",
      title: "One front door. Exact store. Exact work.",
      body: "The Resource Center indexes local files and provides one front door. RC12_9 remains the working authority; enterprise systems are not connected."
    },
    {
      kicker: "04 / From flat map to execution",
      title: "Choose the store. Build the right guide.",
      body: "Designed flow: a verified store and floorset would coordinate the map, locked backbone, translation, visual assets, Brand Guide chapters, and review outputs. This package proves local indexing and prototype behavior—not the full enterprise chain."
    },
    {
      kicker: "05 / The store experience",
      title: "See the floor. See the fixture. Know the action.",
      body: "The proposed store experience uses the clean map as a visual table of contents. One-click delivery on managed store devices still requires testing."
    },
    {
      kicker: "06 / AI with guardrails",
      title: "AI must cite it—or mark it <em>NOT VERIFIED.</em>",
      body: "The bounded prompt requires a source, freshness, store context, and a visible NOT VERIFIED state when evidence is missing. People still verify every operational answer."
    },
    {
      kicker: "07 / People + AI",
      title: "AI can help. <em>People define, test, and decide.</em>",
      body: "Keith built the operating model from real work, working outputs, operational evidence, and iterative testing. AI-assisted technical work helped organize, compare, draft, and troubleshoot; Keith retained the decisions and validation."
    },
    {
      kicker: "08 / Story studio",
      title: "Bring the footage, voice, script, and guide into one timed story.",
      body: "Recovered July 24 inventories list 59 source decks and 38 videos, including 13 hero/conclusion videos and 10 team teasers. These are inventory-evidence counts—not a claim that every source file is bundled or linked."
    },
    {
      kicker: "09 / The practical bridge",
      title: "Static when it must be. Living when it can be.",
      body: "An offline PDF is the fallback. Authenticated Hub or SharePoint pages are a proposed next layer; access, permissions, hosting, retention, QR behavior, and device support are not verified."
    },
    {
      kicker: "10 / Controlled test candidate",
      title: "Beauty is the controlled test workspace.",
      body: "The Studio supports store-scoped source review, manual intake, validated row comparison, workload scenarios, and draft export. Test-launch gates remain visible; indexed content is never mislabeled as approval."
    },
    {
      kicker: "11 / Directional market context",
      title: "Comparable capabilities exist. <em>That is not validation.</em>",
      body: "Public vendor descriptions show adjacent capability patterns. They do not prove SET Loop, integration fit, security, ROI, or a purchase decision."
    },
    {
      kicker: "12 / The enterprise opportunity",
      title: "From Connected Brand Guide to <em>Store Intelligence.</em>",
      body: "Planning, execution, learning, communication, inventory, labor, feedback, and measurement could connect after ownership, access, governance, and observed testing are established."
    },
    {
      kicker: "13 / The decision",
      title: "Protect what works. Prove value. Build the supported bridge.",
      body: "Authorize one controlled proof: one business area, one floorset, representative stores, approved sources, and five to seven evidence-bounded questions."
    }
  ];

  function renderSlide() {
    var stage = $("[data-presentation-stage]");
    var slide = slides[slideIndex];
    if (!stage || !slide) {
      return;
    }
    var cards = safeArray(slide.cards);
    stage.innerHTML =
      '<article class="slide">' +
      '<p class="slide-kicker">' + slide.kicker + "</p>" +
      "<h2>" + slide.title + "</h2>" +
      "<p>" + slide.body + "</p>" +
      (cards.length
        ? '<div class="slide-grid">' + cards.map(function (card) {
            return "<article><strong>" + escapeHtml(card[0]) + "</strong><p>" + escapeHtml(card[1]) + "</p></article>";
          }).join("") + "</div>"
        : "") +
      "</article>";
    setText("[data-slide-current]", String(slideIndex + 1));
    setText("[data-slide-total]", String(slides.length));
  }

  function openPresentation() {
    var presentation = $("[data-presentation]");
    if (!presentation) {
      return;
    }
    presentationLastFocus = document.activeElement;
    slideIndex = 0;
    renderSlide();
    presentation.hidden = false;
    body.classList.add("presentation-open");
    var exit = $("[data-exit-presentation]");
    if (exit) {
      exit.focus();
    }
  }

  function closePresentation() {
    var presentation = $("[data-presentation]");
    if (presentation) {
      presentation.hidden = true;
    }
    body.classList.remove("presentation-open");
    if (presentationLastFocus && typeof presentationLastFocus.focus === "function") {
      presentationLastFocus.focus();
    }
  }

  function changeSlide(delta) {
    slideIndex = Math.max(0, Math.min(slides.length - 1, slideIndex + delta));
    renderSlide();
  }

  function bindEvents() {
    $$("[data-open-ai]").forEach(function (button) {
      button.addEventListener("click", function () { openModal("ai", button); });
    });
    $$("[data-open-stores]").forEach(function (button) {
      button.addEventListener("click", function () { openModal("stores", button); });
    });
    $$("[data-open-videos]").forEach(function (button) {
      button.addEventListener("click", function () { openModal("videos", button); });
    });
    $$("[data-close-modal]").forEach(function (button) {
      button.addEventListener("click", closeModal);
    });
    $$("[data-present]").forEach(function (button) {
      button.addEventListener("click", openPresentation);
    });
    var exit = $("[data-exit-presentation]");
    if (exit) {
      exit.addEventListener("click", closePresentation);
    }
    var previous = $("[data-prev-slide]");
    var next = $("[data-next-slide]");
    if (previous) {
      previous.addEventListener("click", function () { changeSlide(-1); });
    }
    if (next) {
      next.addEventListener("click", function () { changeSlide(1); });
    }
    $$("[data-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        handleWorkflowAction(button.getAttribute("data-action"));
      });
    });
    var closeActionButton = $("[data-close-action]");
    if (closeActionButton) {
      closeActionButton.addEventListener("click", closeAction);
    }

    var form = $("[data-prompt-form]");
    var output = $("[data-prompt-output]");
    if (form && output) {
      output.value = buildPrompt(form);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        output.value = buildPrompt(form);
        output.focus();
      });
    }
    var storeSelect = $("[data-store-select]");
    if (storeSelect) {
      storeSelect.addEventListener("change", function () {
        activeStoreId = normalizeStoreId(storeSelect.value);
        initializeSnapshot();
        renderStores();
        output.value = buildPrompt(form);
      });
    }
    var copyButton = $("[data-copy-prompt]");
    if (copyButton && output) {
      copyButton.addEventListener("click", function () {
        copyText(output.value, output, copyButton);
      });
    }
    var policyOutput = $("[data-policy-prompt]");
    var policyCopyButton = $("[data-copy-policy]");
    if (policyOutput && policyCopyButton) {
      policyCopyButton.addEventListener("click", function () {
        copyText(policyOutput.value, policyOutput, policyCopyButton);
      });
    }

    var menuButton = $("[data-menu-button]");
    var mobileNav = $("#mobile-nav");
    if (menuButton && mobileNav) {
      menuButton.addEventListener("click", function () {
        var expanded = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", String(!expanded));
        mobileNav.hidden = expanded;
      });
      $$("a, button", mobileNav).forEach(function (item) {
        item.addEventListener("click", function () {
          menuButton.setAttribute("aria-expanded", "false");
          mobileNav.hidden = true;
        });
      });
    }

    window.addEventListener("scroll", function () {
      var header = $("[data-header]");
      if (header) {
        header.classList.toggle("is-scrolled", window.scrollY > 12);
      }
    }, { passive: true });

    document.addEventListener("click", function (event) {
      var selectStore = event.target.closest("[data-select-store]");
      if (!selectStore) {
        return;
      }
      activeStoreId = normalizeStoreId(selectStore.getAttribute("data-select-store"));
      initializeSnapshot();
      renderStores();
      var promptStore = $("[data-store-select]");
      if (promptStore) {
        promptStore.value = activeStoreId;
      }
    });

    document.addEventListener("keydown", function (event) {
      if (body.classList.contains("presentation-open")) {
        if (event.key === "Escape") {
          closePresentation();
        } else if (event.key === "ArrowRight" || event.key === " ") {
          event.preventDefault();
          changeSlide(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          changeSlide(-1);
        } else if (event.key === "Tab") {
          var presentation = $("[data-presentation]");
          var presentationFocusable = presentation ? modalFocusable(presentation) : [];
          if (presentationFocusable.length) {
            var presentationFirst = presentationFocusable[0];
            var presentationLast = presentationFocusable[presentationFocusable.length - 1];
            if (event.shiftKey && document.activeElement === presentationFirst) {
              event.preventDefault();
              presentationLast.focus();
            } else if (!event.shiftKey && document.activeElement === presentationLast) {
              event.preventDefault();
              presentationFirst.focus();
            }
          }
        }
        return;
      }

      if (activeModal) {
        if (event.key === "Escape") {
          closeModal();
        } else if (event.key === "Tab") {
          var focusable = modalFocusable(activeModal);
          if (!focusable.length) {
            return;
          }
          var first = focusable[0];
          var last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    });

    var touchStartX = null;
    var stage = $("[data-presentation-stage]");
    if (stage) {
      stage.addEventListener("touchstart", function (event) {
        touchStartX = event.changedTouches[0].clientX;
      }, { passive: true });
      stage.addEventListener("touchend", function (event) {
        if (touchStartX == null) {
          return;
        }
        var delta = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 50) {
          changeSlide(delta < 0 ? 1 : -1);
        }
        touchStartX = null;
      }, { passive: true });
    }
  }

  initializeSnapshot();
  renderVideoCards();
  renderVideoLibrary();
  renderStores();
  bindEvents();
}());
