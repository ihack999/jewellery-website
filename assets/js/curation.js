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
          <a class="atelier-link" href="/shop.html">Explore all pieces <span aria-hidden="true"><svg class="ui-icon ui-icon--arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>
        </div>
      </div>`;
    document.body.appendChild(dialog);

    const type = dialog.querySelector("[data-personal-type]");
    const budget = dialog.querySelector("[data-personal-budget]");
    const close = dialog.querySelector(".personal-edit-dialog__close");
    const results = dialog.querySelector(".personal-edit-results");
    const status = dialog.querySelector(".personal-edit-status");
    const priorities = ["rise-ring", "signature-monogram-ring", "diamond-bracelet-stack", "diamond-tennis-necklace", "vintage-halo-stud-earrings", "half-eternity-pinky-band", "pear-halo-ring", "gold-bezel-hand-chain", "cushion-diamond-ring"];
    let mood = "all";
    let step = 0;
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
        const affinity = (product) => {
          if (mood === "all") return 0;
          const text = [product.name, product.materials, product.shortDescription].join(" ").toLowerCase();
          const words = mood === "sculptural" ? ["bezel", "signet", "monogram", "rise", "sculptural"]
            : mood === "statement" ? ["tennis", "halo", "graduated", "blue", "yellow", "10 ct"]
            : ["stud", "solitaire", "eternity", "diamond", "classic"];
          return words.reduce((score, word) => score + Number(text.includes(word)), 0);
        };
        return affinity(b) - affinity(a) || priority(a) - priority(b);
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
        setResponsivePhoto(image, product.heroImage, "(max-width: 700px) 100px, 30vw");
        image.decoding = "async";
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
        arrow.innerHTML = '<svg class="ui-icon ui-icon--arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        arrow.setAttribute("aria-hidden", "true");
        price.appendChild(arrow);
        link.append(image, title, materials, price);
        results.appendChild(link);
      });

      if (!selection.length) {
        const empty = document.createElement("div");
        empty.className = "personal-edit-empty";
        empty.innerHTML = '<h3>Maybe yours hasn’t been made yet.</h3><p>Tell us the piece you have in mind, and we’ll explore the possibilities together.</p><a class="atelier-link" href="/customs.html#request-form">Start with an idea <span aria-hidden="true"><svg class="ui-icon ui-icon--arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>';
        if (type.value !== "all") {
          const names = { rings: "Ring", necklaces: "Necklace", bracelets: "Bracelet", earrings: "Earrings" };
          empty.querySelector("a").href = `/customs.html?piece=${encodeURIComponent(names[type.value])}#request-form`;
        }
        results.appendChild(empty);
      }
    };

    const body = dialog.querySelector(".personal-edit-dialog__body");
    const progress = document.createElement("nav");
    progress.className = "finder-progress";
    progress.setAttribute("aria-label", "Build your personal edit");
    progress.innerHTML = '<button type="button" data-finder-step="0">01 · Your mood</button><button type="button" data-finder-step="1">02 · The details</button><button type="button" data-finder-step="2">03 · Your pieces</button>';
    const moodChapter = document.createElement("section");
    moodChapter.className = "finder-chapter";
    moodChapter.innerHTML = '<h3 tabindex="-1">What feels like you?</h3><p>A first instinct. A point of view. There is no wrong answer.</p><div class="finder-moods" role="group" aria-label="Your jewellery mood"><button type="button" data-finder-mood="timeless" aria-pressed="false"><span aria-hidden="true">01.</span>Quietly timeless</button><button type="button" data-finder-mood="sculptural" aria-pressed="false"><span aria-hidden="true">02.</span>A little sculptural</button><button type="button" data-finder-mood="statement" aria-pressed="false"><span aria-hidden="true">03.</span>Make a statement</button></div>';
    const detailsChapter = document.createElement("section");
    detailsChapter.className = "finder-chapter";
    detailsChapter.innerHTML = '<h3 tabindex="-1">A few little details.</h3>';
    detailsChapter.append(dialog.querySelector(".personal-edit-controls"));
    const piecesChapter = document.createElement("section");
    piecesChapter.className = "finder-chapter";
    piecesChapter.innerHTML = '<h3 tabindex="-1">A considered selection.</h3>';
    piecesChapter.append(status, results, dialog.querySelector(".personal-edit-dialog__footer"));
    const chapters = [moodChapter, detailsChapter, piecesChapter];
    const navigation = document.createElement("div");
    navigation.className = "finder-next";
    navigation.innerHTML = '<button class="atelier-link" type="button" data-finder-back>Back</button><button class="atelier-button" type="button" data-finder-next>Make it personal</button>';
    body.replaceChildren(progress, ...chapters, navigation);
    const finderMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let stepAnimation;
    finderMotion.addEventListener("change", () => { if (finderMotion.matches) stepAnimation?.cancel(); });
    const showStep = (next, focus = true) => {
      stepAnimation?.cancel();
      step = Math.max(0, Math.min(2, next));
      chapters.forEach((chapter, i) => { chapter.hidden = i !== step; });
      progress.querySelectorAll("button").forEach((button, i) => {
        if (i === step) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });
      navigation.querySelector("[data-finder-back]").hidden = step === 0;
      const nextButton = navigation.querySelector("[data-finder-next]");
      nextButton.hidden = step === 2;
      nextButton.textContent = step === 0 ? "Make it personal" : "Reveal my edit";
      if (!finderMotion.matches && chapters[step].animate) {
        stepAnimation = chapters[step].animate([{opacity: .3, transform: "translateX(15px)"}, {opacity: 1, transform: "none"}], {duration: 350, easing: "cubic-bezier(.22,1,.36,1)"});
      }
      if (focus) chapters[step].querySelector("h3").focus({preventScroll: true});
      body.scrollTop = 0;
    };
    progress.querySelectorAll("button").forEach(button => button.addEventListener("click", () => showStep(Number(button.dataset.finderStep))));
    navigation.querySelector("[data-finder-back]").addEventListener("click", () => showStep(step - 1));
    navigation.querySelector("[data-finder-next]").addEventListener("click", () => showStep(step + 1));
    moodChapter.querySelectorAll("[data-finder-mood]").forEach(button => button.addEventListener("click", () => {
      mood = button.dataset.finderMood;
      moodChapter.querySelectorAll("button").forEach(choice => choice.setAttribute("aria-pressed", String(choice === button)));
      render();
    }));

    const open = (event) => {
      if (dialog.open) return;
      opener = event.currentTarget;
      render();
      showStep(0, false);
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
    signature.innerHTML = '<p>Made personal.</p><a class="atelier-link" href="/customs.html#request-form">Begin your story <span aria-hidden="true"><svg class="ui-icon ui-icon--arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>';
    container.prepend(signature);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupPersonalEdit();
    setupFooterSignature();
  });
})();
