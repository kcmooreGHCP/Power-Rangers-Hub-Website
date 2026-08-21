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
  var approvedAnswers = [
    {
      keywords: ["brand guide", "store 0222", "cross creek", "guide"],
      answer: "The approved Store 0222 Brand Guide covers 20 rooms or zones and 105 presentations. Use its table of contents or full-store map to move to the exact room, zone, fixture, or cabinet run.",
      source: "Store 0222 Brand Guide · pages 1–3",
      partner: "Visual Merchandising"
    },
    {
      keywords: ["set irl", "time it", "tell us", "feedback"],
      answer: "SET IRL is the field return path inside the guide. It lets the team time the work or tell Home Office what happened in real life. Open the SET IRL directory from page 2, or use the SET IRL action on a presentation page.",
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
      keywords: ["inventory", "assortment", "product"],
      answer: "Inventory and assortment answers must come from the connected approved MSI dossier and SET Loop assortment manifest. This prototype does not infer availability from the web or from unapproved files.",
      source: "SET Loop approved MSI + assortment connection",
      partner: "Brand Merchandising + Supply Chain"
    }
  ];

  function addStyles() {
    var style = document.createElement("style");
    style.textContent = [
      ".slx-bar{position:sticky;top:0;z-index:8000;background:#fff;border-bottom:1px solid #e5e7eb;box-shadow:0 3px 14px rgba(17,19,26,.09);font-family:'Helvetica Neue',Arial,sans-serif}",
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
      ".slx-modal-head{padding:14px 18px;border-bottom:1px solid #eaecf0;display:flex;align-items:center;gap:12px}",
      ".slx-modal-head strong{font-size:15px}.slx-modal-head span{font-size:11px;color:#667085;flex:1}",
      ".slx-close{background:#fff;border:1px solid #d0d5dd;border-radius:6px;padding:6px 10px;cursor:pointer}",
      ".slx-guide-actions{padding:10px 18px;border-bottom:1px solid #eaecf0;display:flex;gap:8px;flex-wrap:wrap;background:#fff7fb}",
      ".slx-guide-actions a,.slx-guide-actions button{background:#fff;border:1px solid #ed2d8b;color:#9d174d;border-radius:7px;padding:7px 11px;font-size:12px;font-weight:700;text-decoration:none;cursor:pointer}",
      ".slx-guide-frame{border:0;width:100%;flex:1;background:#f2f4f7}",
      ".slx-agent-body{padding:18px;overflow:auto}",
      ".slx-guard{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 12px;font-size:11px;color:#166534;line-height:1.45;margin-bottom:12px}",
      ".slx-persona{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}",
      ".slx-persona label{font-size:11px;color:#475467;font-weight:700}.slx-persona select{width:100%;padding:8px;border:1px solid #d0d5dd;border-radius:6px;margin-top:4px}",
      ".slx-q{width:100%;min-height:86px;border:1px solid #d0d5dd;border-radius:8px;padding:10px;font:13px/1.4 inherit;resize:vertical}",
      ".slx-submit{background:#ed2d8b;color:#fff;border:0;border-radius:7px;padding:9px 14px;font-weight:700;cursor:pointer;margin-top:8px}",
      ".slx-answer{display:none;margin-top:14px;border:1px solid #eaecf0;border-radius:8px;padding:14px;font-size:13px;line-height:1.55}",
      ".slx-answer.show{display:block}.slx-source{font-size:10px;color:#667085;margin-top:9px;padding-top:8px;border-top:1px solid #eaecf0}",
      ".slx-notfound{color:#b42318}.slx-route{display:none;margin-top:10px;background:#11131a;color:#fff;border:0;border-radius:7px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer}",
      ".slx-route.show{display:inline-block}.slx-ticket{font-size:11px;color:#067647;font-weight:700;margin-top:8px}",
      "@media(max-width:700px){.slx-location{order:3;width:100%}.slx-kpi-inner{grid-template-columns:1fr 1fr}.slx-persona{grid-template-columns:1fr}}"
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
    inner.appendChild(makeButton("✨ SET IRL", function () { openGuide(2); }));
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
      "<div class=\"slx-guide-actions\"><button type=\"button\" data-page=\"1\">Guide cover</button><button type=\"button\" data-page=\"2\">Table of contents</button><button type=\"button\" data-page=\"3\">Full-store map</button><button type=\"button\" data-page=\"2\">✨ Highlight SET IRL directory</button><a href=\"" + guideUrl + "\" target=\"_blank\" rel=\"noopener\">Open guide in new window ↗</a></div>",
      "<iframe class=\"slx-guide-frame\" title=\"Interactive Store 0222 Brand Guide\" src=\"" + guideUrl + "#page=1\"></iframe>",
      "</div>"
    ].join("");
    overlay.querySelector(".slx-close").addEventListener("click", function () { overlay.classList.remove("show"); });
    overlay.querySelectorAll("[data-page]").forEach(function (button) {
      button.addEventListener("click", function () {
        overlay.querySelector("iframe").src = guideUrl + "#page=" + button.getAttribute("data-page");
      });
    });
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) overlay.classList.remove("show");
    });
    document.body.appendChild(overlay);
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
      "<div class=\"slx-persona\"><label>Team personality<select id=\"slxPersona\"><option>Store Operations · Clear + practical</option><option>Visual · Spatial + detail focused</option><option>PINK · Energetic + concise</option><option>Leadership · Executive summary</option></select></label><label>Voice<select id=\"slxVoice\"><option>Text only</option><option>Speak answer · system voice</option></select></label></div>",
      "<textarea class=\"slx-q\" id=\"slxQuestion\" placeholder=\"Ask about readiness, a priority task, the brand guide, SET IRL, a fixture, or an approved connected manifest...\"></textarea>",
      "<button class=\"slx-submit\" type=\"button\">Ask from approved sources</button>",
      "<div class=\"slx-answer\" id=\"slxAnswer\"><div id=\"slxAnswerText\"></div><div class=\"slx-source\" id=\"slxSource\"></div><button class=\"slx-route\" id=\"slxRoute\" type=\"button\">Submit to Home Office / Store Ops</button><div class=\"slx-ticket\" id=\"slxTicket\"></div></div>",
      "</div></div>"
    ].join("");
    overlay.querySelector(".slx-close").addEventListener("click", function () { overlay.classList.remove("show"); });
    overlay.querySelector(".slx-submit").addEventListener("click", answerQuestion);
    overlay.querySelector("#slxRoute").addEventListener("click", routeQuestion);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) overlay.classList.remove("show");
    });
    document.body.appendChild(overlay);
  }

  function openGuide(page) {
    var overlay = document.getElementById("slxGuide");
    overlay.querySelector("iframe").src = guideUrl + "#page=" + (typeof page === "number" ? page : 1);
    overlay.classList.add("show");
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

  function answerQuestion() {
    var question = document.getElementById("slxQuestion").value.trim();
    var lower = question.toLowerCase();
    var answerBox = document.getElementById("slxAnswer");
    var answerText = document.getElementById("slxAnswerText");
    var source = document.getElementById("slxSource");
    var route = document.getElementById("slxRoute");
    var ticket = document.getElementById("slxTicket");
    ticket.textContent = "";

    if (!question) {
      answerText.textContent = "Enter a question so I can search the approved SET Loop sources.";
      source.textContent = "No query submitted.";
      route.classList.remove("show");
      answerBox.classList.add("show");
      return;
    }

    var match = approvedAnswers.find(function (item) {
      return item.keywords.some(function (keyword) { return lower.indexOf(keyword) !== -1; });
    });

    if (match) {
      answerText.className = "";
      answerText.textContent = match.answer;
      source.textContent = "Grounded in: " + match.source + " · Accountable partner: " + match.partner;
      route.classList.remove("show");
      if (document.getElementById("slxVoice").value.indexOf("Speak") === 0 && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(match.answer));
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
      lower.indexOf("promotion") !== -1 || lower.indexOf("sign") !== -1 ? "Marketing" : "Store Operations";
    var ticketId = "SET-" + Date.now().toString().slice(-6);
    var requests = JSON.parse(localStorage.getItem("setloop_agent_requests") || "[]");
    requests.push({ id: ticketId, question: question, scope: current.label, owner: "Home Office / Store Operations", copied: partner, created: new Date().toISOString() });
    localStorage.setItem("setloop_agent_requests", JSON.stringify(requests));
    document.getElementById("slxTicket").textContent = "Prepared " + ticketId + " for Home Office / Store Operations · " + partner + " copied.";
  }

  addStyles();
  buildShell();
  buildGuideModal();
  buildAgentModal();
}());
