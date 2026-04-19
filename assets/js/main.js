const products = [
  {
    slug: "solstice-ring",
    name: "Solstice Ring",
    category: "rings",
    materials: "14k gold with diamond",
    price: 850,
    shortDescription: "A luminous ring designed to feel balanced, crisp, and quietly striking.",
    description:
      "The Solstice Ring is shaped around a clean central stone and a softly sculpted band, offering a refined statement that still feels wearable every day.",
    specs: [
      ["Materials", "14k gold, diamond setting"],
      ["Sizing", "Available in sizes 5 to 9"],
      ["Finish", "High polish with soft edges"],
      ["Timeline", "Ready to ship in 5 to 7 business days"]
    ],
    care: "Store in its pouch and clean gently with a soft jewellery cloth.",
    shipping: "Complimentary gift-ready packaging with tracked Canadian shipping.",
    heroImage: "assets/images/solstice-ring.svg",
    gallery: [
      "assets/images/solstice-ring.svg",
      "assets/images/detail-closeup.svg",
      "assets/images/worn-detail.svg",
      "assets/images/packaging-scale.svg"
    ],
    featured: true
  },
  {
    slug: "luna-pendant-necklace",
    name: "Luna Pendant Necklace",
    category: "necklaces",
    materials: "Sterling silver with crystal detail",
    price: 180,
    shortDescription: "A minimal pendant with cool-toned shine and an easy everyday length.",
    description:
      "Luna balances a softly faceted pendant with a clean chain profile, giving it enough light play for occasion dressing while remaining understated for daily wear.",
    specs: [
      ["Materials", "Sterling silver, crystal detail"],
      ["Length", "18 inches with extender"],
      ["Finish", "Mirror finish chain"],
      ["Timeline", "Ready to ship in 3 to 5 business days"]
    ],
    care: "Avoid fragrance contact and store flat to protect the chain finish.",
    shipping: "Wrapped in a structured keepsake box with polishing cloth included.",
    heroImage: "assets/images/luna-pendant.svg",
    gallery: [
      "assets/images/luna-pendant.svg",
      "assets/images/detail-closeup.svg",
      "assets/images/worn-detail.svg",
      "assets/images/packaging-scale.svg"
    ],
    featured: true
  },
  {
    slug: "eterna-tennis-bracelet",
    name: "Eterna Tennis Bracelet",
    category: "bracelets",
    materials: "14k gold with diamonds",
    price: 1200,
    shortDescription: "A polished bracelet with a structured rhythm of light-catching stones.",
    description:
      "Eterna is designed to sit close to the wrist with a precise line of diamond-set links, giving the bracelet a clean editorial character rather than overt flash.",
    specs: [
      ["Materials", "14k gold, diamond-set links"],
      ["Length", "7 inches"],
      ["Closure", "Low-profile hidden clasp"],
      ["Timeline", "Made to order in 2 to 3 weeks"]
    ],
    care: "Store flat and separate from harder pieces to avoid surface marks.",
    shipping: "Insured delivery and concierge tracking update included.",
    heroImage: "assets/images/eterna-bracelet.svg",
    gallery: [
      "assets/images/eterna-bracelet.svg",
      "assets/images/detail-closeup.svg",
      "assets/images/worn-detail.svg",
      "assets/images/packaging-scale.svg"
    ],
    featured: true
  },
  {
    slug: "aura-hoop-earrings",
    name: "Aura Hoop Earrings",
    category: "earrings",
    materials: "Gold-plated sterling silver",
    price: 240,
    shortDescription: "An airy hoop pair with a soft sculptural curve and warm sheen.",
    description:
      "Aura Hoops use an elegant taper to keep the profile light and modern, making them easy to style with other pieces while still holding their own.",
    specs: [
      ["Materials", "Gold-plated sterling silver"],
      ["Size", "32 mm drop"],
      ["Closure", "Hinged click clasp"],
      ["Timeline", "Ready to ship in 3 to 5 business days"]
    ],
    care: "Remove before showering and store in a dry pouch between wears.",
    shipping: "Prepared in gift-ready packaging with care card included.",
    heroImage: "assets/images/aura-hoops.svg",
    gallery: [
      "assets/images/aura-hoops.svg",
      "assets/images/detail-closeup.svg",
      "assets/images/worn-detail.svg",
      "assets/images/packaging-scale.svg"
    ]
  },
  {
    slug: "celeste-chain-bracelet",
    name: "Celeste Chain Bracelet",
    category: "bracelets",
    materials: "Sterling silver chain links",
    price: 210,
    shortDescription: "A cool silver bracelet with fluid links and a clean drape.",
    description:
      "Celeste keeps the silhouette minimal, relying on proportion and finish rather than heavy styling to make an impression.",
    specs: [
      ["Materials", "Sterling silver chain links"],
      ["Length", "6.75 inches"],
      ["Finish", "Polished silver"],
      ["Timeline", "Ready to ship in 3 to 5 business days"]
    ],
    care: "Clean with a silver polishing cloth and avoid abrasive surfaces.",
    shipping: "Boxed presentation with optional gift message at checkout later.",
    heroImage: "assets/images/celeste-bracelet.svg",
    gallery: [
      "assets/images/celeste-bracelet.svg",
      "assets/images/detail-closeup.svg",
      "assets/images/worn-detail.svg",
      "assets/images/packaging-scale.svg"
    ]
  },
  {
    slug: "north-signet-ring",
    name: "North Signet Ring",
    category: "rings",
    materials: "Sterling silver with mirror face",
    price: 320,
    shortDescription: "A pared-back signet with sharp proportions and weighty simplicity.",
    description:
      "North takes the signet form in a cleaner direction, with softened edges and a reflective top surface that feels modern instead of heavy.",
    specs: [
      ["Materials", "Sterling silver"],
      ["Sizing", "Available in sizes 6 to 11"],
      ["Finish", "Mirror face, brushed interior"],
      ["Timeline", "Ready to ship in 5 to 7 business days"]
    ],
    care: "Best stored separately to preserve the top polished face.",
    shipping: "Presented in a structured box with care instructions.",
    heroImage: "assets/images/north-signet.svg",
    gallery: [
      "assets/images/north-signet.svg",
      "assets/images/detail-closeup.svg",
      "assets/images/worn-detail.svg",
      "assets/images/packaging-scale.svg"
    ]
  }
];

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0
});

