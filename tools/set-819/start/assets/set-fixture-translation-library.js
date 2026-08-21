(() => {
  "use strict";

  const BUILT_IN_RULES = [
    {
      ruleId: "LEGACY-CABINET-3CH",
      label: "3-channel cabinet",
      aliases: ["3 channel", "3-channel", "3ch"],
      assetType: "CABINET",
      legacyX: 33,
      legacyY: null,
      note: "Historical visual proportion; not a physical measurement."
    },
    {
      ruleId: "LEGACY-CABINET-3PUCK-5CH",
      label: "3-puck / 5-channel cabinet",
      aliases: ["3 puck", "3-puck", "5 channel", "5-channel", "5ch"],
      assetType: "CABINET",
      legacyX: 50,
      legacyY: null,
      note: "Historical visual proportion; not a physical measurement."
    },
    {
      ruleId: "LEGACY-PARSONS",
      label: "Parsons table",
      aliases: ["parson", "parsons"],
      assetType: "SURFACE",
      legacyX: 100,
      legacyY: null,
      note: "Historical visual proportion; connector geometry remains authoritative."
    },
    {
      ruleId: "LEGACY-FLOOR-FIXTURE",
      label: "Floor fixture / tree stand",
      aliases: ["floor fixture", "floor-fixture", "tree stand", "tree-stand"],
      assetType: "FLOOR_FIXTURE",
      legacyX: null,
      legacyY: 62,
      note: "Historical visual proportion; not a physical measurement."
    },
    {
      ruleId: "LEGACY-GROUND-FORM",
      label: "Ground-level form",
      aliases: ["ground form", "floor form", "form"],
      assetType: "FORM",
      legacyX: null,
      legacyY: 69,
      note: "Raised-platform forms require owner review."
    }
  ];

  const state = {
    importedRules: [],
    sourceName: "",
    rejectedRows: []
  };
  const workbookAnalysis = {
    scannedRows: 474,
    usableRows: 238,
    blockedRows: 236,
    dominantSignals: ["X=50", "X=100", "X=33", "Y=80", "Y≈62"],
    cleanupRule: "Exclude macOS ._ resource-fork rows and reject non-numeric formula results."
  };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function csvRows(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') {
          value += '"';
          index += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          value += char;
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === ",") {
        row.push(value);
        value = "";
      } else if (char === "\n") {
        row.push(value.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        value = "";
      } else {
        value += char;
      }
    }
    if (value || row.length) {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
    }
    return rows.filter((item) => item.some((cell) => String(cell).trim()));
  }

  function numericOrNull(value) {
    if (value == null || String(value).trim() === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function normalizeRule(row, index) {
    const label = String(row.label || "").trim();
    const aliases = String(row.aliases || "")
      .split("|")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const assetType = String(row.asset_type || "").trim().toUpperCase();
    if (!label || !aliases.length || !assetType) {
      throw new Error(`Row ${index + 2}: label, aliases, and asset_type are required.`);
    }
    const legacyX = numericOrNull(row.legacy_x);
    const legacyY = numericOrNull(row.legacy_y);
    if (legacyX == null && legacyY == null) {
      throw new Error(`Row ${index + 2}: add legacy_x or legacy_y.`);
    }
    return {
      ruleId: String(row.rule_id || `IMPORTED-${index + 1}`).trim().slice(0, 80),
      label: label.slice(0, 120),
      aliases,
      assetType: assetType.slice(0, 40),
      legacyX,
      legacyY,
      note: String(row.note || "Imported historical proportion; owner review required.").trim().slice(0, 240),
      imported: true
    };
  }

  function parseLibrary(text) {
    const rows = csvRows(text);
    if (rows.length < 2) throw new Error("The CSV has no translation rows.");
    const headers = rows[0].map((item) => String(item).trim().toLowerCase());
    const required = ["label", "aliases", "asset_type"];
    const missing = required.filter((header) => !headers.includes(header));
    if (missing.length) throw new Error(`Missing required columns: ${missing.join(", ")}.`);
    const accepted = [];
    const rejected = [];
    rows.slice(1).forEach((values, index) => {
      const row = Object.fromEntries(headers.map((header, column) => [header, values[column] ?? ""]));
      try {
        accepted.push(normalizeRule(row, index));
      } catch (error) {
        rejected.push(error.message);
      }
    });
    if (!accepted.length) throw new Error(rejected[0] || "No valid translation rules were found.");
    return { accepted, rejected };
  }

  function allRules() {
    return [...state.importedRules, ...BUILT_IN_RULES];
  }

  function suggest(asset) {
    const source = `${asset?.sourceFolder || ""}/${asset?.displayName || asset?.name || ""}`.toLowerCase();
    const candidates = allRules()
      .map((rule) => ({
        rule,
        matches: rule.aliases.filter((alias) => source.includes(alias))
      }))
      .filter((item) => item.matches.length)
      .sort((a, b) => {
        const lengthDifference = Math.max(...b.matches.map((item) => item.length))
          - Math.max(...a.matches.map((item) => item.length));
        return lengthDifference || Number(Boolean(b.rule.imported)) - Number(Boolean(a.rule.imported));
      });
    if (!candidates.length) return null;
    const rule = candidates[0].rule;
    return {
      ruleId: rule.ruleId,
      label: rule.label,
      assetType: rule.assetType,
      legacyX: rule.legacyX,
      legacyY: rule.legacyY,
      note: rule.note,
      source: rule.imported ? state.sourceName : "Built-in historical SET translation rules",
      confidence: candidates[0].matches.length > 1 ? "HIGH" : "REVIEW"
    };
  }

  function render() {
    const status = document.querySelector("[data-translation-library-status]");
    const table = document.querySelector("[data-translation-library-rules]");
    if (status) {
      const imported = state.importedRules.length;
      status.textContent = imported
        ? `${imported} imported + ${BUILT_IN_RULES.length} starting rules. ${state.rejectedRows.length} row(s) need correction.`
        : `${BUILT_IN_RULES.length} starting rules loaded. Import a reviewed CSV to extend them.`;
    }
    if (table) {
      table.innerHTML = allRules().map((rule) => `
        <tr>
          <td><strong>${escapeHtml(rule.label)}</strong><small>${escapeHtml(rule.ruleId)}</small></td>
          <td>${escapeHtml(rule.assetType.replaceAll("_", " ").toLowerCase())}</td>
          <td>${rule.legacyX == null ? "—" : escapeHtml(rule.legacyX)}</td>
          <td>${rule.legacyY == null ? "—" : escapeHtml(rule.legacyY)}</td>
          <td>${rule.imported ? "Imported / review" : "Historical / review"}</td>
        </tr>`).join("");
    }
  }

  function downloadTemplate() {
    const content = [
      "rule_id,label,aliases,asset_type,legacy_x,legacy_y,note",
      'CUSTOM-001,Example cabinet,"cabinet alias|fixture nickname",CABINET,50,,Historical visual proportion only'
    ].join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    link.download = "SET_fixture_translation_library_template.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  document.querySelector("[data-translation-library-file]")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const status = document.querySelector("[data-translation-library-status]");
    try {
      const parsed = parseLibrary(await file.text());
      state.importedRules = parsed.accepted;
      state.rejectedRows = parsed.rejected;
      state.sourceName = file.name;
      render();
      window.dispatchEvent(new CustomEvent("set-factory:translation-library-changed"));
    } catch (error) {
      if (status) status.textContent = `${error.message} Save the workbook sheet as CSV and use the template columns.`;
      event.target.value = "";
    }
  });

  document.querySelector("[data-translation-template]")?.addEventListener("click", downloadTemplate);

  window.SET_FIXTURE_TRANSLATION_LIBRARY = {
    suggest,
    parseLibrary,
    getState: () => ({
      sourceName: state.sourceName || "Built-in historical SET translation rules",
      builtInRuleCount: BUILT_IN_RULES.length,
      importedRuleCount: state.importedRules.length,
      rejectedRowCount: state.rejectedRows.length,
      authorityState: "HISTORICAL_VISUAL_PROPORTIONS_OWNER_REVIEW_REQUIRED",
      workbookAnalysis: { ...workbookAnalysis, dominantSignals: [...workbookAnalysis.dominantSignals] },
      rules: allRules().map((rule) => ({ ...rule, aliases: [...rule.aliases] }))
    })
  };

  render();
})();
