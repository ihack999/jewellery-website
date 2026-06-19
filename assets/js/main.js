const DESIGN_STUDIO_PUBLIC = false;

const products = [
  {
    slug: "pear-halo-ring",
    name: "Pear Halo Ring",
    category: "rings",
    materials: "14k white gold with pear-cut centre stone",
    price: 850,
    shortDescription: "A luminous pear-cut ring with a delicate halo and refined pavé band.",
    description:
      "The Pear Halo Ring is shaped around a cool-toned pear-cut centre stone, a bright halo, and a slender pavé band that keeps the statement polished and wearable.",
    specs: [
      ["Materials", "14k white gold, pear-cut centre stone"],
      ["Sizing", "Available in sizes 5 to 9"],
      ["Finish", "High polish with pavé detailing"],
      ["Timeline", "Ready to ship in 5 to 7 business days"]
    ],
    care: "Store in its pouch and clean gently with a soft jewellery cloth.",
    shipping: "Complimentary gift-ready packaging with tracked Canadian shipping.",
    heroImage: "assets/images/drive/img-8503.jpg",
    gallery: [
      "assets/images/drive/img-8503.jpg",
      "assets/images/drive/img-1784.jpg",
      "assets/images/drive/img-4405-a.jpg",
      "assets/images/drive/img-2897.jpg"
    ],
    featured: true
  },
  {
    slug: "diamond-tennis-necklace",
    name: "Diamond Tennis Necklace",
    category: "necklaces",
    materials: "Sterling silver with crystal-set line",
    price: 680,
    shortDescription: "A bright tennis-style necklace with clean sparkle and an easy neckline.",
    description:
      "The Diamond Tennis Necklace follows the collarbone with a continuous line of bright stones, giving special-occasion polish while staying clean enough for modern styling.",
    specs: [
      ["Materials", "Sterling silver, crystal-set links"],
      ["Length", "16 inches with extender"],
      ["Finish", "High polish setting"],
      ["Timeline", "Ready to ship in 3 to 5 business days"]
    ],
    care: "Avoid fragrance contact and store flat to protect the stone setting.",
    shipping: "Wrapped in a structured keepsake box with polishing cloth included.",
    heroImage: "assets/images/drive/img-4403.jpg",
    gallery: [
      "assets/images/drive/img-4403.jpg",
      "assets/images/drive/img-2897.jpg",
      "assets/images/drive/img-9576.jpg",
      "assets/images/drive/img-1784.jpg"
    ],
    featured: true
  },
  {
    slug: "diamond-bracelet-stack",
    name: "Diamond Bracelet Stack",
    category: "bracelets",
    materials: "Sterling silver with diamond-like stones",
    price: 1200,
    shortDescription: "A layered bracelet stack with crisp stone settings and editorial shine.",
    description:
      "The Diamond Bracelet Stack brings together slim tennis-style bracelets with a clean, light-catching rhythm designed for polished evening styling.",
    specs: [
      ["Materials", "Sterling silver, crystal-set links"],
      ["Length", "6.75 to 7 inches"],
      ["Closure", "Low-profile box clasp"],
      ["Timeline", "Made to order in 2 to 3 weeks"]
    ],
    care: "Store flat and separate from harder pieces to avoid surface marks.",
    shipping: "Insured delivery and concierge tracking update included.",
    heroImage: "assets/images/drive/img-4406.jpg",
    gallery: [
      "assets/images/drive/img-4406.jpg",
      "assets/images/drive/img-4427.jpg",
      "assets/images/drive/img-4413.jpg",
      "assets/images/drive/img-4415-a.jpg"
    ],
    featured: true
  },
  {
    slug: "vintage-halo-stud-earrings",
    name: "Vintage Halo Stud Earrings",
    category: "earrings",
    materials: "Gold vermeil with crystal halo",
    price: 240,
    shortDescription: "A round stud pair with a warm centre and bright crystal halo.",
    description:
      "The Vintage Halo Stud Earrings balance a warm centre stone with a crisp surrounding halo, creating a compact statement that still feels elegant.",
    specs: [
      ["Materials", "Gold vermeil, crystal halo"],
      ["Size", "12 mm face"],
      ["Closure", "Post backing"],
      ["Timeline", "Ready to ship in 3 to 5 business days"]
    ],
    care: "Remove before showering and store in a dry pouch between wears.",
    shipping: "Prepared in gift-ready packaging with care card included.",
    heroImage: "assets/images/drive/img-9576.jpg",
    gallery: [
      "assets/images/drive/img-9576.jpg",
      "assets/images/drive/img-4403.jpg",
      "assets/images/drive/img-1784.jpg",
      "assets/images/drive/img-2897.jpg"
    ]
  },
  {
    slug: "gold-bezel-hand-chain",
    name: "Gold Bezel Hand Chain",
    category: "bracelets",
    materials: "Gold vermeil with bezel-set crystals",
    price: 210,
    shortDescription: "A delicate hand chain with bezel-set stones and a soft gold finish.",
    description:
      "The Gold Bezel Hand Chain traces from wrist to finger with fine links and small bezel-set stones, adding a light custom-feeling accent to occasion styling.",
    specs: [
      ["Materials", "Gold vermeil, crystal stations"],
      ["Length", "Adjustable bracelet and ring chain"],
      ["Finish", "Polished gold tone"],
      ["Timeline", "Ready to ship in 3 to 5 business days"]
    ],
    care: "Store flat, avoid moisture, and fasten before placing in its pouch.",
    shipping: "Boxed presentation with optional gift message at checkout later.",
    heroImage: "assets/images/drive/hand-chain-2.png",
    gallery: [
      "assets/images/drive/hand-chain-2.png",
      "assets/images/drive/hand-chain-3.png",
      "assets/images/drive/hand-chain-1.png",
      "assets/images/drive/img-8503.jpg"
    ]
  },
  {
    slug: "cushion-diamond-ring",
    name: "Cushion Diamond Ring",
    category: "rings",
    materials: "14k yellow gold with cushion-cut centre stone",
    price: 920,
    shortDescription: "A cushion-cut ring with a fine pavé band and quiet gold warmth.",
    description:
      "The Cushion Diamond Ring is designed with a clean cushion-cut centre stone and a pavé band, giving the piece classic brightness with a modern profile.",
    specs: [
      ["Materials", "14k yellow gold, cushion-cut stone"],
      ["Sizing", "Available in sizes 5 to 9"],
      ["Finish", "Polished gold with pavé band"],
      ["Timeline", "Ready to ship in 5 to 7 business days"]
    ],
    care: "Store separately and clean with a soft jewellery cloth after wear.",
    shipping: "Presented in a structured box with care instructions.",
    heroImage: "assets/images/drive/img-4405-a.jpg",
    gallery: [
      "assets/images/drive/img-4405-a.jpg",
      "assets/images/drive/img-1784.jpg",
      "assets/images/drive/img-8503.jpg",
      "assets/images/drive/img-4415-a.jpg"
    ]
  }
];

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0
});

const FAVORITES_KEY = "tj-favorite-products";
const RECENTLY_VIEWED_KEY = "tj-recently-viewed-products";
const COMPARE_PRODUCTS_KEY = "tj-compare-products";
const CUSTOM_FORM_DRAFT_KEY = "tj-custom-request-draft";

const gemstoneGuides = {
  "Clear Diamond": {
    image: "assets/images/gemstones/clear-diamond.jpg",
    focus: "52% 50%",
    palette: "colourless",
    copy: "Best for maximum brilliance, classic engagement pieces, and designs where sparkle is the main event.",
    suits: ["Engagement", "Daily wear", "Heirloom"],
    bestCuts: ["Round", "Oval", "Princess", "Emerald", "Cushion"],
    bestMetals: ["Platinum", "White Gold", "Yellow Gold"],
    careNotes: "Ultrasonic-safe in most settings. Wipe with warm soapy water; avoid harsh chlorine.",
    sourcing: "Natural and lab-grown both available. Lab stones cut your spend by ~30–50% at the same look.",
    meters: { hardness: 100, brilliance: 100, durability: 100, saturation: 8 },
    mohs: 10,
    specs: [["Look", "Bright white fire"], ["Best with", "Platinum or white gold"], ["Mood", "Timeless"], ["Wear", "Daily to formal"]]
  },
  "Blush Sapphire": {
    image: "assets/images/gemstones/blush-sapphire.jpg",
    focus: "49% 48%",
    palette: "warm",
    copy: "Best for romantic custom pieces, soft colour stories, and warm metals that make the stone feel personal.",
    suits: ["Romantic gift", "Occasion wear", "Soft palettes"],
    bestCuts: ["Oval", "Cushion", "Pear", "Round"],
    bestMetals: ["Rose Gold", "Yellow Gold", "White Gold"],
    careNotes: "Very durable. Safe for daily wear; rinse and polish with a soft cloth.",
    sourcing: "Sapphires are abundant — natural Sri Lankan / Madagascan stones offer the cleanest blush tones.",
    meters: { hardness: 90, brilliance: 78, durability: 95, saturation: 55 },
    mohs: 9,
    specs: [["Look", "Soft rose tone"], ["Best with", "Rose gold"], ["Mood", "Romantic"], ["Wear", "Gift or occasion"]]
  },
  "Blue Sapphire": {
    image: "assets/images/gemstones/blue-sapphire.jpg",
    focus: "52% 49%",
    palette: "cool",
    copy: "Best for polished contrast, statement rings, and designs that need colour while still feeling refined.",
    suits: ["Statement", "Daily wear", "Royal palettes"],
    bestCuts: ["Oval", "Cushion", "Round", "Emerald"],
    bestMetals: ["White Gold", "Platinum", "Yellow Gold"],
    careNotes: "Extremely tough. Safe in ultrasonic; clean with mild soap and a soft brush.",
    sourcing: "Ceylon and Australian sources are widely available; Kashmir / Burmese stones are rare and premium.",
    meters: { hardness: 90, brilliance: 80, durability: 95, saturation: 88 },
    mohs: 9,
    specs: [["Look", "Deep blue"], ["Best with", "White gold"], ["Mood", "Classic colour"], ["Wear", "Daily or event"]]
  },
  "Emerald Green": {
    image: "assets/images/gemstones/emerald-green.jpg",
    focus: "48% 48%",
    palette: "warm",
    copy: "Best for vintage-inspired designs, yellow gold settings, and rich custom pieces with a strong point of view.",
    suits: ["Heirloom", "Vintage", "Strong colour"],
    bestCuts: ["Emerald", "Cushion", "Oval", "Pear"],
    bestMetals: ["Yellow Gold", "Rose Gold", "Platinum"],
    careNotes: "Softer and inclusion-rich — avoid ultrasonic. Wipe with a damp cloth; remove before sport.",
    sourcing: "Colombian stones lead the colour conversation; Zambian emeralds offer cooler, bluer greens.",
    meters: { hardness: 60, brilliance: 65, durability: 55, saturation: 92 },
    mohs: 7.5,
    specs: [["Look", "Deep green"], ["Best with", "Yellow gold"], ["Mood", "Heirloom"], ["Wear", "Statement"]]
  }
};

