(function () {
  "use strict";

  const samples = {
    cabinet: {
      name: "5-channel cabinet direction",
      legacy: "Historical clue · X = 50",
      asset: "Image + filename suggest a 5-channel cabinet.",
      translation: "X=50 recreates the known cabinet proportion. It is not inches.",
      connector: "The store map must contain an eligible CABINET connector in an included room and zone.",
      selected: "VS Full prototype · eligible cabinet connector · Beauty zone B-04",
      candidate: "Same X clue exists, but SET still checks its own prototype and connector inventory.",
      svg: '<svg viewBox="0 0 420 300" role="img" aria-label="Illustrative five-channel cabinet"><rect x="38" y="50" width="344" height="210" rx="4" fill="#fffdf9" stroke="#92b7ff" stroke-width="8"/><path d="M107 50v210M176 50v210M244 50v210M313 50v210" stroke="#141211" stroke-width="7"/><path d="M38 112h344M38 184h344" stroke="#ff4f87" stroke-width="4"/><circle cx="72" cy="80" r="10" fill="#c7f36b"/><circle cx="141" cy="80" r="10" fill="#c7f36b"/><circle cx="210" cy="80" r="10" fill="#c7f36b"/><circle cx="278" cy="80" r="10" fill="#c7f36b"/><circle cx="347" cy="80" r="10" fill="#c7f36b"/></svg>'
    },
    floor: {
      name: "Floor fixture / tree stand",
      legacy: "Historical clue · Y = 62",
      asset: "Image + filename suggest a floor fixture or tree stand.",
      translation: "Y=62 is the recurring historical height proportion for this fixture family.",
      connector: "The store map must contain an eligible FLOOR_FIXTURE connector in the intended room and zone.",
      selected: "VS Full prototype · floor-fixture connector · Front Room zone F-02",
      candidate: "Y=62 identifies a fixture family; prototype coverage and zone still determine eligibility.",
      svg: '<svg viewBox="0 0 420 300" role="img" aria-label="Illustrative tree stand"><path d="M210 36l110 174H100z" fill="#fffdf9" stroke="#92b7ff" stroke-width="8"/><path d="M210 36v225M142 142h136M119 181h182" stroke="#141211" stroke-width="7"/><rect x="164" y="252" width="92" height="18" fill="#ff4f87"/><circle cx="210" cy="76" r="13" fill="#c7f36b"/></svg>'
    },
    form: {
      name: "Ground-level form",
      legacy: "Historical clue · Y = 69",
      asset: "Image + filename suggest a ground-level body form.",
      translation: "Y=69 recreates the known ground-form proportion; platform placement would require another rule.",
      connector: "The map must contain an eligible FORM connector and confirm whether the form is on the floor or a platform.",
      selected: "VS Full prototype · ground-form connector · Entry story zone E-01",
      candidate: "A form on a platform may share the asset type but not the same Y rule, so SET holds it for review.",
      svg: '<svg viewBox="0 0 420 300" role="img" aria-label="Illustrative ground-level form"><circle cx="210" cy="48" r="28" fill="#c7f36b"/><path d="M170 86q40-28 80 0l20 70-30 52v60h-60v-60l-30-52z" fill="#fffdf9" stroke="#92b7ff" stroke-width="8"/><path d="M181 118h58M160 156h100" stroke="#ff4f87" stroke-width="5"/></svg>'
    }
  };

  const $ = (selector) => document.querySelector(selector);

  function renderSample(key) {
    const sample = samples[key];
    $("[data-fixture-image]").innerHTML = sample.svg;
    $("[data-asset-name]").textContent = sample.name;
    $("[data-legacy-value]").textContent = sample.legacy;
    $("[data-chain-asset]").textContent = sample.asset;
    $("[data-chain-translation]").textContent = sample.translation;
    $("[data-chain-connector]").textContent = sample.connector;
    $("[data-selected-reason]").textContent = sample.selected;
    $("[data-candidate-reason]").textContent = sample.candidate;
    document.querySelectorAll("[data-sample]").forEach((button) => {
      const active = button.dataset.sample === key;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  const examples = {
    maintenance: {
      outcome: "Help store teams report a maintenance issue with the right location, image, urgency, and ownership so it can be routed without repeated follow-up.",
      audience: "Store teams, District Managers, Facilities / Maintenance partners",
      current: "Current maintenance app and follow-up process",
      gap: "The idea needs a clearer intake path, image requirements, location evidence, status visibility, and escalation ownership.",
      constraints: "Use approved systems; do not expose employee or customer data.",
      proof: "Workflow and ownership map"
    },
    zero: {
      outcome: "Help teams act on zero-on-hand signals by combining the approved inventory source, store context, investigation steps, and accountable exception route.",
      audience: "Store teams, DMs, Brand Merchandising, Supply Chain",
      current: "Zero-on-hand app and current inventory investigation",
      gap: "The desired action, source authority, exception reasons, supporting images, and handoff between field and Home Office need to be made explicit.",
      constraints: "Inventory answers must come from approved connected data; no inferred availability.",
      proof: "Data and connection requirements"
    },
    other: {
      outcome: "Turn a partner's idea into a clear, testable workflow that shows who needs it, what action it supports, and what evidence makes it trustworthy.",
      audience: "Partner team and intended field or Home Office users",
      current: "",
      gap: "The AI output did not include enough operational detail, useful imagery, source evidence, or a clear next action.",
      constraints: "Keep source authority, approvals, privacy, and human review visible.",
      proof: "Clickable browser prototype"
    }
  };

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
    if (!files.length) return "None supplied";
    return files.map((file) => `${file.name} (${Math.ceil(file.size / 1024)} KB)`).join("\n- ");
  }

  function buildBrief() {
    const transcript = $("#ideaChat").value.trim();
    return [
      "SET PARTNER IDEA ACTION BRIEF",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "INTENDED OUTCOME",
      $("#ideaOutcome").value.trim(),
      "",
      "WHO NEEDS IT",
      $("#ideaAudience").value.trim(),
      "",
      "CURRENT TOOL OR PROCESS",
      $("#ideaCurrent").value.trim() || "Not provided",
      "",
      "GAP TO SOLVE",
      $("#ideaGap").value.trim(),
      "",
      "VOLUNTARILY SHARED AI CONTEXT",
      transcript || "No conversation supplied",
      "",
      "REFERENCE FILES (LOCAL METADATA ONLY)",
      `- ${fileSummary()}`,
      "",
      "MUST STAY TRUE",
      $("#ideaConstraints").value.trim() || "Not provided",
      "",
      "BEST NEXT PROOF",
      $("#ideaProof").value,
      "",
      "REFINEMENT QUESTIONS",
      "- What decision or action should become easier?",
      "- Which source is authoritative for each answer or image?",
      "- What role owns the next step and the exception?",
      "- What would prove this works in one bounded pilot?",
      "",
      "BOUNDARY",
      "This brief contains only information the partner chose to provide. It does not establish a production connection, approval, or automatic access to private chats or files."
    ].join("\n");
  }

  function downloadText(text) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    link.download = `SET_PARTNER_IDEA_BRIEF_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  document.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => renderSample(button.dataset.sample));
  });
  document.querySelectorAll("[data-example]").forEach((button) => {
    button.addEventListener("click", () => fillExample(button.dataset.example));
  });
  $("#ideaForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const brief = buildBrief();
    $("#briefText").textContent = brief;
    $("#briefOutput").hidden = false;
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

  renderSample("cabinet");
})();
