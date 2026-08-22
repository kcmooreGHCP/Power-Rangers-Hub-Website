(function () {
  "use strict";

  var roleKey = (location.pathname.split("/").pop() || "").replace(".html", "");
  var roleData = {
    store: {
      label: "Store 1392 · Ontario Mills",
      scope: "Store",
      metrics: [
        ["72%", "Launch readiness", "August floorset"],
        ["3 of 7", "Priority tasks", "Today"],
        ["2", "Proof items due", "Thursday"],
        ["1", "Open support flag", "Qualifier"]
      ]
    },
    district: {
      label: "District 339 · West",
      scope: "District",
      metrics: [
        ["83%", "District readiness", "11 stores"],
        ["7", "Stores on track", "Current launch"],
        ["3", "Stores to support", "DM follow-up"],
        ["3", "Open escalations", "Partner owned"]
      ]
    },
    region: {
      label: "Region 400 · West",
      scope: "Region",
      metrics: [
        ["82%", "Region readiness", "4 districts"],
        ["7", "At-risk stores", "Needs support"],
        ["3", "Open escalations", "Upstream"],
        ["4", "Districts reporting", "Current snapshot"]
      ]
    },
    SET_LOOP_MASTER: {
      label: "SET Loop · Home Office",
      scope: "Enterprise",
      metrics: [
        ["82%", "Region 400 readiness", "Field snapshot"],
        ["6", "Publishing queue", "Owner tracked"],
        ["3", "Escalation themes", "Partner routed"],
        ["10", "Priority communications", "Business Now"]
      ]
    }
  };
  var current = roleData[roleKey] || roleData.store;
  var guideUrl = "resources/STORE_0222_2026_08_19_BRAND_GUIDE_INTERACTIVE.pdf";
  var pilotLedgerKey = "setloop_pilot_ledger_v1";
  var irlTimer = { seconds: 0, interval: null };
  var irlAssets = [
    {
      id: "BG-VS-FOS-PARSONS-01",
      source: "Brand Guide",
      brand: "VS",
      area: "Front of Store",
      name: "Front-of-store Parsons presentation",
      presentation: "August chain assortment launch",
      assetType: "Parsons table",
      connector: "Front-of-store surface · Parsons connector",
      detail: "3-room launch prototype · chain assortment · store-specific placement",
      guidePage: 13,
      domain: "visual-merchandising",
      route: "Visual Merchandising · Field Visual · Brand Guide",
      shape: "table"
    },
    {
      id: "BG-PINK-R2-MF02",
      source: "Brand Guide",
      brand: "PINK",
      area: "PINK Room 2",
      name: "New Panty front presentation",
      presentation: "Back-to-campus floor presentation",
      assetType: "Medium Feast",
      connector: "PINK-R2-MF02 · top deck",
      detail: "Folded-stack presentation · approved fixture and surface association",
      guidePage: 38,
      domain: "visual-merchandising",
      route: "Visual Merchandising · PINK Field Visual · Brand Guide",
      shape: "round"
    },
    {
      id: "BG-VSB-FRAGRANCE-5CH",
      source: "Brand Guide",
      brand: "VSB",
      area: "Front Room",
      name: "Fragrance feature cabinet",
      presentation: "VSB fragrance feature event",
      assetType: "5-channel cabinet",
      connector: "Front Room · beauty cabinet run",
      detail: "Tester, signage, product story, and placement direction",
      guidePage: 52,
      domain: "marketing",
      route: "Marketing · Marketing Operations · Visual Merchandising",
      shape: "cabinet"
    },
    {
      id: "MKT-PINK-4821",
      source: "Marketing Pack",
      brand: "PINK",
      area: "PINK Room 2",
      name: "5 for $32 marketing sign",
      presentation: "Campaign pack 4821",
      assetType: "Marketing sign",
      connector: "PINK-R2-MF02 · top deck",
      detail: "Approved campaign identity · quantity and placement check",
      guidePage: 38,
      domain: "marketing",
      route: "Marketing Operations · PINK Visual Merchandising",
      shape: "sign"
    },
    {
      id: "OPS-CASHWRAP-CLOSE",
      source: "Store Task",
      brand: "All brands",
      area: "Cash Wrap",
      name: "Cash-wrap close standard",
      presentation: "Open-to-close operating task",
      assetType: "Task standard",
      connector: "Cash Wrap · close sequence",
      detail: "Recovery, replenishment, and opening-leader handoff",
      guidePage: 0,
      domain: "time-study",
      route: "Store Operations · Labor Planning · Field Test",
      shape: "task"
    },
    {
      id: "MSI-PINK-BEAUTY-5CH",
      source: "Inventory / Assortment",
      brand: "PINK Beauty",
      area: "Beauty Zone",
      name: "Beauty cabinet assortment",
      presentation: "Store-specific approved assortment",
      assetType: "5-channel cabinet",
      connector: "Beauty Zone · 5-channel cabinet",
      detail: "MSI-linked assortment context · no inferred availability",
      guidePage: 0,
      domain: "inventory",
      route: "Brand Merchandising · Inventory · Supply Chain",
      shape: "cabinet"
    }
  ];
  var irlRoutes = {
    "visual-merchandising": "Visual Merchandising · Field Visual · Brand Guide",
    inventory: "Brand Merchandising · Inventory · Supply Chain",
    "time-study": "Store Operations · Labor Planning · Field Test",
    marketing: "Marketing · Marketing Operations · Visual Merchandising",
    execution: "Store Operations · accountable field leader",
    facilities: "Facilities / Maintenance · Store Operations",
    improvement: "Store Operations · requesting role · accountable system owner"
  };
  var approvedAnswers = [
    {
      keywords: ["brand guide", "store 0222", "cross creek", "guide"],
      answer: "The approved Store 0222 Brand Guide covers 20 rooms or zones and 105 presentations. Use its table of contents or full-store map to move to the exact room, zone, fixture, or cabinet run.",
      source: "Store 0222 Brand Guide · pages 1–3",
      partner: "Visual Merchandising"
    },
    {
      keywords: ["set irl", "time it", "tell us", "feedback"],
      answer: "SET IRL is the field return path inside the guide. Use the SET IRL action to record what worked, what created friction, time spent, and store ideas. The pilot keeps that return in the SET Loop activity ledger; approved production routing will use the governed field-learning list.",
      source: "Store 0222 Brand Guide · pages 2, 5, 13",
      partner: "Store Operations + Visual Merchandising"
    },
    {
      keywords: ["readiness", "ready", "launch"],
      answer: current.scope + " readiness is shown in the live KPI snapshot above. The current prototype snapshot is sourced only from approved SET Loop launch, task, and readiness records; use Force refresh to request the newest approved snapshot.",
      source: current.label + " · SET Loop KPI snapshot",
      partner: "Store Operations"
    },
    {
      keywords: ["floorset factory", "build a floorset", "field visual", "brand guide team"],
      answer: "The Floorset Factory is the working SET pilot for turning approved store, fixture, connector, asset, and translation records into a store-specific planning view. Store teams can open the example; Visual, Field Visual, and Brand Guide partners use the same governed workspace with role-appropriate inputs.",
      source: "SET Resource Center · Floorset Factory working pilot",
      partner: "Visual Merchandising + Field Visual + Brand Guide + Store Operations",
      url: "../set-819/start/FLOORSET_FACTORY.html",
      linkLabel: "Open the Floorset Factory working pilot"
    },
    {
      keywords: ["trying to do", "idea help", "maintenance app", "zero on hand", "ai conversation", "details and images"],
      answer: "Partner AI + Automation Studio helps a partner explain the intended outcome, audience, current process, missing details or imagery, approved sources, constraints, and desired proof. A partner may voluntarily paste useful AI back-and-forth; the browser pilot structures only what they provide and never reads private chats automatically.",
      source: "SET Innovation Lab · Partner AI + Automation Studio working browser pilot",
      partner: "Store Operations + requesting partner + accountable system owner",
      url: "../innovation/partner-ai-studio.html",
      linkLabel: "Open Partner AI + Automation Studio"
    },
    {
      keywords: ["task", "priority", "due", "checklist"],
      answer: "Priority tasks are ranked by launch risk, due date, customer impact, and role ownership. The dashboard keeps required actions and readiness together so teams can act without searching across screens.",
      source: current.label + " · Business Now + readiness records",
      partner: "Store Operations"
    },
    {
      keywords: ["fixture", "cabinet", "map", "zone"],
      answer: "The brand guide maps room and zone direction down to surfaces, floor forms, and cabinet runs. The full-store map and table of contents are the approved navigation sources for placement.",
      source: "Store 0222 Brand Guide · pages 2–73",
      partner: "Visual Merchandising"
    },
    {
      keywords: ["marketing", "sign", "placement", "where does", "where should"],
      answer: "Marketing placement must match the approved Brand Guide or connected campaign manifest. Open Promo + Marketing Operations to verify the product or pack number, placement, required quantity, and current store tally. If the exact element is absent, route the question to Marketing rather than inferring a location.",
      source: "Approved Brand Guide + Promo and Marketing manifest",
      partner: "Marketing + Visual Merchandising"
    },
    {
      keywords: ["pack", "vmh", "request my marketing", "order sign"],
      answer: "Use Promo + Marketing Operations to select only missing items and create the VMH bulk format ProductNumber, Quantity. Review the CSV, then upload it in the authenticated VMH Bulk Cart. The prototype cannot upload or submit an order on your behalf.",
      source: "SET Loop Promo + Marketing Operations · VMH handoff",
      partner: "Marketing Operations"
    },
    {
      keywords: ["inventory", "assortment", "product"],
      answer: "Inventory and assortment answers must come from the connected approved MSI dossier and SET Loop assortment manifest. This prototype does not infer availability from the web or from unapproved files.",
      source: "SET Loop approved MSI + assortment connection",
      partner: "Brand Merchandising + Supply Chain"
    }
  ];
  var personaProfiles = {
    store: {
      label: "Store Operations",
      leadIn: "Practical answer:",
      hint: "Direct, calm, and action focused.",
      rate: 0.98,
      pitch: 0.94,
      voiceIndex: 0,
      preferredVoices: /Samantha|Ava|Jenny|Google US English|Microsoft Aria/i
    },
    visual: {
      label: "Visual",
      leadIn: "Visual read:",
      hint: "Measured, spatial, and detail focused.",
      rate: 0.9,
      pitch: 1.06,
      voiceIndex: 1,
      preferredVoices: /Victoria|Serena|Karen|Moira|Microsoft Sonia/i
    },
    pink: {
      label: "PINK",
      leadIn: "Quick take:",
      hint: "Bright, energetic, and concise.",
      rate: 1.08,
      pitch: 1.16,
      voiceIndex: 2,
      preferredVoices: /Zira|Salli|Joanna|Tessa/i
    },
    leadership: {
      label: "Leadership",
      leadIn: "Executive summary:",
      hint: "Steady, concise, and decision oriented.",
      rate: 0.86,
      pitch: 0.88,
      voiceIndex: 3,
      preferredVoices: /Daniel|Alex|David|Guy|Microsoft Mark/i
    }
  };

  function addStyles() {
    var style = document.createElement("style");
    style.textContent = [
      ".slx-bar{position:sticky;top:0;z-index:8000;background:#fff;border-bottom:1px solid #e5e7eb;box-shadow:0 3px 14px rgba(17,19,26,.09)}",
      ".slx-bar-inner{max-width:1200px;margin:auto;min-height:52px;padding:8px 20px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
      ".slx-home,.slx-action{border:1px solid #d7d9df;background:#fff;color:#11131a;border-radius:7px;padding:7px 11px;text-decoration:none;font-size:12px;font-weight:700;cursor:pointer}",
      ".slx-home{background:#11131a;color:#fff;border-color:#11131a}",
      ".slx-home:hover,.slx-action:hover{background:#ed2d8b;color:#fff;border-color:#ed2d8b;text-decoration:none}",
      ".slx-location{font-size:12px;color:#667085;font-weight:600;margin-right:auto;padding:0 6px}",
      ".slx-live{display:inline-flex;align-items:center;gap:5px;color:#067647;font-size:11px;font-weight:700}",
      ".slx-live:before{content:'';width:7px;height:7px;border-radius:50%;background:#12b76a;box-shadow:0 0 0 3px #d1fadf}",
      ".slx-kpis{background:#f8f8fa;border-bottom:1px solid #e5e7eb}",
      ".slx-kpi-inner{max-width:1200px;margin:auto;padding:12px 20px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}",
      ".slx-kpi{background:#fff;border:1px solid #eaecf0;border-radius:8px;padding:11px 13px}",
      ".slx-kpi b{font-size:20px;color:#11131a;display:block;line-height:1.1}",
      ".slx-kpi span{font-size:11px;font-weight:700;color:#475467;display:block;margin-top:4px}",
      ".slx-kpi small{font-size:10px;color:#98a2b3}",
      ".slx-fresh{grid-column:1/-1;display:flex;justify-content:space-between;gap:10px;font-size:10px;color:#667085}",
      ".slx-overlay{display:none;position:fixed;inset:0;background:rgba(17,19,26,.72);z-index:9000;padding:24px;align-items:center;justify-content:center}",
      ".slx-overlay.show{display:flex}",
      ".slx-modal{background:#fff;border-radius:14px;width:min(1100px,100%);height:min(88vh,820px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.35)}",
      ".slx-modal.agent{width:min(720px,100%);height:auto;max-height:88vh}",
      ".slx-modal.irl{width:min(1040px,100%);height:min(92vh,900px)}",
      ".slx-modal-head{padding:14px 18px;border-bottom:1px solid #eaecf0;display:flex;align-items:center;gap:12px}",
      ".slx-modal-head strong{font-size:15px}.slx-modal-head span{font-size:11px;color:#667085;flex:1}",
      ".slx-close{background:#fff;border:1px solid #d0d5dd;border-radius:6px;padding:6px 10px;cursor:pointer}",
      ".slx-guide-actions{padding:10px 18px;border-bottom:1px solid #eaecf0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#fff7fb}",
      ".slx-guide-actions a,.slx-guide-actions button{background:#fff;border:1px solid #ed2d8b;color:#9d174d;border-radius:7px;padding:7px 11px;font-size:12px;font-weight:700;text-decoration:none;cursor:pointer}",
      ".slx-guide-actions button.active{background:#ed2d8b;color:#fff}.slx-guide-status{width:100%;font-size:11px;color:#667085;font-weight:700}",
      ".slx-guide-frame{border:0;width:100%;flex:1;background:#f2f4f7}",
      ".slx-irl-body{padding:22px;overflow:auto;background:#f7f7f9}",
      ".slx-irl-intro{margin:0;color:#344054;font-size:13px;line-height:1.55;max-width:74ch}",
      ".slx-irl-promise{margin:14px 0 18px;padding:12px 14px;border:1px solid #f4b6d4;border-radius:9px;background:#fff7fb;color:#7a1f50;font-size:12px;line-height:1.5}",
      ".slx-irl-workspace{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr);gap:16px;align-items:start}",
      ".slx-irl-panel{background:#fff;border:1px solid #e4e7ec;border-radius:12px;padding:16px}",
      ".slx-irl-panel h3{font-size:15px;margin:0 0 4px;color:#11131a}.slx-irl-panel>p{font-size:11px;color:#667085;margin:0 0 14px}",
      ".slx-context-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
      ".slx-context-grid label{display:grid;gap:5px;color:#344054;font-size:11px;font-weight:800}",
      ".slx-context-grid label.wide{grid-column:1/-1}",
      ".slx-context-grid input,.slx-context-grid select{width:100%;padding:9px 10px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;color:#11131a;font:12px/1.4 inherit}",
      ".slx-asset-card{margin-top:12px;border:1px solid #d0d5dd;border-radius:10px;overflow:hidden}",
      ".slx-asset-visual{min-height:142px;background:#15171d;color:#fff;display:grid;place-items:center;padding:18px}",
      ".slx-asset-visual svg{width:100%;height:112px;display:block}.slx-asset-visual .fill{fill:#ed2d8b}.slx-asset-visual .line{stroke:#fff;stroke-width:2;fill:none}",
      ".slx-asset-copy{padding:13px 14px}.slx-asset-copy strong{display:block;font-size:14px}.slx-asset-copy p{margin:5px 0 0;font-size:11px;line-height:1.5;color:#667085}",
      ".slx-asset-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.slx-asset-tags span{border-radius:999px;background:#f2f4f7;padding:4px 7px;font-size:9px;font-weight:800;color:#475467}",
      ".slx-asset-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.slx-asset-meta div{background:#f8f8fa;padding:8px;border-radius:7px;font-size:10px;color:#667085}.slx-asset-meta b{display:block;color:#11131a;font-size:11px;margin-bottom:2px}",
      ".slx-guide-jump{display:none;margin-top:10px;color:#9d174d;font-size:11px;font-weight:800}.slx-guide-jump.show{display:inline-block}",
      ".slx-pattern-note{margin-top:10px;background:#eef4ff;color:#3538cd;border-radius:8px;padding:9px 10px;font-size:10px;font-weight:700}",
      ".slx-action-kinds{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}",
      ".slx-action-kind{border:1px solid #d0d5dd;background:#fff;border-radius:8px;padding:9px 6px;color:#344054;font-size:10px;font-weight:800;cursor:pointer}.slx-action-kind span{display:block;font-size:18px;margin-bottom:3px}",
      ".slx-action-kind.active{background:#11131a;color:#fff;border-color:#11131a}",
      ".slx-irl-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
      ".slx-irl-grid label{display:grid;gap:5px;color:#344054;font-size:11px;font-weight:800}",
      ".slx-irl-grid label.full{grid-column:1/-1}",
      ".slx-irl-grid input,.slx-irl-grid select,.slx-irl-grid textarea{width:100%;padding:10px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;color:#11131a;font:13px/1.4 inherit}",
      ".slx-irl-grid textarea{min-height:105px;resize:vertical}",
      ".slx-route-preview{grid-column:1/-1;background:#f0fdf4;border-radius:8px;padding:10px 11px;color:#166534;font-size:10px;line-height:1.45}.slx-route-preview b{display:block;font-size:11px}",
      ".slx-timer{display:none;grid-column:1/-1;background:#11131a;color:#fff;border-radius:10px;padding:14px;align-items:center;gap:12px}.slx-timer.show{display:flex}.slx-timer-readout{font-size:30px;font-weight:900;letter-spacing:-1px;min-width:108px}.slx-timer-copy{flex:1;font-size:10px;color:#d0d5dd}.slx-timer-controls{display:flex;gap:6px}.slx-timer-controls button{border:1px solid #475467;background:#fff;color:#11131a;border-radius:6px;padding:7px 9px;font-weight:800;cursor:pointer}",
      ".slx-evidence{grid-column:1/-1}.slx-evidence small{font-weight:500;color:#667085}.slx-evidence-preview{display:none;margin-top:7px;align-items:center;gap:9px;background:#f8f8fa;border-radius:7px;padding:8px;font-size:10px;color:#475467}.slx-evidence-preview.show{display:flex}.slx-evidence-preview img{width:50px;height:50px;object-fit:cover;border-radius:5px}",
      ".slx-irl-actions{margin-top:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
      ".slx-irl-submit{border:0;border-radius:7px;padding:10px 15px;background:#ed2d8b;color:#fff;font-weight:800;cursor:pointer}",
      ".slx-irl-note{color:#667085;font-size:10px;line-height:1.45}",
      ".slx-irl-success{display:none;margin-top:14px;padding:13px;border-radius:8px;background:#ecfdf3;color:#067647;font-size:12px;line-height:1.5}",
      ".slx-irl-success.show{display:block}.slx-irl-success a{color:#065f46;font-weight:800}",
      ".slx-agent-body{padding:18px;overflow:auto}",
      ".slx-guard{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 12px;font-size:11px;color:#166534;line-height:1.45;margin-bottom:12px}",
      ".slx-persona{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}",
      ".slx-persona label{font-size:11px;color:#475467;font-weight:700}.slx-persona select{width:100%;padding:8px;border:1px solid #d0d5dd;border-radius:6px;margin-top:4px}",
      ".slx-persona-note{grid-column:1/-1;background:#f8f5ff;border-radius:6px;padding:8px 10px;color:#5b21b6;font-size:11px;font-weight:700}",
      ".slx-q{width:100%;min-height:86px;border:1px solid #d0d5dd;border-radius:8px;padding:10px;font:13px/1.4 inherit;resize:vertical}",
      ".slx-submit{background:#ed2d8b;color:#fff;border:0;border-radius:7px;padding:9px 14px;font-weight:700;cursor:pointer;margin-top:8px}",
      ".slx-answer{display:none;margin-top:14px;border:1px solid #eaecf0;border-radius:8px;padding:14px;font-size:13px;line-height:1.55}",
      ".slx-answer.show{display:block}.slx-source{font-size:10px;color:#667085;margin-top:9px;padding-top:8px;border-top:1px solid #eaecf0}",
      ".slx-answer-link{display:none;width:max-content;max-width:100%;margin-top:10px;padding:8px 11px;border-radius:7px;background:#11131a;color:#fff;text-decoration:none;font-size:11px;font-weight:800}.slx-answer-link.show{display:inline-block}.slx-answer-link:hover{background:#ed2d8b;color:#fff;text-decoration:none}",
      ".slx-notfound{color:#b42318}.slx-route{display:none;margin-top:10px;background:#11131a;color:#fff;border:0;border-radius:7px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer}",
      ".slx-route.show{display:inline-block}.slx-ticket{font-size:11px;color:#067647;font-weight:700;margin-top:8px}",
      "@media(max-width:760px){.slx-location{order:3;width:100%}.slx-kpi-inner{grid-template-columns:1fr 1fr}.slx-persona,.slx-irl-grid,.slx-irl-workspace{grid-template-columns:1fr}.slx-irl-grid label.full{grid-column:auto}.slx-action-kinds{grid-template-columns:1fr 1fr}.slx-overlay{padding:6px}.slx-modal.irl{height:96vh}.slx-modal-head span{display:none}}",
      "@media(max-width:460px){.slx-context-grid,.slx-asset-meta{grid-template-columns:1fr}.slx-context-grid label.wide{grid-column:auto}.slx-timer.show{align-items:flex-start;flex-wrap:wrap}}"
    ].join("");
    document.head.appendChild(style);
  }

  function makeButton(label, handler) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "slx-action";
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function buildShell() {
    var bar = document.createElement("div");
    bar.className = "slx-bar";
    var inner = document.createElement("div");
    inner.className = "slx-bar-inner";

    var home = document.createElement("a");
    home.className = "slx-home";
    home.href = "SET_LOOP_MASTER.html";
    home.textContent = "← Return to SET Loop";

    var locationLabel = document.createElement("div");
    locationLabel.className = "slx-location";
    locationLabel.innerHTML = "<span class=\"slx-live\">Approved snapshot</span> &nbsp; " + current.label;

    inner.appendChild(home);
    inner.appendChild(locationLabel);
    inner.appendChild(makeButton("📖 Brand Guide", openGuide));
    var marketing = document.createElement("a");
    marketing.className = "slx-action";
    marketing.href = "marketing-operations.html";
    marketing.textContent = "🏷️ Marketing Check";
    inner.appendChild(marketing);
    var factory = document.createElement("a");
    factory.className = "slx-action";
    factory.href = "../set-819/start/FLOORSET_FACTORY.html";
    factory.target = "_blank";
    factory.rel = "noopener";
    factory.textContent = "📐 Floorset Factory";
    inner.appendChild(factory);
    var activity = document.createElement("a");
    activity.className = "slx-action";
    activity.href = "feedback-results.html";
    activity.textContent = "📈 Activity";
    inner.appendChild(activity);
    var ideaHelp = document.createElement("a");
    ideaHelp.className = "slx-action";
    ideaHelp.href = "../innovation/partner-ai-studio.html";
    ideaHelp.target = "_blank";
    ideaHelp.rel = "noopener";
    ideaHelp.textContent = "💡 Partner AI Help";
    inner.appendChild(ideaHelp);
    inner.appendChild(makeButton("✨ SET IRL", openIrl));
    inner.appendChild(makeButton("🎙️ Ask SET Agent", openAgent));
    inner.appendChild(makeButton("↻ Force refresh", refreshSnapshot));
    bar.appendChild(inner);

    var kpis = document.createElement("div");
    kpis.className = "slx-kpis";
    var kpiInner = document.createElement("div");
    kpiInner.className = "slx-kpi-inner";
    current.metrics.forEach(function (metric) {
      var card = document.createElement("div");
      card.className = "slx-kpi";
      card.innerHTML = "<b>" + metric[0] + "</b><span>" + metric[1] + "</span><small>" + metric[2] + "</small>";
      kpiInner.appendChild(card);
    });
    var fresh = document.createElement("div");
    fresh.className = "slx-fresh";
    fresh.innerHTML = "<span>Source: approved SET Loop manifests + connected partner records</span><span id=\"slxFreshTime\">Last refreshed: just now</span>";
    kpiInner.appendChild(fresh);
    kpis.appendChild(kpiInner);

    document.body.insertBefore(kpis, document.body.firstChild);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function buildGuideModal() {
    var overlay = document.createElement("div");
    overlay.className = "slx-overlay";
    overlay.id = "slxGuide";
    overlay.innerHTML = [
      "<div class=\"slx-modal\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Store 0222 Brand Guide\">",
      "<div class=\"slx-modal-head\"><strong>Store 0222 · Interactive Brand Guide</strong><span>20 rooms/zones · 105 presentations · SET IRL field return path</span><button class=\"slx-close\" type=\"button\">Close</button></div>",
      "<div class=\"slx-guide-actions\"><button type=\"button\" data-page=\"1\" data-label=\"Guide cover\">Guide cover</button><button type=\"button\" data-page=\"2\" data-label=\"Table of contents\">Table of contents</button><button type=\"button\" data-page=\"3\" data-label=\"Full-store map\">Full-store map</button><button type=\"button\" data-page=\"2\" data-label=\"SET IRL directory\">Highlight SET IRL directory</button><button type=\"button\" data-open-irl>Send field insight</button><a href=\"" + guideUrl + "\" target=\"_blank\" rel=\"noopener\">Open guide in new window ↗</a><div class=\"slx-guide-status\" aria-live=\"polite\">Showing Guide cover · PDF page 1</div></div>",
      "<iframe class=\"slx-guide-frame\" title=\"Interactive Store 0222 Brand Guide\" src=\"" + guideUrl + "#page=1\"></iframe>",
      "</div>"
    ].join("");
    overlay.querySelector(".slx-close").addEventListener("click", function () { overlay.classList.remove("show"); });
    overlay.querySelectorAll("[data-page]").forEach(function (button) {
      button.addEventListener("click", function () {
        loadGuidePage(Number(button.getAttribute("data-page")), button.getAttribute("data-label"), button);
      });
    });
    overlay.querySelector("[data-open-irl]").addEventListener("click", function () {
      overlay.classList.remove("show");
      openIrl();
    });
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) overlay.classList.remove("show");
    });
    document.body.appendChild(overlay);
  }

  function buildIrlModal() {
    var overlay = document.createElement("div");
    overlay.className = "slx-overlay";
    overlay.id = "slxIrl";
    overlay.innerHTML = [
      "<div class=\"slx-modal irl\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"slxIrlTitle\">",
      "<div class=\"slx-modal-head\"><strong id=\"slxIrlTitle\">SET IRL · Find it. Ask it. Learn from it.</strong><span>" + current.label + " · contextual field intelligence</span><button class=\"slx-close\" type=\"button\">Close</button></div>",
      "<div class=\"slx-irl-body\">",
      "<p class=\"slx-irl-intro\">Start with the exact guide, presentation, area, fixture, sign, or task. SET IRL carries that context into the question, chooses the accountable partner path, and records patterns that can make the next set smarter.</p>",
      "<div class=\"slx-irl-promise\"><strong>SET the standard. Own the outcome. Put Her First.</strong><br>One contextual return can answer a question. Repeated returns can reveal where direction, assets, inventory, or planned time need to change.</div>",
      "<form id=\"slxIrlForm\">",
      "<div class=\"slx-irl-workspace\">",
      "<section class=\"slx-irl-panel\" aria-labelledby=\"slxContextTitle\">",
      "<h3 id=\"slxContextTitle\">1. Find the thing you are looking at</h3><p>Use the sample connected records below. Production search would use approved guides, manifests, store templates, and MSI context.</p>",
      "<div class=\"slx-context-grid\">",
      "<label>Source<select id=\"slxIrlSource\"><option>Brand Guide</option><option>Marketing Pack</option><option>Store Task</option><option>Inventory / Assortment</option><option>All connected sources</option></select></label>",
      "<label>Brand<select id=\"slxIrlBrand\"><option>All brands</option><option>VS</option><option>PINK</option><option>PINK Beauty</option><option>VSB</option></select></label>",
      "<label>Area<select id=\"slxIrlArea\"><option>All areas</option></select></label>",
      "<label>Search<input id=\"slxIrlSearch\" type=\"search\" placeholder=\"Cabinet, sign, presentation…\"></label>",
      "<label class=\"wide\">Asset or presentation<select id=\"slxIrlAsset\" required></select></label>",
      "</div>",
      "<article class=\"slx-asset-card\" aria-live=\"polite\">",
      "<div class=\"slx-asset-visual\" id=\"slxAssetVisual\"></div>",
      "<div class=\"slx-asset-copy\"><strong id=\"slxAssetName\"></strong><p id=\"slxAssetDetail\"></p><div class=\"slx-asset-tags\" id=\"slxAssetTags\"></div><div class=\"slx-asset-meta\"><div><b>Presentation</b><span id=\"slxAssetPresentation\"></span></div><div><b>Connected location</b><span id=\"slxAssetConnector\"></span></div></div><a class=\"slx-guide-jump\" id=\"slxGuideJump\" target=\"_blank\" rel=\"noopener\">Open this context in the guide ↗</a><div class=\"slx-pattern-note\" id=\"slxPatternNote\">No related returns in this browser yet.</div></div>",
      "</article></section>",
      "<section class=\"slx-irl-panel\" aria-labelledby=\"slxActionTitle\">",
      "<h3 id=\"slxActionTitle\">2. Choose what you need to do</h3><p>The selected context stays attached, so the right partners receive the right question and evidence.</p>",
      "<div class=\"slx-action-kinds\" role=\"group\" aria-label=\"SET IRL activity type\">",
      "<button class=\"slx-action-kind active\" type=\"button\" data-irl-action=\"question\"><span>?</span>Ask a question</button>",
      "<button class=\"slx-action-kind\" type=\"button\" data-irl-action=\"time-study\"><span>◷</span>Time the work</button>",
      "<button class=\"slx-action-kind\" type=\"button\" data-irl-action=\"mismatch\"><span>!</span>Report mismatch</button>",
      "<button class=\"slx-action-kind\" type=\"button\" data-irl-action=\"idea\"><span>+</span>Share an idea</button>",
      "</div>",
      "<input id=\"slxIrlAction\" type=\"hidden\" value=\"question\">",
      "<div class=\"slx-irl-grid\">",
      "<label>Question area<select id=\"slxIrlCategory\" required><option value=\"visual-merchandising\">Visual merchandising</option><option value=\"inventory\">Inventory / assortment</option><option value=\"time-study\">Time study / labor</option><option value=\"marketing\">Marketing / signage</option><option value=\"execution\">Store execution</option><option value=\"facilities\">Fixture / facilities</option><option value=\"improvement\">Field idea / improvement</option></select></label>",
      "<label>How should this be shared?<select id=\"slxIrlIdentity\"><option value=\"anonymous\">Anonymous</option><option value=\"role\">Share my role / team only</option><option value=\"profile\">Share my saved SET Loop profile</option></select></label>",
      "<div class=\"slx-route-preview\" id=\"slxRoutePreview\"><b>Suggested partner path</b><span></span></div>",
      "<div class=\"slx-timer\" id=\"slxIrlTimer\"><div class=\"slx-timer-readout\" id=\"slxTimerReadout\">00:00</div><div class=\"slx-timer-copy\"><strong>Live time study</strong><br>Start when the activity begins. Pause for interruptions; the exact elapsed time stays attached to this return.</div><div class=\"slx-timer-controls\"><button id=\"slxTimerToggle\" type=\"button\">Start</button><button id=\"slxTimerReset\" type=\"button\">Reset</button></div></div>",
      "<label class=\"full\">Question, observation, or outcome<textarea id=\"slxIrlMessage\" maxlength=\"1500\" required placeholder=\"What are you trying to understand, what happened, or what would make this easier next time?\"></textarea></label>",
      "<label class=\"slx-evidence\">Current-store photo <small>Optional · filename and size are logged; the image stays in this browser prototype.</small><input id=\"slxIrlEvidence\" type=\"file\" accept=\"image/*\"><span class=\"slx-evidence-preview\" id=\"slxEvidencePreview\"></span></label>",
      "</div>",
      "<div class=\"slx-irl-actions\"><button class=\"slx-irl-submit\" type=\"submit\">Return this context to the Loop</button><span class=\"slx-irl-note\">Pilot entries stay in this browser. Approved production routing requires SharePoint, Power Automate, permissions, retention, and named owners.</span></div>",
      "<div class=\"slx-irl-success\" id=\"slxIrlSuccess\" aria-live=\"polite\"></div>",
      "</section></div>",
      "</form></div></div>"
    ].join("");
    overlay.querySelector(".slx-close").addEventListener("click", function () { closeIrl(overlay); });
    overlay.querySelector("#slxIrlForm").addEventListener("submit", saveIrlInsight);
    overlay.querySelectorAll("#slxIrlSource,#slxIrlBrand,#slxIrlArea").forEach(function (select) {
      select.addEventListener("change", updateIrlAssetChoices);
    });
    overlay.querySelector("#slxIrlSearch").addEventListener("input", updateIrlAssetChoices);
    overlay.querySelector("#slxIrlAsset").addEventListener("change", renderIrlAsset);
    overlay.querySelector("#slxIrlCategory").addEventListener("change", updateIrlRoute);
    overlay.querySelectorAll("[data-irl-action]").forEach(function (button) {
      button.addEventListener("click", function () { setIrlAction(button.getAttribute("data-irl-action")); });
    });
    overlay.querySelector("#slxTimerToggle").addEventListener("click", toggleIrlTimer);
    overlay.querySelector("#slxTimerReset").addEventListener("click", resetIrlTimer);
    overlay.querySelector("#slxIrlEvidence").addEventListener("change", previewIrlEvidence);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeIrl(overlay);
    });
    document.body.appendChild(overlay);
    populateIrlAreas();
    updateIrlAssetChoices();
    setIrlAction("question");
  }

  function buildAgentModal() {
    var overlay = document.createElement("div");
    overlay.className = "slx-overlay";
    overlay.id = "slxAgent";
    overlay.innerHTML = [
      "<div class=\"slx-modal agent\" role=\"dialog\" aria-modal=\"true\" aria-label=\"SET Agent\">",
      "<div class=\"slx-modal-head\"><strong>🎙️ SET Agent · Guardrailed prototype</strong><span>Approved internal sources only</span><button class=\"slx-close\" type=\"button\">Close</button></div>",
      "<div class=\"slx-agent-body\">",
      "<div class=\"slx-guard\"><strong>No guessing. No Google. No unapproved content.</strong><br>Answers must be grounded in SET Loop records and connected partner manifests that passed intake. If the answer is not present, the Agent says so and prepares a support request.</div>",
      "<div class=\"slx-persona\"><label>Team personality<select id=\"slxPersona\"><option value=\"store\">Store Operations · Clear + practical</option><option value=\"visual\">Visual · Spatial + detail focused</option><option value=\"pink\">PINK · Energetic + concise</option><option value=\"leadership\">Leadership · Executive summary</option></select></label><label>Voice delivery<select id=\"slxVoice\"><option value=\"text\">Text only</option><option value=\"speak\">Speak with selected personality</option></select></label><div class=\"slx-persona-note\" id=\"slxPersonaNote\"></div></div>",
      "<textarea class=\"slx-q\" id=\"slxQuestion\" placeholder=\"Ask about readiness, a priority task, the brand guide, SET IRL, a fixture, or an approved connected manifest...\"></textarea>",
      "<button class=\"slx-submit\" type=\"button\">Ask from approved sources</button>",
      "<div class=\"slx-answer\" id=\"slxAnswer\"><div id=\"slxAnswerText\"></div><div class=\"slx-source\" id=\"slxSource\"></div><a class=\"slx-answer-link\" id=\"slxAnswerLink\" target=\"_blank\" rel=\"noopener\"></a><button class=\"slx-route\" id=\"slxRoute\" type=\"button\">Submit to Home Office / Store Ops</button><div class=\"slx-ticket\" id=\"slxTicket\"></div></div>",
      "</div></div>"
    ].join("");
    overlay.querySelector(".slx-close").addEventListener("click", function () { overlay.classList.remove("show"); });
    overlay.querySelector(".slx-submit").addEventListener("click", answerQuestion);
    overlay.querySelector("#slxRoute").addEventListener("click", routeQuestion);
    overlay.querySelector("#slxPersona").addEventListener("change", updatePersonaHint);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) overlay.classList.remove("show");
    });
    document.body.appendChild(overlay);
    updatePersonaHint();
  }

  function loadGuidePage(page, label, activeButton) {
    var overlay = document.getElementById("slxGuide");
    var currentFrame = overlay.querySelector(".slx-guide-frame");
    var nextFrame = currentFrame.cloneNode(false);
    currentFrame.replaceWith(nextFrame);
    overlay.querySelectorAll("[data-page]").forEach(function (button) {
      button.classList.toggle("active", button === activeButton);
    });
    overlay.querySelector(".slx-guide-status").textContent = "Loading " + label + " · PDF page " + page + "…";
    requestAnimationFrame(function () {
      nextFrame.src = guideUrl + "#page=" + page + "&zoom=page-fit";
      overlay.querySelector(".slx-guide-status").textContent = "Showing " + label + " · PDF page " + page;
    });
  }

  function openGuide(page) {
    var overlay = document.getElementById("slxGuide");
    var targetPage = typeof page === "number" ? page : 1;
    var label = targetPage === 2 ? "SET IRL directory" : "Guide cover";
    var activeButton = overlay.querySelector("[data-label=\"" + label + "\"]");
    loadGuidePage(targetPage, label, activeButton);
    overlay.classList.add("show");
  }

  function assetPreviewSvg(shape) {
    var body;
    if (shape === "table") {
      body = "<path class=\"line\" d=\"M60 30h200v44H60zM82 74v54m156-54v54M46 128h228\"/><rect class=\"fill\" x=\"100\" y=\"40\" width=\"120\" height=\"24\" rx=\"3\"/>";
    } else if (shape === "round") {
      body = "<ellipse class=\"line\" cx=\"160\" cy=\"48\" rx=\"92\" ry=\"28\"/><path class=\"line\" d=\"M68 48v42c0 16 41 29 92 29s92-13 92-29V48M160 76v52\"/><ellipse class=\"fill\" cx=\"160\" cy=\"48\" rx=\"52\" ry=\"15\"/>";
    } else if (shape === "cabinet") {
      body = "<path class=\"line\" d=\"M78 18h164v112H78zM90 36h140M90 58h140M90 80h140M90 102h140\"/><rect class=\"fill\" x=\"98\" y=\"42\" width=\"124\" height=\"10\" rx=\"2\"/>";
    } else if (shape === "sign") {
      body = "<path class=\"line\" d=\"M94 16h132v92H94zM160 108v26M116 134h88\"/><rect class=\"fill\" x=\"111\" y=\"34\" width=\"98\" height=\"42\" rx=\"3\"/>";
    } else {
      body = "<path class=\"line\" d=\"M90 18h140v112H90zM112 46l12 12 25-27M112 78l12 12 25-27M112 110l12 12 25-27M170 48h38M170 80h38M170 112h38\"/><circle class=\"fill\" cx=\"124\" cy=\"58\" r=\"5\"/>";
    }
    return "<svg viewBox=\"0 0 320 145\" role=\"img\" aria-label=\"Connected asset prototype preview\">" + body + "</svg>";
  }

  function populateIrlAreas() {
    var select = document.getElementById("slxIrlArea");
    var areas = irlAssets.map(function (asset) { return asset.area; }).filter(function (area, index, all) {
      return all.indexOf(area) === index;
    }).sort();
    select.innerHTML = "<option>All areas</option>" + areas.map(function (area) {
      return "<option>" + area + "</option>";
    }).join("");
  }

  function currentIrlAsset() {
    var id = document.getElementById("slxIrlAsset").value;
    return irlAssets.find(function (asset) { return asset.id === id; }) || null;
  }

  function updateIrlAssetChoices() {
    var source = document.getElementById("slxIrlSource").value;
    var brand = document.getElementById("slxIrlBrand").value;
    var area = document.getElementById("slxIrlArea").value;
    var query = document.getElementById("slxIrlSearch").value.trim().toLowerCase();
    var sourceMatches = irlAssets.filter(function (asset) {
      return (source === "All connected sources" || asset.source === source) &&
        (brand === "All brands" || asset.brand === brand || asset.brand === "All brands");
    });
    var availableAreas = sourceMatches.map(function (asset) { return asset.area; }).filter(function (value, index, all) {
      return all.indexOf(value) === index;
    }).sort();
    var areaSelect = document.getElementById("slxIrlArea");
    if (area !== "All areas" && availableAreas.indexOf(area) === -1) area = "All areas";
    areaSelect.innerHTML = "<option>All areas</option>" + availableAreas.map(function (value) {
      return "<option" + (value === area ? " selected" : "") + ">" + value + "</option>";
    }).join("");
    var matches = sourceMatches.filter(function (asset) {
      var haystack = [asset.name, asset.presentation, asset.assetType, asset.connector, asset.area, asset.id].join(" ").toLowerCase();
      return (area === "All areas" || asset.area === area) && (!query || haystack.indexOf(query) >= 0);
    });
    var select = document.getElementById("slxIrlAsset");
    var previous = select.value;
    select.innerHTML = matches.length ? matches.map(function (asset) {
      return "<option value=\"" + asset.id + "\"" + (asset.id === previous ? " selected" : "") + ">" + asset.name + " · " + asset.area + "</option>";
    }).join("") : "<option value=\"\">No connected sample matches those filters</option>";
    renderIrlAsset();
  }

  function irlContextFrequency(assetId) {
    return readPilotLedger().filter(function (entry) {
      return entry.type === "set-irl" && entry.context && entry.context.assetId === assetId;
    }).length;
  }

  function renderIrlAsset() {
    var asset = currentIrlAsset();
    var visual = document.getElementById("slxAssetVisual");
    var jump = document.getElementById("slxGuideJump");
    if (!asset) {
      visual.innerHTML = "<span>No connected sample found. Clear a filter to continue.</span>";
      document.getElementById("slxAssetName").textContent = "No asset selected";
      document.getElementById("slxAssetDetail").textContent = "";
      document.getElementById("slxAssetTags").innerHTML = "";
      document.getElementById("slxAssetPresentation").textContent = "";
      document.getElementById("slxAssetConnector").textContent = "";
      document.getElementById("slxPatternNote").textContent = "No context selected.";
      jump.classList.remove("show");
      return;
    }
    visual.innerHTML = assetPreviewSvg(asset.shape);
    document.getElementById("slxAssetName").textContent = asset.name;
    document.getElementById("slxAssetDetail").textContent = asset.detail;
    document.getElementById("slxAssetTags").innerHTML = [asset.source, asset.brand, asset.area, asset.assetType].map(function (tag) {
      return "<span>" + tag + "</span>";
    }).join("");
    document.getElementById("slxAssetPresentation").textContent = asset.presentation;
    document.getElementById("slxAssetConnector").textContent = asset.connector;
    var frequency = irlContextFrequency(asset.id);
    document.getElementById("slxPatternNote").textContent = frequency ?
      frequency + " related return" + (frequency === 1 ? "" : "s") + " about this context already exist in this browser." :
      "No related returns about this context exist in this browser yet.";
    if (asset.guidePage) {
      jump.href = guideUrl + "#page=" + asset.guidePage;
      jump.textContent = "Open guide page " + asset.guidePage + " ↗";
      jump.classList.add("show");
    } else {
      jump.classList.remove("show");
      jump.removeAttribute("href");
    }
    if (document.getElementById("slxIrlAction").value === "question") {
      document.getElementById("slxIrlCategory").value = asset.domain;
    }
    updateIrlRoute();
  }

  function updateIrlRoute() {
    var category = document.getElementById("slxIrlCategory").value;
    var asset = currentIrlAsset();
    var route = irlRoutes[category] || (asset ? asset.route : "Store Operations");
    document.querySelector("#slxRoutePreview span").textContent = route + " · final ownership is confirmed in the approved routing list.";
    document.getElementById("slxIrlTimer").classList.toggle("show", category === "time-study" || document.getElementById("slxIrlAction").value === "time-study");
  }

  function setIrlAction(action) {
    document.getElementById("slxIrlAction").value = action;
    document.querySelectorAll("[data-irl-action]").forEach(function (button) {
      var active = button.getAttribute("data-irl-action") === action;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    var asset = currentIrlAsset();
    var category = action === "time-study" ? "time-study" :
      action === "idea" ? "improvement" :
      action === "mismatch" && asset && asset.domain === "inventory" ? "inventory" :
      action === "mismatch" ? "facilities" :
      asset ? asset.domain : "execution";
    document.getElementById("slxIrlCategory").value = category;
    var prompts = {
      question: "What are you trying to understand about this exact asset, presentation, placement, or task?",
      "time-study": "What activity are you timing, and what helped or interrupted the work?",
      mismatch: "What does not match the guide, store, fixture, sign, assortment, or connected record?",
      idea: "What would make this direction, asset, task, or workflow work better next time?"
    };
    document.getElementById("slxIrlMessage").placeholder = prompts[action];
    updateIrlRoute();
  }

  function formatIrlTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    var remainder = seconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(remainder).padStart(2, "0");
  }

  function renderIrlTimer() {
    document.getElementById("slxTimerReadout").textContent = formatIrlTime(irlTimer.seconds);
    document.getElementById("slxTimerToggle").textContent = irlTimer.interval ? "Pause" : (irlTimer.seconds ? "Resume" : "Start");
  }

  function toggleIrlTimer() {
    if (irlTimer.interval) {
      clearInterval(irlTimer.interval);
      irlTimer.interval = null;
      renderIrlTimer();
      return;
    }
    irlTimer.interval = setInterval(function () {
      irlTimer.seconds += 1;
      renderIrlTimer();
    }, 1000);
    renderIrlTimer();
  }

  function resetIrlTimer() {
    if (irlTimer.interval) clearInterval(irlTimer.interval);
    irlTimer.interval = null;
    irlTimer.seconds = 0;
    renderIrlTimer();
  }

  function previewIrlEvidence(event) {
    var file = event.target.files[0];
    var preview = document.getElementById("slxEvidencePreview");
    var oldUrl = preview.dataset.objectUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    if (!file) {
      preview.classList.remove("show");
      preview.innerHTML = "";
      delete preview.dataset.objectUrl;
      return;
    }
    var objectUrl = URL.createObjectURL(file);
    preview.dataset.objectUrl = objectUrl;
    preview.innerHTML = "";
    var image = document.createElement("img");
    image.alt = "Current-store evidence preview";
    image.src = objectUrl;
    var detail = document.createElement("span");
    detail.textContent = file.name + " · " + Math.ceil(file.size / 1024) + " KB · local preview only";
    preview.append(image, detail);
    preview.classList.add("show");
  }

  function closeIrl(overlay) {
    if (irlTimer.interval) {
      clearInterval(irlTimer.interval);
      irlTimer.interval = null;
      renderIrlTimer();
    }
    overlay.classList.remove("show");
  }

  function openIrl() {
    var overlay = document.getElementById("slxIrl");
    renderIrlAsset();
    updateIrlRoute();
    overlay.classList.add("show");
    setTimeout(function () { document.getElementById("slxIrlSearch").focus(); }, 50);
  }

  function readPilotLedger() {
    try {
      return JSON.parse(localStorage.getItem(pilotLedgerKey) || "[]");
    } catch (error) {
      return [];
    }
  }

  function savedPilotProfile() {
    if (!window.SETLoopFeedback || typeof window.SETLoopFeedback.getProfile !== "function") return {};
    return window.SETLoopFeedback.getProfile() || {};
  }

  function saveIrlInsight(event) {
    event.preventDefault();
    var asset = currentIrlAsset();
    var categorySelect = document.getElementById("slxIrlCategory");
    var categoryKey = categorySelect.value;
    var category = categorySelect.options[categorySelect.selectedIndex].textContent;
    var message = document.getElementById("slxIrlMessage").value.trim();
    var identity = document.getElementById("slxIrlIdentity").value;
    var success = document.getElementById("slxIrlSuccess");
    if (!asset || !categoryKey || !message) {
      success.classList.add("show");
      success.textContent = "Choose a connected asset or presentation, select the question area, and add the field insight before returning it to the Loop.";
      return;
    }
    if (categoryKey === "time-study" && irlTimer.seconds === 0) {
      success.classList.add("show");
      success.textContent = "Start the live timer before returning a time study to the Loop.";
      return;
    }
    if (irlTimer.interval) {
      clearInterval(irlTimer.interval);
      irlTimer.interval = null;
      renderIrlTimer();
    }
    var profile = savedPilotProfile();
    var sharedProfile = identity === "profile" ? profile : identity === "role" ? {
      department: profile.department || current.scope,
      level: profile.level || ""
    } : {};
    var ledger = readPilotLedger();
    var normalizedMessage = message.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    var existingContextCount = ledger.filter(function (item) {
      return item.type === "set-irl" && item.context && item.context.assetId === asset.id;
    }).length;
    var existingQuestionCount = ledger.filter(function (item) {
      return item.type === "set-irl" && item.normalizedMessage === normalizedMessage;
    }).length;
    var evidenceFile = document.getElementById("slxIrlEvidence").files[0];
    var route = irlRoutes[categoryKey] || asset.route;
    var entry = {
      type: "set-irl",
      timestamp: new Date().toISOString(),
      page: current.label,
      scope: current.scope,
      action: document.getElementById("slxIrlAction").value,
      category: category,
      categoryKey: categoryKey,
      location: asset.area,
      minutes: irlTimer.seconds ? Math.round(irlTimer.seconds / 0.6) / 100 : "",
      timerSeconds: irlTimer.seconds,
      message: message,
      normalizedMessage: normalizedMessage,
      route: route,
      context: {
        assetId: asset.id,
        assetName: asset.name,
        source: asset.source,
        brand: asset.brand,
        area: asset.area,
        presentation: asset.presentation,
        assetType: asset.assetType,
        connector: asset.connector,
        guidePage: asset.guidePage
      },
      evidence: evidenceFile ? {
        name: evidenceFile.name,
        type: evidenceFile.type || "unknown",
        sizeKb: Math.ceil(evidenceFile.size / 1024),
        storage: "not persisted"
      } : null,
      contextOccurrence: existingContextCount + 1,
      exactQuestionOccurrence: existingQuestionCount + 1,
      profile: sharedProfile,
      identityChoice: identity,
      delivery: "local pilot queue"
    };
    try {
      ledger.push(entry);
      localStorage.setItem(pilotLedgerKey, JSON.stringify(ledger));
      success.classList.add("show");
      success.innerHTML = "<strong>Context returned to the SET Loop pilot ledger.</strong><br>Suggested route: " + route + ". This is return " + entry.contextOccurrence + " for " + asset.name + (entry.exactQuestionOccurrence > 1 ? " and occurrence " + entry.exactQuestionOccurrence + " of this same question pattern." : ".") + " Review it in this browser's <a href=\"feedback-results.html\">Pilot Results</a>.";
      document.getElementById("slxIrlMessage").value = "";
      document.getElementById("slxIrlEvidence").value = "";
      previewIrlEvidence({ target: document.getElementById("slxIrlEvidence") });
      resetIrlTimer();
      renderIrlAsset();
    } catch (error) {
      success.classList.add("show");
      success.textContent = "This browser could not save the insight. Copy your note before closing and try again.";
    }
  }

  function openAgent() {
    document.getElementById("slxAgent").classList.add("show");
    setTimeout(function () { document.getElementById("slxQuestion").focus(); }, 50);
  }

  function refreshSnapshot() {
    var time = document.getElementById("slxFreshTime");
    time.textContent = "Refreshing approved sources…";
    setTimeout(function () {
      time.textContent = "Last refreshed: " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }, 700);
  }

  function selectedPersona() {
    var select = document.getElementById("slxPersona");
    return personaProfiles[select ? select.value : "store"] || personaProfiles.store;
  }

  function updatePersonaHint() {
    var profile = selectedPersona();
    var hint = document.getElementById("slxPersonaNote");
    if (hint) hint.textContent = profile.label + " voice · " + profile.hint;
  }

  function speakAnswer(text, profile) {
    if (!("speechSynthesis" in window)) return false;
    var utterance = new SpeechSynthesisUtterance(text);
    var voices = window.speechSynthesis.getVoices().filter(function (voice) {
      return !voice.lang || /^en(?:-|_)/i.test(voice.lang);
    });
    utterance.voice = voices.find(function (voice) {
      return profile.preferredVoices.test(voice.name);
    }) || voices[profile.voiceIndex % Math.max(voices.length, 1)] || null;
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function answerQuestion() {
    var question = document.getElementById("slxQuestion").value.trim();
    var lower = question.toLowerCase();
    var answerBox = document.getElementById("slxAnswer");
    var answerText = document.getElementById("slxAnswerText");
    var source = document.getElementById("slxSource");
    var answerLink = document.getElementById("slxAnswerLink");
    var route = document.getElementById("slxRoute");
    var ticket = document.getElementById("slxTicket");
    ticket.textContent = "";
    answerLink.classList.remove("show");
    answerLink.removeAttribute("href");
    answerLink.textContent = "";

    if (!question) {
      answerText.textContent = "Enter a question so I can search the approved SET Loop sources.";
      source.textContent = "No query submitted.";
      route.classList.remove("show");
      answerBox.classList.add("show");
      return;
    }

    var match = approvedAnswers.map(function (item, index) {
      return {
        item: item,
        index: index,
        score: item.keywords.reduce(function (total, keyword) {
          return total + (lower.indexOf(keyword) !== -1 ? keyword.length : 0);
        }, 0)
      };
    }).filter(function (candidate) {
      return candidate.score > 0;
    }).sort(function (left, right) {
      return right.score - left.score || left.index - right.index;
    })[0];
    match = match && match.item;

    if (match) {
      var profile = selectedPersona();
      var presentedAnswer = profile.leadIn + " " + match.answer;
      answerText.className = "";
      answerText.textContent = presentedAnswer;
      source.textContent = profile.label + " delivery · Grounded in: " + match.source + " · Accountable partner: " + match.partner;
      if (match.url) {
        answerLink.href = match.url;
        answerLink.textContent = match.linkLabel || "Open approved SET Loop source";
        answerLink.classList.add("show");
      }
      route.classList.remove("show");
      if (document.getElementById("slxVoice").value === "speak" && !speakAnswer(presentedAnswer, profile)) {
        ticket.textContent = "Voice playback is unavailable in this browser. The approved answer remains visible above.";
      }
    } else {
      answerText.className = "slx-notfound";
      answerText.textContent = "I could not find an approved answer in the SET Loop sources available to this prototype. I will not invent one or search the web. Refine the question, or submit it for support.";
      source.textContent = "Suggested route: Home Office / Store Operations · Partner copied based on question classification.";
      route.classList.add("show");
    }
    answerBox.classList.add("show");
  }

  function routeQuestion() {
    var question = document.getElementById("slxQuestion").value.trim();
    var lower = question.toLowerCase();
    var partner = lower.indexOf("visual") !== -1 || lower.indexOf("fixture") !== -1 ? "Visual Merchandising" :
      lower.indexOf("inventory") !== -1 || lower.indexOf("product") !== -1 ? "Brand Merchandising + Supply Chain" :
      lower.indexOf("promotion") !== -1 || lower.indexOf("sign") !== -1 || lower.indexOf("marketing") !== -1 || lower.indexOf("pack") !== -1 || lower.indexOf("vmh") !== -1 ? "Marketing" : "Store Operations";
    var ticketId = "SET-" + Date.now().toString().slice(-6);
    var requests = JSON.parse(localStorage.getItem("setloop_agent_requests") || "[]");
    requests.push({ id: ticketId, question: question, scope: current.label, owner: "Home Office / Store Operations", copied: partner, created: new Date().toISOString() });
    localStorage.setItem("setloop_agent_requests", JSON.stringify(requests));
    document.getElementById("slxTicket").textContent = "Prepared " + ticketId + " for Home Office / Store Operations · " + partner + " copied.";
  }

  addStyles();
  buildShell();
  buildGuideModal();
  buildIrlModal();
  buildAgentModal();
  if (location.hash === "#set-irl") {
    setTimeout(openIrl, 0);
  }
}());