function productCardMarkup(product, index = 0) {
  const revealStyle = ["fade-up", "fade-left", "fade-right"][index % 3];

  return `
    <article class="product-card" data-reveal="${revealStyle}">
      <a class="product-card__link" href="product.html?slug=${product.slug}">
        <div class="product-card__media">
          <img src="${product.heroImage}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-card__body">
          <h3>${product.name}</h3>
          <p class="product-card__materials">${product.materials}</p>
          <div class="product-card__footer">
            <span class="product-card__price">${money.format(product.price)}</span>
            <span class="product-card__view">Discover</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function renderProductCollection(container, items) {
  if (!container) {
    return;
  }

  container.innerHTML = items.map((product, index) => productCardMarkup(product, index)).join("");
  setupRevealStaggers(container);
}

function setupHeader() {
  const body = document.body;
  const menuButton = document.querySelector("[data-menu-toggle]");
  const navLinks = document.querySelectorAll(".primary-nav a");
  const header = document.querySelector(".site-header");
  const headerActions = document.querySelector(".header-actions");
  const navList = document.querySelector(".primary-nav__list");

  let indicator = null;

  if (headerActions && !headerActions.querySelector(".header-primary-links")) {
    const primaryLinks = document.createElement("div");
    primaryLinks.className = "header-primary-links";
    primaryLinks.innerHTML = `
      <a class="header-primary-link" href="shop.html">Shop</a>
      <a class="header-primary-link header-primary-link--accent" href="customs.html">Customs</a>
    `;
    headerActions.insertBefore(primaryLinks, menuButton || headerActions.firstChild);
  }

  if (navList && navLinks.length) {
    indicator = document.createElement("span");
    indicator.className = "primary-nav__indicator";
    indicator.setAttribute("aria-hidden", "true");
    navList.appendChild(indicator);
  }

  const moveIndicator = (target) => {
    if (!indicator || !navList || !target) {
      return;
    }

    const listRect = navList.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const x = targetRect.left - listRect.left;

    indicator.style.width = `${targetRect.width}px`;
    indicator.style.height = `${targetRect.height}px`;
    indicator.style.transform = `translate(${x}px, -50%)`;
    indicator.style.opacity = "1";
  };

  const getActiveLink = () => navList?.querySelector("a.is-active") || navLinks[0];

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

    link.addEventListener("mouseenter", () => {
      moveIndicator(link);
    });

    link.addEventListener("focus", () => {
      moveIndicator(link);
    });

    link.addEventListener("click", () => {
      body.classList.remove("nav-open");
      if (menuButton) {
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  });

  if (navList && indicator) {
    navList.addEventListener("mouseleave", () => {
      moveIndicator(getActiveLink());
    });

    window.addEventListener("resize", () => {
      moveIndicator(getActiveLink());
    });
  }

  const onScroll = () => {
    if (!header) {
      return;
    }

    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  moveIndicator(getActiveLink());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("nav-open")) {
      body.classList.remove("nav-open");
      if (menuButton) {
        menuButton.setAttribute("aria-expanded", "false");
      }
    }
  });
}

function syncCustomRequestFields(form) {
  const pieceType = form.querySelector("[data-piece-type-select]");
  if (!pieceType) {
    return;
  }

  const value = pieceType.value.trim().toLowerCase();

  form.querySelectorAll("[data-piece-type-only]").forEach((section) => {
    const shouldShow = section.dataset.pieceTypeOnly.toLowerCase() === value;
    section.hidden = !shouldShow;
    section.setAttribute("aria-hidden", String(!shouldShow));

    section.querySelectorAll("input, select, textarea").forEach((field) => {
      if (!shouldShow) {
        field.value = "";
      }
    });
  });
}

function setupCustomRequestFlow() {
  document.querySelectorAll("[data-custom-request-flow]").forEach((form) => {
    const pieceType = form.querySelector("[data-piece-type-select]");
    if (!pieceType) {
      return;
    }

    const update = () => syncCustomRequestFields(form);
    pieceType.addEventListener("change", update);
    update();
  });
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
  const categoryLabel = product.category.charAt(0).toUpperCase() + product.category.slice(1);
  const editorialHeading = `A ${categoryLabel.toLowerCase()} shaped to feel composed in every view`;
  const editorialCopy = `${product.name} is built around ${product.materials.toLowerCase()} and a controlled silhouette, so it reads like a finished object rather than a trend piece.`;
  const supportCopyOne = `${product.name} holds attention through material contrast, edge control, and deliberate proportion.`;
  const supportCopyTwo = `The piece is intended to sit with ease on the body while still carrying a clear point of view.`;
  const editorialCaptionOne = `${product.shipping}`;
  const editorialCaptionTwo = `${product.care}`;

  page.querySelector("[data-product-price]").textContent = money.format(product.price);
  page.querySelector("[data-product-materials]").textContent = product.materials;
  page.querySelector("[data-product-description]").textContent = product.description;
  page.querySelector("[data-product-shipping]").textContent = product.shipping;
  page.querySelector("[data-product-care]").textContent = product.care;
  const categoryBadge = page.querySelector("[data-product-category-badge]");
  const shortDescription = page.querySelector("[data-product-short-description]");
  const supportImageOne = page.querySelector("[data-product-support-image-one]");
  const supportImageTwo = page.querySelector("[data-product-support-image-two]");
  const supportCopyNodeOne = page.querySelector("[data-product-support-copy-one]");
  const supportCopyNodeTwo = page.querySelector("[data-product-support-copy-two]");
  const editorialHeadingNode = page.querySelector("[data-product-editorial-heading]");
  const editorialCopyNode = page.querySelector("[data-product-editorial-copy]");
  const editorialImageOne = page.querySelector("[data-product-editorial-image-one]");
  const editorialImageTwo = page.querySelector("[data-product-editorial-image-two]");
  const editorialCaptionNodeOne = page.querySelector("[data-product-editorial-caption-one]");
  const editorialCaptionNodeTwo = page.querySelector("[data-product-editorial-caption-two]");

  if (categoryBadge) {
    categoryBadge.textContent = categoryLabel;
  }

  if (shortDescription) {
    shortDescription.textContent = product.shortDescription;
  }

  if (supportCopyNodeOne) {
    supportCopyNodeOne.textContent = supportCopyOne;
  }

  if (supportCopyNodeTwo) {
    supportCopyNodeTwo.textContent = supportCopyTwo;
  }

  if (editorialHeadingNode) {
    editorialHeadingNode.textContent = editorialHeading;
  }

  if (editorialCopyNode) {
    editorialCopyNode.textContent = editorialCopy;
  }

  if (editorialCaptionNodeOne) {
    editorialCaptionNodeOne.textContent = editorialCaptionOne;
  }

  if (editorialCaptionNodeTwo) {
    editorialCaptionNodeTwo.textContent = editorialCaptionTwo;
  }

  const mainImage = page.querySelector("[data-product-main-image]");
  const thumbnailGrid = page.querySelector("[data-product-thumbnails]");
  const detailList = page.querySelector("[data-product-specs]");
  const related = page.querySelector("[data-related-products]");

  const updateMainImage = (src) => {
    mainImage.src = src;
    mainImage.alt = product.name;
  };

  updateMainImage(product.gallery[0]);

  if (supportImageOne) {
    supportImageOne.src = product.gallery[1] || product.gallery[0];
    supportImageOne.alt = `${product.name} detail view`;
  }

  if (supportImageTwo) {
    supportImageTwo.src = product.gallery[2] || product.gallery[0];
    supportImageTwo.alt = `${product.name} worn view`;
  }

  if (editorialImageOne) {
    editorialImageOne.src = product.gallery[3] || product.gallery[1] || product.gallery[0];
    editorialImageOne.alt = `${product.name} presentation view`;
  }

  if (editorialImageTwo) {
    editorialImageTwo.src = product.gallery[1] || product.gallery[0];
    editorialImageTwo.alt = `${product.name} finish detail`;
  }

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
      updateMainImage(product.gallery[index]);
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
      cartStatus.textContent = "Direct consultation is handling purchase flow for now. The piece and its specifications are ready for the next step.";
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

function setupFilePickers() {
  document.querySelectorAll("[data-file-picker]").forEach((picker) => {
    const input = picker.querySelector("[data-file-input]");
    const fileName = picker.querySelector("[data-file-name]");

    if (!input || !fileName) {
      return;
    }

    const updateFileName = () => {
      const file = input.files && input.files[0];
      fileName.textContent = file ? file.name : "No file selected yet";
    };

    input.addEventListener("change", updateFileName);
    updateFileName();
  });
}

function setupAppointmentModal() {
  const modal = document.querySelector("[data-appointment-modal]");
  if (!modal) {
    return;
  }

  const form = modal.querySelector("[data-appointment-form]");
  const triggers = document.querySelectorAll("[data-appointment-trigger]");
  let lastFocusedTrigger = null;

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    if (lastFocusedTrigger instanceof HTMLElement) {
      lastFocusedTrigger.focus();
    }
  };

  const openModal = (selectedItem, trigger) => {
    lastFocusedTrigger = trigger || document.activeElement;

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

    const firstFocusable = modal.querySelector("input, select, textarea, button");
    if (firstFocusable instanceof HTMLElement) {
      window.requestAnimationFrame(() => {
        firstFocusable.focus();
      });
    }
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openModal(trigger.dataset.appointmentTrigger || "Selected piece", trigger);
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

        if (form.hasAttribute("data-custom-request-flow")) {
          syncCustomRequestFields(form);
        }

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

function applyStagger(group) {
  if (!group) {
    return;
  }

  const items = Array.from(group.children).filter((child) => child.matches("[data-reveal]"));

  items.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index * 110, 550)}ms`);
  });
}