const budgetProfiles = {
  "500 to 1000": {
    title: "Simple custom direction",
    copy: "Best for a clean silhouette, lighter detail, and a focused stone or metal choice.",
    progress: "24%",
    specs: [["Scope", "Simple"], ["Detail", "Minimal"], ["Stone", "Modest scale"], ["Timeline", "Shorter review"]]
  },
  "1000 to 5000": {
    title: "Detailed custom direction",
    copy: "A balanced range for custom proportions, accent stones, and a more personal finish.",
    progress: "48%",
    specs: [["Scope", "Detailed"], ["Detail", "Accent options"], ["Stone", "Flexible"], ["Timeline", "Standard review"]]
  },
  "5000 to 10000": {
    title: "Premium custom direction",
    copy: "A strong range for elevated stones, richer settings, and more design refinement.",
    progress: "72%",
    specs: [["Scope", "Premium"], ["Detail", "High"], ["Stone", "Larger options"], ["Timeline", "Design review"]]
  },
  "10000 plus": {
    title: "Statement custom direction",
    copy: "Best for substantial stones, complex settings, private sourcing, or luxury redesign conversations.",
    progress: "100%",
    specs: [["Scope", "Statement"], ["Detail", "Concierge"], ["Stone", "Sourcing possible"], ["Timeline", "Private review"]]
  }
};

function readStoredList(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");

    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function writeStoredList(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage is progressive enhancement only.
  }
}

function getFavoriteSlugs() {
  return new Set(readStoredList(FAVORITES_KEY));
}

function setFavoriteSlugs(favorites) {
  writeStoredList(FAVORITES_KEY, Array.from(favorites));
}

function isProductFavorite(slug) {
  return getFavoriteSlugs().has(slug);
}

function toggleProductFavorite(slug) {
  const favorites = getFavoriteSlugs();
  const isSaved = favorites.has(slug);

  if (isSaved) {
    favorites.delete(slug);
  } else {
    favorites.add(slug);
  }

  setFavoriteSlugs(favorites);

  return !isSaved;
}

function syncFavoriteButtons() {
  const favorites = getFavoriteSlugs();

  document.querySelectorAll("[data-favorite-toggle]").forEach((button) => {
    const slug = button.dataset.favoriteToggle;
    const isSaved = favorites.has(slug);
    const product = products.find((item) => item.slug === slug);
    const label = product ? `${isSaved ? "Remove" : "Save"} ${product.name}` : "Save piece";

    button.classList.toggle("is-active", isSaved);
    button.setAttribute("aria-pressed", String(isSaved));
    button.setAttribute("aria-label", label);
    button.querySelector("[data-favorite-label]")?.replaceChildren(document.createTextNode(isSaved ? "Saved" : "Save"));
  });
}

function setupFavoriteButtons(scope = document) {
  const buttons = [];

  if (scope.matches && scope.matches("[data-favorite-toggle]")) {
    buttons.push(scope);
  }

  if (scope.querySelectorAll) {
    buttons.push(...scope.querySelectorAll("[data-favorite-toggle]"));
  }

  buttons.forEach((button) => {
    if (button.dataset.favoriteReady === "true") {
      return;
    }

    button.dataset.favoriteReady = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const slug = button.dataset.favoriteToggle;
      const nowSaved = toggleProductFavorite(slug);
      syncFavoriteButtons();
      renderFavoritesShelf();
      document.dispatchEvent(new CustomEvent("tj:favorites-changed", { detail: { slug, saved: nowSaved } }));
      if (window.tjToast) {
        const product = products.find((item) => item.slug === slug);
        const name = product ? product.name : "Piece";
        window.tjToast(nowSaved ? `Saved ${name} to your pieces` : `Removed ${name} from saved`);
      }
    });
  });

  syncFavoriteButtons();
}

function renderFavoritesShelf() {
  const productGrid = document.querySelector("[data-shop-products]");

  if (!productGrid || !productGrid.parentNode) {
    return;
  }

  let shelf = document.querySelector("[data-favorites-shelf]");

  if (!shelf) {
    shelf = document.createElement("div");
    shelf.className = "favorites-shelf";
    shelf.dataset.favoritesShelf = "";
    productGrid.parentNode.insertBefore(shelf, productGrid);
  }

  const favorites = getFavoriteSlugs();
  const favoriteProducts = products.filter((product) => favorites.has(product.slug));

  if (!favoriteProducts.length) {
    shelf.hidden = true;
    shelf.replaceChildren();
    return;
  }

  shelf.hidden = false;
  shelf.innerHTML = `
    <div class="favorites-shelf__header">
      <span class="eyebrow">Saved Pieces</span>
      <strong>${favoriteProducts.length} ${favoriteProducts.length === 1 ? "piece" : "pieces"}</strong>
    </div>
    <div class="favorites-shelf__track">
      ${favoriteProducts.map((product) => `
        <a class="favorite-chip" href="product.html?slug=${product.slug}">
          <img src="${product.heroImage}" alt="${product.name}" loading="lazy">
          <span>${product.name}</span>
          <small>${money.format(product.price)}</small>
        </a>
      `).join("")}
    </div>
  `;
}

function rememberRecentlyViewed(slug) {
  const recent = readStoredList(RECENTLY_VIEWED_KEY).filter((item) => item !== slug);

  recent.unshift(slug);
  writeStoredList(RECENTLY_VIEWED_KEY, recent.slice(0, 8));
}

function renderRecentlyViewedShelf(anchorSelector, excludeSlug = "") {
  const anchor = document.querySelector(anchorSelector);

  if (!anchor || !anchor.parentNode) {
    return;
  }

  const context = anchor.hasAttribute("data-shop-products") ? "shop" : "product";
  let shelf = document.querySelector(`[data-recently-viewed-shelf="${context}"]`);

  if (!shelf) {
    shelf = document.createElement("div");
    shelf.className = "favorites-shelf recently-viewed-shelf";
    shelf.dataset.recentlyViewedShelf = context;
    anchor.parentNode.insertBefore(shelf, anchor);
  }

  const recentProducts = readStoredList(RECENTLY_VIEWED_KEY)
    .filter((slug) => slug !== excludeSlug)
    .map((slug) => products.find((product) => product.slug === slug))
    .filter(Boolean)
    .slice(0, 4);

  if (!recentProducts.length) {
    shelf.hidden = true;
    shelf.replaceChildren();
    return;
  }

  shelf.hidden = false;
  shelf.innerHTML = `
    <div class="favorites-shelf__header">
      <span class="eyebrow">Recently Viewed</span>
      <strong>${recentProducts.length} ${recentProducts.length === 1 ? "piece" : "pieces"}</strong>
    </div>
    <div class="favorites-shelf__track">
      ${recentProducts.map((product) => `
        <a class="favorite-chip" href="product.html?slug=${product.slug}">
          <img src="${product.heroImage}" alt="${product.name}" loading="lazy">
          <span>${product.name}</span>
          <small>${money.format(product.price)}</small>
        </a>
      `).join("")}
    </div>
  `;
}

function getCompareSlugs() {
  return readStoredList(COMPARE_PRODUCTS_KEY);
}

function setCompareSlugs(slugs) {
  writeStoredList(COMPARE_PRODUCTS_KEY, slugs.slice(0, 3));
}

function isProductCompared(slug) {
  return getCompareSlugs().includes(slug);
}

function toggleProductCompare(slug) {
  const compared = getCompareSlugs();
  const exists = compared.includes(slug);

  if (exists) {
    setCompareSlugs(compared.filter((item) => item !== slug));
    return false;
  }

  setCompareSlugs([slug, ...compared].slice(0, 3));
  return true;
}

function syncCompareButtons() {
  const compared = getCompareSlugs();

  document.querySelectorAll("[data-compare-toggle]").forEach((button) => {
    const isCompared = compared.includes(button.dataset.compareToggle);

    button.classList.toggle("is-active", isCompared);
    button.setAttribute("aria-pressed", String(isCompared));
    button.querySelector("[data-compare-label]")?.replaceChildren(document.createTextNode(isCompared ? "Comparing" : "Compare"));
  });
}

function renderCompareBar() {
  let bar = document.querySelector("[data-compare-bar]");

  if (!bar) {
    bar = document.createElement("aside");
    bar.className = "compare-bar";
    bar.dataset.compareBar = "";
    bar.setAttribute("aria-live", "polite");
    document.body.appendChild(bar);
  }

  const comparedProducts = getCompareSlugs()
    .map((slug) => products.find((product) => product.slug === slug))
    .filter(Boolean);

  if (!comparedProducts.length) {
    bar.hidden = true;
    bar.replaceChildren();
    return;
  }

  bar.hidden = false;
  bar.innerHTML = `
    <div class="compare-bar__items">
      ${comparedProducts.map((product) => `
        <span>
          <img src="${product.heroImage}" alt="${product.name}" loading="lazy">
          <strong>${product.name}</strong>
        </span>
      `).join("")}
    </div>
    <div class="compare-bar__actions">
      <button class="button" type="button" data-open-compare>Compare</button>
      <button class="button-secondary" type="button" data-clear-compare>Clear</button>
    </div>
  `;

  bar.querySelector("[data-open-compare]")?.addEventListener("click", renderCompareModal);
  bar.querySelector("[data-clear-compare]")?.addEventListener("click", () => {
    setCompareSlugs([]);
    syncCompareButtons();
    renderCompareBar();
  });
}

