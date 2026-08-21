(function () {
  "use strict";

  var resource = window.SET_RESOURCE_INDEX || {};
  var defaults = window.SET_BEAUTY_DEFAULTS || {};
  var storageKey = "set-beauty-pilot-v1";
  var priorRows = [];
  var currentRows = [];
  var workloadRows = [];
  var changes = [];
  var importStatus = {
    previous: null,
    current: null,
    workload: null
  };
  var comparisonBlockers = [];
  var gateBlockers = [];
  var activeSourceKind = "";
  var lastFocus = null;
  var toastTimer = null;

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function text(selector, value) {
    var element = $(selector);
    if (element) {
      element.textContent = value;
    }
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
    var output = String(value == null ? "" : value);
    if (!/%[0-9A-Fa-f]{2}/.test(output)) {
      return output;
    }
    try {
      return decodeURIComponent(output);
    } catch (error) {
      return output;
    }
  }

  function fileName(path) {
    var parts = displayValue(path || "").split("/");
    return parts[parts.length - 1] || path || "";
  }

  function titleFromFile(path) {
    return fileName(path)
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, function (character) { return character.toUpperCase(); });
  }

  function authoritativeCalendar() {
    var candidates = resource.floorsetCalendar || resource.calendarEvents || resource.calendar;
    return safeArray(candidates).map(function (event) {
      var date = displayValue(event.date || event.effectiveDate || event.floorsetDate || "");
      var match = date.match(/^\d{4}-(\d{2})-(\d{2})$/);
      return {
        date: date,
        label: displayValue(event.label || event.floorset || (
          match ? Number(match[1]) + "." + Number(match[2]) : date
        )),
        phase: displayValue(event.phase || event.event || event.name || "Floorset / update"),
        status: displayValue(event.approvalStatus || event.status || "INDEXED_LOCAL"),
        source: displayValue(event.source || event.path || "")
      };
    }).filter(function (event) {
      return Boolean(event.date);
    });
  }

  defaults.floorsets = authoritativeCalendar();

  function safeRelativeHref(value) {
    var href = String(value == null ? "" : value).trim();
    if (!/^(?:\.\/|\.\.\/|#)/.test(href)) {
      return "";
    }
    if (/^(?:\.\.\/){2}/.test(href) || /\/\.\.\//.test(href) || href.indexOf("\\") !== -1) {
      return "";
    }
    return href;
  }

  function isNativeAuthoringItem(item) {
    var path = displayValue((item && item.path) || "");
    var mode = String((item && (item.openMode || item.runMode)) || "").toUpperCase();
    return mode === "FINDER_DOUBLE_CLICK" ||
      mode === "FINDER_ONLY" ||
      /\.(?:ai|command|doc|docx|idml|indd|indt|jsx|jsxbin|ppt|pptx|psb|psd|xls|xlsm|xlsx)$/i.test(path);
  }

  function localItemLink(item) {
    var finderOnly = isNativeAuthoringItem(item);
    var href = finderOnly
      ? safeRelativeHref(item && item.folderHref)
      : safeRelativeHref(item && item.href) || safeRelativeHref(item && item.folderHref);
    return {
      href: href,
      finderOnly: finderOnly,
      instruction: String((item && item.finderInstruction) || (
        finderOnly
          ? "In Finder, double-click " + fileName((item && item.path) || "the exact file") + "."
          : ""
      ))
    };
  }

  function round(value, digits) {
    var factor = Math.pow(10, digits || 0);
    return Math.round((Number(value) || 0) * factor) / factor;
  }

  function toNumber(value) {
    var parsed = parseFloat(String(value == null ? "" : value).replace(/[^0-9.-]/g, ""));
    return isFinite(parsed) ? parsed : 0;
  }

  function normalizeHeader(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function normalizeRow(row) {
    var output = {};
    Object.keys(row || {}).forEach(function (key) {
      output[normalizeHeader(key)] = row[key];
    });
    return output;
  }

  function aliasValue(row, group) {
    var aliases = (defaults.fieldAliases && defaults.fieldAliases[group]) || [];
    var normalized = row || {};
    var value = "";
    aliases.some(function (alias) {
      var candidate = normalized[normalizeHeader(alias)];
      if (candidate != null && String(candidate).trim() !== "") {
        value = String(candidate).trim();
        return true;
      }
      return false;
    });
    return value;
  }

  function hasAliasColumn(rows, group) {
    var aliases = (defaults.fieldAliases && defaults.fieldAliases[group]) || [];
    var normalizedAliases = aliases.map(normalizeHeader);
    return safeArray(rows).some(function (row) {
      return normalizedAliases.some(function (alias) {
        return Object.prototype.hasOwnProperty.call(row || {}, alias);
      });
    });
  }

  function strictNumericValue(value) {
    var source = String(value == null ? "" : value).trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(source)) {
      return null;
    }
    var parsed = Number(source);
    return isFinite(parsed) ? parsed : null;
  }

  function mapSchemaBlockers(rows) {
    var blockers = [];
    ["store", "floorset", "key"].forEach(function (group) {
      if (!hasAliasColumn(rows, group)) {
        blockers.push("Map schema is missing a recognized " + group.toUpperCase() + " column.");
      }
    });

    var hasRoom = hasAliasColumn(rows, "room");
    var hasZone = hasAliasColumn(rows, "zone");
    var hasX = hasAliasColumn(rows, "x");
    var hasY = hasAliasColumn(rows, "y");
    var hasWidth = hasAliasColumn(rows, "width");
    var hasHeight = hasAliasColumn(rows, "height");
    if (!hasRoom && !hasZone && !(hasX && hasY)) {
      blockers.push("Map schema needs ROOM, ZONE, or a complete X/Y coordinate pair.");
    }
    if (hasX !== hasY) {
      blockers.push("Map schema has only one coordinate column; both X and Y are required.");
    }
    if (hasWidth !== hasHeight) {
      blockers.push("Map schema has only one size column; both W and H are required.");
    }

    var invalidCoordinates = 0;
    var invalidSizes = 0;
    safeArray(rows).forEach(function (row) {
      var x = aliasValue(row, "x");
      var y = aliasValue(row, "y");
      if ((x || y) &&
          (!x || !y ||
           strictNumericValue(x) === null ||
           strictNumericValue(y) === null)) {
        invalidCoordinates += 1;
      }
      var width = aliasValue(row, "width");
      var height = aliasValue(row, "height");
      if ((width || height) &&
          (!width || !height ||
           strictNumericValue(width) === null ||
           strictNumericValue(height) === null)) {
        invalidSizes += 1;
      }
    });
    if (invalidCoordinates) {
      blockers.push(invalidCoordinates + " map row(s) have incomplete or non-numeric X/Y coordinates.");
    }
    if (invalidSizes) {
      blockers.push(invalidSizes + " map row(s) have incomplete or non-numeric W/H dimensions.");
    }
    return blockers;
  }

  function loadState() {
    var firstFloorset = safeArray(defaults.floorsets)[0];
    var indexedFloorset = displayValue(resource.floorsetDate || "");
    var initialFloorset = safeArray(defaults.floorsets).some(function (event) {
      return event.date === indexedFloorset;
    }) ? indexedFloorset : firstFloorset ? firstFloorset.date : "";
    var fallback = {
      store: "",
      floorset: initialFloorset,
      tier: "",
      role: "home-office",
      note: "",
      labor: safeArray(defaults.brandRows).map(function (row) {
        return {
          id: row.id,
          label: row.label,
          demand: Number(row.demand) || 0,
          scheduled: Number(row.scheduled) || 0
        };
      }),
      prototypePath: "",
      supportRequest: null
    };
    try {
      var saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!saved || typeof saved !== "object") {
        return fallback;
      }
      Object.keys(fallback).forEach(function (key) {
        if (saved[key] == null) {
          saved[key] = fallback[key];
        }
      });
      return saved;
    } catch (error) {
      return fallback;
    }
  }

  var state = loadState();
  state.labor = safeArray(state.labor).map(function (row) {
    return {
      id: row.id,
      label: row.label,
      demand: 0,
      scheduled: Math.max(0, toNumber(row.scheduled))
    };
  });
  state.workloadSource = null;
  state.supportRequest = null;

  function saveState(message) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      if (message) {
        showToast(message);
      }
    } catch (error) {
      showToast("The browser blocked local saving. Use Download session JSON for the handoff.");
    }
  }

  function showToast(message) {
    var toast = $("[data-toast]");
    if (!toast) {
      return;
    }
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(function () {
      toast.hidden = true;
    }, 3200);
  }

  function recentFiles() {
    var indexedFiles = Array.isArray(resource.relevantFiles)
      ? resource.relevantFiles
      : resource.recentFiles;
    return safeArray(indexedFiles).filter(function (item) {
      var path = displayValue(item.path || "");
      var name = fileName(path);
      return !/\/(?:90_ARCHIVE|99_ARCHIVE|99_BACKUPS|RESOURCE_CENTER_BACKUPS)\//i.test("/" + path) &&
        !/\/project_sources\//i.test("/" + path) &&
        !/PLACEHOLDER/i.test(name) &&
        !/MAP_(?:BACKBONE_)?PROTO_BBV_T1/i.test(name) &&
        !/CAB_BEAUTY_001/i.test(name);
    }).sort(function (left, right) {
      return (Number(right.modified) || 0) - (Number(left.modified) || 0);
    });
  }

  function itemStoreId(item) {
    var direct = normalizeStoreId(item && (item.storeId || item.store || item.storeNumber));
    var haystack;
    var match;
    if (direct) {
      return direct;
    }
    haystack = displayValue(((item && item.path) || "") + "/" + ((item && item.name) || ""));
    match = haystack.match(/(?:^|\/)(?:store[_ -]*)?0*(\d{3,5})(?:\s+[^/]+)?(?:\/|$)/i) ||
      haystack.match(/(?:BY|STORE)[_-]?0*(\d{3,5})(?:[^0-9]|$)/i);
    return match ? normalizeStoreId(match[1]) : "";
  }

  function normalizedTier(value) {
    var match = String(value == null ? "" : value).toUpperCase().match(/^T?(1[0-9]|[1-9])([A-Z]?)$/);
    return match ? "T" + match[1] + match[2] : "";
  }

  function itemTier(item) {
    var explicit = normalizedTier(item && item.tier);
    var haystack;
    var match;
    if (explicit) {
      return explicit;
    }
    haystack = displayValue(((item && item.path) || "") + " " + ((item && item.name) || "")).toUpperCase();
    match = haystack.match(/(?:^|[_ .-])T(?:IER[_ .-]*)?(1[0-9]|[1-9])([A-Z]?)(?![_ .-]?[0-9])/);
    return match ? "T" + match[1] + match[2] : "";
  }

  function itemFloorsetMatches(item) {
    var value = displayValue(item && (item.floorsetId || item.floorset || ""));
    var event = selectedFloorEvent();
    if (!value || !state.floorset) {
      return true;
    }
    return value === state.floorset || value === event.label;
  }

  function fileAppliesToContext(item) {
    var storeId = itemStoreId(item);
    var scope = String((item && item.scope) || "").toUpperCase();
    var storeMatch = !storeId || !state.store || storeId === normalizeStoreId(state.store);
    if (scope === "GLOBAL" || scope === "WORKSPACE") {
      storeMatch = true;
    }
    return storeMatch && itemFloorsetMatches(item);
  }

  function fileAppliesToStore(item) {
    var storeId = itemStoreId(item);
    var scope = String((item && item.scope) || "").toUpperCase();
    return scope === "GLOBAL" || scope === "WORKSPACE" ||
      !storeId || !state.store || storeId === normalizeStoreId(state.store);
  }

  function sourceStatus(item) {
    var approval = String((item && (item.approvalStatus || item.status)) || "").toUpperCase();
    var local = String((item && item.localStatus) || "").toUpperCase();
    if (/STALE|MODIFIED|CONFLICT/.test(approval + " " + local)) {
      return "STALE OR MODIFIED";
    }
    if (/POINTER|ALIAS/.test(local) || /\salias$/i.test(fileName((item && item.path) || ""))) {
      return "FINDER-LINKED POINTER";
    }
    if (approval === "APPROVED" || approval === "VERIFIED") {
      return approval;
    }
    if (["NOT_VERIFIED", "UNVERIFIED", "PENDING", "UNKNOWN"].indexOf(approval) !== -1) {
      return "NOT VERIFIED";
    }
    if (itemStoreId(item) && itemStoreId(item) === normalizeStoreId(state.store)) {
      return "CONTEXT MATCHED";
    }
    if (/INDEXED/.test(local)) {
      return "INDEXED LOCAL";
    }
    return "NOT VERIFIED";
  }

  function filesForKind(kind) {
    var matched = recentFiles().filter(function (item) {
      var itemKind = String(item.kind || item.sourceRole || "").toLowerCase();
      var path = displayValue(item.path || "").toLowerCase();
      var kindMatch = itemKind === kind;
      if (kind === "brand-guide") {
        kindMatch = kindMatch || /brand.?guide|execution.?guide|full.?store.?working/.test(path);
      }
      if (kind === "store-input") {
        kindMatch = kindMatch ||
          (itemStoreId(item) && /\.(?:csv|tsv|txt|pdf|indd)$/i.test(path) &&
           ["reference", "other", "store-input"].indexOf(itemKind) !== -1);
      }
      return kindMatch && fileAppliesToContext(item);
    });
    if (kind === "calendar" && !matched.length && safeArray(defaults.floorsets).length) {
      matched.push({
        kind: "calendar",
        path: "CONFIG/FLOORSET_CALENDAR.csv",
        scope: "WORKSPACE",
        localStatus: "INDEXED_LOCAL",
        approvalStatus: safeArray(defaults.floorsets)[0].status || "INDEXED_LOCAL"
      });
    }
    if (kind === "payroll" && !matched.length &&
        safeArray(resource.laborRules || resource.laborSupportRules || resource.payrollRules).length) {
      matched.push({
        kind: "payroll",
        path: "CONFIG/LABOR_SUPPORT_RULES.csv",
        scope: "WORKSPACE",
        localStatus: "INDEXED_LOCAL",
        approvalStatus: "NOT_VERIFIED"
      });
    }
    return matched;
  }

  function populateStores() {
    var select = $("[data-store-select]");
    if (!select) {
      return;
    }
    var stores = safeArray(resource.stores).slice().sort(function (left, right) {
      return String(left.id || "").localeCompare(String(right.id || ""));
    });
    select.innerHTML = '<option value="">Choose indexed store</option>' +
      stores.map(function (store) {
        var storeName = displayValue(store.name || "");
        var storeId = normalizeStoreId(store.id);
        if (storeId) {
          storeName = storeName.replace(
            new RegExp("^\\s*(?:store\\s*)?0*" + storeId + "(?:\\s*[-—/:]\\s*|\\s+)", "i"),
            ""
          );
        }
        return '<option value="' + escapeHtml(storeId) + '">' +
          escapeHtml(storeId) +
          (storeName ? " / " + escapeHtml(storeName) : "") +
          "</option>";
      }).join("");

    state.store = normalizeStoreId(state.store);
    var available = stores.some(function (store) {
      return normalizeStoreId(store.id) === state.store;
    });
    if (!available) {
      var recommended = stores.filter(function (store) {
        return normalizeStoreId(store.id) === "1392";
      })[0];
      state.store = recommended ? normalizeStoreId(recommended.id) : "";
    }
    select.value = state.store;
  }

  function availableTiers() {
    var found = {};
    recentFiles().filter(fileAppliesToStore).forEach(function (item) {
      var tier = itemTier(item);
      if (tier) {
        found[tier] = true;
      }
    });
    return Object.keys(found).sort(function (left, right) {
      var leftMatch = left.match(/^T(\d+)([A-Z]?)$/);
      var rightMatch = right.match(/^T(\d+)([A-Z]?)$/);
      var difference = Number(leftMatch && leftMatch[1]) - Number(rightMatch && rightMatch[1]);
      return difference || String(leftMatch && leftMatch[2]).localeCompare(String(rightMatch && rightMatch[2]));
    });
  }

  function populateTiers() {
    var select = $("[data-tier-select]");
    var tiers;
    if (!select) {
      return;
    }
    tiers = availableTiers();
    select.innerHTML = '<option value="">Choose tier</option>' + tiers.map(function (tier) {
      return '<option value="' + escapeHtml(tier) + '">' +
        escapeHtml("Tier " + tier.replace(/^T/, "")) + "</option>";
    }).join("");
    if (state.tier && tiers.indexOf(state.tier) === -1) {
      state.tier = "";
    }
    select.value = state.tier || "";
  }

  function populateFloorsets() {
    var select = $("[data-floorset-select]");
    if (!select) {
      return;
    }
    var events = safeArray(defaults.floorsets);
    select.innerHTML = events.length ? events.map(function (event) {
      return '<option value="' + escapeHtml(event.date) + '">' +
        escapeHtml(event.label + " / " + event.phase) +
        "</option>";
    }).join("") : '<option value="">Refresh to load FLOORSET_CALENDAR.csv</option>';
    if (!events.some(function (event) { return event.date === state.floorset; })) {
      state.floorset = events[0] ? events[0].date : "";
    }
    select.value = state.floorset;
    select.disabled = !events.length;
  }

  function populateRoles() {
    var select = $("[data-role-select]");
    if (!select) {
      return;
    }
    select.innerHTML = safeArray(defaults.roles).map(function (role) {
      return '<option value="' + escapeHtml(role.id) + '">' + escapeHtml(role.label) + "</option>";
    }).join("");
    select.value = state.role;
  }

  function populateForm() {
    var form = $("[data-session-form]");
    if (!form) {
      return;
    }
    form.elements.tier.value = state.tier || "";
    form.elements.note.value = state.note || "";
  }

  function selectedFloorEvent() {
    return safeArray(defaults.floorsets).filter(function (event) {
      return event.date === state.floorset;
    })[0] || safeArray(defaults.floorsets)[0] || { label: "—", phase: "Not set" };
  }

  function prototypeCandidates() {
    var candidates = filesForKind("beauty-prototype");
    if (!state.tier) {
      return [];
    }
    var matching = candidates.filter(function (item) {
      var tier = itemTier(item);
      var path = displayValue(item.path || "");
      return tier === state.tier || new RegExp("(?:^|[^A-Z0-9])" + state.tier + "(?:[^A-Z0-9]|$)", "i").test(path);
    });
    candidates = matching;
    return candidates.sort(function (left, right) {
      return (Number(right.modified) || 0) - (Number(left.modified) || 0);
    });
  }

  function selectedPrototype() {
    var candidates = prototypeCandidates();
    var exact = candidates.filter(function (item) {
      return displayValue(item.path || "") === state.prototypePath;
    })[0];
    return exact || candidates[0] || null;
  }

  function updatePrototype() {
    var candidate = selectedPrototype();
    var title = $("[data-prototype-title]");
    var path = $("[data-prototype-path]");
    var status = $("[data-prototype-state]");
    var open = $("[data-open-prototype]");
    var link;

    if (!candidate) {
      if (title) { title.textContent = state.tier ? state.tier + " prototype not indexed" : "No tier prototype selected"; }
      if (path) { path.textContent = "Index a live Beauty prototype candidate from the working computer. Indexing does not establish owner approval."; }
      if (status) {
        status.textContent = "Needs live source";
        status.classList.remove("is-ready");
      }
      if (open) {
        open.removeAttribute("href");
        open.classList.add("is-disabled");
        open.setAttribute("aria-disabled", "true");
        open.setAttribute("tabindex", "-1");
      }
      state.prototypePath = "";
      return;
    }

    state.prototypePath = displayValue(candidate.path || "");
    link = localItemLink(candidate);
    if (title) { title.textContent = titleFromFile(candidate.name || candidate.path); }
    if (path) {
      path.textContent = displayValue(candidate.path || "") +
        (link.finderOnly ? " — " + link.instruction : "");
    }
    if (status) {
      status.textContent = sourceStatus(candidate);
      status.classList.toggle("is-ready", /^(?:APPROVED|VERIFIED)$/.test(sourceStatus(candidate)));
    }
    if (open && link.href) {
      open.href = link.href;
      open.textContent = link.finderOnly ? "Browse containing folder" : "Open candidate";
      open.title = link.finderOnly ? link.instruction : "";
      open.classList.remove("is-disabled");
      open.removeAttribute("aria-disabled");
      open.removeAttribute("tabindex");
    } else if (open) {
      open.removeAttribute("href");
      open.textContent = link && link.finderOnly ? "Use Finder for this file" : "Open candidate";
      open.title = link && link.finderOnly ? link.instruction : "";
      open.classList.add("is-disabled");
      open.setAttribute("aria-disabled", "true");
      open.setAttribute("tabindex", "-1");
    }
  }

  function updateSnapshot() {
    var event = selectedFloorEvent();
    var prototype = selectedPrototype();
    var covered = safeArray(defaults.sourceKinds).filter(function (kind) {
      return filesForKind(kind.id).length > 0;
    }).length;
    text("[data-snapshot-store]", state.store || "Choose store");
    text("[data-snapshot-floorset]", event.label || "—");
    text("[data-snapshot-prototype]", prototype ? (prototype.tier || titleFromFile(prototype.path)) : "Not selected");
    text("[data-source-coverage]", covered + " / " + safeArray(defaults.sourceKinds).length);
  }

  function renderSources() {
    var grid = $("[data-source-grid]");
    if (!grid) {
      return;
    }
    grid.innerHTML = safeArray(defaults.sourceKinds).map(function (kind) {
      var files = filesForKind(kind.id);
      var connected = files.length > 0;
      var statuses = files.map(sourceStatus);
      var summary = statuses.indexOf("APPROVED") !== -1 ? "Approved source" :
        statuses.indexOf("VERIFIED") !== -1 ? "Verified source" :
          statuses.indexOf("CONTEXT MATCHED") !== -1 ? "Context matched" :
            statuses.indexOf("FINDER-LINKED POINTER") !== -1 ? "Finder-linked pointer" :
              connected ? "Indexed local" : "Missing";
      return '<button class="source-card ' + (connected ? "is-connected" : "") +
        '" type="button" data-open-source-kind="' + escapeHtml(kind.id) + '">' +
        "<span>" + escapeHtml(summary) + (connected ? " · " + files.length : "") + "</span>" +
        "<strong>" + escapeHtml(kind.label) + "</strong>" +
        "<p>" + escapeHtml(kind.note) + "</p>" +
        "<b>" + (connected ? "Review local files →" : "See source requirement →") + "</b>" +
        "</button>";
    }).join("");
  }

  function renderStageOrder() {
    var list = $("[data-stage-order]");
    if (!list) {
      return;
    }
    list.innerHTML = safeArray(defaults.stageOrder).map(function (stage) {
      return "<li><span>" + escapeHtml(String(stage.order).padStart(2, "0")) + "</span>" +
        "<div><b>" + escapeHtml(stage.title) + "</b><small>" +
        escapeHtml(stage.detail) + "</small></div></li>";
    }).join("");
  }

  function openSourceDrawer(kind, trigger) {
    var drawer = $("[data-source-drawer]");
    if (!drawer) {
      return;
    }
    activeSourceKind = kind;
    lastFocus = trigger || document.activeElement;
    var definition = safeArray(defaults.sourceKinds).filter(function (source) {
      return source.id === kind;
    })[0] || { label: "Source files", note: "Required local source" };
    var files = filesForKind(kind);
    text("[data-source-drawer-title]", definition.label);
    var container = $("[data-source-drawer-files]");
    if (container) {
      if (!files.length) {
        container.innerHTML = '<div class="drawer-file"><div><strong>No live source indexed</strong>' +
          "<small>" + escapeHtml(definition.note) +
          ". The supplied legacy ZIPs are not treated as approved production authority.</small></div><span>Missing</span></div>";
      } else {
        container.innerHTML = files.map(function (file) {
          var link = localItemLink(file);
          var action = link.href
            ? '<a href="' + escapeHtml(link.href) + '">' +
              (link.finderOnly ? "Browse folder →" : "Open →") + "</a>"
            : "<span>Refresh needed</span>";
          return '<article class="drawer-file"><div><strong>' +
            escapeHtml(titleFromFile(file.name || file.path)) + "</strong><small>" +
            escapeHtml(displayValue(file.path || "")) + "</small>" +
            "<small>" + escapeHtml(sourceStatus(file)) +
            (itemStoreId(file) ? " · Store " + escapeHtml(itemStoreId(file)) : " · Workspace-wide") +
            (itemTier(file) ? " · " + escapeHtml(itemTier(file)) : "") + "</small>" +
            (link.finderOnly ? "<small>" + escapeHtml(link.instruction) + "</small>" : "") +
            "</div>" + action + "</article>";
        }).join("");
      }
    }
    drawer.hidden = false;
    document.body.classList.add("drawer-open");
    var close = $("[data-close-source-drawer]", drawer);
    if (close) {
      close.focus();
    }
  }

  function closeSourceDrawer() {
    var drawer = $("[data-source-drawer]");
    if (!drawer || drawer.hidden) {
      return;
    }
    drawer.hidden = true;
    document.body.classList.remove("drawer-open");
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function parseDelimited(input) {
    var source = String(input || "").replace(/^\uFEFF/, "");
    var firstLine = source.split(/\r?\n/, 1)[0] || "";
    var delimiter = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? "\t" : ",";
    var rows = [];
    var row = [];
    var cell = "";
    var quoted = false;
    var index;
    var character;
    var next;

    for (index = 0; index < source.length; index += 1) {
      character = source.charAt(index);
      next = source.charAt(index + 1);
      if (quoted) {
        if (character === '"' && next === '"') {
          cell += '"';
          index += 1;
        } else if (character === '"') {
          quoted = false;
        } else {
          cell += character;
        }
      } else if (character === '"') {
        quoted = true;
      } else if (character === delimiter) {
        row.push(cell);
        cell = "";
      } else if (character === "\n") {
        row.push(cell.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += character;
      }
    }
    if (cell !== "" || row.length) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
    }
    while (rows.length && rows[rows.length - 1].every(function (value) { return value === ""; })) {
      rows.pop();
    }
    if (!rows.length) {
      return [];
    }

    var headers = rows.shift().map(normalizeHeader);
    return rows.filter(function (values) {
      return values.some(function (value) { return String(value).trim() !== ""; });
    }).map(function (values) {
      var output = {};
      headers.forEach(function (header, column) {
        output[header || ("COLUMN_" + (column + 1))] = values[column] == null ? "" : values[column];
      });
      return normalizeRow(output);
    });
  }

  function normalizeStoreId(value) {
    var match = String(value == null ? "" : value).match(/(?:^|[^0-9])([0-9]{3,5})(?:[^0-9]|$)/);
    if (!match) {
      return "";
    }
    return match[1].length <= 4 ? match[1].padStart(4, "0") : match[1];
  }

  function storeMatches(value) {
    var rowStore = normalizeStoreId(value);
    var selectedStore = normalizeStoreId(state.store);
    return Boolean(rowStore && selectedStore && rowStore === selectedStore);
  }

  function floorsetMatches(value) {
    var source = String(value == null ? "" : value).trim();
    if (!source) {
      return false;
    }
    if (source === state.floorset) {
      return true;
    }
    var parts = String(state.floorset || "").split("-");
    if (parts.length !== 3) {
      return false;
    }
    var year = parts[0];
    var month = String(parseInt(parts[1], 10));
    var day = String(parseInt(parts[2], 10));
    var sourceYear = source.match(/(?:^|[^0-9])(20[0-9]{2})(?:[^0-9]|$)/);
    if (sourceYear && sourceYear[1] !== year) {
      return false;
    }
    return new RegExp(
      "(?:^|[^0-9])0?" + month + "[^0-9]+0?" + day + "(?:[^0-9]|$)"
    ).test(source);
  }

  function scopeRows(rows, kind, file) {
    var matched = [];
    var wrongStore = 0;
    var wrongFloorset = 0;
    var missingStore = 0;
    var missingFloorset = 0;

    rows.forEach(function (row) {
      var rowStore = aliasValue(row, "store");
      var rowFloorset = aliasValue(row, "floorset");
      if (!rowStore) {
        missingStore += 1;
      } else if (!storeMatches(rowStore)) {
        wrongStore += 1;
        return;
      }
      if (!rowFloorset) {
        missingFloorset += 1;
      } else if (!floorsetMatches(rowFloorset)) {
        wrongFloorset += 1;
        return;
      }
      matched.push(row);
    });

    var status = {
      kind: kind,
      filename: file.name,
      size: Number(file.size) || 0,
      modified: file.lastModified ? new Date(file.lastModified).toISOString() : "NOT_PROVIDED",
      totalRows: rows.length,
      matchedRows: matched.length,
      wrongStoreRows: wrongStore,
      wrongFloorsetRows: wrongFloorset,
      missingStoreRows: missingStore,
      missingFloorsetRows: missingFloorset,
      blockers: []
    };
    if (!state.store) {
      status.blockers.push("No indexed store is selected.");
    }
    if (!state.floorset) {
      status.blockers.push("No floorset is selected.");
    }
    if (wrongStore) {
      status.blockers.push(wrongStore + " row(s) belong to a different store.");
    }
    if (wrongFloorset) {
      status.blockers.push(wrongFloorset + " row(s) belong to a different floorset.");
    }
    if (missingStore) {
      status.blockers.push(missingStore + " row(s) do not carry a store identifier.");
    }
    if (missingFloorset) {
      status.blockers.push(missingFloorset + " row(s) do not carry a floorset identifier.");
    }
    if (!matched.length) {
      status.blockers.push("No rows match the active store and floorset.");
    }
    if (kind === "previous" || kind === "current") {
      status.blockers = status.blockers.concat(mapSchemaBlockers(rows));
    }
    return { rows: matched, status: status };
  }

  function resetImportedEvidence() {
    priorRows = [];
    currentRows = [];
    workloadRows = [];
    changes = [];
    comparisonBlockers = [];
    importStatus = { previous: null, current: null, workload: null };
    [
      ["[data-previous-file]", "No file loaded"],
      ["[data-current-file]", "No file loaded"],
      ["[data-workload-file]", "No file loaded"]
    ].forEach(function (entry) {
      text(entry[0], entry[1]);
    });
    state.workloadSource = null;
    state.supportRequest = null;
    state.prototypePath = "";
    state.labor = safeArray(defaults.brandRows).map(function (row) {
      return { id: row.id, label: row.label, demand: 0, scheduled: 0 };
    });
    renderChanges();
    renderLabor();
  }

  function importCsv(file, kind) {
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsedRows = parseDelimited(reader.result);
        if (!parsedRows.length) {
          throw new Error("No data rows found");
        }
        var scoped = scopeRows(parsedRows, kind, file);
        importStatus[kind] = scoped.status;
        var rows = scoped.rows;
        if (!rows.length) {
          throw new Error("No active-context rows found");
        }
        if (kind === "previous") {
          priorRows = rows;
          text("[data-previous-file]", file.name + " / " + rows.length + " matched of " + parsedRows.length);
        } else if (kind === "current") {
          currentRows = rows;
          text("[data-current-file]", file.name + " / " + rows.length + " matched of " + parsedRows.length);
        } else {
          workloadRows = rows;
          text("[data-workload-file]", file.name + " / " + rows.length + " matched of " + parsedRows.length);
          applyWorkloadRows(file.name);
        }
        compareRows();
        renderGateStatus();
        if (kind !== "workload") {
          showToast(file.name + " loaded locally. The source file was not changed.");
        }
      } catch (error) {
        renderGateStatus();
        showToast("That file did not provide usable rows for the selected store and floorset.");
      }
    };
    reader.onerror = function () {
      showToast("The browser could not read that local file.");
    };
    reader.readAsText(file);
  }

  function workloadBrandId(row) {
    var value = aliasValue(row, "brand").toUpperCase();
    if (/PINK.*BEAUTY|BEAUTY.*PINK/.test(value)) {
      return "pink-beauty";
    }
    if (/BEAUTY|VSB|BBV/.test(value)) {
      return "beauty";
    }
    if (/PINK/.test(value)) {
      return "pink";
    }
    if (/VS|VICTORIA/.test(value)) {
      return "vs";
    }
    return "";
  }

  function normalizedEnum(value) {
    return String(value == null ? "" : value)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function physicalAction(row) {
    var action = normalizedEnum(aliasValue(row, "action") || row.TASK_TYPE || row.WORKLOAD_BUCKET);
    return [
      "MOVE",
      "MOVED",
      "ADD",
      "ADDED",
      "REMOVE",
      "REMOVED",
      "CAPACITY_CHANGED",
      "MARKETING_INSTALL",
      "PHYSICAL",
      "REMERCH",
      "SET_WORK",
      "FIXTURE_WORK"
    ].indexOf(action) !== -1;
  }

  function sourceQualifiedEvidence(row) {
    var approval = normalizedEnum(aliasValue(row, "approvalStatus"));
    var assumption = normalizedEnum(aliasValue(row, "assumptionStatus"));
    return ["APPROVED", "SUPPORTED", "VERIFIED"].indexOf(approval) !== -1 &&
      ["ASSUMPTION", "UNVERIFIED", "NOT_VERIFIED", "PENDING"].indexOf(assumption) === -1;
  }

  function physicalWorkMinutes(row) {
    var taskId = aliasValue(row, "taskId");
    var sourceIds = aliasValue(row, "sourceIds");
    var totalValue = aliasValue(row, "totalMinutes");
    if (!physicalAction(row) || !sourceQualifiedEvidence(row) || !taskId || !sourceIds || totalValue === "") {
      return 0;
    }
    return Math.max(0, toNumber(totalValue));
  }

  function applyWorkloadRows(sourceName) {
    ensureLaborState();
    var totals = {
      beauty: 0,
      vs: 0,
      pink: 0,
      "pink-beauty": 0
    };
    var supportedRows = 0;
    var taskIds = {};
    var missingTaskIds = 0;
    var duplicateTaskIds = 0;
    workloadRows.forEach(function (row) {
      var taskId = aliasValue(row, "taskId");
      if (!taskId) {
        missingTaskIds += 1;
        return;
      }
      if (taskIds[taskId]) {
        duplicateTaskIds += 1;
        return;
      }
      taskIds[taskId] = true;
      var brandId = workloadBrandId(row);
      var minutes = physicalWorkMinutes(row);
      if (brandId && minutes > 0) {
        totals[brandId] += minutes;
        supportedRows += 1;
      }
    });
    if (importStatus.workload) {
      if (missingTaskIds) {
        importStatus.workload.blockers.push(missingTaskIds + " workload row(s) are missing TASK_ID.");
      }
      if (duplicateTaskIds) {
        importStatus.workload.blockers.push(duplicateTaskIds + " duplicate TASK_ID row(s) were excluded.");
      }
      if (!supportedRows) {
        importStatus.workload.blockers.push("No physical rows contain explicit APPROVED, VERIFIED, or SUPPORTED status, source IDs, and source-provided total minutes.");
      }
    }
    state.labor.forEach(function (row) {
      row.demand = round((totals[row.id] || 0) / 60, 2);
    });
    state.workloadSource = {
      filename: sourceName,
      rows: workloadRows.length,
      supportedPhysicalRows: supportedRows,
      gate: importStatus.workload,
      loadedAt: new Date().toISOString()
    };
    renderLabor();
    saveState();
    if (supportedRows) {
      showToast(supportedRows + " source-qualified physical workload row(s) populated draft demand.");
    } else {
      showToast("No physical workload rows with explicit source verification were found. Draft demand stayed at zero.");
    }
  }

  function rowKey(row, index, side) {
    var key = aliasValue(row, "key");
    var store = aliasValue(row, "store");
    if (key) {
      return (store ? normalizeStoreId(store) + "_" : "") +
        String(key).trim().toUpperCase();
    }
    return "";
  }

  function canonicalCoordinate(value) {
    if (String(value == null ? "" : value).trim() === "") {
      return "";
    }
    var numeric = strictNumericValue(value);
    return numeric === null ? "INVALID" : String(round(numeric, 3));
  }

  function rowLocation(row) {
    var room = aliasValue(row, "room").trim().toUpperCase();
    var zone = aliasValue(row, "zone").trim().toUpperCase();
    var x = canonicalCoordinate(aliasValue(row, "x"));
    var y = canonicalCoordinate(aliasValue(row, "y"));
    var pieces = [];
    if (room) { pieces.push(room); }
    if (zone) { pieces.push(zone); }
    if (x || y) { pieces.push("x:" + (x || "?") + " y:" + (y || "?")); }
    return pieces.join(" / ") || "Location not supplied";
  }

  function rowSignature(row) {
    var keys = Object.keys(row || {}).filter(function (key) {
      return /^(ACTION|CHANGE_TYPE|PAYROLL_ACTION|MOVE_TYPE|QUANTITY|QTY|UNITS|COUNT|DESCRIPTION|FIXTURE_NAME|PRESENTATION|STYLE_DESCRIPTION|FIXTURE_TYPE|COLLECTION|EMOTIONAL_SPACE|CABINET_ID|SURFACE_ID|ASSET_ID|ASSET_FILE|ASSET_FILE_PATH|ECAB_CAPACITY|CAPACITY)$/.test(key);
    }).sort();
    var signature = keys.map(function (key) {
      return key + "=" + String(row[key] == null ? "" : row[key]).trim();
    });
    signature.push("WIDTH=" + canonicalCoordinate(aliasValue(row, "width")));
    signature.push("HEIGHT=" + canonicalCoordinate(aliasValue(row, "height")));
    return signature.join("\u001f");
  }

  function supportedMinutes(row) {
    if (!physicalAction(row) || !sourceQualifiedEvidence(row) || !aliasValue(row, "sourceIds")) {
      return 0;
    }
    var totalValue = aliasValue(row, "totalMinutes");
    if (totalValue !== "") {
      return Math.max(0, toNumber(totalValue));
    }
    var baseValue = aliasValue(row, "baseMinutes");
    var unitValue = aliasValue(row, "unitMinutes");
    var quantityValue = aliasValue(row, "quantity");
    if (baseValue === "" && unitValue === "") {
      return 0;
    }
    var quantity = quantityValue === "" ? 1 : Math.max(0, toNumber(quantityValue));
    return Math.max(0, toNumber(baseValue) + (quantity * Math.max(0, toNumber(unitValue))));
  }

  function keyedRows(rows, side) {
    var map = {};
    var duplicates = [];
    var missing = 0;
    rows.forEach(function (row, index) {
      var key = rowKey(row, index, side);
      if (!key) {
        missing += 1;
        return;
      }
      if (map[key]) {
        duplicates.push(key);
        return;
      }
      map[key] = row;
    });
    return { map: map, duplicates: duplicates, missing: missing };
  }

  function compareRows() {
    if (!priorRows.length || !currentRows.length) {
      changes = [];
      renderChanges();
      return;
    }
    var prior = keyedRows(priorRows, "prior");
    var current = keyedRows(currentRows, "current");
    comparisonBlockers = [];
    if (prior.missing || current.missing) {
      comparisonBlockers.push(
        (prior.missing + current.missing) + " map row(s) are missing a stable fixture key."
      );
    }
    if (prior.duplicates.length || current.duplicates.length) {
      comparisonBlockers.push(
        (prior.duplicates.length + current.duplicates.length) + " duplicate fixture key(s) were excluded."
      );
    }
    var keys = {};
    Object.keys(prior.map).forEach(function (key) { keys[key] = true; });
    Object.keys(current.map).forEach(function (key) { keys[key] = true; });

    changes = Object.keys(keys).sort().map(function (key) {
      var before = prior.map[key];
      var after = current.map[key];
      var status;
      var minutes;
      if (!before) {
        status = "new";
        minutes = supportedMinutes(after);
      } else if (!after) {
        status = "removed";
        minutes = supportedMinutes(before);
      } else if (rowLocation(before) !== rowLocation(after)) {
        status = "moved";
        minutes = supportedMinutes(after);
      } else if (rowSignature(before) !== rowSignature(after)) {
        status = "changed";
        minutes = supportedMinutes(after);
      } else {
        status = "unchanged";
        minutes = 0;
      }
      return {
        status: status,
        key: key,
        prior: before ? rowLocation(before) : "—",
        current: after ? rowLocation(after) : "—",
        minutes: round(minutes, 2),
        description: aliasValue(after || before, "description") || ""
      };
    });

    if (comparisonBlockers.length) {
      showToast(comparisonBlockers.join(" "));
    }
    renderChanges();
    renderGateStatus();
  }

  function renderChanges() {
    var statuses = ["new", "moved", "changed", "removed", "unchanged"];
    statuses.forEach(function (status) {
      text("[data-metric-" + status + "]", changes.filter(function (change) {
        return change.status === status;
      }).length);
    });
    var totalMinutes = changes.reduce(function (sum, change) {
      return sum + (Number(change.minutes) || 0);
    }, 0);
    text("[data-metric-hours]", round(totalMinutes / 60, 1).toFixed(1) + "h");

    var tbody = $("[data-change-rows]");
    if (!tbody) {
      return;
    }
    var filter = ($("[data-change-filter]") || {}).value || "all";
    var visible = changes.filter(function (change) {
      return filter === "all" || change.status === filter;
    });
    if (!visible.length) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="5">' +
        (changes.length ? "No records match this filter." : "Load prior and current map CSVs to build the movement register.") +
        "</td></tr>";
      return;
    }
    tbody.innerHTML = visible.slice(0, 250).map(function (change) {
      return "<tr><td><span class=\"status-pill status-" + escapeHtml(change.status) + "\">" +
        escapeHtml(change.status) + "</span></td><td><strong>" +
        escapeHtml(change.key) + "</strong>" +
        (change.description ? "<br><small>" + escapeHtml(change.description) + "</small>" : "") +
        "</td><td>" + escapeHtml(change.prior) + "</td><td>" +
        escapeHtml(change.current) + "</td><td>" + escapeHtml(String(change.minutes)) + "</td></tr>";
    }).join("");
  }

  function renderCalendar() {
    var track = $("[data-calendar-track]");
    if (!track) {
      return;
    }
    var events = safeArray(defaults.floorsets);
    var activeIndex = Math.max(0, events.findIndex(function (event) { return event.date === state.floorset; }));
    var start = Math.max(0, Math.min(activeIndex - 2, Math.max(0, events.length - 7)));
    var visible = events.slice(start, start + 7);
    track.innerHTML = visible.length ? visible.map(function (event) {
      return '<button class="calendar-date ' + (event.date === state.floorset ? "is-selected" : "") +
        '" type="button" data-calendar-date="' + escapeHtml(event.date) + '">' +
        "<span>" + escapeHtml(event.phase) + "</span><b>" + escapeHtml(event.label) +
        "</b><small>" + escapeHtml(event.date) + "</small></button>";
    }).join("") : '<p class="calendar-empty">No embedded fallback dates are used. Run the Resource Center refresh to load FLOORSET_CALENDAR.csv.</p>';
    var selected = selectedFloorEvent();
    text("[data-calendar-title]", selected.label + " / " + selected.phase);
    var supportDate = $("[data-support-form] input[name='date']");
    if (supportDate) {
      supportDate.value = state.floorset;
    }
  }

  function renderRole() {
    var role = safeArray(defaults.roles).filter(function (candidate) {
      return candidate.id === state.role;
    })[0] || safeArray(defaults.roles)[0];
    if (!role) {
      return;
    }
    text("[data-role-title]", role.label);
    text("[data-role-scope]", role.scope);
    text("[data-role-boundary]", "Boundary: " + safeArray(role.restrictions).join(" · "));
    var list = $("[data-role-permissions]");
    if (list) {
      list.innerHTML = safeArray(role.permissions).map(function (permission) {
        return "<li>" + escapeHtml(permission) + "</li>";
      }).join("");
    }
  }

  function renderGateStatus() {
    var blockers = [];
    if (!state.store) {
      blockers.push("Choose an indexed store.");
    }
    if (!state.floorset) {
      blockers.push("Refresh the Resource Center to load FLOORSET_CALENDAR.csv, then choose a floorset.");
    }
    if (!state.tier) {
      blockers.push("Choose the Beauty tier.");
    }
    if (!selectedPrototype()) {
      blockers.push("No candidate exists for the selected tier.");
    } else if (!/^(?:APPROVED|VERIFIED)$/.test(sourceStatus(selectedPrototype()))) {
      blockers.push(
        "Prototype status is " + sourceStatus(selectedPrototype()) +
        "; accountable approval is not recorded in the indexed metadata."
      );
    }
    if (!priorRows.length) {
      blockers.push("Load the prior map export.");
    }
    if (!currentRows.length) {
      blockers.push("Load the current map export.");
    }
    ["previous", "current", "workload"].forEach(function (kind) {
      var status = importStatus[kind];
      if (status && status.blockers && status.blockers.length) {
        status.blockers.forEach(function (blocker) {
          blockers.push(titleFromFile(status.filename) + ": " + blocker);
        });
      }
    });
    comparisonBlockers.forEach(function (blocker) {
      blockers.push("Map comparison: " + blocker);
    });
    if (state.supportRequest && state.supportRequest.final_status === "DRAFT_BLOCKED") {
      safeArray(state.supportRequest.blockers).forEach(function (blocker) {
        blockers.push("Support request: " + blocker);
      });
    }
    gateBlockers = Array.from(new Set(blockers));

    var card = $("[data-gate-card]");
    var list = $("[data-gate-blockers]");
    text("[data-gate-title]", gateBlockers.length
      ? "DRAFT_BLOCKED / " + gateBlockers.length + " open gate(s)"
      : "DRAFT_COMPLETE_FOR_REVIEW");
    if (card) {
      card.classList.toggle("is-ready", gateBlockers.length === 0);
    }
    if (list) {
      list.innerHTML = gateBlockers.length
        ? gateBlockers.map(function (blocker) {
            return "<li>" + escapeHtml(blocker) + "</li>";
          }).join("")
        : "<li>Draft completeness checks passed. This is not source approval; accountable owners still verify and decide outside this concept demo.</li>";
    }
  }

  function ensureLaborState() {
    var definitions = safeArray(defaults.brandRows);
    var existing = safeArray(state.labor);
    state.labor = definitions.map(function (definition) {
      var saved = existing.filter(function (row) { return row.id === definition.id; })[0] || {};
      return {
        id: definition.id,
        label: definition.label,
        demand: Math.max(0, toNumber(saved.demand)),
        scheduled: Math.max(0, toNumber(saved.scheduled))
      };
    });
  }

  function renderLabor() {
    ensureLaborState();
    var container = $("[data-labor-rows]");
    if (container) {
      container.innerHTML = state.labor.map(function (row) {
        var delta = round(row.scheduled - row.demand, 2);
        var resultClass = delta < 0 ? "is-short" : (delta > 0 ? "is-surplus" : "");
        var resultText = delta < 0
          ? Math.abs(delta).toFixed(1) + "h shortage"
          : (delta > 0 ? delta.toFixed(1) + "h possible capacity" : "Balanced");
        return '<div class="labor-row" data-labor-row="' + escapeHtml(row.id) + '">' +
          "<strong>" + escapeHtml(row.label) + "</strong>" +
          '<label>Demand<input type="number" min="0" step="0.25" value="' +
          escapeHtml(String(row.demand)) + '" data-hours="demand"></label>' +
          '<label>Scheduled<input type="number" min="0" step="0.25" value="' +
          escapeHtml(String(row.scheduled)) + '" data-hours="scheduled"></label>' +
          '<div class="labor-result ' + resultClass + '">' + escapeHtml(resultText) + "</div></div>";
      }).join("");
    }
    var totalDemand = state.labor.reduce(function (sum, row) { return sum + row.demand; }, 0);
    var totalScheduled = state.labor.reduce(function (sum, row) { return sum + row.scheduled; }, 0);
    var totalShortage = state.labor.reduce(function (sum, row) {
      return sum + Math.max(0, row.demand - row.scheduled);
    }, 0);
    var totalSurplus = state.labor.reduce(function (sum, row) {
      return sum + Math.max(0, row.scheduled - row.demand);
    }, 0);
    text("[data-total-demand]", totalDemand.toFixed(1) + "h");
    text("[data-total-scheduled]", totalScheduled.toFixed(1) + "h");
    text("[data-total-shortage]", totalShortage.toFixed(1) + "h");
    text("[data-potential-support]", Math.min(totalShortage, totalSurplus).toFixed(1) + "h");
    populateSupportBrands();
  }

  function populateSupportBrands() {
    var options = state.labor.map(function (row) {
      return '<option value="' + escapeHtml(row.id) + '">' + escapeHtml(row.label) + "</option>";
    }).join("");
    var receiving = $("[data-receiving-brand]");
    var supporting = $("[data-supporting-brand]");
    var receivingValue = receiving ? receiving.value : "";
    var supportingValue = supporting ? supporting.value : "";
    if (receiving) {
      receiving.innerHTML = options;
      receiving.value = receivingValue || "beauty";
    }
    if (supporting) {
      supporting.innerHTML = options;
      supporting.value = supportingValue || "vs";
    }
  }

  function formValues(form) {
    var output = {};
    Array.prototype.forEach.call(form.elements, function (element) {
      if (!element.name) {
        return;
      }
      output[element.name] = element.type === "checkbox" ? element.checked : element.value;
    });
    return output;
  }

  function buildSupportRequest(form) {
    var values = formValues(form);
    var receiving = state.labor.filter(function (row) { return row.id === values.receivingBrand; })[0];
    var supporting = state.labor.filter(function (row) { return row.id === values.supportingBrand; })[0];
    var hours = Math.max(0, toNumber(values.hours));
    var protectedCoverage = Math.max(0, toNumber(values.protectedCoverage));
    var otherCommitments = Math.max(0, toNumber(values.otherCommitments));
    var deficit = receiving ? Math.max(0, receiving.demand - receiving.scheduled) : 0;
    var available = supporting
      ? Math.max(0, supporting.scheduled - supporting.demand - protectedCoverage - otherCommitments)
      : 0;
    var maximumSupport = Math.min(deficit, available);
    var blockers = [];
    var supportingStore = String(values.supportingStore || "").trim();
    var taskScope = String(values.work || "").trim();
    var locationGroup = String(values.locationGroup || "").trim();

    if (!state.store) { blockers.push("Select the requesting store."); }
    if (!receiving || !supporting) { blockers.push("Select both brands."); }
    if (receiving && supporting && receiving.id === supporting.id) {
      blockers.push("Receiving and supporting brands must be different.");
    }
    if (!/^[0-9]{3,5}$/.test(supportingStore)) {
      blockers.push("Enter the exact 3–5 digit supporting store number.");
    } else if (normalizeStoreId(supportingStore) === normalizeStoreId(state.store)) {
      blockers.push("Supporting store must be distinct from the requesting store.");
    }
    if (!locationGroup) { blockers.push("Enter the proposed location group for this draft scenario."); }
    if (!taskScope) { blockers.push("Describe the physical work and required skill."); }
    if (hours <= 0) { blockers.push("Requested hours must be greater than zero."); }
    if (values.date !== state.floorset) {
      blockers.push("The request date must match the active floorset.");
    }
    if (!values.sameMall) { blockers.push("Confirm the user-entered partner-store relationship for owner review."); }
    if (!values.skillReady) { blockers.push("Confirm the draft assumes the required supporting skill."); }
    if (deficit <= 0) { blockers.push("The receiving brand has no calculated shortage."); }
    if (available <= 0) { blockers.push("No support remains after protected coverage and other commitments."); }
    if (hours > maximumSupport) {
      blockers.push("Requested hours exceed the illustrative scenario maximum of " + maximumSupport.toFixed(2) + "h.");
    }

    var blocked = blockers.length > 0;
    var request = {
      request_id: "SET-" + String(Date.now()),
      location_group_id: locationGroup || "NOT_VERIFIED",
      requesting_store: state.store || "NOT_SELECTED",
      requesting_brand: receiving ? receiving.label : values.receivingBrand,
      supporting_store: supportingStore || "NOT_SELECTED",
      supporting_brand: supporting ? supporting.label : values.supportingBrand,
      execution_date: values.date || state.floorset,
      requested_hours: hours,
      task_scope: taskScope || "NOT_SUPPLIED",
      estimated_deficit: round(deficit, 2),
      protected_coverage_hours: round(protectedCoverage, 2),
      other_committed_hours: round(otherCommitments, 2),
      available_support_hours: round(available, 2),
      governed_maximum_hours: round(maximumSupport, 2),
      same_mall_validated: Boolean(values.sameMall),
      skill_ready: Boolean(values.skillReady),
      scenario_authority: "USER_ENTERED_NOT_GOVERNED_VALIDATED_OR_APPROVED",
      compatibility_note: "governed_maximum_hours and same_mall_validated are retained field names; values are draft user-entered scenario outputs pending owner verification",
      sending_leader_status: blocked ? "NOT_READY" : "PENDING",
      receiving_leader_status: blocked ? "NOT_READY" : "PENDING",
      district_status: blocked ? "NOT_READY" : "PENDING",
      finance_status: blocked ? "NOT_READY" : "PENDING",
      policy_escalation_required: "OWNER_TO_CONFIRM",
      blockers: blockers,
      final_status: blocked ? "DRAFT_BLOCKED" : "DRAFT_COMPLETE_FOR_REVIEW"
    };
    state.supportRequest = request;
    saveState();
    var result = $("[data-support-result]");
    if (result) {
      result.classList.toggle("is-ready", !blocked);
      result.classList.toggle("is-blocked", blocked);
      result.textContent =
        request.request_id + "\n" +
        request.requesting_store + " / " + request.requesting_brand +
        " requests " + hours.toFixed(2) + "h from " + request.supporting_brand +
        " / Store " + request.supporting_store +
        " on " + request.execution_date + ".\n" +
        "Work: " + request.task_scope + "\n" +
        "Deficit: " + deficit.toFixed(2) + "h · available after protected coverage: " +
        available.toFixed(2) + "h · illustrative scenario maximum: " + maximumSupport.toFixed(2) + "h.\n" +
        "Status: " + request.final_status +
        (blocked
          ? "\nBlockers: " + blockers.join(" · ")
          : "\nDraft only. Next review: both store leaders → district leader → payroll/timekeeping owner.");
    }
    renderGateStatus();
    showToast(blocked
      ? "Blocked draft built. Resolve every listed gate before submission."
      : "Draft complete for review. It is not validated or approved, and no person or payroll was moved.");
  }

  function downloadFile(name, content, type) {
    var blob = new Blob([content], { type: type || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function csvCell(value) {
    var output = String(value == null ? "" : value);
    var trimmed = output.replace(/^[\u0000-\u0020]+/, "");
    var numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed);
    if (!numeric && (/^[=+\-@]/.test(trimmed) || /^[\t\r\n]/.test(output))) {
      output = "'" + output;
    }
    return '"' + output.replace(/"/g, '""') + '"';
  }

  function downloadMovements() {
    if (!changes.length) {
      showToast("Load both map CSVs before exporting the movement register.");
      return;
    }
    var mapGateBlockers = comparisonBlockers.slice();
    ["previous", "current"].forEach(function (kind) {
      if (importStatus[kind]) {
        mapGateBlockers = mapGateBlockers.concat(importStatus[kind].blockers || []);
      }
    });
    if (mapGateBlockers.length) {
      showToast("Movement export is blocked until store, floorset, schema, and fixture-key gates pass.");
      return;
    }
    var rows = [["STATUS", "FIXTURE_KEY", "PRIOR_LOCATION", "CURRENT_LOCATION", "SUPPORTED_MINUTES", "DESCRIPTION"]];
    changes.forEach(function (change) {
      rows.push([change.status, change.key, change.prior, change.current, change.minutes, change.description]);
    });
    var csv = rows.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n");
    downloadFile("BEAUTY_MOVEMENT_" + (state.store || "STORE") + "_" + state.floorset + ".csv", csv, "text/csv;charset=utf-8");
  }

  function sessionExport() {
    renderGateStatus();
    return {
      export_type: "SET_BEAUTY_PILOT_HANDOFF",
      schema_version: 1,
      generated_at: new Date().toISOString(),
      boundary: "LOCAL_PLANNING_PROOF_NOT_ENTERPRISE_APPROVAL",
      release_status: gateBlockers.length ? "DRAFT_BLOCKED" : "DRAFT_COMPLETE_FOR_REVIEW",
      access_enforcement: "CONCEPT_ONLY_NOT_AUTHENTICATED",
      blockers: gateBlockers,
      session: state,
      selected_prototype: selectedPrototype(),
      source_imports: importStatus,
      source_coverage: safeArray(defaults.sourceKinds).map(function (kind) {
        return { kind: kind.id, indexed_count: filesForKind(kind.id).length };
      }),
      movement_summary: ["new", "moved", "changed", "removed", "unchanged"].reduce(function (output, status) {
        output[status] = changes.filter(function (change) { return change.status === status; }).length;
        return output;
      }, {}),
      movements: changes,
      approvals_required: [
        "Business owner validates sources and Beauty direction",
        "Space Planning approves structural movement and ADA exceptions",
        "Marketing approves campaign content",
        "District leader approves cross-store support",
        "Payroll/timekeeping owner confirms routing before any cross-brand work"
      ]
    };
  }

  function groundedPrompt() {
    var event = selectedFloorEvent();
    var prototype = selectedPrototype();
    renderGateStatus();
    var sourceSummary = safeArray(defaults.sourceKinds).map(function (kind) {
      var candidates = filesForKind(kind.id).slice(0, 5).map(function (file) {
        var modified = Number(file.modified)
          ? new Date(Number(file.modified) * 1000).toISOString()
          : "modified date not indexed";
        return displayValue(file.name || file.path) + " (" + modified + ")";
      });
      return kind.label + ": " + (candidates.length ? candidates.join(", ") : "none indexed");
    }).join("; ");
    return [
      "Act as a bounded SET Beauty planning assistant.",
      "Role view: " + state.role + ". Store: " + (state.store || "NOT SELECTED") +
        ". Floorset: " + event.label + " (" + state.floorset + "). Tier: " + (state.tier || "NOT SELECTED") + ".",
      "Indexed prototype candidate: " + (prototype
        ? displayValue(prototype.path || "") + " (indexed status: " + sourceStatus(prototype) + ")"
        : "NOT VERIFIED / NOT SELECTED") + ".",
      "Source coverage: " + sourceSummary + ".",
      "Imported evidence: " + JSON.stringify(importStatus) + ".",
      "Release gate: " + (gateBlockers.length ? "DRAFT_BLOCKED — " + gateBlockers.join(" | ") : "DRAFT_COMPLETE_FOR_REVIEW") + ".",
      "Movement counts: " + ["new", "moved", "changed", "removed", "unchanged"].map(function (status) {
        return status + "=" + changes.filter(function (change) { return change.status === status; }).length;
      }).join(", ") + ".",
      "An indexed filename is only a candidate, not approval. Treat it as fact only when the supplied evidence explicitly establishes accountable-owner approval or source verification; otherwise label it NOT VERIFIED. Cite filename and modified date beside every conclusion.",
      "Keep Blue Yonder/Space Planning architecture authoritative. Do not invent tier, style, capacity, time, ADA, marketing, labor, approval, or availability data.",
      "Separate verified facts, supported calculations, planning assumptions, and decisions requiring an accountable owner.",
      "For cross-store support, suggest a request only. Never claim that a person, payroll, or cost center has been transferred.",
      "Question: Build the Beauty floorset staging plan, list store-specific movements, identify missing sources or blockers, and prepare the leader approval checklist."
    ].join("\n\n");
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        showToast("Grounded Beauty prompt copied.");
      }).catch(function () {
        fallbackCopy(value);
      });
    } else {
      fallbackCopy(value);
    }
  }

  function fallbackCopy(value) {
    var textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showToast("Grounded Beauty prompt copied.");
    } catch (error) {
      showToast("Copy was blocked. Download the session JSON instead.");
    }
    document.body.removeChild(textarea);
  }

  function openBestTool() {
    var control = resource.controls && resource.controls.start;
    var exact = control &&
      control.verified === true &&
      displayValue(control.name || "") === "START_SET_LOOP_SESSION.command" &&
      displayValue(control.path || "") === "00_START/START_SET_LOOP_SESSION.command" &&
      String(control.runMode || "").toUpperCase() === "FINDER_ONLY" &&
      Boolean(safeRelativeHref(control.folderHref));
    if (!exact) {
      showToast("The verified SET Loop session control is unavailable. No similarly named command was substituted.");
      return;
    }
    var browseHref = safeRelativeHref(control.folderHref);
    showToast("Browse 00_START, then use Finder to double-click START_SET_LOOP_SESSION.command.");
    window.location.href = browseHref;
  }

  function updateAll() {
    updatePrototype();
    updateSnapshot();
    renderSources();
    renderCalendar();
    renderRole();
    renderLabor();
    renderGateStatus();
  }

  function setContextValue(field, value) {
    var nextValue = value || "";
    if (state[field] === nextValue) {
      return;
    }
    if (field === "store" || field === "floorset") {
      resetImportedEvidence();
      showToast("Store/floorset changed. Imported evidence and hours were cleared to prevent context bleed.");
    }
    state[field] = nextValue;
    if (field === "store") {
      populateTiers();
    }
  }

  function bindEvents() {
    var sessionForm = $("[data-session-form]");
    if (sessionForm) {
      sessionForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var values = formValues(sessionForm);
        if (state.store !== (values.store || "") ||
            state.floorset !== (values.floorset || state.floorset)) {
          resetImportedEvidence();
        }
        state.store = values.store || "";
        state.floorset = values.floorset || state.floorset;
        state.tier = values.tier || "";
        state.role = values.role || state.role;
        state.note = values.note || "";
        updateAll();
        saveState("Beauty session saved on this computer.");
      });
      ["store", "floorset", "tier", "role"].forEach(function (field) {
        sessionForm.elements[field].addEventListener("change", function () {
          setContextValue(field, sessionForm.elements[field].value || "");
          updateAll();
          saveState();
        });
      });
      sessionForm.elements.note.addEventListener("input", function () {
        state.note = sessionForm.elements.note.value || "";
        saveState();
      });
    }

    document.addEventListener("click", function (event) {
      var sourceTrigger = event.target.closest("[data-open-source-kind]");
      if (sourceTrigger) {
        event.preventDefault();
        openSourceDrawer(sourceTrigger.getAttribute("data-open-source-kind"), sourceTrigger);
        return;
      }
      var dateTrigger = event.target.closest("[data-calendar-date]");
      if (dateTrigger) {
        setContextValue("floorset", dateTrigger.getAttribute("data-calendar-date"));
        var floorSelect = $("[data-floorset-select]");
        if (floorSelect) { floorSelect.value = state.floorset; }
        updateAll();
        saveState();
      }
    });

    $$("[data-close-source-drawer]").forEach(function (button) {
      button.addEventListener("click", closeSourceDrawer);
    });

    var previousInput = $("[data-import-previous]");
    var currentInput = $("[data-import-current]");
    var workloadInput = $("[data-import-workload]");
    if (previousInput) {
      previousInput.addEventListener("change", function () {
        importCsv(previousInput.files && previousInput.files[0], "previous");
      });
    }
    if (currentInput) {
      currentInput.addEventListener("change", function () {
        importCsv(currentInput.files && currentInput.files[0], "current");
      });
    }
    if (workloadInput) {
      workloadInput.addEventListener("change", function () {
        importCsv(workloadInput.files && workloadInput.files[0], "workload");
      });
    }

    var filter = $("[data-change-filter]");
    if (filter) {
      filter.addEventListener("change", renderChanges);
    }

    var next = $("[data-calendar-next]");
    if (next) {
      next.addEventListener("click", function () {
        var events = safeArray(defaults.floorsets);
        if (!events.length) {
          showToast("No indexed calendar is loaded. Run the Resource Center refresh.");
          return;
        }
        var index = events.findIndex(function (event) { return event.date === state.floorset; });
        setContextValue("floorset", events[(index + 1 + events.length) % events.length].date);
        var floorSelect = $("[data-floorset-select]");
        if (floorSelect) { floorSelect.value = state.floorset; }
        updateAll();
        saveState();
      });
    }

    var laborRows = $("[data-labor-rows]");
    if (laborRows) {
      laborRows.addEventListener("change", function (event) {
        var input = event.target.closest("[data-hours]");
        var rowElement = event.target.closest("[data-labor-row]");
        if (!input || !rowElement) {
          return;
        }
        var row = state.labor.filter(function (item) {
          return item.id === rowElement.getAttribute("data-labor-row");
        })[0];
        if (row) {
          row[input.getAttribute("data-hours")] = Math.max(0, toNumber(input.value));
          renderLabor();
          saveState();
        }
      });
    }

    var clearHours = $("[data-clear-hours]");
    if (clearHours) {
      clearHours.addEventListener("click", function () {
        state.labor.forEach(function (row) {
          row.demand = 0;
          row.scheduled = 0;
        });
        renderLabor();
        saveState("Hours cleared. No source data was changed.");
      });
    }

    var supportForm = $("[data-support-form]");
    if (supportForm) {
      supportForm.addEventListener("submit", function (event) {
        event.preventDefault();
        buildSupportRequest(supportForm);
      });
    }

    var bestTool = $("[data-open-best-tool]");
    if (bestTool) {
      bestTool.textContent = "Browse SET Loop session control";
      bestTool.title = "Use Finder to double-click the verified START_SET_LOOP_SESSION.command file.";
      bestTool.addEventListener("click", openBestTool);
    }

    var downloadSession = $("[data-download-session]");
    if (downloadSession) {
      downloadSession.addEventListener("click", function () {
        downloadFile(
          "SET_BEAUTY_SESSION_" + (state.store || "STORE") + "_" + state.floorset + ".json",
          JSON.stringify(sessionExport(), null, 2),
          "application/json;charset=utf-8"
        );
      });
    }

    var downloadMovement = $("[data-download-movements]");
    if (downloadMovement) {
      downloadMovement.addEventListener("click", downloadMovements);
    }

    var copyAi = $("[data-copy-ai]");
    if (copyAi) {
      copyAi.addEventListener("click", function () { copyText(groundedPrompt()); });
    }

    var print = $("[data-print]");
    if (print) {
      print.addEventListener("click", function () { window.print(); });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeSourceDrawer();
      }
      var drawer = $("[data-source-drawer]");
      if (event.key === "Tab" && drawer && !drawer.hidden) {
        var focusable = $$("a[href], button:not([disabled]), input, select, textarea", drawer).filter(function (element) {
          return element.offsetParent !== null;
        });
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
    });
  }

  populateStores();
  populateFloorsets();
  populateTiers();
  populateRoles();
  populateForm();
  renderStageOrder();
  updateAll();
  bindEvents();
}());