function setupRevealStaggers(scope = document) {
  const groups = [];

  if (scope instanceof Element && scope.hasAttribute("data-stagger")) {
    groups.push(scope);
  }

  if ("querySelectorAll" in scope) {
    groups.push(...scope.querySelectorAll("[data-stagger]"));
  }

  groups.forEach(applyStagger);
}

function setupAmbientMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const layers = Array.from(document.querySelectorAll("[data-parallax]"));

  if (!layers.length) {
    return;
  }

  let frameId = null;

  const update = () => {
    const viewportHeight = window.innerHeight;
    const documentHeight = Math.max(document.documentElement.scrollHeight - viewportHeight, 1);
    const progress = Math.min(window.scrollY / documentHeight, 1);

    document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(3));

    layers.forEach((layer) => {
      const speed = Number(layer.dataset.parallax || "0.08");
      const rect = layer.getBoundingClientRect();
      const distanceFromCenter = rect.top + rect.height / 2 - viewportHeight / 2;
      const offset = distanceFromCenter * -speed;

      layer.style.setProperty("--parallax-offset", `${offset.toFixed(2)}px`);
    });

    frameId = null;
  };

  const requestUpdate = () => {
    if (frameId !== null) {
      return;
    }

    frameId = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function setupStorySequence() {
  document.querySelectorAll("[data-story-sequence]").forEach((sequence) => {
    const steps = Array.from(sequence.querySelectorAll("[data-story-step]"));
    const panels = Array.from(sequence.querySelectorAll("[data-story-panel]"));
    const progressBar = sequence.querySelector("[data-story-progress]");

    if (!steps.length || !panels.length) {
      return;
    }

    const activate = (stepId) => {
      const stepIndex = steps.findIndex((step) => step.dataset.storyStep === stepId);
      const safeIndex = stepIndex === -1 ? 0 : stepIndex;

      steps.forEach((step, index) => {
        step.classList.toggle("is-active", index === safeIndex);
      });

      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.storyPanel === stepId);
      });

      if (progressBar) {
        progressBar.style.height = `${((safeIndex + 1) / steps.length) * 100}%`;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        activate(visibleEntry.target.dataset.storyStep || steps[0].dataset.storyStep);
      },
      {
        threshold: [0.35, 0.55, 0.75],
        rootMargin: "-18% 0px -18% 0px"
      }
    );

    steps.forEach((step) => observer.observe(step));
    activate(steps[0].dataset.storyStep);
  });
}