function renderCompareModal() {
  let modal = document.querySelector("[data-compare-modal]");

  if (!modal) {
    modal = document.createElement("div");
    modal.className = "compare-modal";
    modal.dataset.compareModal = "";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Product comparison");
    document.body.appendChild(modal);
  }

  const comparedProducts = getCompareSlugs()
    .map((slug) => products.find((product) => product.slug === slug))
    .filter(Boolean);

  if (!comparedProducts.length) {
    return;
  }

  const rows = [
    ["Price", (product) => money.format(product.price)],
    ["Category", (product) => product.category],
    ["Materials", (product) => product.materials],
    ["Timeline", (product) => product.specs.find(([label]) => label === "Timeline")?.[1] || "Available by request"],
    ["Best for", (product) => product.shortDescription]
  ];

  modal.innerHTML = `
    <div class="compare-modal__scrim" data-close-compare></div>
    <div class="compare-modal__panel">
      <div class="compare-modal__header">
        <div>
          <span class="eyebrow">Compare Pieces</span>
          <h2>Review details side by side</h2>
        </div>
        <button class="icon-button" type="button" data-close-compare aria-label="Close comparison">X</button>
      </div>
      <div class="compare-table">
        <div class="compare-table__row compare-table__row--media" style="--compare-count:${comparedProducts.length}">
          <span></span>
          ${comparedProducts.map((product) => `
            <a href="product.html?slug=${product.slug}">
              <img src="${product.heroImage}" alt="${product.name}" loading="lazy">
              <strong>${product.name}</strong>
            </a>
          `).join("")}
        </div>
        ${rows.map(([label, getter]) => `
          <div class="compare-table__row" style="--compare-count:${comparedProducts.length}">
            <span>${label}</span>
            ${comparedProducts.map((product) => `<p>${getter(product)}</p>`).join("")}
          </div>
        `).join("")}
      </div>
    </div>
  `;

  modal.classList.add("is-open");
  document.body.classList.add("modal-open");
  modal.querySelectorAll("[data-close-compare]").forEach((button) => {
    button.addEventListener("click", () => {
      modal.classList.remove("is-open");
      document.body.classList.remove("modal-open");
    });
  });
}

function setupCompareButtons(scope = document) {
  const buttons = [];

  if (scope.matches && scope.matches("[data-compare-toggle]")) {
    buttons.push(scope);
  }

  if (scope.querySelectorAll) {
    buttons.push(...scope.querySelectorAll("[data-compare-toggle]"));
  }

  buttons.forEach((button) => {
    if (button.dataset.compareReady === "true") {
      return;
    }

    button.dataset.compareReady = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleProductCompare(button.dataset.compareToggle);
      syncCompareButtons();
      renderCompareBar();
    });
  });

  syncCompareButtons();
  renderCompareBar();
}

function productCardMarkup(product) {
  const isSaved = isProductFavorite(product.slug);
  const isCompared = isProductCompared(product.slug);

  return `
    <article class="product-card" data-product-card="${product.slug}" data-reveal>
      <button class="favorite-button ${isSaved ? "is-active" : ""}" type="button" data-favorite-toggle="${product.slug}" aria-label="${isSaved ? "Remove" : "Save"} ${product.name}" aria-pressed="${isSaved}">
        <span data-favorite-label>${isSaved ? "Saved" : "Save"}</span>
      </button>
      <button class="compare-button ${isCompared ? "is-active" : ""}" type="button" data-compare-toggle="${product.slug}" aria-label="Compare ${product.name}" aria-pressed="${isCompared}">
        <span data-compare-label>${isCompared ? "Comparing" : "Compare"}</span>
      </button>
      <a class="product-card__link" href="product.html?slug=${product.slug}">
        <div class="product-card__media">
          <img src="${product.heroImage}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-card__body">
          <h3>${product.name}</h3>
          <p class="product-card__materials">${product.materials}</p>
          <span class="product-card__price">${money.format(product.price)}</span>
        </div>
      </a>
    </article>
  `;
}

function renderProductCollection(container, items) {
  if (!container) {
    return;
  }

  container.innerHTML = items.map(productCardMarkup).join("");
  applyRevealDelays(container);
  setupDepthCards(container);
  setupFavoriteButtons(container);
  setupCompareButtons(container);
  renderFavoritesShelf();
}

function setupHeader() {
  const body = document.body;
  const menuButton = document.querySelector("[data-menu-toggle]");
  const navLinks = document.querySelectorAll(".primary-nav a");
  const header = document.querySelector(".site-header");

  if (menuButton) {
    menuButton.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      body.classList.toggle("nav-open");
    });
  }

  navLinks.forEach((link) => {
    if (link.dataset.page === body.dataset.page) {
      link.classList.add("is-active");
    }

    link.addEventListener("click", () => {
      body.classList.remove("nav-open");
      if (menuButton) {
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  });

  const onScroll = () => {
    if (!header) {
      return;
    }

    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function renderFeaturedProducts() {
  const container = document.querySelector("[data-featured-products]");
  const featured = products.filter((product) => product.featured).slice(0, 3);
  renderProductCollection(container, featured);
}

function renderShopProducts(filter = "all") {
  const container = document.querySelector("[data-shop-products]");
  if (!container) {
    return;
  }

  const items = filter === "all"
    ? products
    : products.filter((product) => product.category === filter);

  renderProductCollection(container, items);
  renderRecentlyViewedShelf("[data-shop-products]");
  revealVisible();
}

function setupShopFilters() {
  const chips = document.querySelectorAll("[data-filter]");
  if (!chips.length) {
    return;
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((item) => item.classList.remove("is-active"));
      chip.classList.add("is-active");
      renderShopProducts(chip.dataset.filter || "all");
    });
  });

  renderShopProducts("all");
}

function renderProductPage() {
  const page = document.querySelector("[data-product-page]");
  if (!page) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const product = products.find((item) => item.slug === slug) || products[0];

  rememberRecentlyViewed(product.slug);

  page.querySelector("[data-product-name]").textContent = product.name;
  page.querySelector("[data-product-category]").textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);
  page.querySelector("[data-product-price]").textContent = money.format(product.price);
  page.querySelector("[data-product-materials]").textContent = product.materials;
  page.querySelector("[data-product-description]").textContent = product.description;
  page.querySelector("[data-product-shipping]").textContent = product.shipping;
  page.querySelector("[data-product-care]").textContent = product.care;

  const mainImage = page.querySelector("[data-product-main-image]");
  const thumbnailGrid = page.querySelector("[data-product-thumbnails]");
  const detailList = page.querySelector("[data-product-specs]");
  const related = page.querySelector("[data-related-products]");

  const updateMainImage = (src, animate = false) => {
    if (!mainImage) {
      return;
    }

    if (!animate) {
      mainImage.src = src;
      mainImage.alt = product.name;
      return;
    }

    mainImage.classList.add("is-swapping");

    window.setTimeout(() => {
      mainImage.src = src;
      mainImage.alt = product.name;
      mainImage.classList.remove("is-swapping");
    }, 140);
  };

  updateMainImage(product.gallery[0]);

  thumbnailGrid.innerHTML = product.gallery
    .map(
      (image, index) => `
        <button class="thumbnail-button ${index === 0 ? "is-active" : ""}" type="button" data-gallery-thumb>
          <img src="${image}" alt="${product.name} view ${index + 1}" loading="lazy">
        </button>
      `
    )
    .join("");

  detailList.innerHTML = product.specs
    .map(
      ([label, value]) => `
        <li>
          <strong>${label}</strong>
          <span>${value}</span>
        </li>
      `
    )
    .join("");

  thumbnailGrid.querySelectorAll("[data-gallery-thumb]").forEach((button, index) => {
    button.addEventListener("click", () => {
      thumbnailGrid.querySelectorAll("[data-gallery-thumb]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      updateMainImage(product.gallery[index], true);
    });
  });

  renderProductCollection(
    related,
    products.filter((item) => item.slug !== product.slug).slice(0, 3)
  );
  renderRecentlyViewedShelf("[data-related-products]", product.slug);

  const cartButton = page.querySelector("[data-cart-button]");
  const cartStatus = page.querySelector("[data-cart-status]");
  const actionGroup = page.querySelector(".product-action-group");

  if (cartButton && cartStatus) {
    cartButton.addEventListener("click", () => {
      cartStatus.textContent = "Cart flow is staged for design review. Product details are ready to connect to checkout later.";
    });
  }

  if (actionGroup && !actionGroup.querySelector("[data-product-page-favorite]")) {
    const favoriteButton = document.createElement("button");
    favoriteButton.className = "button-secondary product-save-button";
    favoriteButton.type = "button";
    favoriteButton.dataset.favoriteToggle = product.slug;
    favoriteButton.dataset.productPageFavorite = "true";
    favoriteButton.innerHTML = '<span data-favorite-label>Save</span>';
    actionGroup.appendChild(favoriteButton);
    setupFavoriteButtons(actionGroup);
  }

  if (actionGroup && !actionGroup.querySelector("[data-product-page-compare]")) {
    const compareButton = document.createElement("button");
    compareButton.className = "button-secondary product-compare-button";
    compareButton.type = "button";
    compareButton.dataset.compareToggle = product.slug;
    compareButton.dataset.productPageCompare = "true";
    compareButton.innerHTML = '<span data-compare-label>Compare</span>';
    actionGroup.appendChild(compareButton);
    setupCompareButtons(actionGroup);
  }
}

function setupFaq() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const trigger = item.querySelector(".faq-question");
    if (!trigger) {
      return;
    }

    trigger.addEventListener("click", () => {
      item.classList.toggle("is-open");
    });
  });
}

function syncSelectedPiece(form) {
  const selectedItem = form.dataset.selectedItem || "";

  form.querySelectorAll("[data-selected-piece]").forEach((field) => {
    if ("value" in field) {
      field.value = selectedItem;
    } else {
      field.textContent = selectedItem;
    }
  });

  form.querySelectorAll("[data-selected-piece-label]").forEach((field) => {
    field.textContent = selectedItem || "your selected piece";
  });
}

function getGeneratedDesignFile(form) {
  const file = form?.__tjGeneratedDesignFile;

  if (!file || typeof file.name !== "string" || typeof file.size !== "number") {
    return null;
  }

  return file;
}

function filesMatch(firstFile, secondFile) {
  return Boolean(
    firstFile &&
      secondFile &&
      firstFile.name === secondFile.name &&
      firstFile.size === secondFile.size &&
      firstFile.type === secondFile.type &&
      firstFile.lastModified === secondFile.lastModified
  );
}

