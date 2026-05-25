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

function productCardMarkup(product) {
  return `
    <article class="product-card" data-reveal>
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

  const cartButton = page.querySelector("[data-cart-button]");
  const cartStatus = page.querySelector("[data-cart-status]");

  if (cartButton && cartStatus) {
    cartButton.addEventListener("click", () => {
      cartStatus.textContent = "Cart flow is staged for design review. Product details are ready to connect to checkout later.";
    });
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

function setupCustomForm() {
  document.querySelectorAll("[data-custom-form]").forEach((form) => {
    const status = form.querySelector("[data-form-status]") || form.parentElement?.querySelector("[data-form-status]");
    const submitButton = form.querySelector('button[type="submit"]');
    const defaultSubmitLabel = submitButton ? submitButton.textContent : "Submit";

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

document.addEventListener("DOMContentLoaded", () => {
  setupScrollProgress();
  setupHeader();
  renderFeaturedProducts();
  setupShopFilters();
  renderProductPage();
  setupFaq();
  setupFilePickers();
  setupPieceTypePrefill();
  setupAppointmentModal();
  setupCustomForm();
  setYear();
  setupHeroMotion();
  setupDepthCards();
  setupMagneticActions();
  applyRevealDelays();
  revealVisible();
});
