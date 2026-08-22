(function () {
  "use strict";

  const QUEUE_KEY = "setloop_partner_help_v1";
  const LEDGER_KEY = "setloop_pilot_ledger_v1";
  const OWNER_KEY = "setloop_pilot_owner_email_v1";
  const $ = (selector) => document.querySelector(selector);

  const examples = {
    maintenance: {
      outcome: "Help store teams report a maintenance issue with the correct location, image, urgency, and ownership so it can be routed without repeated follow-up.",
      audience: "Store teams, District Managers, Facilities / Maintenance partners",
      current: "Current maintenance app and follow-up process",
      gap: "The intake needs clearer image requirements, store/fixture location evidence, status visibility, escalation ownership, and a return path to the field.",
      constraints: "Use approved systems; do not expose employee or customer data.",
      proof: "Workflow and ownership map"
    },
    zero: {
      outcome: "Help teams act on zero-on-hand signals by combining the approved inventory source, store context, investigation steps, and accountable exception route.",
      audience: "Store teams, DMs, Brand Merchandising, Supply Chain",
      current: "Zero-on-hand app and current inventory investigation",
      gap: "The desired action, source authority, exception reasons, supporting images, and handoff between field and Home Office need to be explicit.",
      constraints: "Inventory answers must come from approved connected data; no inferred availability.",
      proof: "Data and connection requirements"
    },
    agent: {
      outcome: "Build a structured agent that reduces repeated work while answering only from approved internal knowledge and routing unresolved questions to a person.",
      audience: "Partner team and the roles completing the workflow",
      current: "Manual questions, repeated prompts, and disconnected reference files",
      gap: "The agent needs an approved knowledge boundary, allowed actions, source citations, escalation path, test cases, ownership, and a feedback loop.",
      constraints: "No web search, no invented answers, no automatic access to private chats, and human review for consequential actions.",
      proof: "Clickable browser prototype"
    },
    other: {
      outcome: "Turn a partner idea into a clear, testable workflow that shows who needs it, what action it supports, and what evidence makes it trustworthy.",
      audience: "Partner team and intended field or Home Office users",
      current: "",
      gap: "The current output does not include enough operational detail, useful imagery, source evidence, ownership, or a clear next action.",
      constraints: "Keep source authority, approvals, privacy, and human review visible.",
      proof: "Partner-ready decision brief"
    }
  };

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); }
    catch (_) { return []; }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function fillExample(key) {
    const example = examples[key];
    $("#ideaOutcome").value = example.outcome;
    $("#ideaAudience").value = example.audience;
    $("#ideaCurrent").value = example.current;
    $("#ideaGap").value = example.gap;
    $("#ideaConstraints").value = example.constraints;
    $("#ideaProof").value = example.proof;
    $("#ideaOutcome").focus();
  }

  function fileSummary() {
    const files = [...$("#ideaFiles").files];
    if (!files.length) return [];
    return files.map((file) => ({ name: file.name, sizeKb: Math.ceil(file.size / 1024), type: file.type || "unknown" }));
  }

  function values() {
    return {
      partner: $("#ideaPartner").value.trim(),
      department: $("#ideaDepartment").value.trim(),
      outcome: $("#ideaOutcome").value.trim(),
      audience: $("#ideaAudience").value.trim(),
      currentProcess: $("#ideaCurrent").value.trim(),
      gap: $("#ideaGap").value.trim(),
      sharedAiContext: $("#ideaChat").value.trim(),
      files: fileSummary(),
      constraints: $("#ideaConstraints").value.trim(),
      nextProof: $("#ideaProof").value
    };
  }

  function buildBrief(entry) {
    const value = entry.details;
    const fileLines = value.files.length ? value.files.map((file) => `- ${file.name} (${file.sizeKb} KB)`).join("\n") : "None supplied";
    return [
      "SET PARTNER IDEA ACTION BRIEF",
      `Request: ${entry.id}`,
      `Generated: ${new Date(entry.timestamp).toLocaleString()}`,
      "",
      "PARTNER / TEAM",
      [value.partner, value.department].filter(Boolean).join(" · ") || "Not provided",
      "",
      "INTENDED OUTCOME",
      value.outcome,
      "",
      "WHO NEEDS IT",
      value.audience,
      "",
      "CURRENT TOOL OR PROCESS",
      value.currentProcess || "Not provided",
      "",
      "GAP TO SOLVE",
      value.gap,
      "",
      "VOLUNTARILY SHARED AI CONTEXT",
      value.sharedAiContext || "No conversation supplied",
      "",
      "REFERENCE FILES (LOCAL METADATA ONLY)",
      fileLines,
      "",
      "MUST STAY TRUE",
      value.constraints || "Not provided",
      "",
      "BEST NEXT PROOF",
      value.nextProof,
      "",
      "REFINEMENT QUESTIONS",
      "- What decision or action should become easier?",
      "- Which source is authoritative for each answer, data point, or image?",
      "- What role owns the next step and the exception?",
      "- What should return to SET Loop as reusable learning?",
      "- What would prove this works in one bounded pilot?",
      "",
      "BOUNDARY",
      "This brief contains only information the partner chose to provide. It does not establish production approval or automatic access to private chats, files, or systems."
    ].join("\n");
  }

  function saveRequest(details) {
    const entry = {
      id: `IDEA-${Date.now().toString().slice(-8)}`,
      type: "partner-help",
      timestamp: new Date().toISOString(),
      page: document.title,
      delivery: "local partner help queue",
      details
    };
    const queue = read(QUEUE_KEY);
    queue.push(entry);
    write(QUEUE_KEY, queue);
    const ledger = read(LEDGER_KEY);
    ledger.push(entry);
    write(LEDGER_KEY, ledger);
    return entry;
  }

  function renderQueue() {
    const queue = read(QUEUE_KEY).reverse();
    $("#queueCount").textContent = queue.length;
    $("#queueList").innerHTML = queue.length ? queue.map((entry) => `
      <article class="queue-item">
        <time>${new Date(entry.timestamp).toLocaleString()}</time>
        <div><strong>${escapeHtml(entry.details.outcome)}</strong><p>${escapeHtml([entry.details.partner, entry.details.department, entry.details.nextProof].filter(Boolean).join(" · "))}</p></div>
        <span>${escapeHtml(entry.id)}</span>
      </article>`).join("") : '<div class="queue-empty">No partner help requests are saved in this browser yet.</div>';
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function downloadText(text) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    link.download = `SET_PARTNER_IDEA_BRIEF_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function updateEmail(brief) {
    const owner = localStorage.getItem(OWNER_KEY) || "";
    $("#emailBrief").href = `mailto:${encodeURIComponent(owner)}?subject=${encodeURIComponent("SET partner idea help request")}&body=${encodeURIComponent(brief)}`;
  }

  document.querySelectorAll("[data-example]").forEach((button) => button.addEventListener("click", () => fillExample(button.dataset.example)));
  $("#ideaForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const entry = saveRequest(values());
    const brief = buildBrief(entry);
    $("#briefText").textContent = brief;
    $("#briefReceipt").textContent = `${entry.id} · saved to this browser’s Partner Help Queue`;
    $("#briefOutput").hidden = false;
    updateEmail(brief);
    renderQueue();
    $("#briefOutput").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#clearIdea").addEventListener("click", () => {
    $("#ideaForm").reset();
    $("#briefOutput").hidden = true;
  });
  $("#copyBrief").addEventListener("click", async () => {
    await window.innovationCopyText($("#briefText").textContent);
    $("#copyBrief").textContent = "Copied";
    setTimeout(() => { $("#copyBrief").textContent = "Copy brief"; }, 1400);
  });
  $("#downloadBrief").addEventListener("click", () => downloadText($("#briefText").textContent));

  renderQueue();
})();