function clearGeneratedDesignUpload(form, picker, input) {
  if (!getGeneratedDesignFile(form)) {
    return;
  }

  delete form.__tjGeneratedDesignFile;
  delete input.dataset.generatedDesignFile;
  picker.classList.remove("has-generated-design");

  const preview = picker.querySelector("[data-design-preview]");

  if (preview) {
    const previewUrl = preview.dataset.previewUrl;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    delete preview.dataset.previewUrl;
    preview.hidden = true;
    preview.replaceChildren();
  }
}

function setupFilePickers() {
  document.querySelectorAll("[data-file-picker]").forEach((picker) => {
    const input = picker.querySelector("[data-file-input]");
    const fileName = picker.querySelector("[data-file-name]");

    if (!input || !fileName) {
      return;
    }

    const updateFileName = () => {
      const file = (input.files && input.files[0]) || getGeneratedDesignFile(input.form);
      fileName.textContent = file ? file.name : "No file selected yet";
    };

    input.addEventListener("change", (event) => {
      const selectedFile = input.files && input.files[0];
      const generatedFile = getGeneratedDesignFile(input.form);

      if (event.isTrusted && generatedFile && !filesMatch(selectedFile, generatedFile)) {
        clearGeneratedDesignUpload(input.form, picker, input);
      }

      updateFileName();
    });

    input.form?.addEventListener("reset", () => {
      window.setTimeout(() => {
        clearGeneratedDesignUpload(input.form, picker, input);
        updateFileName();
      }, 0);
    });

    updateFileName();
  });
}

function setupPieceTypePrefill() {
  const params = new URLSearchParams(window.location.search);
  const rawPiece = params.get("piece") || params.get("piece-type");
  const select = document.querySelector("#piece-type");

  if (!rawPiece || !select) {
    return;
  }

  const pieceMap = {
    ring: "Ring",
    rings: "Ring",
    necklace: "Necklace",
    necklaces: "Necklace",
    bracelet: "Bracelet",
    bracelets: "Bracelet",
    earring: "Earrings",
    earrings: "Earrings",
    other: "Other"
  };
  const normalizedPiece = rawPiece.trim().toLowerCase().replace(/[^a-z]/g, "");
  const selectedPiece = pieceMap[normalizedPiece];

  if (!selectedPiece) {
    return;
  }

  select.value = selectedPiece;
  select.dispatchEvent(new Event("change", { bubbles: true }));

  const field = select.closest(".form-field");
  if (field) {
    field.classList.add("is-prefilled");
  }
}

function formatGuideLabel(value) {
  return (value || "")
    .replace(/[-_]+/gu, " ")
    .replace(/\b\w/gu, (letter) => letter.toUpperCase());
}

function guideBudgetFormValue(value) {
  return {
    simple: "500 to 1000",
    detailed: "1000 to 5000",
    premium: "5000 to 10000",
    statement: "10000 plus"
  }[value] || "1000 to 5000";
}

function createGuideContext(answers) {
  return {
    occasion: answers.occasion || "engagement",
    wear: answers.wear || "daily",
    budget: answers.budget || "simple",
    occasionLabel: formatGuideLabel(answers.occasion || "engagement"),
    wearLabel: formatGuideLabel(answers.wear || "daily"),
    budgetLabel: formatGuideLabel(answers.budget || "simple"),
    budgetFormValue: guideBudgetFormValue(answers.budget)
  };
}

function createCustomDesignHref(state, context = {}) {
  const params = new URLSearchParams();

  Object.entries(state).forEach(([key, value]) => {
    params.set(key, typeof value === "boolean" ? (value ? "1" : "0") : value);
  });

  if (context.occasion) {
    params.set("guide-occasion", context.occasion);
  }

  if (context.wear) {
    params.set("guide-wear", context.wear);
  }

  if (context.budget) {
    params.set("guide-budget", context.budget);
    params.set("form-budget", context.budgetFormValue || guideBudgetFormValue(context.budget));
  }

  const targetHash = DESIGN_STUDIO_PUBLIC ? "design-studio" : "request-form";
  return `customs.html?${params.toString()}#${targetHash}`;
}

function recommendCustomDirection(answers) {
  const context = createGuideContext(answers);
  const budgetMap = {
    simple: { size: "0.9", weight: "0.9", halo: false, accent: false, scope: "clean and focused", priceLow: 600, priceHigh: 1100, complexity: 28, weeks: "3–4" },
    detailed: { size: "1.2", weight: "1", halo: true, accent: true, scope: "detailed but balanced", priceLow: 1200, priceHigh: 4800, complexity: 52, weeks: "4–6" },
    premium: { size: "1.5", weight: "1.12", halo: true, accent: true, scope: "premium and refined", priceLow: 5200, priceHigh: 9800, complexity: 74, weeks: "5–7" },
    statement: { size: "1.9", weight: "1.28", halo: true, accent: true, scope: "bold and high-impact", priceLow: 10500, priceHigh: 22000, complexity: 92, weeks: "6–9" }
  };
  const tierMap = {
    refined: { sizeMul: 0.78, weightMul: 0.92, halo: false, accent: false, finish: "Soft Satin", complexityDelta: -18, priceMul: 0.72, label: "Refined", note: "Pared back: smaller centre, clean profile, lower spend." },
    signature: { sizeMul: 1.0, weightMul: 1.0, halo: null, accent: null, finish: null, complexityDelta: 0, priceMul: 1.0, label: "Signature", note: "On-brief: balanced proportions matched to your answers." },
    statement: { sizeMul: 1.28, weightMul: 1.12, halo: true, accent: true, finish: "High Polish", complexityDelta: 16, priceMul: 1.45, label: "Statement", note: "Maxed up: larger stone, framed detail, bolder presence." }
  };
  const budget = budgetMap[answers.budget] || budgetMap.simple;
  const tier = tierMap[answers.tier] || tierMap.signature;
  const base = {
    piece: answers.piece || "Ring",
    metal: answers.metal || "White Gold",
    setting: budget.halo ? "Prong" : "Bezel",
    finish: tier.finish || (answers.budget === "simple" ? "Soft Satin" : "High Polish"),
    shape: "Oval",
    stone: "Clear Diamond",
    size: (Number(budget.size) * tier.sizeMul).toFixed(2),
    weight: (Number(budget.weight) * tier.weightMul).toFixed(2),
    halo: tier.halo !== null ? tier.halo : budget.halo,
    accent: tier.accent !== null ? tier.accent : budget.accent,
    lighting: answers.wear === "statement" ? "Flash" : "Showroom",
    engraving: ""
  };

  // Mood overrides — adjust shape, setting, finish for the chosen vibe.
  const mood = answers.mood || "modern";
  if (mood === "vintage") {
    base.setting = "Bezel";
    base.finish = tier.label === "Statement" ? "Milgrain Edge" : "Soft Satin";
    base.shape = "Cushion";
  } else if (mood === "romantic") {
    base.shape = "Oval";
    base.finish = tier.label === "Refined" ? "Soft Satin" : "High Polish";
    base.stone = answers.metal === "Rose Gold" ? "Blush Sapphire" : base.stone;
  } else if (mood === "bold") {
    base.shape = "Pear";
    base.finish = "High Polish";
    base.lighting = "Flash";
  }

  // Piece-only mood/occasion tweaks (only when user did NOT explicitly pick a piece).
  if (!answers.piece) {
    if (answers.occasion === "gift") {
      base.piece = answers.wear === "daily" || answers.wear === "delicate" ? "Necklace" : "Bracelet";
      base.shape = "Round";
      base.setting = "Bezel";
      base.stone = answers.metal === "Rose Gold" ? "Blush Sapphire" : "Clear Diamond";
    }
    if (answers.occasion === "event" || answers.wear === "statement") {
      base.piece = answers.occasion === "event" ? "Earrings" : "Ring";
      base.shape = "Pear";
      base.stone = answers.metal === "Yellow Gold" ? "Emerald Green" : "Blue Sapphire";
      base.finish = "High Polish";
      base.lighting = "Flash";
    }
    if (answers.occasion === "personal") {
      base.piece = answers.wear === "daily" ? "Bracelet" : "Necklace";
      base.shape = answers.wear === "delicate" ? "Round" : "Cushion";
      base.setting = "Bezel";
    }
  }

  const title = `${base.shape} ${base.stone} ${base.piece}`;
  const copy = `${budget.scope.charAt(0).toUpperCase()}${budget.scope.slice(1)} direction in ${base.metal.toLowerCase()}, tuned for ${answers.wear} wear.`;
  const priceLow = Math.round(budget.priceLow * tier.priceMul);
  const priceHigh = Math.round(budget.priceHigh * tier.priceMul);
  const complexity = Math.max(10, Math.min(100, budget.complexity + tier.complexityDelta));
  const priceRange = `${money.format(priceLow)} – ${money.format(priceHigh)}`;

  return {
    state: base,
    context,
    title,
    copy,
    tier: tier.label,
    tierNote: tier.note,
    priceLow,
    priceHigh,
    priceRange,
    complexity,
    timeline: `${budget.weeks} weeks`,
    specs: [
      ["Piece", base.piece],
      ["Stone", `${base.size} ct feel ${base.shape} ${base.stone}`],
      ["Metal", base.metal],
      ["Detail", `${base.setting}, ${base.halo ? "framed" : "clean"}, ${base.accent ? "accent stones" : "minimal profile"}`],
      ["Range", priceRange],
      ["Timeline", `${budget.weeks} weeks`]
    ]
  };
}

function recommendCustomDirections(answers) {
  return ["refined", "signature", "statement"].map((tier) => recommendCustomDirection({ ...answers, tier }));
}

