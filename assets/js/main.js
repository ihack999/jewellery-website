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

  const updateMainImage = (src) => {
    mainImage.src = src;
    mainImage.alt = product.name;
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
  setupCustomForm();
  setYear();
  revealVisible();
});