function setupHoverLighting() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const targets = document.querySelectorAll(
    ".product-card, .luxury-card, .studio-card, .info-panel, .process-card, .hero-stat, .hero-frame, .page-banner, .editorial-panel, .image-panel, .gallery-main, .story-card, .button, .button-secondary"
  );

  targets.forEach((target) => {
    const updatePointer = (event) => {
      const rect = target.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      target.style.setProperty("--pointer-x", `${x.toFixed(2)}%`);
      target.style.setProperty("--pointer-y", `${y.toFixed(2)}%`);
    };

    target.addEventListener("pointerenter", (event) => {
      target.classList.add("is-lit");
      updatePointer(event);
    });

    target.addEventListener("pointermove", updatePointer);

    target.addEventListener("pointerleave", () => {
      target.classList.remove("is-lit");
    });
  });
}

function setupCustomCursor() {
  const supportsCursor = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1100px)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!supportsCursor || reduceMotion) {
    return;
  }

  const body = document.body;
  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = `
    <span class="custom-cursor__ring"></span>
    <span class="custom-cursor__core"></span>
  `;
  document.body.appendChild(cursor);
  body.classList.add("has-custom-cursor");

  let rafId = null;
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;

  const update = () => {
    cursor.style.setProperty("--cursor-x", `${pointerX}px`);
    cursor.style.setProperty("--cursor-y", `${pointerY}px`);
    rafId = null;
  };

  const requestUpdate = () => {
    if (rafId !== null) {
      return;
    }

    rafId = window.requestAnimationFrame(update);
  };

  document.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    cursor.classList.add("is-visible");
    requestUpdate();
  });

  document.addEventListener("pointerdown", () => {
    cursor.classList.add("is-pressed");
  });

  document.addEventListener("pointerup", () => {
    cursor.classList.remove("is-pressed");
  });

  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-visible");
  });

  const hoverTargets = document.querySelectorAll("a, button, input, select, textarea, .product-card, .luxury-card, .story-card");
  hoverTargets.forEach((target) => {
    target.addEventListener("pointerenter", () => {
      cursor.classList.add("is-hovering");
    });

    target.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-hovering");
    });
  });
}