function applyGuideRecommendationToForm(recommendation) {
  const form = document.querySelector("[data-custom-form]");

  if (!form || !recommendation) {
    return;
  }

  const { state, context } = recommendation;
  const setValue = (selector, value) => {
    const field = form.querySelector(selector);

    if (!field) {
      return;
    }

    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    field.closest(".form-field")?.classList.add("is-prefilled");
  };
  const selectedBudget = form.querySelector(`input[name="budget"][value="${context.budgetFormValue}"]`);
  const description = form.querySelector("#description");
  const guideSummary = [
    `${recommendation.title}`,
    `Occasion: ${context.occasionLabel}`,
    `Wear: ${context.wearLabel}`,
    `Budget direction: ${context.budgetLabel}`,
    `Metal: ${state.metal}`,
    `Stone: ${state.size} ct feel ${state.shape} ${state.stone}`,
    `Detail: ${state.setting}, ${state.halo ? "diamond frame" : "clean center"}, ${state.accent ? "accent stones" : "minimal profile"}`
  ].join("\n");

  setValue("#piece-type", state.piece);
  setValue("#metal-preference", `${state.metal}, ${state.finish}`);
  setValue("#stone-preference", `${state.size} ct feel ${state.stone}, ${state.shape}`);
  setValue("#finish-preference", `${state.setting} setting, ${state.halo ? "diamond frame" : "unframed center stone"}, ${state.accent ? "accent stones" : "clean profile"}`);
  setValue("#dimensions", `${state.piece} designer scale: ${state.size} ct feel, ${context.wearLabel.toLowerCase()} wear`);
  setValue("#occasion", `${context.occasionLabel} / ${context.wearLabel} wear`);

  if (selectedBudget) {
    selectedBudget.checked = true;
    selectedBudget.dispatchEvent(new Event("change", { bubbles: true }));
    selectedBudget.closest(".form-field")?.classList.add("is-prefilled");
  }

  if (description) {
    const existing = description.value.replace(/\n*\[Guided Direction\][\s\S]*?(?=\n\n\[|$)/u, "").trim();
    description.value = `${existing ? `${existing}\n\n` : ""}[Guided Direction]\n${guideSummary}`;
    description.dispatchEvent(new Event("input", { bubbles: true }));
    description.closest(".form-field")?.classList.add("is-prefilled");
  }
}

function recommendationFromGuideParams() {
  const params = new URLSearchParams(window.location.search);

  if (!params.has("guide-occasion") && !params.has("guide-wear") && !params.has("guide-budget")) {
    return null;
  }

  return recommendCustomDirection({
    occasion: params.get("guide-occasion") || "engagement",
    wear: params.get("guide-wear") || "daily",
    budget: params.get("guide-budget") || "simple",
    metal: params.get("metal") || "White Gold"
  });
}

function setupCustomGuide() {
  const guide = document.querySelector("[data-custom-guide]");

  if (!guide) {
    return;
  }

  const form = guide.querySelector(".custom-guide__form");
  const cardsHost = guide.querySelector("[data-guide-directions]");
  const summary = guide.querySelector("[data-guide-summary]");

  if (!form || !cardsHost) {
    return;
  }

  const selected = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || "";

  const renderCard = (rec, isFeatured) => {
    const article = document.createElement("article");
    article.className = `guide-direction guide-direction--${rec.tier.toLowerCase()}${isFeatured ? " guide-direction--featured" : ""}`;
    article.dataset.guideTier = rec.tier;

    const header = document.createElement("header");
    header.className = "guide-direction__header";
    header.innerHTML = `
      <span class="guide-direction__tag">${rec.tier}</span>
      <h3>${rec.title}</h3>
    `;

    const note = document.createElement("p");
    note.className = "guide-direction__note";
    note.textContent = rec.tierNote;

    const price = document.createElement("div");
    price.className = "guide-direction__price";
    price.innerHTML = `<small>From</small><strong>${rec.priceRange}</strong>`;

    const meter = document.createElement("div");
    meter.className = "guide-meter";
    meter.innerHTML = `
      <div class="guide-meter__row"><span>Complexity</span><span class="guide-meter__bar"><i style="width:${rec.complexity}%"></i></span></div>
      <div class="guide-meter__row"><span>Timeline</span><strong>${rec.timeline}</strong></div>
    `;

    const dl = document.createElement("dl");
    dl.className = "guide-direction__specs";
    rec.specs.slice(0, 4).forEach(([label, value]) => {
      const wrap = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      wrap.append(dt, dd);
      dl.appendChild(wrap);
    });

    const actions = document.createElement("div");
    actions.className = "guide-direction__actions";
    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = DESIGN_STUDIO_PUBLIC ? "button-secondary" : "button";
    apply.textContent = "Use for Request";
    apply.addEventListener("click", () => {
      applyGuideRecommendationToForm(rec);
      document.querySelector("#request-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    if (DESIGN_STUDIO_PUBLIC) {
      const open = document.createElement("a");
      open.className = "button";
      open.href = createCustomDesignHref(rec.state, rec.context);
      open.textContent = "Open in Studio";
      actions.append(open);
    }
    actions.append(apply);

    article.append(header, note, price, meter, dl, actions);
    return article;
  };

  const update = () => {
    const answers = {
      occasion: selected("guide-occasion"),
      wear: selected("guide-wear"),
      budget: selected("guide-budget"),
      metal: selected("guide-metal"),
      piece: selected("guide-piece"),
      mood: selected("guide-mood")
    };
    const directions = recommendCustomDirections(answers);

    cardsHost.replaceChildren(...directions.map((rec) => renderCard(rec, rec.tier === "Signature")));

    if (summary) {
      const ctx = directions[0].context;
      summary.textContent = `${answers.piece || "Piece"} • ${ctx.occasionLabel} • ${ctx.wearLabel} wear • ${ctx.budgetLabel} budget • ${formatGuideLabel(answers.mood || "Modern")} mood`;
    }
  };

  form.addEventListener("change", update);
  update();
}

function setupContextualCustomFields() {
  const select = document.querySelector("#piece-type");
  const panels = document.querySelectorAll("[data-context-panel]");
  const dimensionsLabel = document.querySelector('label[for="dimensions"]');
  const dimensions = document.querySelector("#dimensions");
  const labels = {
    Ring: "Ring Size or Dimensions",
    Necklace: "Necklace Length or Pendant Scale",
    Bracelet: "Bracelet Length or Wrist Size",
    Earrings: "Earring Size or Drop Length",
    Other: "Dimensions or Custom Notes"
  };
  const placeholders = {
    Ring: "Size 7, band width, centre stone scale",
    Necklace: "16 inch chain, pendant scale, neckline",
    Bracelet: "7 inch bracelet, wrist size, clasp preference",
    Earrings: "Stud size, drop length, backing preference",
    Other: "Approximate dimensions, placement, or use"
  };

  if (!select || !panels.length) {
    return;
  }

  const update = () => {
    const selectedPiece = select.value || "Ring";

    panels.forEach((panel) => {
      const isActive = panel.dataset.contextPanel === selectedPiece;
      panel.hidden = !isActive;
      panel.querySelectorAll("input, select, textarea").forEach((field) => {
        field.disabled = !isActive;
      });
    });

    if (dimensionsLabel) {
      dimensionsLabel.textContent = labels[selectedPiece] || labels.Other;
    }

    if (dimensions) {
      dimensions.placeholder = placeholders[selectedPiece] || placeholders.Other;
    }
  };

  select.addEventListener("change", update);
  update();
}

function setupFaqSearch() {
  const search = document.querySelector("[data-faq-search]");
  const items = document.querySelectorAll(".faq-item");

  if (!search || !items.length) {
    return;
  }

  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();

    items.forEach((item) => {
      const matches = item.textContent.toLowerCase().includes(query);
      item.hidden = Boolean(query && !matches);
    });
  });
}

function setupBudgetEstimator() {
  const estimator = document.querySelector("[data-budget-estimator]");
  const form = document.querySelector("[data-custom-form]");

  if (!estimator || !form) {
    return;
  }

  const title = estimator.querySelector("[data-budget-title]");
  const copy = estimator.querySelector("[data-budget-copy]");
  const meter = estimator.querySelector("[data-budget-meter]");
  const specs = estimator.querySelector("[data-budget-specs]");

  const update = () => {
    const selectedBudget = form.querySelector('input[name="budget"]:checked')?.value || "1000 to 5000";
    const profile = budgetProfiles[selectedBudget] || budgetProfiles["1000 to 5000"];
    const piece = form.querySelector("#piece-type")?.value || "Custom piece";
    const metal = form.querySelector("#metal-preference")?.value || "metal to confirm";
    const stone = form.querySelector("#stone-preference")?.value || "stone direction to confirm";

    if (title) {
      title.textContent = profile.title;
    }

    if (copy) {
      copy.textContent = profile.copy;
    }

    if (meter) {
      meter.style.width = profile.progress;
    }

    if (specs) {
      specs.replaceChildren();
      [
        ["Piece", piece],
        ["Metal", metal],
        ["Stone", stone],
        ...profile.specs
      ].forEach(([label, value]) => {
        const wrapper = document.createElement("div");
        const term = document.createElement("dt");
        const detail = document.createElement("dd");

        term.textContent = label;
        detail.textContent = value;
        wrapper.append(term, detail);
        specs.appendChild(wrapper);
      });
    }
  };

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}

function setupGemstoneGuide() {
  const guide = document.querySelector("[data-gemstone-guide]");

  if (!guide) {
    return;
  }

  const cards = Array.from(guide.querySelectorAll("[data-gemstone]"));
  const title = guide.querySelector("[data-gemstone-title]");
  const copy = guide.querySelector("[data-gemstone-copy]");
  const specs = guide.querySelector("[data-gemstone-specs]");
  const visual = guide.querySelector("[data-gemstone-visual]");
  const apply = guide.querySelector("[data-gemstone-apply]");
  const metersHost = guide.querySelector("[data-gemstone-meters]");
  const cutsHost = guide.querySelector("[data-gemstone-cuts]");
  const careHost = guide.querySelector("[data-gemstone-care]");
  const sourcingHost = guide.querySelector("[data-gemstone-sourcing]");
  const suitsHost = guide.querySelector("[data-gemstone-suits]");
  const filterButtons = Array.from(guide.querySelectorAll("[data-gemstone-filter]"));
  const compareToggle = guide.querySelector("[data-gemstone-compare-toggle]");
  const compareDrawer = guide.querySelector("[data-gemstone-compare]");
  const compareClose = guide.querySelector("[data-gemstone-compare-close]");

  let compareMode = false;
  const compareSet = new Set();

  const meterLabels = {
    hardness: "Hardness",
    brilliance: "Brilliance",
    durability: "Durability",
    saturation: "Colour"
  };

  const renderMeters = (host, data) => {
    if (!host) return;
    host.replaceChildren();
    Object.entries(data.meters || {}).forEach(([key, value]) => {
      const row = document.createElement("div");
      row.className = "gem-meter__row";
      row.innerHTML = `<span>${meterLabels[key] || key}</span><span class="gem-meter__bar"><i style="width:${value}%"></i></span><em>${value}</em>`;
      host.appendChild(row);
    });
  };

  const renderChips = (host, items, opts = {}) => {
    if (!host) return;
    host.replaceChildren();
    (items || []).forEach((item) => {
      const chip = document.createElement(opts.href ? "a" : "span");
      chip.className = "gem-chip";
      chip.textContent = item;
      if (opts.href) chip.href = opts.href(item);
      host.appendChild(chip);
    });
  };

  const update = (name) => {
    const guideData = gemstoneGuides[name] || gemstoneGuides["Clear Diamond"];

    cards.forEach((card) => card.classList.toggle("is-active", card.dataset.gemstone === name));

    if (title) title.textContent = name;
    if (copy) copy.textContent = guideData.copy;
    if (careHost) careHost.textContent = guideData.careNotes || "";
    if (sourcingHost) sourcingHost.textContent = guideData.sourcing || "";

    if (visual) {
      visual.dataset.gemstoneVisual = name.toLowerCase().replace(/\s+/g, "-");
      visual.style.setProperty("--gemstone-image", `url("${guideData.image}")`);
      visual.style.setProperty("--gemstone-focus", guideData.focus || "50% 50%");
    }

    renderMeters(metersHost, guideData);
    renderChips(suitsHost, guideData.suits);
    renderChips(cutsHost, guideData.bestCuts, DESIGN_STUDIO_PUBLIC ? {
      href: (shape) => `customs.html?stone=${encodeURIComponent(name)}&shape=${encodeURIComponent(shape)}#design-studio`
    } : {});

    if (apply) {
      apply.hidden = !DESIGN_STUDIO_PUBLIC;
      if (DESIGN_STUDIO_PUBLIC) {
        const params = new URLSearchParams({ stone: name, shape: (guideData.bestCuts && guideData.bestCuts[0]) || "Oval" });
        apply.href = `customs.html?${params.toString()}#design-studio`;
      }
    }

    if (specs) {
      specs.replaceChildren();
      [["Mohs hardness", `${guideData.mohs} / 10`], ...guideData.specs].forEach(([label, value]) => {
        const wrap = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = label;
        dd.textContent = value;
        wrap.append(dt, dd);
        specs.appendChild(wrap);
      });
    }
  };

  const applyFilter = (palette) => {
    cards.forEach((card) => {
      const data = gemstoneGuides[card.dataset.gemstone];
      const matches = palette === "all" || !data || data.palette === palette;
      card.hidden = !matches;
    });
    filterButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.gemstoneFilter === palette));
  };

  const renderCompareDrawer = () => {
    if (!compareDrawer) return;
    const list = compareDrawer.querySelector("[data-compare-list]");
    if (!list) return;
    list.replaceChildren();
    Array.from(compareSet).forEach((name) => {
      const data = gemstoneGuides[name];
      if (!data) return;
      const col = document.createElement("article");
      col.className = "gem-compare__col";
      col.innerHTML = `
        <header style="background-image:url('${data.image}')"><strong>${name}</strong></header>
        <dl>
          <div><dt>Mohs</dt><dd>${data.mohs} / 10</dd></div>
          <div><dt>Hardness</dt><dd><span class="gem-meter__bar"><i style="width:${data.meters.hardness}%"></i></span></dd></div>
          <div><dt>Brilliance</dt><dd><span class="gem-meter__bar"><i style="width:${data.meters.brilliance}%"></i></span></dd></div>
          <div><dt>Durability</dt><dd><span class="gem-meter__bar"><i style="width:${data.meters.durability}%"></i></span></dd></div>
          <div><dt>Colour</dt><dd><span class="gem-meter__bar"><i style="width:${data.meters.saturation}%"></i></span></dd></div>
          <div><dt>Best with</dt><dd>${(data.bestMetals || []).join(", ")}</dd></div>
          <div><dt>Care</dt><dd>${data.careNotes || ""}</dd></div>
        </dl>
      `;
      list.appendChild(col);
    });
    compareDrawer.hidden = compareSet.size === 0;
    compareDrawer.classList.toggle("is-open", compareSet.size > 0);
  };

  const setCompareMode = (on) => {
    compareMode = !!on;
    guide.classList.toggle("is-comparing", compareMode);
    if (compareToggle) {
      compareToggle.setAttribute("aria-pressed", String(compareMode));
      compareToggle.textContent = compareMode ? "Done Comparing" : "Compare Stones";
    }
    if (!compareMode) {
      compareSet.clear();
      cards.forEach((card) => card.classList.remove("is-comparing"));
      if (compareDrawer) {
        compareDrawer.hidden = true;
        compareDrawer.classList.remove("is-open");
      }
    } else {
      renderCompareDrawer();
    }
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const name = card.dataset.gemstone;
      if (compareMode) {
        if (compareSet.has(name)) {
          compareSet.delete(name);
          card.classList.remove("is-comparing");
        } else {
          if (compareSet.size >= 2) {
            const first = compareSet.values().next().value;
            compareSet.delete(first);
            cards.find((c) => c.dataset.gemstone === first)?.classList.remove("is-comparing");
          }
          compareSet.add(name);
          card.classList.add("is-comparing");
        }
        renderCompareDrawer();
      } else {
        update(name);
      }
    });
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.gemstoneFilter));
  });

  compareToggle?.addEventListener("click", () => setCompareMode(!compareMode));
  compareClose?.addEventListener("click", () => setCompareMode(false));

  applyFilter("all");
  update(cards[0]?.dataset.gemstone || "Clear Diamond");
}

