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
      image: "../shared-assets/real-world/store-0222-color-map.png",
      imageAlt: "Store 0222 approved color map showing real rooms, fixtures, Parsons tables, wall cabinets, and assortment zones",
      imageFit: "contain",
      imageSource: "Store 0222 approved color map · reference only"
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
      image: "../shared-assets/real-world/pink-wall-marketing.jpg",
      imageAlt: "Real PINK wall presentation with sports bras, bralettes, product drawers, fixtures, and promotional marketing",
      imageFit: "cover",
      imageSource: "PINK in-store test reference · wall + marketing"
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
      image: "../shared-assets/real-world/set-map-mode-proof.jpg",
      imageAlt: "Real SET map-mode proof showing fixture presentation assets positioned against store map connectors",
      imageFit: "cover",
      imageSource: "SET map-mode working reference · asset-to-store context"
    }
  };

  const $ = (selector) => document.querySelector(selector);

  function renderSample(key) {
    const sample = samples[key];
    const image = document.createElement("img");
    image.src = sample.image;
    image.alt = sample.imageAlt;
    image.className = sample.imageFit === "contain" ? "contain" : "";
    $("[data-fixture-image]").replaceChildren(image);
    $("[data-fixture-source]").textContent = sample.imageSource;
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