function setupMagneticElements() {
  const supportsMagnetic = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1100px)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!supportsMagnetic || reduceMotion) {
    return;
  }

  const targets = document.querySelectorAll(".button, .button-secondary, .icon-button, .menu-toggle, .primary-nav a");

  targets.forEach((target) => {
    target.classList.add("is-magnetic");

    const reset = () => {
      target.style.transform = "";
    };

    target.addEventListener("pointermove", (event) => {
      const rect = target.getBoundingClientRect();
      const offsetX = event.clientX - rect.left - rect.width / 2;
      const offsetY = event.clientY - rect.top - rect.height / 2;
      const strength = target.matches(".primary-nav a") ? 0.14 : 0.18;

      target.style.transform = `translate(${(offsetX * strength).toFixed(2)}px, ${(offsetY * strength).toFixed(2)}px)`;
    });

    target.addEventListener("pointerleave", reset);
    target.addEventListener("blur", reset);
  });
}

let observer;

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

document.addEventListener("DOMContentLoaded", () => {
  setupHeader();
  renderFeaturedProducts();
  setupShopFilters();
  renderProductPage();
  setupFaq();
  setupFilePickers();
  setupAppointmentModal();
  setupCustomRequestFlow();
  setupCustomForm();
  setYear();
  setupRevealStaggers();
  revealVisible();
});