(function () {
  "use strict";
  if (document.querySelector(".set-expert-launch")) return;

  const scriptUrl = new URL(document.currentScript?.src || location.href);
  const innovationBase = new URL("./", scriptUrl);
  const LEDGER_KEY = "setloop_pilot_ledger_v1";
  const answers = [
    { keys:["route","right store","presentation","promotion","communication","prototype","blue yonder"], answer:"SET routes work by comparing the identifiers on the direction—such as brand, prototype, launch group, assortment, store area, fixture or role—with the approved store profile, template shell, eligibility rules, and relevant space-planning record. Only stores where the required identifiers align enter the audience.", source:"SET Routing Lab · content-to-store evidence chain", link:"set-connection-lab.html", label:"Open the routing demonstration" },
    { keys:["factory","floorset"], answer:"Floorset Factory is the working SET pilot for loading approved store context, fixture connectors, assets, translation evidence, and Brand Guide planning into one store-specific workspace.", source:"SET Resource Center · Floorset Factory working pilot", link:"../set-819/start/FLOORSET_FACTORY.html", label:"Open Floorset Factory" },
    { keys:["maintenance","zero on hand","automation","agent","trying to do","idea"], answer:"Partner AI + Automation Studio helps turn an idea into an intended outcome, audience, approved source plan, ownership map, exception path, and bounded proof. It can structure only the context a partner chooses to provide.", source:"Partner AI + Automation Studio · working browser pilot", link:"partner-ai-studio.html", label:"Open Partner AI Studio" },
    { keys:["set irl","field feedback","store voice","time study","ask about asset"], answer:"SET IRL starts with the exact guide, presentation, area, fixture, sign, assortment, or task a partner is looking at. It attaches that context to a question, mismatch, idea, or live time study; suggests the accountable partner path; and counts repeated patterns so direction and planning can improve.", source:"SET Loop · contextual SET IRL field return", link:"../store-ops/SET_LOOP_MASTER.html#set-irl", label:"Open SET IRL" },
    { keys:["activity","responses","clicked","tracking"], answer:"Prototype reactions are recorded in the visitor’s browser. They do not automatically aggregate across people. Approved production tracking requires the SharePoint List and Power Automate route.", source:"SET Loop Pilot Results · tracking boundary", link:"../store-ops/feedback-results.html", label:"Open Pilot Results" },
    { keys:["what is set loop","set loop"], answer:"SET is the build and targeting side; SET Loop is the role-specific receive, execute, return, and learning side. Together they connect approved direction to store action and field evidence back to accountable partners.", source:"SET + SET Loop · operating model", link:"../../vp-presentation.html#concept", label:"Open the operating model" }
  ];

  const launch = document.createElement("button");
  launch.type = "button";
  launch.className = "set-expert-launch";
  launch.setAttribute("aria-expanded", "false");
  launch.innerHTML = "<span>S</span><span>Scout · SET Expert</span>";
  const panel = document.createElement("aside");
  panel.className = "set-expert-panel";
  panel.setAttribute("aria-label", "Scout, your SET Expert");
  panel.innerHTML = `
    <div class="set-expert-head"><span class="set-expert-mark">S</span><div><strong>Hey, I’m Scout—your SET Expert.</strong><p>I can help navigate what is already inside SET + SET Loop and capture what we still need to learn.</p></div><button class="set-expert-close" type="button" aria-label="Close SET Expert">Close</button></div>
    <div class="set-expert-body">
      <div class="set-expert-guard"><strong>Inside the Loop only.</strong> I use the approved prototype knowledge defined here. I do not browse the web, open private chats, or invent an answer.</div>
      <div class="set-expert-suggestions"><button type="button">How does SET find the right store?</button><button type="button">Help with an automation idea</button><button type="button">Where is SET IRL?</button></div>
      <textarea class="set-expert-question" aria-label="Ask Scout about SET and SET Loop" placeholder="Ask about SET, SET Loop, routing, Floorset Factory, SET IRL, activity, or partner AI help..."></textarea>
      <button class="set-expert-ask" type="button">Ask Scout</button>
      <div class="set-expert-answer"><p></p><div class="set-expert-source"></div><a class="set-expert-link"></a><button class="set-expert-save" type="button">Save as a learning question</button><div class="set-expert-receipt"></div></div>
    </div>`;
  document.body.append(launch, panel);

  const question = panel.querySelector(".set-expert-question");
  const answerBox = panel.querySelector(".set-expert-answer");
  const answerText = answerBox.querySelector("p");
  const source = answerBox.querySelector(".set-expert-source");
  const link = answerBox.querySelector(".set-expert-link");
  const save = answerBox.querySelector(".set-expert-save");
  const receipt = answerBox.querySelector(".set-expert-receipt");

  function toggle(open) {
    panel.classList.toggle("show", open);
    launch.setAttribute("aria-expanded", String(open));
    if (open) setTimeout(() => question.focus(), 30);
  }

  function findAnswer(value) {
    const lower = value.toLowerCase();
    return answers.map((item, index) => ({ item, index, score:item.keys.reduce((total, key) => total + (lower.includes(key) ? key.length : 0), 0) }))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.item;
  }

  function answer() {
    const value = question.value.trim();
    answerBox.classList.add("show");
    receipt.textContent = "";
    save.classList.remove("show");
    link.classList.remove("show");
    link.removeAttribute("href");
    if (!value) {
      answerText.textContent = "Add a question so I can check the SET + SET Loop knowledge available to this prototype.";
      source.textContent = "No question submitted.";
      return;
    }
    const match = findAnswer(value);
    if (match) {
      answerText.textContent = match.answer;
      source.textContent = `Grounded in: ${match.source}`;
      link.href = new URL(match.link, innovationBase).href;
      link.textContent = match.label;
      link.classList.add("show");
    } else {
      answerText.textContent = "I do not have an approved answer for that inside the current SET + SET Loop knowledge. I will not guess or search the web. Save it as a learning question so it can inform an SOP, source connection, or future enhancement.";
      source.textContent = "Answer state: unresolved · human review required";
      save.classList.add("show");
    }
  }

  function saveQuestion() {
    const value = question.value.trim();
    if (!value) return;
    let ledger = [];
    try { ledger = JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]"); } catch (_) {}
    const entry = { id:`SCOUT-${Date.now().toString().slice(-8)}`, type:"expert-question", timestamp:new Date().toISOString(), page:document.title, question:value, answerState:"unresolved", delivery:"local learning queue" };
    ledger.push(entry);
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
    receipt.textContent = `${entry.id} saved in this browser’s learning queue. Approved production routing is still required.`;
    save.classList.remove("show");
  }

  launch.addEventListener("click", () => toggle(!panel.classList.contains("show")));
  panel.querySelector(".set-expert-close").addEventListener("click", () => toggle(false));
  panel.querySelector(".set-expert-ask").addEventListener("click", answer);
  save.addEventListener("click", saveQuestion);
  panel.querySelectorAll(".set-expert-suggestions button").forEach((button) => button.addEventListener("click", () => { question.value = button.textContent; answer(); }));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("show")) {
      toggle(false);
      launch.focus();
    }
  });
})();