function setupPrivateInquiry() {
  const toggle = document.querySelector("[data-private-inquiry-toggle]");
  const fields = document.querySelector("[data-private-inquiry-fields]");

  if (!toggle || !fields) {
    return;
  }

  const update = () => {
    fields.hidden = !toggle.checked;
    fields.querySelectorAll("input, select, textarea").forEach((field) => {
      field.disabled = !toggle.checked;
    });
  };

  toggle.addEventListener("change", update);
  update();
}

function setupAppointmentModal() {
  const modal = document.querySelector("[data-appointment-modal]");
  if (!modal) {
    return;
  }

  const form = modal.querySelector("[data-appointment-form]");
  const triggers = document.querySelectorAll("[data-appointment-trigger]");

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  const openModal = (selectedItem) => {
    if (form) {
      form.dataset.selectedItem = selectedItem;
      syncSelectedPiece(form);
      const status = form.querySelector("[data-form-status]");
      if (status) {
        status.textContent = "";
      }
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openModal(trigger.dataset.appointmentTrigger || "Selected piece");
    });
  });

  modal.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}

function shouldAutosaveField(field) {
  if (!field.name || field.type === "file" || field.type === "hidden") {
    return false;
  }

  return !["bot-field"].includes(field.name);
}

function readCustomFormDraft() {
  try {
    const value = window.localStorage.getItem(CUSTOM_FORM_DRAFT_KEY);

    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function writeCustomFormDraft(form) {
  try {
    const draft = {};

    form.querySelectorAll("input, select, textarea").forEach((field) => {
      if (!shouldAutosaveField(field)) {
        return;
      }

      if (field.type === "radio") {
        if (field.checked) {
          draft[field.name] = field.value;
        } else if (!(field.name in draft)) {
          draft[field.name] = "";
        }
        return;
      }

      if (field.type === "checkbox") {
        draft[field.name] = field.checked;
        return;
      }

      draft[field.name] = field.value;
    });

    window.localStorage.setItem(CUSTOM_FORM_DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    // Storage can be blocked in private browsing; the form still works normally.
  }
}

function clearCustomFormDraft() {
  try {
    window.localStorage.removeItem(CUSTOM_FORM_DRAFT_KEY);
  } catch (error) {
    // Nothing to clear if storage is unavailable.
  }
}

function restoreCustomFormDraft(form) {
  const draft = readCustomFormDraft();

  if (!draft || typeof draft !== "object") {
    return;
  }

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    if (!shouldAutosaveField(field) || !(field.name in draft)) {
      return;
    }

    const value = draft[field.name];

    if (field.type === "radio") {
      field.checked = field.value === value;
    } else if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value;
    }
  });

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    if (shouldAutosaveField(field) && field.name in draft) {
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

function setupCustomForm() {
  document.querySelectorAll("[data-custom-form]").forEach((form) => {
    const status = form.querySelector("[data-form-status]") || form.parentElement?.querySelector("[data-form-status]");
    const submitButton = form.querySelector('button[type="submit"]');
    const defaultSubmitLabel = submitButton ? submitButton.textContent : "Submit";

    restoreCustomFormDraft(form);
    applyGuideRecommendationToForm(recommendationFromGuideParams());
    form.addEventListener("input", () => writeCustomFormDraft(form));
    form.addEventListener("change", () => writeCustomFormDraft(form));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const generatedDesignFile = getGeneratedDesignFile(form);

      if (generatedDesignFile) {
        formData.set("inspiration-upload", generatedDesignFile, generatedDesignFile.name);
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      if (status) {
        status.textContent = "Submitting your request...";
      }

      try {
        const response = await fetch("/", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          throw new Error("Form submission failed");
        }

        form.reset();
        clearCustomFormDraft();
        form.querySelectorAll("input, select, textarea").forEach((field) => {
          field.dispatchEvent(new Event("change", { bubbles: true }));
        });

        if (form.hasAttribute("data-appointment-form")) {
          syncSelectedPiece(form);
        }

        if (status) {
          status.textContent = form.hasAttribute("data-appointment-form")
            ? "Appointment request received. We'll follow up to confirm the next step."
            : "Submission received. We'll review it and follow up soon.";
        }
      } catch (error) {
        if (status) {
          status.textContent = "Submission failed. Please try again in a moment or email us directly.";
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = defaultSubmitLabel;
        }
      }
    });
  });
}

function setYear() {
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

let observer;

function applyRevealDelays(scope = document) {
  const groupSelector = ".product-grid, .custom-type-grid, .process-grid, .studio-grid, .value-strip, .custom-entry__steps, .luxury-grid";
  const revealGroups = [];

  if (scope.matches && scope.matches(groupSelector)) {
    revealGroups.push(scope);
  }

  if (scope.querySelectorAll) {
    revealGroups.push(...scope.querySelectorAll(groupSelector));
  }

  revealGroups.forEach((group) => {
    group.querySelectorAll("[data-reveal], article, a").forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 70}ms`);
    });
  });

  if (scope === document) {
    document.querySelectorAll("main > section").forEach((section, sectionIndex) => {
      section.querySelectorAll(":scope > .container > [data-reveal], :scope > .content-width > [data-reveal]").forEach((item, index) => {
        item.style.setProperty("--reveal-delay", `${Math.min(index + sectionIndex % 2, 4) * 60}ms`);
      });
    });
  }
}

function revealVisible() {
  const targets = document.querySelectorAll("[data-reveal]");

  if (!("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15
      }
    );
  }

  targets.forEach((target) => {
    if (!target.classList.contains("is-visible")) {
      observer.observe(target);
    }
  });
}

function setupScrollProgress() {
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  let frame = null;

  const update = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progressValue = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    document.documentElement.style.setProperty("--scroll-progress", progressValue.toFixed(4));
    frame = null;
  };

  const requestUpdate = () => {
    if (frame !== null) {
      return;
    }

    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function setupHeroMotion() {
  const hero = document.querySelector(".hero");
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!hero || mediaQuery.matches) {
    return;
  }

  let frame = null;

  const update = () => {
    const progress = Math.min(Math.max(window.scrollY / Math.max(hero.offsetHeight, 1), 0), 1);
    hero.style.setProperty("--hero-shift", String(Math.round(progress * -34)));
    frame = null;
  };

  const requestUpdate = () => {
    if (frame !== null) {
      return;
    }

    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function setupDepthCards(scope = document) {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (mediaQuery.matches) {
    return;
  }

  const selector = [
    ".product-card",
    ".custom-type-card",
    ".luxury-card",
    ".process-card",
    ".custom-entry__media",
    ".custom-entry__content",
    ".editorial-panel",
    ".gallery-main",
    ".custom-request-panel",
    ".cta-panel",
    ".info-panel"
  ].join(", ");
  const cards = [];

  if (scope.matches && scope.matches(selector)) {
    cards.push(scope);
  }

  if (scope.querySelectorAll) {
    cards.push(...scope.querySelectorAll(selector));
  }

  cards.forEach((card) => {
    if (card.dataset.depthReady === "true") {
      return;
    }

    card.dataset.depthReady = "true";
    card.classList.add("depth-card");

    if (!card.querySelector(":scope > .depth-glare")) {
      const glare = document.createElement("span");
      glare.className = "depth-glare";
      glare.setAttribute("aria-hidden", "true");
      card.appendChild(glare);
    }

    const resetDepth = () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--glare-opacity", "0");
    };

    card.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") {
        return;
      }

      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * 7;
      const tiltY = (x - 0.5) * 8;

      card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
      card.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
      card.style.setProperty("--glare-opacity", "0.42");
    });

    card.addEventListener("pointerleave", resetDepth);
    card.addEventListener("blur", resetDepth, true);
  });
}

function setupMagneticActions(scope = document) {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (mediaQuery.matches) {
    return;
  }

  const selector = ".button, .button-secondary, .header-cta";
  const actions = [];

  if (scope.matches && scope.matches(selector)) {
    actions.push(scope);
  }

  if (scope.querySelectorAll) {
    actions.push(...scope.querySelectorAll(selector));
  }

  actions.forEach((action) => {
    if (action.dataset.magneticReady === "true") {
      return;
    }

    action.dataset.magneticReady = "true";

    const resetMagnet = () => {
      action.style.setProperty("--magnet-x", "0px");
      action.style.setProperty("--magnet-y", "0px");
    };

    action.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") {
        return;
      }

      const rect = action.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 6;
      action.style.setProperty("--magnet-x", `${x.toFixed(2)}px`);
      action.style.setProperty("--magnet-y", `${y.toFixed(2)}px`);
    });

    action.addEventListener("pointerleave", resetMagnet);
    action.addEventListener("blur", resetMagnet);
  });
}

function setupSkipLink() {
  const main = document.querySelector("main");
  if (!main) {
    return;
  }
  if (!main.id) {
    main.id = "main-content";
  }
  if (document.querySelector(".skip-link")) {
    return;
  }
  const link = document.createElement("a");
  link.className = "skip-link";
  link.href = `#${main.id}`;
  link.textContent = "Skip to content";
  document.body.insertBefore(link, document.body.firstChild);
}

function setupToasts() {
  if (window.tjToast) {
    return;
  }
  const stack = document.createElement("div");
  stack.className = "toast-stack";
  stack.setAttribute("role", "status");
  stack.setAttribute("aria-live", "polite");
  document.body.appendChild(stack);

  window.tjToast = (message, options = {}) => {
    if (!message) {
      return;
    }
    const toast = document.createElement("div");
    toast.className = "toast" + (options.tone ? ` toast--${options.tone}` : "");
    toast.textContent = message;
    stack.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("is-visible"));

    const duration = options.duration ?? 2600;
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
      window.setTimeout(() => toast.remove(), 400);
    }, duration);
  };
}

