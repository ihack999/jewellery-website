/* Small, progressive enhancements for the personal storefront. */
(() => {
  "use strict";

  function setupPersonalEdit() {
    const triggers = [...document.querySelectorAll("[data-personal-edit-open]")];
    if (!triggers.length || typeof products === "undefined" || !window.HTMLDialogElement) return;

    const dialog = document.createElement("dialog");
    dialog.className = "personal-edit-dialog";
    dialog.setAttribute("aria-labelledby", "personal-edit-heading");
    dialog.innerHTML = `
      <header class="personal-edit-dialog__header">
        <div><p class="editorial-kicker">Selected around you</p><h2 id="personal-edit-heading">Your personal edit.</h2></div>
        <button class="personal-edit-dialog__close" type="button" aria-label="Close personal edit">×</button>
      </header>
      <div class="personal-edit-dialog__body">
        <p class="personal-edit-dialog__intro">Start with what you love. We’ll find a few pieces worth a closer look.</p>
        <div class="personal-edit-controls">
          <label>What catches your eye?
            <select data-personal-type>
              <option value="all">All jewellery</option>
              <option value="rings">Rings</option>
              <option value="necklaces">Necklaces</option>
              <option value="bracelets">Bracelets</option>
              <option value="earrings">Earrings</option>
            </select>
          </label>
          <label>Your budget direction
            <select data-personal-budget>
              <option value="any">Any budget</option>
              <option value="1500">Up to $1,500 CAD</option>
              <option value="5000">Up to $5,000 CAD</option>
              <option value="10000">Up to $10,000 CAD</option>
              <option value="over">$10,000+ CAD</option>
            </select>
          </label>
        </div>
        <p class="personal-edit-status" role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="personal-edit-results"></div>
        <div class="personal-edit-dialog__footer">
          <p>Budget matches use published or starting CAD prices. Custom details can change the final price. Inquiry-only pieces appear when you select Any budget.</p>
          <a class="atelier-link" href="/shop.html">Explore all pieces <span aria-hidden="true">↗</span></a>
        </div>
      </div>`;
    document.body.appendChild(dialog);

    const type = dialog.querySelector("[data-personal-type]");
    const budget = dialog.querySelector("[data-personal-budget]");
    const close = dialog.querySelector(".personal-edit-dialog__close");
    const results = dialog.querySelector(".personal-edit-results");
    const status = dialog.querySelector(".personal-edit-status");
    const priorities = ["rise-ring", "signature-monogram-ring", "diamond-bracelet-stack", "diamond-tennis-necklace", "vintage-halo-stud-earrings", "half-eternity-pinky-band", "pear-halo-ring", "gold-bezel-hand-chain", "cushion-diamond-ring"];
    let opener = null;
    let alreadyLocked = false;

    const render = () => {
      const matches = products.filter((product) => {
        if (type.value !== "all" && product.category !== type.value) return false;
        if (budget.value === "any") return true;
        if (product.currency !== "cad" || !Number.isFinite(Number(product.price))) return false;
        return budget.value === "over" ? Number(product.price) >= 10000 : Number(product.price) <= Number(budget.value);
      }).sort((a, b) => {
        const priority = (product) => {
          const index = priorities.indexOf(product.slug);
          return index < 0 ? priorities.length : index;
        };
        return priority(a) - priority(b);
      });
      const selection = matches.slice(0, 3);
      results.replaceChildren();
      status.textContent = selection.length
        ? `${selection.length} ${selection.length === 1 ? "piece" : "pieces"} to explore${matches.length > 3 ? `, from ${matches.length} matching pieces` : ""}. Selected from our current catalogue.`
        : "No published-price pieces match those preferences. Try another budget or start a custom conversation.";

      selection.forEach((product) => {
        const presentation = typeof productCardPresentation !== "undefined" ? productCardPresentation[product.slug] || {} : {};
        const link = document.createElement("a");
        link.className = "personal-edit-result";
        link.href = productUrl(product);
        const image = document.createElement("img");
        image.src = product.slug === "rise-ring" ? "/assets/images/products/rise-ring/rise-ring-polished.jpeg" : product.heroImage;
        image.alt = product.name;
        image.width = 400;
        image.height = 400;
        image.loading = "lazy";
        const title = document.createElement("h3");
        title.textContent = presentation.title || product.name;
        const materials = document.createElement("p");
        materials.textContent = presentation.materials || product.materials;
        const price = document.createElement("span");
        price.textContent = productPriceLabel(product);
        const arrow = document.createElement("span");
        arrow.textContent = "↗";
        arrow.setAttribute("aria-hidden", "true");
        price.appendChild(arrow);
        link.append(image, title, materials, price);
        results.appendChild(link);
      });

      if (!selection.length) {
        const empty = document.createElement("div");
        empty.className = "personal-edit-empty";
        empty.innerHTML = '<h3>Maybe yours hasn’t been made yet.</h3><p>Tell us the piece you have in mind, and we’ll explore the possibilities together.</p><a class="atelier-link" href="/customs.html#request-form">Start with an idea <span aria-hidden="true">↗</span></a>';
        if (type.value !== "all") {
          const names = { rings: "Ring", necklaces: "Necklace", bracelets: "Bracelet", earrings: "Earrings" };
          empty.querySelector("a").href = `/customs.html?piece=${encodeURIComponent(names[type.value])}#request-form`;
        }
        results.appendChild(empty);
      }
    };

    const open = (event) => {
      if (dialog.open) return;
      opener = event.currentTarget;
      render();
      alreadyLocked = document.body.classList.contains("modal-open");
      document.body.classList.add("modal-open");
      dialog.showModal();
      close.focus();
    };
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener("close", () => {
      if (!alreadyLocked) document.body.classList.remove("modal-open");
      if (opener?.isConnected) opener.focus();
    });
    type.addEventListener("change", render);
    budget.addEventListener("change", render);
    triggers.forEach((trigger) => {
      trigger.hidden = false;
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.addEventListener("click", open);
    });
  }

  function setupFooterSignature() {
    const container = document.querySelector(".footer > .container");
    if (!container || container.querySelector(".footer-signature")) return;
    const signature = document.createElement("div");
    signature.className = "footer-signature";
    signature.innerHTML = '<p>Made personal.</p><a class="atelier-link" href="/customs.html#request-form">Begin your story <span aria-hidden="true">↗</span></a>';
    container.prepend(signature);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupPersonalEdit();
    setupFooterSignature();
  });
})();
