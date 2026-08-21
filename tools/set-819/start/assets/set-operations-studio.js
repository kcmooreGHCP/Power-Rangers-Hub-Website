(function () {
  "use strict";

  var resource = window.SET_RESOURCE_INDEX || {};
  var sourceGroups = [
    {
      id: "map",
      label: "Store maps",
      kinds: ["map", "map-history", "working-map", "store-map"],
      note: "Working and prior map candidates for the exact store."
    },
    {
      id: "brand-guide",
      label: "Brand Guides",
      kinds: ["brand-guide", "execution-guide", "store-guide"],
      note: "Store execution and Brand Guide candidates for the exact context."
    },
    {
      id: "line-list",
      label: "Line lists",
      kinds: ["line-list", "linelist", "assortment"],
      note: "Tier or store-specific line-list and assortment candidates."
    },
    {
      id: "fixture",
      label: "Fixtures + registry",
      kinds: ["fixture", "fixture-registry", "fixture-finder"],
      note: "Fixture identities, capacities, visual assets, and finder outputs."
    },
    {
      id: "marketing",
      label: "Marketing / AdTrax",
      kinds: ["marketing", "adtrax", "pack-detail"],
      note: "Campaign and pack-detail sources; approval remains with the owner."
    },
    {
      id: "aem",
      label: "AEM assets",
      kinds: ["aem", "aem-asset", "asset"],
      note: "Indexed visual assets or Finder-linked asset locations."
    },
    {
      id: "media",
      label: "Photos + video",
      kinds: ["video", "media", "store-photo", "video-library"],
      note: "Store proof, walkthroughs, and local presentation media."
    },
    {
      id: "payroll",
      label: "Labor sources",
      kinds: ["payroll", "labor", "time-study", "workload"],
      note: "Workload and time-study candidates—not a payroll approval."
    },
    {
      id: "prototype",
      label: "Tier prototypes",
      kinds: ["beauty-prototype", "prototype"],
      note: "Brand and tier intent candidates for controlled review."
    },
    {
      id: "store-input",
      label: "Other store inputs",
      kinds: ["store-input", "reference", "other"],
      note: "Store-scoped CSV and reference inputs not yet assigned a more specific source role."
    }
  ];
  var brands = [
    { id: "vs", label: "Victoria's Secret" },
    { id: "beauty", label: "Beauty" },
    { id: "pink", label: "PINK" },
    { id: "pink-beauty", label: "PINK Beauty" },
    { id: "vsx", label: "VSX" }
  ];
  var selectedSourceGroup = "";
  var files = normalizeFiles();
  var stores = normalizeStores();
  var calendar = normalizeCalendar();
  var state = {
    store: chooseInitialStore(),
    floorset: chooseInitialFloorset(),
    brand: "all",
    labor: brands.map(function (brand) {
      return { id: brand.id, label: brand.label, demand: 0, scheduled: 0 };
    })
  };
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
    var result = String(value == null ? "" : value);
    if (!/%[0-9a-f]{2}/i.test(result)) {
      return result;
    }
    try {
      return decodeURIComponent(result);
    } catch (error) {
      return result;
    }
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

  function normalizeStoreId(value) {
    var match = String(value == null ? "" : value).match(/\d{3,5}/);
    if (!match) {
      return "";
    }
    return match[0].length <= 4 ? match[0].padStart(4, "0") : match[0];
  }

  function cleanStoreName(store) {
    var id = normalizeStoreId(store.id);
    var name = displayValue(store.name || store.label || "Indexed store folder");
    if (id) {
      name = name.replace(new RegExp("^\\s*(?:store\\s*)?0*" + id + "(?:\\s*[-—/:]\\s*|\\s+)", "i"), "");
    }
    return name || "Indexed store folder";
  }

  function inferStoreId(item) {
    var direct = normalizeStoreId(item.storeId || item.store || item.storeNumber);
    var path;
    var match;
    if (direct) {
      return direct;
    }
    path = displayValue((item.path || "") + "/" + (item.name || ""));
    match = path.match(/(?:^|\/)(?:store[_ -]*)?0*(\d{3,5})(?:\s+[^/]+)?(?:\/|$)/i) ||
      path.match(/(?:BY|STORE)[_-]?0*(\d{3,5})(?:[^0-9]|$)/i);
    return match ? normalizeStoreId(match[1]) : "";
  }

  function normalizeFiles() {
    var indexed = Array.isArray(resource.relevantFiles) ? resource.relevantFiles : resource.recentFiles;
    return safeArray(indexed).map(function (item) {
      var copy = {};
      Object.keys(item || {}).forEach(function (key) { copy[key] = item[key]; });
      copy.path = displayValue(copy.path || copy.name || "");
      copy.kind = String(copy.kind || copy.sourceRole || "reference").toLowerCase();
      copy.storeId = inferStoreId(copy);
      copy.floorsetId = displayValue(copy.floorsetId || copy.floorset || "");
      copy.tier = String(copy.tier || "").toUpperCase();
      copy.scope = String(copy.scope || (copy.storeId ? "STORE" : "WORKSPACE")).toUpperCase();
      return copy;
    }).filter(function (item) {
      return !/\/(?:90_ARCHIVE|99_ARCHIVE|99_BACKUPS|RESOURCE_CENTER_BACKUPS|project_sources)\//i.test("/" + item.path);
    });
  }

  function normalizeStores() {
    return safeArray(resource.stores).map(function (store) {
      return {
        id: normalizeStoreId(store.id || store.storeId),
        name: cleanStoreName(store),
        href: store.href || store.folderHref || "",
        raw: store
      };
    }).filter(function (store) {
      return Boolean(store.id);
    }).sort(function (left, right) {
      return left.id.localeCompare(right.id, undefined, { numeric: true });
    });
  }

  function normalizeCalendar() {
    var candidates = resource.floorsetCalendar || resource.calendarEvents || resource.calendar;
    var normalized = safeArray(candidates).map(function (event) {
      var date = displayValue(event.date || event.effectiveDate || event.floorsetDate || "");
      return {
        date: date,
        label: displayValue(event.label || event.floorset || shortDate(date)),
        phase: displayValue(event.phase || event.event || event.name || "Floorset / update"),
        brand: String(event.brand || "all").toLowerCase(),
        status: displayValue(event.approvalStatus || event.status || "INDEXED_LOCAL"),
        source: displayValue(event.source || event.path || "")
      };
    }).filter(function (event) {
      return Boolean(event.date);
    });
    return normalized;
  }

  function shortDate(date) {
    var parts = String(date || "").match(/^\d{4}-(\d{2})-(\d{2})$/);
    return parts ? Number(parts[1]) + "." + Number(parts[2]) : date;
  }

  function chooseInitialStore() {
    var requested = normalizeStoreId(resource.activeStore && resource.activeStore.id);
    if (requested && stores.some(function (store) { return store.id === requested; })) {
      return requested;
    }
    if (stores.some(function (store) { return store.id === "1392"; })) {
      return "1392";
    }
    return stores[0] ? stores[0].id : "";
  }

  function chooseInitialFloorset() {
    var requested = displayValue(resource.floorsetDate || "");
    if (requested && calendar.some(function (event) { return event.date === requested; })) {
      return requested;
    }
    return calendar[0] ? calendar[0].date : "";
  }

  function selectedStore() {
    return stores.filter(function (store) { return store.id === state.store; })[0] || null;
  }

  function selectedCalendarEvent() {
    return calendar.filter(function (event) { return event.date === state.floorset; })[0] ||
      calendar[0] || { date: "", label: "—", phase: "Not set" };
  }

  function fileBrand(item) {
    var explicit = String(item.brand || "").toLowerCase().replace(/\s+/g, "-");
    var haystack = (item.path + " " + item.kind).toLowerCase();
    if (explicit) {
      return explicit;
    }
    if (/pink.?beauty/.test(haystack)) { return "pink-beauty"; }
    if (/\bbeauty\b/.test(haystack)) { return "beauty"; }
    if (/\bpink\b/.test(haystack)) { return "pink"; }
    if (/\bvsx\b|\bsport\b/.test(haystack)) { return "vsx"; }
    if (/\bvs\b|victoria/.test(haystack)) { return "vs"; }
    return "all";
  }

  function floorsetMatches(item) {
    var value = String(item.floorsetId || "");
    var event = selectedCalendarEvent();
    if (!value) {
      return true;
    }
    return value === state.floorset || value === event.label ||
      value.replace(/^0+/, "") === event.label.replace(/^0+/, "");
  }

  function contextFiles() {
    return files.filter(function (item) {
      var storeMatches = !item.storeId || !state.store || item.storeId === state.store;
      var brand = fileBrand(item);
      var brandMatches = state.brand === "all" || brand === "all" || brand === state.brand;
      return storeMatches && brandMatches && floorsetMatches(item);
    });
  }

  function groupFiles(group) {
    return contextFiles().filter(function (item) {
      var kind = item.kind;
      var path = item.path.toLowerCase();
      if (group.kinds.indexOf(kind) !== -1) {
        return true;
      }
      if (group.id === "map") {
        return /\.(indd|pdf|csv)$/i.test(path) &&
          (/\bmap\b|working|total.?store|space.?planning/.test(path));
      }
      if (group.id === "brand-guide") {
        return /brand.?guide|execution.?guide|full.?store.?working/.test(path);
      }
      if (group.id === "line-list") {
        return /line.?list|visualization/.test(path);
      }
      if (group.id === "fixture") {
        return /fixture|vision.?matcher|registry/.test(path);
      }
      if (group.id === "marketing") {
        return /marketing|adtrax|pack.?detail/.test(path);
      }
      if (group.id === "aem") {
        return /aem|asset.?cache/.test(path);
      }
      if (group.id === "media") {
        return /photo|video|\.(mp4|mov|m4v|webm)$/i.test(path);
      }
      if (group.id === "payroll") {
        return /payroll|labor|time.?stud|workload/.test(path);
      }
      if (group.id === "prototype") {
        return /prototype|mock.?store/.test(path);
      }
      if (group.id === "store-input") {
        return Boolean(item.storeId) &&
          ["reference", "other", "store-input"].indexOf(kind) !== -1 &&
          /\.(?:csv|tsv|txt|pdf|indd)$/i.test(path);
      }
      return false;
    });
  }

  function approvalStatus(item) {
    var status = String(item.approvalStatus || item.status || "").toUpperCase();
    var local = String(item.localStatus || "").toUpperCase();
    if (/STALE|MODIFIED|CONFLICT/.test(status + " " + local)) {
      return "STALE OR MODIFIED";
    }
    if (/POINTER|ALIAS/.test(local) || /\salias$/i.test(fileName(item.path))) {
      return "FINDER-LINKED POINTER";
    }
    if (status === "APPROVED" || status === "VERIFIED") {
      return status;
    }
    if (["NOT_VERIFIED", "UNVERIFIED", "PENDING", "UNKNOWN"].indexOf(status) !== -1) {
      return "NOT VERIFIED";
    }
    if (item.storeId && state.store && item.storeId === state.store) {
      return "CONTEXT MATCHED";
    }
    if (/INDEXED/.test(local)) {
      return "INDEXED LOCAL";
    }
    return "NOT VERIFIED";
  }

  function safeHref(value) {
    var href = String(value || "");
    if (!href || /^(?:javascript|data|vbscript):/i.test(href)) {
      return "";
    }
    return href;
  }

  function localLink(item) {
    var href = safeHref(item.href || item.folderHref);
    return {
      href: href,
      label: item.href ? "Open →" : href ? "Browse folder →" : ""
    };
  }

  function populateControls() {
    var storeSelect = $("[data-store-select]");
    var floorSelect = $("[data-floorset-select]");
    if (storeSelect) {
      storeSelect.innerHTML = '<option value="">Choose indexed store</option>' +
        stores.map(function (store) {
          return '<option value="' + escapeHtml(store.id) + '">Store ' +
            escapeHtml(store.id) + " / " + escapeHtml(store.name) + "</option>";
        }).join("");
      storeSelect.value = state.store;
    }
    if (floorSelect) {
      floorSelect.innerHTML = calendar.length ? calendar.map(function (event) {
        return '<option value="' + escapeHtml(event.date) + '">' +
          escapeHtml(event.label + " / " + event.phase) + "</option>";
      }).join("") : '<option value="">Refresh to load FLOORSET_CALENDAR.csv</option>';
      floorSelect.value = state.floorset;
    }
  }

  function renderContext() {
    var store = selectedStore();
    var event = selectedCalendarEvent();
    var scoped = contextFiles();
    var navigation = resource.navigation || {};
    var diagnostics = resource.scanDiagnostics || resource.scan || {};
    text("[data-context-store]", store ? "Store " + store.id : "Choose store");
    text("[data-context-name]", store ? store.name : "Indexed local workspace");
    text("[data-context-floorset]", event.label || "—");
    text("[data-context-brand]", state.brand === "all" ? "All brands" :
      (brands.filter(function (brand) { return brand.id === state.brand; })[0] || {}).label || state.brand);
    text("[data-context-source-count]", String(scoped.length));
    text("[data-preview-sources]", scoped.length + " context candidate" + (scoped.length === 1 ? "" : "s"));
    text("[data-scan-state]", diagnostics.state || (navigation.ready ? "Complete" : "Needs refresh"));
    text("[data-store-count]", String(stores.length));
    text("[data-source-count]", String(scoped.length));
    text("[data-source-scope]", store ? "Store " + store.id + " + workspace-wide" : "Workspace-wide candidates");
    text("[data-line-list-count]", String(groupFiles(sourceGroups.filter(function (group) {
      return group.id === "line-list";
    })[0]).length));
    text("[data-map-count]", String(groupFiles(sourceGroups.filter(function (group) {
      return group.id === "map";
    })[0]).length));
    text("[data-pointer-count]", String(scoped.filter(function (item) {
      return approvalStatus(item) === "FINDER-LINKED POINTER";
    }).length));
  }

  function renderCalendar() {
    var track = $("[data-calendar-track]");
    var selected = selectedCalendarEvent();
    var activeIndex = Math.max(0, calendar.findIndex(function (event) {
      return event.date === state.floorset;
    }));
    var start = Math.max(0, Math.min(activeIndex - 2, Math.max(0, calendar.length - 7)));
    var visible = calendar.slice(start, start + 7);
    if (track) {
      track.innerHTML = visible.length ? visible.map(function (event) {
        return '<button class="calendar-card ' + (event.date === state.floorset ? "is-active" : "") +
          '" type="button" data-calendar-value="' + escapeHtml(event.date) + '" role="listitem">' +
          "<span>" + escapeHtml(event.phase) + "</span>" +
          "<b>" + escapeHtml(event.label) + "</b>" +
          "<small>" + escapeHtml(event.date) + "</small></button>";
      }).join("") : '<p class="calendar-empty">No indexed calendar is loaded. Run the Resource Center refresh to read FLOORSET_CALENDAR.csv.</p>';
    }
    text("[data-calendar-title]", selected.label + " / " + selected.phase);
    text("[data-preview-calendar]", selected.label + " / " + selected.phase);
    text("[data-calendar-date]", selected.date || "—");
    var indexedCalendar = safeArray(resource.floorsetCalendar || resource.calendarEvents || resource.calendar);
    text("[data-calendar-source]", indexedCalendar.length
      ? "Loaded from the indexed workspace calendar. Status: " + (selected.status || "INDEXED LOCAL") +
        (selected.source ? " · " + selected.source : "")
      : "No fallback dates are embedded. Run the Resource Center refresh to load the authoritative FLOORSET_CALENDAR.csv.");
  }

  function renderSourceOverview() {
    var container = $("[data-source-overview]");
    if (!container) {
      return;
    }
    container.innerHTML = sourceGroups.map(function (group) {
      var matched = groupFiles(group);
      var explicitApproved = matched.filter(function (item) {
        return /^(?:APPROVED|VERIFIED)$/.test(approvalStatus(item));
      }).length;
      return '<button class="source-card ' + (selectedSourceGroup === group.id ? "is-active" : "") +
        '" type="button" data-source-group="' + escapeHtml(group.id) + '">' +
        "<span>" + matched.length + " context candidate" + (matched.length === 1 ? "" : "s") +
        (explicitApproved ? " / " + explicitApproved + " explicit approval" : "") + "</span>" +
        "<strong>" + escapeHtml(group.label) + "</strong>" +
        "<p>" + escapeHtml(group.note) + "</p>" +
        "<b>" + (matched.length ? "Inspect evidence →" : "See requirement →") + "</b>" +
        "</button>";
    }).join("");
  }

  function renderSourceDetail(groupId) {
    var group = sourceGroups.filter(function (candidate) { return candidate.id === groupId; })[0];
    var container = $("[data-source-files]");
    if (!container || !group) {
      text("[data-source-detail-kicker]", "Context source detail");
      text("[data-source-detail-title]", "Select a source group");
      if (container) {
        container.innerHTML = "<p>Choose a source card to inspect its context-matched local candidates.</p>";
      }
      return;
    }
    var matched = groupFiles(group);
    text("[data-source-detail-kicker]", state.store ? "Store " + state.store + " + workspace sources" : "Workspace sources");
    text("[data-source-detail-title]", group.label);
    if (!matched.length) {
      container.innerHTML = "<p>No matching local candidate is indexed for this context. Missing does not mean the source does not exist elsewhere.</p>";
      return;
    }
    container.innerHTML = matched.map(function (item) {
      var link = localLink(item);
      return '<article class="source-file"><div><strong>' +
        escapeHtml(titleFromFile(item.name || item.path)) + "</strong>" +
        '<small class="file-status">' + escapeHtml(approvalStatus(item)) + "</small>" +
        "<small>" + escapeHtml(item.path) + "</small>" +
        "<small>" + escapeHtml([
          item.storeId ? "Store " + item.storeId : "Workspace-wide",
          item.floorsetId ? "Floorset " + item.floorsetId : "",
          item.tier ? "Tier " + item.tier : ""
        ].filter(Boolean).join(" · ")) + "</small></div>" +
        (link.href ? '<a href="' + escapeHtml(link.href) + '">' + link.label + "</a>" : "<span></span>") +
        "</article>";
    }).join("");
  }

  function renderLabor() {
    var tbody = $("[data-labor-rows]");
    var totalDemand = 0;
    var totalScheduled = 0;
    if (tbody) {
      tbody.innerHTML = state.labor.map(function (row) {
        var gap = row.scheduled - row.demand;
        totalDemand += row.demand;
        totalScheduled += row.scheduled;
        return '<tr data-labor-brand="' + escapeHtml(row.id) + '"><th scope="row">' +
          escapeHtml(row.label) + '</th><td><input type="number" min="0" step="0.25" inputmode="decimal" ' +
          'aria-label="' + escapeHtml(row.label) + ' demand hours" data-hour-field="demand" value="' +
          escapeHtml(row.demand.toFixed(2)) + '" /></td><td><input type="number" min="0" step="0.25" inputmode="decimal" ' +
          'aria-label="' + escapeHtml(row.label) + ' scheduled hours" data-hour-field="scheduled" value="' +
          escapeHtml(row.scheduled.toFixed(2)) + '" /></td><td class="' +
          (gap < 0 ? "gap-negative" : gap > 0 ? "gap-positive" : "") + '">' + gap.toFixed(2) +
          '</td><td><span class="state-chip">Scenario</span></td></tr>';
      }).join("");
    } else {
      state.labor.forEach(function (row) {
        totalDemand += row.demand;
        totalScheduled += row.scheduled;
      });
    }
    var gapTotal = totalScheduled - totalDemand;
    text("[data-total-demand]", totalDemand.toFixed(2));
    text("[data-total-scheduled]", totalScheduled.toFixed(2));
    text("[data-total-gap]", gapTotal.toFixed(2));
    if (!totalDemand && !totalScheduled) {
      text("[data-labor-signal]", "Enter hours to model the day.");
      text("[data-labor-detail]", "No source or approval is changed.");
      text("[data-preview-labor]", "Scenario only");
    } else if (gapTotal < 0) {
      text("[data-labor-signal]", Math.abs(gapTotal).toFixed(2) + " planning hours short.");
      text("[data-labor-detail]", "Review sequencing, assumptions, and the accountable approval path.");
      text("[data-preview-labor]", Math.abs(gapTotal).toFixed(2) + " h planning short");
    } else {
      text("[data-labor-signal]", gapTotal.toFixed(2) + " planning hours available.");
      text("[data-labor-detail]", "Availability is a scenario signal—not authorization to move people or payroll.");
      text("[data-preview-labor]", gapTotal.toFixed(2) + " h planning available");
    }
  }

  function resetLaborScenario() {
    state.labor.forEach(function (row) {
      row.demand = 0;
      row.scheduled = 0;
    });
  }

  function setContext(nextStore, nextFloorset, nextBrand) {
    var normalizedStore = normalizeStoreId(nextStore);
    var normalizedFloorset = String(nextFloorset || state.floorset || "");
    var normalizedBrand = String(nextBrand || "all");
    var laborContextChanged = normalizedStore !== state.store ||
      normalizedFloorset !== state.floorset;
    var storeSelect = $("[data-store-select]");
    var floorsetSelect = $("[data-floorset-select]");
    var brandSelect = $("[data-brand-select]");

    state.store = normalizedStore;
    state.floorset = normalizedFloorset;
    state.brand = normalizedBrand;
    selectedSourceGroup = "";

    if (laborContextChanged) {
      resetLaborScenario();
    }
    if (storeSelect) {
      storeSelect.value = state.store;
    }
    if (floorsetSelect) {
      floorsetSelect.value = state.floorset;
    }
    if (brandSelect) {
      brandSelect.value = state.brand;
    }

    renderAll();
    if (laborContextChanged) {
      showToast("Store or floorset changed. Planning hours were cleared so they cannot carry into a different context.");
    }
  }

  function laborRules() {
    return safeArray(resource.laborRules || resource.laborSupportRules || resource.payrollRules);
  }

  function renderLaborRules() {
    var rules = laborRules();
    var list = $("[data-labor-rules]");
    text("[data-labor-rule-count]", rules.length + " rule" + (rules.length === 1 ? "" : "s"));
    if (!list) {
      return;
    }
    list.innerHTML = rules.length ? rules.map(function (rule) {
      var name = displayValue(rule.name || rule.label || rule.id || "Labor guidance");
      var statement = displayValue(rule.text || rule.rule || rule.description || "");
      var status = displayValue(rule.approvalStatus || rule.status || "INDEXED LOCAL");
      var owner = displayValue(rule.requiredOwner || rule.owner || "");
      return "<li><strong>" + escapeHtml(status + " / " + name) + ":</strong> " +
        escapeHtml(statement || "Indexed guidance record") +
        (owner ? " <em>Owner: " + escapeHtml(owner) + ".</em>" : "") + "</li>";
    }).join("") : "<li>No indexed labor guidance is loaded. Use approved policy and accountable owners.</li>";
  }

  function findTool(patterns, kinds) {
    return files.filter(function (item) {
      var haystack = (item.path + " " + item.kind).toLowerCase();
      return kinds.indexOf(item.kind) !== -1 || patterns.some(function (pattern) {
        return pattern.test(haystack);
      });
    }).sort(function (left, right) {
      return (Number(right.modified) || 0) - (Number(left.modified) || 0);
    })[0] || null;
  }

  function renderTools() {
    var container = $("[data-tool-grid]");
    if (!container) {
      return;
    }
    var definitions = [
      {
        label: "Shared SET",
        title: "Resource Center",
        note: "Leadership story, workflow, videos, proof boundaries, and exact command guidance.",
        fixedHref: "./START_HERE.html",
        action: "Open Resource Center →"
      },
      {
        label: "Beauty / controlled workspace",
        title: "Beauty Studio",
        note: "Store-scoped source review, map comparison, workload scenario, and draft handoff.",
        fixedHref: "./BEAUTY_STUDIO.html",
        action: "Open Beauty Studio →"
      },
      {
        label: "Fixture evidence",
        title: "Fixture Finder",
        note: "Open the indexed fixture finder or its containing report folder.",
        item: findTool([/fixture.?finder/], ["fixture-finder"]),
        action: "Open indexed tool →"
      },
      {
        label: "Store evidence",
        title: "Store Registry",
        note: "Open the indexed store registry/matchback or its containing report folder.",
        item: findTool([/store.?registry|registry.?matchback/], ["store-registry"]),
        action: "Open indexed tool →"
      },
      {
        label: "Assortment evidence",
        title: "Line-list shelf",
        note: "Inspect line-list candidates already filtered to the active store, date, and brand context.",
        sourceGroup: "line-list",
        action: "Inspect line lists →"
      },
      {
        label: "Marketing / AdTrax",
        title: "Marketing source shelf",
        note: "Inspect Marketing and AdTrax candidates; AEM, store-photo, and video groups remain available in the source shelf above.",
        sourceGroup: "marketing",
        action: "Inspect marketing →"
      }
    ];
    container.innerHTML = definitions.map(function (definition) {
      var href = definition.fixedHref;
      if (!href && definition.item) {
        href = localLink(definition.item).href;
      }
      var available = Boolean(href || definition.sourceGroup);
      return '<article class="tool-card ' + (available ? "" : "is-missing") + '">' +
        "<span>" + escapeHtml(definition.label) + "</span>" +
        "<h3>" + escapeHtml(definition.title) + "</h3>" +
        "<p>" + escapeHtml(definition.note) + "</p>" +
        (href ? '<a href="' + escapeHtml(href) + '">' + escapeHtml(definition.action) + "</a>" :
          definition.sourceGroup ? '<a href="#sources" data-tool-source="' +
            escapeHtml(definition.sourceGroup) + '">' + escapeHtml(definition.action) + "</a>" :
            "<b>Not indexed in this workspace</b>") +
        "</article>";
    }).join("");
  }

  function renderAll() {
    renderContext();
    renderCalendar();
    renderSourceOverview();
    renderSourceDetail(selectedSourceGroup);
    renderLabor();
    renderLaborRules();
    renderTools();
  }

  function showToast(message) {
    var toast = $("[data-toast]");
    if (!toast) {
      return;
    }
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 3400);
  }

  function downloadLabor() {
    var event = selectedCalendarEvent();
    var rows = [
      ["status", "store", "floorset_date", "floorset_label", "brand", "demand_hours", "scheduled_hours", "planning_gap_hours"]
    ];
    state.labor.forEach(function (row) {
      rows.push([
        "SCENARIO_NOT_APPROVAL",
        state.store || "NOT_SELECTED",
        state.floorset || "",
        event.label || "",
        row.label,
        row.demand.toFixed(2),
        row.scheduled.toFixed(2),
        (row.scheduled - row.demand).toFixed(2)
      ]);
    });
    var csv = rows.map(function (row) {
      return row.map(function (value) {
        return '"' + String(value).replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\r\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var href = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = href;
    link.download = "SET_LABOR_SCENARIO_" + (state.store || "STORE") + "_" +
      (state.floorset || "DATE") + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
    showToast("Scenario CSV downloaded. It is not payroll approval or a staffing transfer.");
  }

  function bindEvents() {
    var form = $("[data-context-form]");
    if (form) {
      form.addEventListener("change", function () {
        setContext(
          form.elements.store.value || "",
          form.elements.floorset.value || state.floorset,
          form.elements.brand.value || "all"
        );
      });
    }
    document.addEventListener("click", function (event) {
      var calendarButton = event.target.closest("[data-calendar-value]");
      var sourceButton = event.target.closest("[data-source-group]");
      var toolSource = event.target.closest("[data-tool-source]");
      if (calendarButton) {
        setContext(
          state.store,
          calendarButton.getAttribute("data-calendar-value") || state.floorset,
          state.brand
        );
        return;
      }
      if (sourceButton) {
        selectedSourceGroup = sourceButton.getAttribute("data-source-group") || "";
        renderSourceOverview();
        renderSourceDetail(selectedSourceGroup);
        return;
      }
      if (toolSource) {
        selectedSourceGroup = toolSource.getAttribute("data-tool-source") || "";
        renderSourceOverview();
        renderSourceDetail(selectedSourceGroup);
      }
    });
    var next = $("[data-next-date]");
    if (next) {
      next.addEventListener("click", function () {
        if (!calendar.length) {
          showToast("No indexed calendar is loaded. Run the Resource Center refresh.");
          return;
        }
        var index = calendar.findIndex(function (event) { return event.date === state.floorset; });
        setContext(
          state.store,
          calendar[(index + 1 + calendar.length) % calendar.length].date,
          state.brand
        );
      });
    }
    var clearDetail = $("[data-clear-source-detail]");
    if (clearDetail) {
      clearDetail.addEventListener("click", function () {
        selectedSourceGroup = "";
        renderSourceOverview();
        renderSourceDetail("");
      });
    }
    var laborRows = $("[data-labor-rows]");
    if (laborRows) {
      laborRows.addEventListener("change", function (event) {
        var input = event.target.closest("[data-hour-field]");
        var row = event.target.closest("[data-labor-brand]");
        if (!input || !row) {
          return;
        }
        var model = state.labor.filter(function (candidate) {
          return candidate.id === row.getAttribute("data-labor-brand");
        })[0];
        if (model) {
          model[input.getAttribute("data-hour-field")] = Math.max(0, Number(input.value) || 0);
          renderLabor();
        }
      });
    }
    var clearLabor = $("[data-clear-labor]");
    if (clearLabor) {
      clearLabor.addEventListener("click", function () {
        resetLaborScenario();
        renderLabor();
        showToast("Planning hours cleared. No source data was changed.");
      });
    }
    var exportLabor = $("[data-export-labor]");
    if (exportLabor) {
      exportLabor.addEventListener("click", downloadLabor);
    }
  }

  populateControls();
  renderAll();
  bindEvents();
}());