function setupBackToTop() {
  if (document.querySelector("[data-back-to-top]")) {
    return;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top";
  button.setAttribute("aria-label", "Back to top");
  button.dataset.backToTop = "";
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5L12 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M5 12L12 5L19 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  document.body.appendChild(button);

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });

  let frame = null;
  const update = () => {
    button.classList.toggle("is-visible", window.scrollY > 600);
    frame = null;
  };
  const onScroll = () => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(update);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  update();
}

function setupCartIcon() {
  const buttons = document.querySelectorAll('.icon-button[aria-label="View cart"]');
  if (!buttons.length) {
    return;
  }
  buttons.forEach((button) => {
    if (button.dataset.cartReady === "true") return;
    button.dataset.cartReady = "true";
    button.setAttribute("aria-label", "View saved pieces");
    button.classList.add("cart-icon");

    const badge = document.createElement("span");
    badge.className = "cart-badge";
    badge.setAttribute("aria-hidden", "true");
    button.appendChild(badge);

    button.addEventListener("click", () => {
      const count = getFavoriteSlugs().size;
      if (!count) {
        window.tjToast?.("No saved pieces yet — tap the heart on any piece to save it.");
        return;
      }
      const shelf = document.querySelector("[data-favorites-shelf]");
      if (shelf && !shelf.hidden) {
        shelf.scrollIntoView({ behavior: "smooth", block: "start" });
        shelf.classList.add("is-pulsing");
        window.setTimeout(() => shelf.classList.remove("is-pulsing"), 1200);
      } else {
        window.location.href = "shop.html";
      }
    });
  });

  const syncBadges = () => {
    const count = getFavoriteSlugs().size;
    document.querySelectorAll(".cart-badge").forEach((badge) => {
      badge.textContent = count > 0 ? String(count) : "";
      badge.classList.toggle("is-visible", count > 0);
    });
  };
  syncBadges();

  window.addEventListener("storage", (event) => {
    if (event.key === FAVORITES_KEY) {
      syncBadges();
    }
  });
  document.addEventListener("tj:favorites-changed", syncBadges);
}

