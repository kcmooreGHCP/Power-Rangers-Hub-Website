(function () {
  "use strict";

  const samples = {
    presentation: {
      brand: "VS",
      brandKey: "vs",
      name: "Front-of-store chain presentation",
      type: "Presentation direction",
      identifiers: ["VS", "3-room launch", "Front of store", "Parsons table", "Chain assortment"],
      direction: "The mock-store direction says: chain assortment, front of store, Parsons table, 3-room launch prototype.",
      profile: "The store registry confirms VS, 3-room launch, chain assortment, and the active launch window.",
      templateTitle: "Inspect the template shell",
      template: "The store template shell contains a front-of-store surface with a Parsons-table connector.",
      spaceTitle: "Confirm the space plan",
      space: "Imported Blue Yonder space-planning information confirms the Parsons table exists in that location.",
      result: "SET builds the eligible store list and prepares the correct store-specific presentation for review.",
      sources: ["Store registry", "Template shell", "Assortment rules", "Blue Yonder space plan"],
      plainLanguage: "SET looks for stores that describe themselves the same way the work was described. If the direction says “chain product, front-of-store Parsons table, 3-room launch,” SET finds stores with that same approved combination. X/Y helps size a known fixture after the match; it does not decide who receives the work.",
      selected: "3-room launch · chain assortment · front-of-store Parsons connector",
      candidate: "Assortment and prototype align; the exact surface connector still needs confirmation.",
      blockedLabel: "Different prototype · excluded",
      blocked: "This store does not share the required 3-room launch prototype or Parsons surface.",
      image: "../shared-assets/real-world/store-0222-color-map.png",
      imageAlt: "Store 0222 approved color map showing real rooms, fixtures, Parsons tables, wall cabinets, and assortment zones",
      imageFit: "contain",
      imageSource: "Store 0222 · approved color map"
    },
    promotion: {
      brand: "PINK",
      brandKey: "pink",
      name: "PINK wall marketing update",
      type: "Promotion + marketing package",
      identifiers: ["PINK", "Wall eligible", "Room 2", "Wall + drawer fixture", "Approved campaign pack"],
      direction: "Marketing tags the update with brand, campaign pack, eligibility, intended room, and fixture family.",
      profile: "The store profile confirms PINK assortment and promotional eligibility.",
      templateTitle: "Inspect the template shell",
      template: "The store template shell contains the required Room 2 wall-and-drawer connector.",
      spaceTitle: "Confirm the space plan",
      space: "Imported Blue Yonder information confirms the wall run and its store-specific zone.",
      result: "Eligible PINK stores receive the correct imagery, product story, placement, and communication; missing evidence is held.",
      sources: ["Store registry", "Template shell", "Promotion eligibility", "Blue Yonder space plan"],
      plainLanguage: "SET compares the PINK campaign requirements with each store’s approved brand, room, fixture, and promotion eligibility. Stores with the right Room 2 wall receive the complete package; stores with missing evidence stay visible for review instead of receiving a best guess.",
      selected: "PINK eligible · approved campaign pack · Room 2 wall connector",
      candidate: "Brand and promotion eligibility align; the exact wall run still needs confirmation.",
      blockedLabel: "Not promotion eligible · excluded",
      blocked: "This store is not eligible for the PINK campaign package and is excluded.",
      image: "../shared-assets/real-world/pink-wall-marketing.jpg",
      imageAlt: "Real PINK wall presentation with sports bras, bralettes, product drawers, fixtures, and promotional marketing",
      imageFit: "cover",
      imageSource: "PINK · in-store wall + marketing test"
    },
    communication: {
      brand: "SET",
      brandKey: "set",
      name: "Weekend readiness communication",
      type: "Required communication",
      identifiers: ["All brands", "Store leaders", "Active launch", "Weekend readiness", "Action required"],
      direction: "Store Operations tags the message by role, launch window, brand scope, and required action.",
      profile: "The role directory and store registry identify active launch stores and their accountable store leaders.",
      templateTitle: "Check the delivery template",
      template: "No fixture is required; the communication template controls the approved message and action fields.",
      spaceTitle: "Use only relevant sources",
      space: "Blue Yonder is not needed for this message. SET uses only sources relevant to the work being routed.",
      result: "The communication reaches the correct role and stores; acknowledgment and questions return through SET Loop.",
      sources: ["Store registry", "Role directory", "Launch window", "Approved message template"],
      plainLanguage: "Not every route needs a fixture or space plan. For this communication, SET uses the active launch audience and accountable-role directory, then sends the approved action to the right store leaders. Questions and acknowledgment return through SET Loop.",
      selected: "Active launch store · Store Leader role · weekend action required",
      candidate: "The store is active, but accountable-role data needs confirmation.",
      blockedLabel: "Outside launch audience · excluded",
      blocked: "This location is outside the active launch audience and does not receive the message.",
      image: "../shared-assets/real-world/set-map-mode-proof.jpg",
      imageAlt: "Real SET map-mode proof showing fixture presentation assets positioned against store map connectors",
      imageFit: "cover",
      imageSource: "SET · map-mode working reference"
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
    const brand = $("[data-fixture-brand]");
    brand.textContent = sample.brand;
    brand.dataset.brand = sample.brandKey;
    $("[data-asset-name]").textContent = sample.name;
    $("[data-content-type]").textContent = sample.type;
    $("[data-identifier-list]").innerHTML = sample.identifiers.map((identifier) => `<span>${identifier}</span>`).join("");
    $("[data-chain-direction]").textContent = sample.direction;
    $("[data-chain-profile]").textContent = sample.profile;
    $("[data-chain-template-title]").textContent = sample.templateTitle;
    $("[data-chain-template]").textContent = sample.template;
    $("[data-chain-space-title]").textContent = sample.spaceTitle;
    $("[data-chain-space]").textContent = sample.space;
    $("[data-chain-result]").textContent = sample.result;
    $("[data-source-rail]").innerHTML = [
      "<span>Direction package</span><b>compares with</b>",
      ...sample.sources.map((source) => `<span>${source}</span>`),
      "<b>to create</b><span>Eligible store audience</span>"
    ].join("");
    $("[data-plain-language]").textContent = sample.plainLanguage;
    $("[data-selected-reason]").textContent = sample.selected;
    $("[data-candidate-reason]").textContent = sample.candidate;
    $("[data-blocked-label]").textContent = sample.blockedLabel;
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
