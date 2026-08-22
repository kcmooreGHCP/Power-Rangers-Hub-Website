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
      image: "../shared-assets/real-world/store-0222-brand-guide-map.png",
      imageAlt: "Cropped Store 0222 Brand Guide map showing only the full store plan, fixtures, presentations, cabinets, and connected zones",
      imageFit: "contain",
      imageSource: "Brand Guide · Store 0222 full-store map"
    },
    promotion: {
      brand: "PINK",
      brandKey: "pink",
      name: "PINK Intimates · Tier 1",
      type: "Mapped promotional direction",
      identifiers: ["PINK", "Intimates Tier 1", "C1 → C2 → C3", "Wear Everywhere", "Marketing included"],
      direction: "The Brand Guide defines the Tier 1 story, cabinet priorities, product families, and the marketing that belongs with each presentation.",
      profile: "The store profile confirms PINK Intimates Tier 1 eligibility and the mapped cabinet sequence.",
      templateTitle: "Inspect the template shell",
      template: "The store template shell locates C1, C2, and C3 so the direction can resolve to each real cabinet in order.",
      spaceTitle: "Confirm the space plan",
      space: "The mapped cabinet assets and imported space-planning evidence confirm where each C1–C3 presentation lives in this store.",
      result: "The store receives one connected package: overview direction, ordered cabinet images, product story, and the associated marketing proof.",
      sources: ["Store registry", "Brand Guide direction", "Mapped cabinet assets", "Marketing proof"],
      plainLanguage: "The promotional overview should not live separately from the cabinet details. SET connects the Tier 1 direction to the store’s C1, C2, and C3 assets, then delivers the three actual cabinet images in order with their product and marketing context.",
      selected: "PINK Tier 1 · C1–C3 mapped · promotional direction connected",
      candidate: "Tier and product story align; one cabinet connector still needs confirmation.",
      blockedLabel: "Not promotion eligible · excluded",
      blocked: "This store does not have the Tier 1 cabinet sequence and receives its approved alternate direction instead.",
      image: "../shared-assets/real-world/pink-tier-1-promo-direction.png",
      imageAlt: "PINK Intimates Tier 1 promotional direction showing cabinet priorities, product presentations, and associated marketing",
      imageFit: "contain",
      imageSource: "PINK Brand Guide · Intimates Tier 1 direction",
      sequence: [
        {
          step: "C1 · Priority 1",
          title: "Lightly Lined Wireless",
          detail: "Product, category message, tray, and cabinet architecture",
          image: "../shared-assets/real-world/pink-c1-lightly-lined-wireless.jpg",
          alt: "PINK C1 Lightly Lined Wireless cabinet with product, category sign, tray, and drawers"
        },
        {
          step: "C2 · Priority 2",
          title: "Lightly Lined T-Shirt",
          detail: "Product, category message, tray, and connected proof",
          image: "../shared-assets/real-world/pink-c2-lightly-lined-tshirt.jpg",
          alt: "PINK C2 Lightly Lined T-Shirt cabinet with product, category sign, tray, and drawers"
        },
        {
          step: "C3 · Priority 3",
          title: "Wear Everywhere Push-Up",
          detail: "Product, promotional marketing, tray, and cabinet architecture",
          image: "../shared-assets/real-world/pink-c3-wear-everywhere-pushup.jpg",
          alt: "PINK C3 Wear Everywhere Push-Up cabinet with product, promotional signs, tray, and drawers"
        }
      ]
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
    const sequence = $("[data-evidence-sequence]");
    if (sample.sequence) {
      sequence.hidden = false;
      sequence.innerHTML = `
        <div class="promotion-sequence__head">
          <div><p>Mapped cabinet sequence</p><h2>Direction becomes store-ready proof.</h2></div>
          <span>Each cabinet stays connected to its Brand Guide priority, product story, and marketing context.</span>
        </div>
        <div class="promotion-sequence__grid">
          ${sample.sequence.map((item) => `
            <article class="promotion-sequence__card">
              <img src="${item.image}" alt="${item.alt}">
              <footer><small>${item.step}</small><strong>${item.title}</strong><span>${item.detail}</span></footer>
            </article>
          `).join("")}
        </div>`;
    } else {
      sequence.hidden = true;
      sequence.replaceChildren();
    }
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