function setupSearchModal() {
  const triggers = document.querySelectorAll('.icon-button[aria-label="Search catalogue"]');
  if (!triggers.length) {
    return;
  }

  let modal = null;
  let input = null;
  let resultList = null;
  let activeIndex = -1;
  let lastFocus = null;

  const buildModal = () => {
    modal = document.createElement("div");
    modal.className = "search-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Search catalogue");
    modal.hidden = true;
    modal.innerHTML = `
      <div class="search-modal__overlay" data-search-close></div>
      <div class="search-modal__panel">
        <div class="search-modal__bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.6"/>
            <path d="M16 16L21 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <input type="search" class="search-modal__input" placeholder="Search pieces, materials, stones…" autocomplete="off" aria-label="Search">
          <kbd class="search-modal__hint">Esc</kbd>
        </div>
        <ul class="search-modal__results" role="listbox"></ul>
        <div class="search-modal__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>/</kbd> focus</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    input = modal.querySelector(".search-modal__input");
    resultList = modal.querySelector(".search-modal__results");

    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-search-close]")) {
        closeModal();
      }
    });

    input.addEventListener("input", () => render(input.value));
    input.addEventListener("keydown", onKeydown);
    render("");
  };

  const render = (query) => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? products.filter((p) =>
          [p.name, p.category, p.materials, p.shortDescription]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(q))
        ).slice(0, 8)
      : products.filter((p) => p.featured).slice(0, 6);

    activeIndex = matches.length ? 0 : -1;

    if (!matches.length) {
      resultList.innerHTML = `<li class="search-modal__empty">No pieces match “${escapeHtml(query)}”. Try a category like rings or necklaces.</li>`;
      return;
    }

    resultList.innerHTML = matches.map((p, i) => `
      <li role="option" class="search-result${i === 0 ? " is-active" : ""}" data-slug="${p.slug}">
        <a href="product.html?slug=${p.slug}">
          <img src="${p.heroImage}" alt="" loading="lazy">
          <span class="search-result__body">
            <strong>${highlight(p.name, q)}</strong>
            <small>${p.category} · ${money.format(p.price)}</small>
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12H19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M13 6L19 12L13 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </li>
    `).join("");

    resultList.querySelectorAll(".search-result").forEach((el, i) => {
      el.addEventListener("mouseenter", () => setActive(i));
    });
  };

  const setActive = (index) => {
    const items = resultList.querySelectorAll(".search-result");
    if (!items.length) return;
    activeIndex = (index + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle("is-active", i === activeIndex));
    items[activeIndex].scrollIntoView({ block: "nearest" });
  };

  const onKeydown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === "Enter") {
      const items = resultList.querySelectorAll(".search-result");
      if (items[activeIndex]) {
        const link = items[activeIndex].querySelector("a");
        if (link) {
          window.location.href = link.href;
        }
      }
    } else if (event.key === "Escape") {
      closeModal();
    }
  };

  const openModal = () => {
    if (!modal) buildModal();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("search-open");
    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      input.value = "";
      render("");
      input.focus();
    });
  };

  const closeModal = () => {
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("search-open");
    window.setTimeout(() => {
      modal.hidden = true;
      if (lastFocus && lastFocus.focus) {
        lastFocus.focus();
      }
    }, 200);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", openModal);
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target && target.matches && target.matches('input, textarea, select, [contenteditable="true"]');
    const mod = event.ctrlKey || event.metaKey;

    if (mod && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openModal();
      return;
    }
    if (event.key === "/" && !typing && !mod) {
      event.preventDefault();
      openModal();
    }
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function highlight(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const safeQuery = escapeHtml(query);
  const idx = safe.toLowerCase().indexOf(safeQuery.toLowerCase());
  if (idx < 0) return safe;
  return `${safe.slice(0, idx)}<mark>${safe.slice(idx, idx + safeQuery.length)}</mark>${safe.slice(idx + safeQuery.length)}`;
}

function setupCustomsSectionRail() {
  if (document.body.dataset.page !== "customs") return;
  const main = document.querySelector("main");
  if (!main) return;

  const sections = Array.from(main.querySelectorAll("section[id]"))
    .filter((section) => !section.hidden && (DESIGN_STUDIO_PUBLIC || section.id !== "design-studio"));
  const items = sections
    .map((section) => {
      const heading = section.querySelector("h1, h2");
      if (!heading) return null;
      return {
        id: section.id,
        section,
        label: heading.textContent.trim()
      };
    })
    .filter(Boolean);

  if (items.length < 2) return;

  const railLabels = {
    "custom-guide": "Direction",
    "design-studio": "Design Studio",
    "gemstone-guide": "Stone Guide",
    "request-form": "Request",
    "process": "Process",
    "faq": "FAQ"
  };

  const rail = document.createElement("nav");
  rail.className = "customs-rail";
  rail.setAttribute("aria-label", "Customs page sections");
  rail.innerHTML = `
    <ol class="customs-rail__list">
      ${items.map((item, i) => `
        <li class="customs-rail__item" data-target="${item.id}">
          <a href="#${item.id}">
            <span class="customs-rail__dot" aria-hidden="true"></span>
            <span class="customs-rail__num">${String(i + 1).padStart(2, "0")}</span>
            <span class="customs-rail__label">${railLabels[item.id] || item.label}</span>
          </a>
        </li>
      `).join("")}
    </ol>
  `;
  document.body.appendChild(rail);

  const railItems = rail.querySelectorAll(".customs-rail__item");

  const setActive = (id) => {
    railItems.forEach((el) => {
      el.classList.toggle("is-active", el.dataset.target === id);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) {
        setActive(visible[0].target.id);
      }
    },
    { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.2, 0.6, 1] }
  );

  items.forEach((item) => observer.observe(item.section));

  // Show after small scroll
  const reveal = () => {
    rail.classList.toggle("is-visible", window.scrollY > 200);
  };
  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}

function setupCustomFormProgress() {
  const form = document.querySelector("[data-custom-form]");
  if (!form) return;

  // Track required fields + a few high-signal optional ones
  const trackedSelectors = [
    "[required]",
    'select[name="piece-type"]',
    'input[name="budget"]',
    'textarea[name="description"]'
  ];
  const fields = new Set();
  trackedSelectors.forEach((sel) => {
    form.querySelectorAll(sel).forEach((f) => fields.add(f));
  });

  if (!fields.size) return;

  // Group radio buttons by name
  const fieldList = [];
  const seenRadioNames = new Set();
  fields.forEach((field) => {
    if (field.type === "radio") {
      if (seenRadioNames.has(field.name)) return;
      seenRadioNames.add(field.name);
      fieldList.push({
        type: "radio",
        name: field.name,
        nodes: form.querySelectorAll(`input[type="radio"][name="${field.name}"]`),
        required: field.required
      });
    } else {
      fieldList.push({
        type: field.type,
        node: field,
        required: field.required
      });
    }
  });

  // Inject progress UI as the first visible child of the form so it spans both grid columns
  const wrap = document.createElement("div");
  wrap.className = "form-progress form-field--wide";
  wrap.innerHTML = `
    <div class="form-progress__row">
      <div class="form-progress__meta">
        <strong data-form-progress-pct title="Jump to first missing field">0%</strong>
        <span data-form-progress-label>Start by filling the request details</span>
      </div>
      <span class="form-progress__draft" data-form-draft-indicator hidden>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12.5L10 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span data-form-draft-text>Draft saved</span>
      </span>
    </div>
    <div class="form-progress__track" aria-hidden="true">
      <span class="form-progress__bar" data-form-progress-bar></span>
    </div>
  `;
  // Insert just before the first non-hidden form field so it spans both grid columns
  const firstVisible = Array.from(form.children).find((el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === "input" && (el.type === "hidden" || el.classList.contains("sr-only"))) return false;
    if (el.classList && el.classList.contains("sr-only")) return false;
    return true;
  });
  if (firstVisible) {
    form.insertBefore(wrap, firstVisible);
  } else {
    form.appendChild(wrap);
  }

  const pctEl = wrap.querySelector("[data-form-progress-pct]");
  const labelEl = wrap.querySelector("[data-form-progress-label]");
  const barEl = wrap.querySelector("[data-form-progress-bar]");

  const isFieldFilled = (entry) => {
    if (entry.type === "radio") {
      return Array.from(entry.nodes).some((n) => n.checked);
    }
    if (entry.type === "checkbox") {
      return entry.node.checked;
    }
    return !!(entry.node.value && entry.node.value.trim());
  };

  const totalRequired = fieldList.filter((e) => e.required).length;

  const update = () => {
    const filled = fieldList.filter(isFieldFilled).length;
    const total = fieldList.length;
    const pct = total ? Math.round((filled / total) * 100) : 0;
    pctEl.textContent = `${pct}%`;
    barEl.style.width = `${pct}%`;
    wrap.classList.toggle("is-complete", pct >= 100);

    const requiredFilled = fieldList.filter((e) => e.required && isFieldFilled(e)).length;
    const requiredLeft = totalRequired - requiredFilled;

    if (pct === 0) {
      labelEl.textContent = "Start by filling the request details";
    } else if (requiredLeft > 0) {
      labelEl.textContent = `${requiredLeft} required field${requiredLeft === 1 ? "" : "s"} remaining`;
    } else if (pct < 100) {
      labelEl.textContent = "Required fields done · a few extras to polish your brief";
    } else {
      labelEl.textContent = "All set — ready to submit";
    }
  };

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();

  // Draft saved indicator — hook into the same input/change autosave flow
  const draftIndicator = wrap.querySelector("[data-form-draft-indicator]");
  const draftText = wrap.querySelector("[data-form-draft-text]");
  let saveTimer = null;
  let lastSaved = 0;

  const formatSince = (ts) => {
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 5) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
    const h = Math.floor(m / 60);
    return `${h} hr${h === 1 ? "" : "s"} ago`;
  };

  const flashDraftSaved = () => {
    lastSaved = Date.now();
    draftIndicator.hidden = false;
    draftIndicator.classList.add("is-pulsing");
    draftText.textContent = "Draft saved";
    window.setTimeout(() => draftIndicator.classList.remove("is-pulsing"), 800);
  };

  const onChange = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flashDraftSaved, 350);
  };

  form.addEventListener("input", onChange);
  form.addEventListener("change", onChange);

  // Refresh "Xs ago" label periodically
  window.setInterval(() => {
    if (lastSaved && !draftIndicator.hidden) {
      draftText.textContent = `Draft saved · ${formatSince(lastSaved)}`;
    }
  }, 15000);

  // If a draft already exists on load, show indicator
  try {
    if (window.localStorage.getItem(CUSTOM_FORM_DRAFT_KEY)) {
      draftIndicator.hidden = false;
      draftText.textContent = "Draft restored";
      lastSaved = Date.now() - 60000;
    }
  } catch (e) { /* noop */ }

  // Smooth focus on first required empty field when clicking percentage label
  pctEl.addEventListener("click", () => {
    const missing = fieldList.find((e) => e.required && !isFieldFilled(e));
    if (!missing) return;
    const node = missing.type === "radio" ? missing.nodes[0] : missing.node;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); }
    }, 380);
  });

  // Make the "01 Inspiration / 02 Details / 03 Timeline" cards clickable jumps
  const miniMap = {
    "01": form.querySelector('input[name="inspiration-link"]') || form.querySelector('input[name="inspiration-upload"]'),
    "02": form.querySelector('select[name="metal-preference"]') || form.querySelector('select[name="piece-type"]'),
    "03": form.querySelector('input[name="budget"]') || form.querySelector('input[name="needed-by"]')
  };
  document.querySelectorAll(".request-mini-list article").forEach((article) => {
    const num = article.querySelector("span")?.textContent?.trim();
    const target = miniMap[num];
    if (!target) return;
    article.classList.add("is-interactive");
    article.setAttribute("role", "button");
    article.setAttribute("tabindex", "0");
    const jump = () => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
        const field = target.closest(".form-field") || target.parentElement;
        if (field) {
          field.classList.add("is-highlighted");
          window.setTimeout(() => field.classList.remove("is-highlighted"), 1600);
        }
      }, 420);
    };
    article.addEventListener("click", jump);
    article.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        jump();
      }
    });
  });

  // "Clear draft" button — only shown when a saved draft is restored
  try {
    if (window.localStorage.getItem(CUSTOM_FORM_DRAFT_KEY)) {
      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "form-progress__clear";
      clearBtn.textContent = "Clear draft";
      clearBtn.setAttribute("aria-label", "Clear saved draft and reset the form");
      wrap.querySelector(".form-progress__row").appendChild(clearBtn);
      clearBtn.addEventListener("click", () => {
        if (!window.confirm("Clear the saved draft and reset the form?")) return;
        clearCustomFormDraft();
        form.reset();
        form.querySelectorAll("input, select, textarea").forEach((f) => {
          f.dispatchEvent(new Event("input", { bubbles: true }));
          f.dispatchEvent(new Event("change", { bubbles: true }));
        });
        clearBtn.remove();
        draftIndicator.hidden = true;
        if (window.tjToast) window.tjToast("Draft cleared", { tone: "warn" });
      });
    }
  } catch (e) { /* noop */ }
}

document.addEventListener("DOMContentLoaded", () => {
  setupSkipLink();
  setupToasts();
  setupScrollProgress();
  setupHeader();
  setupSearchModal();
  setupBackToTop();
  setupCartIcon();
  renderFeaturedProducts();
  setupShopFilters();
  renderProductPage();
  setupFaq();
  setupFilePickers();
  setupPieceTypePrefill();
  setupContextualCustomFields();
  setupCustomGuide();
  setupFaqSearch();
  setupBudgetEstimator();
  setupGemstoneGuide();
  setupPrivateInquiry();
  setupAppointmentModal();
  setupCustomForm();
  setupCustomsSectionRail();
  setupCustomFormProgress();
  setYear();
  setupHeroMotion();
  setupDepthCards();
  setupMagneticActions();
  applyRevealDelays();
  revealVisible();
});
