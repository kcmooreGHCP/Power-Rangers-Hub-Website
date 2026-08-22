(function () {
  "use strict";

  const samples = {
    presentation: {
      name: "Front-of-store chain presentation",
      type: "Presentation direction",
      identifiers: ["VS", "3-room launch", "Front of store", "Parsons table", "Chain assortment"],
      direction: "The mock-store direction says: chain assortment, front of store, Parsons table, 3-room launch prototype.",
      profile: "The store registry confirms VS, 3-room launch, chain assortment, and the active launch window.",
      template: "The store template shell contains a front-of-store surface with a Parsons-table connector.",
      space: "Imported Blue Yonder space-planning information confirms the Parsons table exists in that location.",
      result: "SET builds the eligible store list and prepares the correct store-specific presentation for review.",
      selected: "3-room launch · chain assortment · front-of-store Parsons connector",
      candidate: "Assortment and prototype align; the exact surface connector still needs confirmation.",
      blocked: "This store does not share the required 3-room launch prototype or Parsons surface.",
      svg: '<svg viewBox="0 0 520 320" role="img" aria-label="Illustrative front-of-store Parsons table presentation"><rect x="40" y="34" width="440" height="252" fill="#fffdf9" stroke="#92b7ff" stroke-width="7"/><path d="M76 90h368" stroke="#ff4f87" stroke-width="8"/><rect x="150" y="145" width="220" height="70" fill="#c7f36b" stroke="#141211" stroke-width="7"/><path d="M172 215v48M348 215v48" stroke="#141211" stroke-width="12"/><circle cx="205" cy="180" r="22" fill="#92b7ff"/><circle cx="260" cy="180" r="22" fill="#ff4f87"/><circle cx="315" cy="180" r="22" fill="#92b7ff"/><text x="260" y="72" text-anchor="middle" font-family="Aptos,Segoe UI,sans-serif" font-size="18" font-weight="800" fill="#141211">FRONT OF STORE</text></svg>'
    },
    promotion: {
      name: "Fragrance feature promotion",
      type: "Promotion package",
      identifiers: ["VSB", "Beauty eligible", "Front room", "5-channel cabinet", "Campaign pack 4471"],
      direction: "Marketing tags the promotion with brand, campaign pack, eligibility, intended room, and fixture family.",
      profile: "The store profile confirms VSB assortment and Beauty promotional eligibility.",
      template: "The store template shell contains the required front-room 5-channel cabinet connector.",
      space: "Imported Blue Yonder information confirms the cabinet run and its store-specific zone.",
      result: "Eligible stores receive the correct sign quantity, placement, and promotion communication; missing evidence is held.",
      selected: "VSB eligible · campaign pack 4471 · front-room 5-channel cabinet",
      candidate: "Promotion eligibility aligns; sign quantity awaits the connected cabinet count.",
      blocked: "This store is not eligible for the VSB campaign pack and is excluded.",
      svg: '<svg viewBox="0 0 520 320" role="img" aria-label="Illustrative fragrance promotion on a five-channel cabinet"><rect x="55" y="42" width="410" height="236" rx="3" fill="#fffdf9" stroke="#92b7ff" stroke-width="7"/><path d="M137 42v236M219 42v236M301 42v236M383 42v236" stroke="#141211" stroke-width="6"/><path d="M55 120h410M55 202h410" stroke="#ff4f87" stroke-width="5"/><rect x="198" y="65" width="124" height="34" fill="#c7f36b"/><text x="260" y="88" text-anchor="middle" font-family="Aptos,Segoe UI,sans-serif" font-size="16" font-weight="900" fill="#141211">PACK 4471</text></svg>'
    },
    communication: {
      name: "Weekend readiness communication",
      type: "Required communication",
      identifiers: ["All brands", "Store leaders", "Active launch", "Weekend readiness", "Action required"],
      direction: "Store Operations tags the message by role, launch window, brand scope, and required action.",
      profile: "The role directory and store registry identify active launch stores and their accountable store leaders.",
      template: "No fixture is required; the communication template controls the approved message and action fields.",
      space: "Blue Yonder is not needed for this message. SET uses only sources relevant to the work being routed.",
      result: "The communication reaches the correct role and stores; acknowledgment and questions return through SET Loop.",
      selected: "Active launch store · Store Leader role · weekend action required",
      candidate: "The store is active, but accountable-role data needs confirmation.",
      blocked: "This location is outside the active launch audience and does not receive the message.",
      svg: '<svg viewBox="0 0 520 320" role="img" aria-label="Illustrative targeted readiness communication"><rect x="78" y="42" width="364" height="236" rx="10" fill="#fffdf9" stroke="#92b7ff" stroke-width="7"/><rect x="78" y="42" width="364" height="58" rx="10" fill="#c7f36b"/><path d="M118 138h284M118 174h230M118 210h260" stroke="#141211" stroke-width="9"/><circle cx="390" cy="242" r="24" fill="#ff4f87"/><path d="M379 242l8 8 15-18" fill="none" stroke="#fff" stroke-width="6"/></svg>'
    }
  };

  const $ = (selector) => document.querySelector(selector);

  function renderSample(key) {
    const sample = samples[key];
    $("[data-fixture-image]").innerHTML = sample.svg;
    $("[data-asset-name]").textContent = sample.name;
    $("[data-content-type]").textContent = sample.type;
    $("[data-identifier-list]").innerHTML = sample.identifiers.map((identifier) => `<span>${identifier}</span>`).join("");
    $("[data-chain-direction]").textContent = sample.direction;
    $("[data-chain-profile]").textContent = sample.profile;
    $("[data-chain-template]").textContent = sample.template;
    $("[data-chain-space]").textContent = sample.space;
    $("[data-chain-result]").textContent = sample.result;
    $("[data-selected-reason]").textContent = sample.selected;
    $("[data-candidate-reason]").textContent = sample.candidate;
    $("[data-blocked-reason]").textContent = sample.blocked;
    document.querySelectorAll("[data-sample]").forEach((button) => {
      const active = button.dataset.sample === key;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  document.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => renderSample(button.dataset.sample));
  });

  renderSample("presentation");
})();
