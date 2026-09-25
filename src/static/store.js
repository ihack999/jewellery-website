/* Storefront behaviour: header, menus, search, wishlist, bag, product options,
   filters, carousels, forms. No dependencies. Everything is progressive — the
   HTML works without it. */
(() => {
  "use strict";
  const S = window.STORE || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fmtCache = {};
  function money(amount, currency = S.currency || "CAD") {
    fmtCache[currency] ||= new Intl.NumberFormat(S.locale || "en-CA", { style: "currency", currency, maximumFractionDigits: 0, currencyDisplay: "narrowSymbol" });
    const text = fmtCache[currency].format(amount);
    return currency !== S.currency ? `${text} ${currency}` : text;
  }

  const storage = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } }
  };

  let catalogPromise;
  const catalog = () => (catalogPromise ||= fetch(S.catalog || "/products.json").then((r) => r.json()).catch(() => []));
  const findProduct = async (slug) => (await catalog()).find((p) => p.slug === slug);

  const ICON = {
    heart: '<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20Z"/></svg>',
    check: '<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    minus: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14"/></svg>',
    plus: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    chevron: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    camera: '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3.2L9 5.5h6L16.8 8H20v11H4z"/><circle cx="12" cy="13.2" r="3.6"/></svg>',
    info: '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.1"/></svg>'
  };

  // ------------------------------------------------------------------ toasts
  function toast(message, { image = "", action = null, timeout = 4200 } = {}) {
    const host = $("[data-toasts]");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `${image ? `<img src="${esc(image)}" alt="">` : ""}<span>${esc(message)}</span>`;
    if (action) {
      const a = document.createElement(action.href ? "a" : "button");
      a.textContent = action.label;
      if (action.href) a.href = action.href; else { a.type = "button"; a.addEventListener("click", action.onClick); }
      el.append(a);
    }
    host.append(el);
    setTimeout(() => { el.classList.add("is-leaving"); setTimeout(() => el.remove(), 320); }, timeout);
  }
  window.tjToast = (msg, opts) => toast(msg, opts);

  // ------------------------------------------------------- overlays / focus
  const openLayers = [];
  function focusables(root) {
    return $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])', root).filter((el) => el.offsetParent !== null || el === document.activeElement);
  }
  function openLayer(el, { onClose, initialFocus } = {}) {
    if (!el || !el.hidden) return;
    const layer = { el, onClose, returnFocus: document.activeElement };
    el.hidden = false;
    el.classList.remove("is-closing");
    openLayers.push(layer);
    document.body.classList.add("is-locked");
    const panel = el.querySelector('[role="dialog"]') || el;
    requestAnimationFrame(() => (initialFocus || panel).focus({ preventScroll: true }));
    return layer;
  }
  function closeLayer(el) {
    const i = openLayers.findIndex((l) => l.el === el);
    if (i < 0) return;
    const [layer] = openLayers.splice(i, 1);
    const finish = () => {
      el.hidden = true;
      el.classList.remove("is-closing");
      layer.onClose?.();
      if (!openLayers.length) document.body.classList.remove("is-locked");
      layer.returnFocus?.focus?.({ preventScroll: true });
    };
    if (el.classList.contains("drawer") && !reduceMotion) {
      el.classList.add("is-closing");
      setTimeout(finish, 240);
    } else finish();
  }
  document.addEventListener("keydown", (e) => {
    const top = openLayers[openLayers.length - 1];
    if (!top) return;
    if (e.key === "Escape") { e.preventDefault(); closeLayer(top.el); }
    if (e.key === "Tab") {
      const items = focusables(top.el);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // ------------------------------------------------------------------ header
  function setupHeader() {
    const header = $("[data-header]");
    if (!header) return;
    const root = document.documentElement;
    const measure = () => root.style.setProperty("--header-h", `${header.offsetHeight}px`);
    measure();
    addEventListener("resize", measure, { passive: true });

    let lastY = scrollY;
    let ticking = false;
    const toolbar = $("[data-toolbar]");
    addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        const megaOpen = $(".primary-nav__link[aria-expanded='true']");
        const down = y > lastY + 4;
        const up = y < lastY - 4;
        if (y > 420 && down && !megaOpen && !openLayers.length) header.classList.add("is-hidden");
        else if (up || y < 200) header.classList.remove("is-hidden");
        header.classList.toggle("is-scrolled", y > 8);
        if (toolbar) {
          toolbar.style.top = header.classList.contains("is-hidden") ? "0px" : `${header.offsetHeight}px`;
          toolbar.classList.toggle("is-stuck", toolbar.getBoundingClientRect().top <= header.offsetHeight + 1);
        }
        lastY = y;
        ticking = false;
      });
    }, { passive: true });

    // Mega menus: hover intent on desktop, click/keyboard everywhere.
    $$("[data-mega]").forEach((item) => {
      const link = item.querySelector(".primary-nav__link");
      const panel = item.querySelector("[data-mega-panel]");
      let timer;
      const open = () => {
        clearTimeout(timer);
        $$("[data-mega]").forEach((other) => other !== item && close(other));
        panel.hidden = false;
        link.setAttribute("aria-expanded", "true");
      };
      const close = (target = item) => {
        const l = target.querySelector(".primary-nav__link");
        const p = target.querySelector("[data-mega-panel]");
        if (p) p.hidden = true;
        l?.setAttribute("aria-expanded", "false");
      };
      item.addEventListener("mouseenter", () => { clearTimeout(timer); timer = setTimeout(open, 90); });
      item.addEventListener("mouseleave", () => { clearTimeout(timer); timer = setTimeout(() => close(), 160); });
      link.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); open(); panel.querySelector("a")?.focus(); }
      });
      item.addEventListener("focusout", (e) => { if (!item.contains(e.relatedTarget)) close(); });
      item.addEventListener("keydown", (e) => { if (e.key === "Escape") { close(); link.focus(); } });
      link.addEventListener("click", (e) => {
        if (matchMedia("(hover: none)").matches && panel.hidden) { e.preventDefault(); open(); }
      });
    });
  }

  function setupAnnouncements() {
    const bar = $("[data-announce]");
    if (!bar) return;
    const items = $$(".announce__item", bar);
    if (items.length < 2) { $$(".announce__btn", bar).forEach((b) => (b.hidden = true)); return; }
    let i = 0;
    let timer;
    const show = (n) => {
      items[i].hidden = true; items[i].classList.remove("is-active");
      i = (n + items.length) % items.length;
      items[i].hidden = false; items[i].classList.add("is-active");
    };
    const start = () => { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => show(i + 1), 5000); };
    $("[data-announce-next]", bar).addEventListener("click", () => { show(i + 1); start(); });
    $("[data-announce-prev]", bar).addEventListener("click", () => { show(i - 1); start(); });
    bar.addEventListener("mouseenter", () => clearInterval(timer));
    bar.addEventListener("mouseleave", start);
    start();
  }

  function setupDrawers() {
    const menu = $('[data-drawer="menu"]');
    const cart = $('[data-drawer="cart"]');
    $$("[data-menu-open]").forEach((b) => b.addEventListener("click", () => { openLayer(menu); b.setAttribute("aria-expanded", "true"); }));
    $$("[data-cart-open]").forEach((b) => b.addEventListener("click", () => openCart()));
    $$("[data-drawer]").forEach((d) => d.addEventListener("click", (e) => {
      if (e.target.closest("[data-drawer-close]")) {
        closeLayer(d);
        $$("[data-menu-open]").forEach((b) => b.setAttribute("aria-expanded", "false"));
      }
    }));
    window.openCart = () => openCart();
    function openCart() {
      renderCart();
      showCartStep("bag");
      openLayer(cart);
    }
  }

  // ------------------------------------------------------------ card markup
  function cardHtml(p) {
    const swatches = (p.options.find((o) => o.type === "swatch")?.values || []);
    return `<article class="card${p.availability === "sold" ? " card--sold" : ""}" data-product-card data-slug="${esc(p.slug)}">
      <div class="card__frame">
        <a class="card__media" href="${esc(p.url)}" tabindex="-1" aria-hidden="true">
          <img class="card__img" src="${esc(p.image)}" alt="" loading="lazy">
          ${p.hover ? `<img class="card__img card__img--hover" src="${esc(p.hover)}" alt="" loading="lazy">` : ""}
        </a>
        ${p.badge ? `<span class="badge${p.availability === "sold" ? " badge--sold" : /estate|rare/i.test(p.badge) ? " badge--estate" : ""}">${esc(p.badge)}</span>` : ""}
        <button type="button" class="card__wish" data-wish="${esc(p.slug)}" aria-pressed="${wishlist.has(p.slug)}" aria-label="Save ${esc(p.name)} to wishlist">${ICON.heart}</button>
        <button type="button" class="card__quick" data-quick-view="${esc(p.slug)}">Quick view</button>
      </div>
      <div class="card__body">
        <h3 class="card__title"><a href="${esc(p.url)}">${esc(p.name)}</a></h3>
        <p class="card__price${p.price === null || p.availability === "sold" ? " price--quiet" : ""}">${esc(p.priceText)}</p>
        ${swatches.length > 1 ? `<ul class="card__swatches">${swatches.map((s, i) => `<li><span class="swatch${i === 0 ? " is-active" : ""}" style="--swatch:${esc(s.swatch || "#ddd")}" title="${esc(s.label)}"></span></li>`).join("")}</ul>` : ""}
      </div>
    </article>`;
  }

  // --------------------------------------------------------------- wishlist
  const WISH_KEY = "store.wishlist";
  const wishlist = new Set(storage.get(WISH_KEY, []));
  function syncWish() {
    $$("[data-wish]").forEach((b) => b.setAttribute("aria-pressed", String(wishlist.has(b.dataset.wish))));
    $$("[data-wish-count]").forEach((c) => { c.textContent = wishlist.size; c.hidden = wishlist.size === 0; });
  }
  function setupWishlist() {
    syncWish();
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-wish]");
      if (!btn) return;
      e.preventDefault();
      const slug = btn.dataset.wish;
      const adding = !wishlist.has(slug);
      adding ? wishlist.add(slug) : wishlist.delete(slug);
      storage.set(WISH_KEY, [...wishlist]);
      syncWish();
      btn.animate?.([{ transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 280 });
      const p = await findProduct(slug);
      toast(adding ? `Saved ${p?.name || "piece"} to your wishlist` : "Removed from wishlist", { image: adding ? p?.image : "", action: adding ? { label: "View", href: "/wishlist/" } : null, timeout: 2600 });
      if ($("[data-wishlist-grid]")) renderWishlistPage();
    });
    renderWishlistPage();
  }
  async function renderWishlistPage() {
    const grid = $("[data-wishlist-grid]");
    if (!grid) return;
    const items = (await catalog()).filter((p) => wishlist.has(p.slug));
    grid.innerHTML = items.map(cardHtml).join("");
    $("[data-wishlist-empty]").hidden = items.length > 0;
    const share = $("[data-wishlist-share]");
    share.hidden = !items.length;
    const mail = $("[data-wishlist-email]");
    if (mail && items.length) {
      const email = document.querySelector('a[href^="mailto:"]')?.getAttribute("href")?.slice(7) || "";
      const body = `Hello,\n\nI'd love to hear more about these pieces:\n\n${items.map((p) => `• ${p.name} — ${location.origin}${p.url}`).join("\n")}\n\nThank you!`;
      mail.href = `mailto:${email}?subject=${encodeURIComponent("My wishlist")}&body=${encodeURIComponent(body)}`;
    }
  }

  // -------------------------------------------------------------------- bag
  const CART_KEY = "store.bag";
  let cart = storage.get(CART_KEY, []).filter((l) => l && l.slug);
  const saveCart = () => { storage.set(CART_KEY, cart); syncCartCount(); };
  function syncCartCount() {
    const n = cart.reduce((a, l) => a + l.qty, 0);
    $$("[data-cart-count]").forEach((c) => { c.textContent = n; c.hidden = n === 0; });
    const inline = $("[data-cart-count-inline]");
    if (inline) inline.textContent = n ? `(${n})` : "";
  }
  function lineKey(slug, options) { return `${slug}::${JSON.stringify(options)}`; }
  function addToCart(p, options, qty = 1) {
    const unit = unitPrice(p, options);
    const key = lineKey(p.slug, options);
    const existing = cart.find((l) => l.key === key);
    if (existing) existing.qty = Math.min(p.maxQuantity || 5, existing.qty + qty);
    else cart.push({ key, slug: p.slug, name: p.name, url: p.url, image: p.image, currency: p.currency, unit, options, qty: Math.min(p.maxQuantity || 5, qty), max: p.maxQuantity || 5 });
    saveCart();
    renderCart();
  }
  function unitPrice(p, options) {
    let total = p.price || 0;
    for (const o of p.options) {
      const chosen = options[o.name];
      const v = o.values?.find((x) => x.value === chosen);
      if (v?.add) total += v.add;
    }
    return total;
  }
  function totals() {
    const byCurrency = {};
    cart.forEach((l) => { byCurrency[l.currency] = (byCurrency[l.currency] || 0) + l.unit * l.qty; });
    return Object.entries(byCurrency).map(([c, amt]) => money(amt, c)).join(" + ") || money(0);
  }
  function renderCart() {
    const list = $("[data-cart-lines]");
    if (!list) return;
    const empty = !cart.length;
    $("[data-cart-empty]").hidden = !empty;
    $("[data-cart-foot]").hidden = empty;
    list.innerHTML = cart.map((l, i) => `<li class="cart-line">
      <a class="cart-line__img" href="${esc(l.url)}"><img src="${esc(l.image)}" alt=""></a>
      <div>
        <div class="cart-line__top"><a class="cart-line__name" href="${esc(l.url)}">${esc(l.name)}</a><span class="cart-line__price">${money(l.unit * l.qty, l.currency)}</span></div>
        <div class="cart-line__opts">${Object.entries(l.options).filter(([, v]) => v).map(([k, v]) => `<span>${esc(k)}: ${esc(v)}</span>`).join("")}</div>
        <div class="cart-line__bottom">
          <div class="qty" aria-label="Quantity">
            <button type="button" data-qty="${i}" data-delta="-1" aria-label="Decrease quantity"${l.qty <= 1 ? " disabled" : ""}>${ICON.minus}</button>
            <span aria-live="polite">${l.qty}</span>
            <button type="button" data-qty="${i}" data-delta="1" aria-label="Increase quantity"${l.qty >= l.max ? " disabled" : ""}>${ICON.plus}</button>
          </div>
          <button type="button" class="cart-line__remove" data-remove="${i}">Remove</button>
        </div>
      </div>
    </li>`).join("");
    $("[data-cart-total]").textContent = totals();
    syncCartCount();
  }
  function showCartStep(step) {
    const form = $("[data-cart-request]");
    const lines = $("[data-cart-lines]");
    const foot = $("[data-cart-foot]");
    if (!form) return;
    const requesting = step === "request" && cart.length;
    form.hidden = !requesting;
    lines.hidden = requesting;
    foot.hidden = requesting || !cart.length;
    if (requesting) {
      $("[data-cart-order-field]").value = cart.map((l) => `${l.qty} × ${l.name}${Object.keys(l.options).length ? ` (${Object.entries(l.options).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(", ")})` : ""} — ${money(l.unit * l.qty, l.currency)} — ${location.origin}${l.url}`).join("\n");
      $("[data-cart-total-field]").value = totals();
      form.querySelector("input:not([type=hidden])")?.focus();
    }
  }
  function setupCart() {
    syncCartCount();
    const drawer = $('[data-drawer="cart"]');
    if (!drawer) return;
    drawer.addEventListener("click", (e) => {
      const q = e.target.closest("[data-qty]");
      const r = e.target.closest("[data-remove]");
      if (q) {
        const l = cart[Number(q.dataset.qty)];
        l.qty = Math.max(1, Math.min(l.max, l.qty + Number(q.dataset.delta)));
        saveCart(); renderCart();
      }
      if (r) { cart.splice(Number(r.dataset.remove), 1); saveCart(); renderCart(); if (!cart.length) showCartStep("bag"); }
      if (e.target.closest("[data-cart-back]")) showCartStep("bag");
      if (e.target.closest("[data-cart-checkout]")) checkout();
    });
    const form = $("[data-cart-request]");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate(form)) return;
      const ok = await submitForm(form);
      if (ok) {
        cart = []; saveCart(); renderCart();
        form.hidden = true;
        $("[data-cart-empty]").hidden = true;
        $("[data-cart-lines]").hidden = false;
        $("[data-cart-body]").insertAdjacentHTML("beforeend", `<div class="form-done" data-cart-done>${ICON.check}<p class="cart-empty__title">Request received</p><p class="muted">Thank you — we'll reply personally to confirm every detail in writing before any payment.</p></div>`);
        drawer.addEventListener("transitionend", () => {}, { once: true });
        setTimeout(() => $("[data-cart-done]")?.remove(), 12000);
      }
    });
  }
  async function checkout() {
    if (!cart.length) return;
    if ((S.checkout?.mode || "request") !== "stripe") { showCartStep("request"); return; }
    const btn = $("[data-cart-checkout]");
    btn.classList.add("is-busy");
    try {
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.map((l) => ({ slug: l.slug, options: l.options, quantity: l.qty })) })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) { location.href = data.url; return; }
      toast(data.message || "Checkout is unavailable right now — please send an order request instead.");
      showCartStep("request");
    } catch {
      toast("Checkout could not be reached. Please try again.");
    } finally {
      btn.classList.remove("is-busy");
    }
  }

  // --------------------------------------------------------- product forms
  function selectedOptions(form) {
    const out = {};
    $$("[data-option]", form).forEach((input) => {
      if (input.type === "radio") { if (input.checked) out[input.name] = input.value; }
      else out[input.name] = input.value.trim();
    });
    return out;
  }
  function validate(form) {
    let ok = true;
    $$("[required]", form).forEach((el) => {
      const bad = el.type === "radio" ? !$(`[name="${CSS.escape(el.name)}"]:checked`, form) : !el.value.trim() || (el.type === "email" && !/^\S+@\S+\.\S+$/.test(el.value));
      el.classList.toggle("is-invalid", bad);
      el.setAttribute("aria-invalid", String(bad));
      if (bad && ok) { el.focus(); ok = false; }
    });
    const status = $("[data-form-status]", form);
    if (status) { status.textContent = ok ? "" : "Please complete the highlighted fields."; status.className = `form-status${ok ? "" : " is-error"}`; }
    return ok;
  }

  function bindProductForm(form, p, { onImage } = {}) {
    const addBtn = $("[data-add-to-bag]", form);
    const enqBtn = $("[data-enquire]", form);
    const note = $("[data-inquire-note]", form);
    const priceEls = $$("[data-price-display]", form.closest("[data-pdp], .quick") || document);
    const update = () => {
      const opts = selectedOptions(form);
      let inquire = !p.purchasable;
      for (const o of p.options) {
        const v = o.values?.find((x) => x.value === opts[o.name]);
        if (v?.inquire) inquire = true;
      }
      $$("[data-option-group]", form).forEach((fs) => {
        const checked = $("input:checked", fs);
        const label = $("[data-option-value]", fs);
        if (checked && label) label.textContent = checked.value;
      });
      if (p.availability !== "sold") {
        if (addBtn) addBtn.hidden = inquire;
        if (enqBtn) { enqBtn.hidden = !inquire; enqBtn.classList.toggle("btn--solid", inquire); enqBtn.classList.toggle("btn--ghost", !inquire); }
        if (note) note.hidden = !(inquire && p.purchasable);
      }
      if (p.price !== null && p.availability !== "sold") {
        const hasAdd = p.options.some((o) => o.values?.some((v) => v.add));
        if (hasAdd) priceEls.forEach((el) => (el.textContent = (p.priceFrom ? "From " : "") + money(unitPrice(p, opts), p.currency)));
        if (inquire && p.purchasable) priceEls.forEach((el) => (el.textContent = "Price on request"));
        else if (!hasAdd) priceEls.forEach((el) => (el.textContent = p.priceText));
      }
      form.dataset.inquire = String(inquire);
    };
    form.addEventListener("change", (e) => {
      const input = e.target;
      if (input.matches("[data-option]")) {
        input.classList.remove("is-invalid");
        if (input.dataset.image !== undefined && input.checked) onImage?.(Number(input.dataset.image));
      }
      update();
    });
    form.addEventListener("input", (e) => {
      if (e.target.matches("[data-option-text]")) e.target.value = e.target.value.toUpperCase();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (form.dataset.inquire === "true") { enqBtn?.click(); return; }
      if (!validate(form)) return;
      const opts = selectedOptions(form);
      addToCart(p, opts, 1);
      if (form.closest("[data-quick-modal]")) closeLayer(form.closest("[data-quick-modal]"));
      window.openCart();
    });
    enqBtn?.addEventListener("click", () => openEnquiry(p, selectedOptions(form)));
    update();
    return { update };
  }

  function openEnquiry(p, opts) {
    const modal = $("[data-enquire-modal]");
    if (!modal) { location.href = `/pages/contact/?product=${encodeURIComponent(p.name)}`; return; }
    const field = $("[data-enquire-options]", modal);
    if (field) field.value = Object.entries(opts || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(", ");
    openLayer(modal, { initialFocus: $("input:not([type=hidden])", modal) });
  }

  // ---------------------------------------------------------------- PDP
  async function setupProductPage() {
    const pdp = $("[data-pdp]");
    if (!pdp) return;
    const slug = pdp.dataset.slug;
    const p = await findProduct(slug);
    const gallery = $("[data-gallery]", pdp);
    const track = $("[data-gallery-track]", gallery);
    const items = $$("[data-gallery-item]", track);
    const dots = $$(".gallery__dot", gallery);
    const current = $("[data-gallery-current]", gallery);

    // Swipe gallery (mobile): update dots.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && en.intersectionRatio > .6) {
          const i = items.indexOf(en.target);
          dots.forEach((d, n) => d.classList.toggle("is-active", n === i));
          if (current) current.textContent = i + 1;
        }
      });
    }, { root: track, threshold: [.6] });
    if (matchMedia("(max-width: 959px)").matches) items.forEach((it) => io.observe(it));

    const goToImage = (index) => {
      const el = items.find((it) => Number(it.dataset.index) === index);
      if (!el) return;
      if (matchMedia("(max-width: 959px)").matches) {
        track.scrollTo({ left: el.offsetLeft - track.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
      } else {
        const img = $("img", el);
        const lead = $("img", items[0]);
        if (img && lead && index !== 0) {
          // Swap into the lead position so the choice is visible without scrolling.
          const [src, srcset] = [img.currentSrc || img.src, img.srcset];
          lead.srcset = srcset; lead.src = src;
          lead.animate?.([{ opacity: .4 }, { opacity: 1 }], { duration: 350 });
        } else if (index === 0 && lead) {
          lead.srcset = lead.dataset.origSrcset ?? lead.srcset; lead.src = lead.dataset.origSrc ?? lead.src;
        }
      }
    };
    const lead = $("img", items[0]);
    if (lead) { lead.dataset.origSrc = lead.src; lead.dataset.origSrcset = lead.srcset; }

    const form = $("[data-product-form]", pdp);
    if (form && p) bindProductForm(form, p, { onImage: goToImage });

    // Lightbox
    const lb = $("[data-lightbox]");
    if (lb) {
      const sources = JSON.parse($("[data-lightbox-sources]", lb).innerHTML);
      const img = $("[data-lightbox-img]", lb);
      let at = 0;
      const show = (n) => { at = (n + sources.length) % sources.length; img.src = sources[at].src; img.alt = sources[at].alt; };
      pdp.addEventListener("click", (e) => {
        const z = e.target.closest("[data-zoom]");
        if (!z) return;
        show(Number(z.dataset.zoom));
        openLayer(lb, { initialFocus: $("[data-lightbox-close]", lb) });
      });
      $("[data-lightbox-close]", lb).addEventListener("click", () => closeLayer(lb));
      $("[data-lightbox-prev]", lb).addEventListener("click", () => show(at - 1));
      $("[data-lightbox-next]", lb).addEventListener("click", () => show(at + 1));
      lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") show(at - 1); if (e.key === "ArrowRight") show(at + 1); });
      let sx = null;
      lb.addEventListener("pointerdown", (e) => (sx = e.clientX));
      lb.addEventListener("pointerup", (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 50) show(at + (e.clientX < sx ? 1 : -1)); sx = null; });
    }

    // Sticky add-to-bag once the main button scrolls away.
    const sticky = $("[data-sticky-atc]");
    const actions = $(".pdp__actions", pdp);
    if (sticky && actions) {
      sticky.hidden = false;
      new IntersectionObserver(([en]) => sticky.classList.toggle("is-visible", !en.isIntersecting && en.boundingClientRect.top < 0), { threshold: 0 }).observe(actions);
      $("[data-sticky-action]", sticky).addEventListener("click", () => {
        const visibleBtn = $$(".pdp__actions .btn", pdp).find((b) => !b.hidden);
        actions.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        if (visibleBtn && visibleBtn.tagName === "A") return;
        setTimeout(() => visibleBtn?.click(), 350);
      });
    }

    // Modals on this page
    $$("[data-enquire-modal], [data-quick-modal]").forEach((m) => m.addEventListener("click", (e) => { if (e.target.closest("[data-modal-close]")) closeLayer(m); }));

    // Recently viewed
    const RECENT_KEY = "store.recent";
    const recent = storage.get(RECENT_KEY, []).filter((s) => s !== slug);
    storage.set(RECENT_KEY, [slug, ...recent].slice(0, 12));
    const all = await catalog();
    const recentProducts = recent.map((s) => all.find((x) => x.slug === s)).filter(Boolean).slice(0, 8);
    const section = $("[data-recent]");
    if (section && recentProducts.length) {
      $("[data-recent-track]", section).innerHTML = recentProducts.map((x) => `<div class="rail__item" role="listitem">${cardHtml(x)}</div>`).join("");
      section.hidden = false;
      syncWish();
    }
  }

  // ------------------------------------------------------------ AR try-on links
  // [data-tryon] links open the Design Studio straight into the camera. The
  // chosen metal on the product form rides along, and the heavy AR files are
  // warmed up on hover/touch so the camera starts sooner.
  function setupTryOn() {
    const warmed = new Set();
    const warm = (link) => {
      const url = new URL(link.href, location.href);
      const piece = url.searchParams.get("piece") || "Ring";
      const files = ["/assets/js/ar-tryon.js?v=20260925-arx2", "/assets/js/designer.js?v=20260914-studio", "/assets/vendor/mediapipe-0.10.14/vision_bundle.mjs",
        "/assets/vendor/mediapipe-0.10.14/wasm/vision_wasm_internal.js", "/assets/vendor/mediapipe-0.10.14/wasm/vision_wasm_internal.wasm",
        ...({ Ring: ["hand_landmarker.task"], Bracelet: ["hand_landmarker.task", "pose_landmarker_lite.task"], Earrings: ["face_landmarker.task", "hair_segmenter.tflite"], Necklace: ["pose_landmarker_full.task", "hair_segmenter.tflite"] }[piece] || []).map((f) => `/assets/models/${f}`)];
      for (const href of files) {
        if (warmed.has(href)) continue;
        warmed.add(href);
        const hint = document.createElement("link");
        hint.rel = "prefetch";
        hint.href = href;
        document.head.appendChild(hint);
      }
    };
    const saveData = navigator.connection?.saveData;
    ["pointerenter", "focusin", "touchstart"].forEach((type) => document.addEventListener(type, (e) => {
      const link = e.target instanceof Element && e.target.closest("[data-tryon]");
      if (link && !saveData) warm(link);
    }, { capture: true, passive: true }));
    document.addEventListener("click", (e) => {
      const link = e.target instanceof Element && e.target.closest("[data-tryon]");
      if (!link) return;
      const scope = link.closest("[data-pdp], .quick");
      const metal = scope?.querySelector("input[data-studio-metal]:checked")?.dataset.studioMetal;
      if (!metal) return;
      const url = new URL(link.href, location.href);
      url.searchParams.set("metal", metal);
      link.href = url.pathname + url.search + url.hash;
    }, true);
  }

  // ------------------------------------------------------------ quick view
  function setupQuickView() {
    const modal = $("[data-quick-modal]");
    if (!modal) return;
    modal.addEventListener("click", (e) => { if (e.target.closest("[data-modal-close]")) closeLayer(modal); });
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-quick-view]");
      if (!btn) return;
      e.preventDefault();
      const p = await findProduct(btn.dataset.quickView);
      if (!p) return;
      const body = $("[data-quick-body]", modal);
      body.innerHTML = quickHtml(p);
      openLayer(modal);
      const form = $("[data-product-form]", body);
      const track = $(".quick__track", body);
      bindProductForm(form, p, {
        onImage: (i) => { const img = track.children[i]; if (img) track.scrollTo({ left: img.offsetLeft, behavior: "smooth" }); }
      });
      syncWish();
    });
  }
  function quickHtml(p) {
    const opts = p.options.map((o) => {
      const id = `q-${p.slug}-${o.id}`;
      if (o.type === "text") return `<div class="option"><label class="option__label" for="${id}">${esc(o.name)}</label><input class="option__input" id="${id}" name="${esc(o.name)}" ${o.maxLength ? `maxlength="${o.maxLength}"` : ""} placeholder="${esc(o.placeholder || "")}" ${o.required ? "required" : ""} data-option data-option-text autocomplete="off"></div>`;
      if (o.type === "size") return `<div class="option"><label class="option__label" for="${id}">${esc(o.name)}</label><div class="select"><select id="${id}" name="${esc(o.name)}" ${o.required ? "required" : ""} data-option><option value="">Select ${esc(o.name.toLowerCase())}</option>${o.values.map((v) => `<option value="${esc(v.value)}">${esc(v.label)}</option>`).join("")}</select>${ICON.chevron}</div></div>`;
      const sw = o.type === "swatch";
      return `<fieldset class="option" data-option-group><legend class="option__label">${esc(o.name)}: <span class="option__value" data-option-value>${esc(o.values[0].label)}</span></legend><div class="${sw ? "option__swatches" : "option__buttons"}">${o.values.map((v, i) => `<label class="${sw ? "swatch-choice" : "pill"}"><input type="radio" name="${esc(o.name)}" value="${esc(v.value)}" ${i === 0 ? "checked" : ""} data-option ${v.add ? `data-add="${v.add}"` : ""} ${v.inquire ? "data-inquire" : ""} ${v.image !== undefined && v.image !== null ? `data-image="${v.image}"` : ""} ${v.studioMetal ? `data-studio-metal="${esc(v.studioMetal)}"` : ""}>${sw ? `<span class="swatch swatch--lg" style="--swatch:${esc(v.swatch || "#ddd")}"></span><span class="visually-hidden">${esc(v.label)}</span>` : `<span>${esc(v.label)}</span>`}</label>`).join("")}</div></fieldset>`;
    }).join("");
    const sold = p.availability === "sold";
    return `<div class="quick">
      <div class="quick__media"><div class="quick__track">${p.images.map((img) => `<img src="${esc(img.src)}" alt="${esc(img.alt)}">`).join("")}</div></div>
      <div class="quick__info">
        <p class="pdp__meta">${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}<span>${esc(p.categoryLabel)}</span></p>
        <h2 class="pdp__title">${esc(p.name)}</h2>
        <p class="pdp__price${p.price === null ? " price--quiet" : ""}" data-price-display>${esc(p.priceText)}</p>
        ${p.summary ? `<p class="pdp__summary">${esc(p.summary)}</p>` : ""}
        <form class="pdp__form" data-product-form novalidate>
          ${sold ? "" : opts}
          <p class="pdp__inquire-note" data-inquire-note hidden>${ICON.info} This option is quoted personally — we'll reply with pricing.</p>
          <div class="pdp__actions">
            ${sold ? `<a class="btn btn--solid btn--block" href="${esc(p.url)}">View details</a>` : `<button type="submit" class="btn btn--solid btn--block" data-add-to-bag ${p.purchasable ? "" : "hidden"}>Add to bag</button>
            <a class="btn btn--${p.purchasable ? "ghost" : "solid"} btn--block" href="${esc(p.url)}" data-enquire-link ${p.purchasable ? "hidden" : ""}>Enquire</a>`}
            <button type="button" class="pdp__wish" data-wish="${esc(p.slug)}" aria-pressed="${wishlist.has(p.slug)}" aria-label="Save to wishlist">${ICON.heart}</button>
          </div>
          <p class="form-status" data-form-status role="status"></p>
        </form>
        ${p.tryon ? `<a class="quick__tryon" href="${esc(p.tryon)}" data-tryon>${ICON.camera} Try it on with your camera</a>` : ""}
        <a class="quick__more" href="${esc(p.url)}">View full details</a>
      </div>
    </div>`;
  }

  // ------------------------------------------------------------ collections
  function setupCollection() {
    const root = $("[data-collection]");
    if (!root) return;
    const grid = $("[data-grid]", root);
    const cards = $$("[data-product-card]", grid);
    const promo = $("[data-promo-tile]", grid);
    const form = $("[data-filters]", root);
    const pageSize = Number(root.dataset.pageSize) || 12;
    const loadMore = $("[data-load-more]", root);
    const chips = $("[data-active-filters]", root);
    const scrim = $(".filters-scrim");
    let shown = pageSize;
    const original = [...cards];
    const promoBefore = promo?.nextElementSibling || null;

    // Read initial state from the URL (so filtered pages are shareable).
    const params = new URLSearchParams(location.search);
    for (const [key, value] of params) {
      value.split(",").forEach((v) => {
        const input = form && $(`input[name="${CSS.escape(key)}"][value="${CSS.escape(v)}"]`, form);
        if (input) input.checked = true;
      });
    }
    const q = (params.get("q") || "").trim().toLowerCase();
    if (q) {
      const title = $(".collection-title");
      if (title) title.textContent = `Results for “${params.get("q")}”`;
    }

    const state = () => {
      const s = {};
      $$("input:checked", form).forEach((i) => { (s[i.name] ||= []).push(i.value); });
      return s;
    };
    const matchCard = (card, s) => {
      const d = card.dataset;
      const price = d.price === "" ? null : Number(d.price);
      if (s.category && !s.category.includes(d.category)) return false;
      if (s.metal && !s.metal.some((m) => d.metals.split(" ").includes(m))) return false;
      if (s.stone && !s.stone.some((m) => d.stones.split(" ").includes(m))) return false;
      if (s.availability && !s.availability.includes(d.availability)) return false;
      if (s.price && !s.price.some((r) => {
        if (r === "request") return price === null && d.availability !== "sold";
        const [min, max] = r.split("-");
        return price !== null && price >= Number(min) && (max === "" || price < Number(max));
      })) return false;
      if (q && !(`${d.name} ${d.tags} ${d.category} ${d.metals} ${d.stones}`.toLowerCase().includes(q))) return false;
      return true;
    };
    const labelFor = (name, value) => $(`input[name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`, form)?.closest("label")?.querySelector("span:not(.swatch):not(.check__count)")?.textContent || value;

    function apply({ resetPage = true, scroll = false } = {}) {
      const s = state();
      const sort = (s.sort || ["featured"])[0];
      delete s.sort;
      if (resetPage) shown = pageSize;
      const sorted = [...original].sort((a, b) => {
        const pa = a.dataset.price === "" ? Infinity : Number(a.dataset.price);
        const pb = b.dataset.price === "" ? Infinity : Number(b.dataset.price);
        if (sort === "price-asc") return pa - pb;
        if (sort === "price-desc") return (pb === Infinity ? -1 : pb) - (pa === Infinity ? -1 : pa);
        if (sort === "name") return a.dataset.name.localeCompare(b.dataset.name);
        return Number(a.dataset.sort) - Number(b.dataset.sort);
      });
      sorted.forEach((c) => grid.append(c));
      const matching = sorted.filter((c) => matchCard(c, s));
      const filtering = Object.keys(s).length > 0 || sort !== "featured" || Boolean(q);
      sorted.forEach((c) => { c.hidden = !matching.includes(c); });
      // The editorial tile takes two grid cells, so show two fewer products with it to keep rows even.
      const limit = shown - (promo && !filtering ? 2 : 0);
      matching.forEach((c, i) => c.classList.toggle("is-paged-out", i >= limit));
      if (promo) {
        promo.hidden = Boolean(filtering);
        if (!promo.hidden && promoBefore) grid.insertBefore(promo, promoBefore);
      }
      $$("[data-result-number]", root).forEach((n) => (n.textContent = matching.length));
      $("[data-grid-empty]", root).hidden = matching.length > 0;
      if (loadMore) {
        loadMore.hidden = matching.length <= limit;
        $("[data-shown]", loadMore).textContent = Math.min(limit, matching.length);
        $("[data-total]", loadMore).textContent = matching.length;
        $("[data-progress]", loadMore).style.width = `${(Math.min(limit, matching.length) / Math.max(1, matching.length)) * 100}%`;
      }
      // Filter counters + chips
      let active = 0;
      $$("[data-filter-group]", form).forEach((g) => {
        const name = g.dataset.filterGroup;
        const n = name === "sort" ? 0 : (s[name] || []).length;
        active += n;
        const c = $("[data-filter-count]", g);
        if (c) c.textContent = n ? `(${n})` : "";
      });
      const sortLabel = $("[data-sort-label]", form);
      if (sortLabel) sortLabel.textContent = sort === "featured" ? "" : `· ${labelFor("sort", sort)}`;
      $$("[data-active-count]", root).forEach((c) => (c.textContent = active || ""));
      chips.innerHTML = Object.entries(s).flatMap(([name, values]) => values.map((v) => `<button type="button" class="chip" data-remove-filter="${esc(name)}" data-value="${esc(v)}">${esc(labelFor(name, v))} ${ICON.minus.replace('width="14" height="14"', 'width="12" height="12"')}</button>`)).join("") + (active ? `<button type="button" class="chip chip--clear" data-filters-clear>Clear all</button>` : "");
      chips.hidden = !active;
      // URL
      const url = new URL(location.href);
      ["category", "price", "metal", "stone", "availability", "sort"].forEach((k) => url.searchParams.delete(k));
      Object.entries(s).forEach(([k, v]) => url.searchParams.set(k, v.join(",")));
      if (sort !== "featured") url.searchParams.set("sort", sort);
      history.replaceState(null, "", url);
      if (scroll) root.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }

    if (form) {
      form.addEventListener("change", () => apply());
      form.addEventListener("click", (e) => {
        const t = e.target.closest("[data-filter-toggle]");
        if (!t) return;
        const panel = t.nextElementSibling;
        const open = t.getAttribute("aria-expanded") !== "true";
        if (!form.classList.contains("is-open")) {
          $$("[data-filter-toggle]", form).forEach((o) => { if (o !== t) { o.setAttribute("aria-expanded", "false"); o.nextElementSibling.hidden = true; } });
        }
        t.setAttribute("aria-expanded", String(open));
        panel.hidden = !open;
      });
      document.addEventListener("click", (e) => {
        if (form.classList.contains("is-open") || e.target.closest("[data-filter-group]")) return;
        $$("[data-filter-toggle]", form).forEach((o) => { o.setAttribute("aria-expanded", "false"); o.nextElementSibling.hidden = true; });
      });
      form.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !form.classList.contains("is-open")) {
          const openBtn = $('[data-filter-toggle][aria-expanded="true"]', form);
          if (openBtn) { openBtn.click(); openBtn.focus(); }
        }
      });
    }
    root.addEventListener("click", (e) => {
      const rm = e.target.closest("[data-remove-filter]");
      if (rm) {
        const input = $(`input[name="${CSS.escape(rm.dataset.removeFilter)}"][value="${CSS.escape(rm.dataset.value)}"]`, form);
        if (input) input.checked = false;
        apply();
      }
      if (e.target.closest("[data-filters-clear]")) {
        $$("input", form).forEach((i) => { i.checked = i.name === "sort" && i.value === "featured"; });
        apply();
      }
    });
    // Mobile sheet
    const openSheet = () => {
      form.classList.add("is-open");
      form.closest("[data-toolbar]")?.classList.add("has-open-sheet");
      scrim.hidden = false;
      document.body.classList.add("is-locked");
      $$("[data-filter-toggle]", form).forEach((t) => { t.setAttribute("aria-expanded", "false"); t.nextElementSibling.hidden = true; });
      $("[data-filter-toggle]", form)?.focus();
    };
    const closeSheet = () => { form.classList.remove("is-open"); form.closest("[data-toolbar]")?.classList.remove("has-open-sheet"); scrim.hidden = true; document.body.classList.remove("is-locked"); };
    $$("[data-filters-open]", root).forEach((b) => b.addEventListener("click", openSheet));
    $$("[data-filters-close]").forEach((b) => b.addEventListener("click", closeSheet));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && form?.classList.contains("is-open")) closeSheet(); });

    $("[data-load-more-btn]", root)?.addEventListener("click", () => {
      const before = shown;
      shown += pageSize;
      apply({ resetPage: false });
      const visible = $$("[data-product-card]:not([hidden])", grid);
      visible.slice(before, shown).forEach((c, i) => { c.classList.add("is-entering"); c.style.animationDelay = `${i * 40}ms`; });
      visible[before]?.querySelector("a")?.focus({ preventScroll: true });
    });
    apply({ resetPage: true });
  }

  // ------------------------------------------------------------------ rails
  function setupRails(scope = document) {
    $$("[data-rail]", scope).forEach((rail) => {
      const track = $("[data-rail-track]", rail);
      const prev = $("[data-rail-prev]", rail);
      const next = $("[data-rail-next]", rail);
      if (!track || !prev) return;
      const update = () => {
        const max = track.scrollWidth - track.clientWidth - 2;
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= max;
        const media = $(".card__media, .moment__media", track);
        if (media) rail.style.setProperty("--rail-media-h", `${media.offsetHeight}px`);
      };
      const step = (dir) => track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: reduceMotion ? "auto" : "smooth" });
      prev.addEventListener("click", () => step(-1));
      next.addEventListener("click", () => step(1));
      track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
      addEventListener("resize", update, { passive: true });
      update();
      $$("img", track).forEach((img) => img.addEventListener("load", update, { once: true }));
    });
  }

  function setupTabs() {
    $$("[data-tabs]").forEach((section) => {
      const tabs = $$('[role="tab"]', section);
      const select = (tab, focus = false) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          const panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
        const panel = document.getElementById(tab.getAttribute("aria-controls"));
        panel && setupRailsRefresh(panel);
      };
      tabs.forEach((t, i) => {
        t.addEventListener("click", () => select(t));
        t.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight") select(tabs[(i + 1) % tabs.length], true);
          if (e.key === "ArrowLeft") select(tabs[(i - 1 + tabs.length) % tabs.length], true);
        });
      });
    });
  }
  function setupRailsRefresh(panel) {
    $$("[data-rail-track]", panel).forEach((t) => t.dispatchEvent(new Event("scroll")));
  }

  // --------------------------------------------------------- card swatches
  function setupCardSwatches() {
    document.addEventListener("click", (e) => {
      const sw = e.target.closest(".card__swatches button.swatch");
      if (!sw) return;
      e.preventDefault();
      const card = sw.closest(".card");
      $$(".swatch", card).forEach((s) => s.classList.toggle("is-active", s === sw));
      const img = $(".card__img:not(.card__img--hover)", card);
      if (sw.dataset.swatchImage && img) {
        img.dataset.orig ||= img.src;
        img.removeAttribute("srcset");
        img.src = sw.dataset.swatchImage;
      }
    });
  }

  // -------------------------------------------------------- client moments
  function setupMoments() {
    const vids = $$("[data-moment-video]");
    if (!vids.length) return;
    const load = (v) => { if (!v.src && v.dataset.src) v.src = v.dataset.src; };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const v = en.target;
        const fig = v.closest(".moment");
        if (en.isIntersecting && !reduceMotion) {
          load(v);
          v.play().then(() => fig.classList.add("is-playing")).catch(() => {});
        } else {
          v.pause();
          fig.classList.remove("is-playing");
        }
      });
    }, { threshold: 0.75 });
    vids.forEach((v) => io.observe(v));
  }

  // ------------------------------------------------------------------ search
  function setupSearch() {
    const overlay = $("[data-search]");
    if (!overlay) return;
    const input = $("[data-search-input]", overlay);
    const results = $("[data-search-results]", overlay);
    const suggest = $("[data-search-suggest]", overlay);
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-search-open]")) { e.preventDefault(); openLayer(overlay, { initialFocus: input }); catalog(); }
      if (e.target.closest("[data-search-close]")) closeLayer(overlay);
    });
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const q = input.value.trim().toLowerCase();
        if (q.length < 2) { results.innerHTML = ""; suggest.hidden = false; return; }
        const words = q.split(/\s+/);
        const hits = (await catalog()).filter((p) => {
          const hay = `${p.name} ${p.subtitle} ${p.categoryLabel} ${p.tags.join(" ")} ${p.metals.join(" ")} ${p.stones.join(" ")} ${p.summary}`.toLowerCase().replace(/-/g, " ");
          return words.every((w) => hay.includes(w));
        });
        suggest.hidden = hits.length > 0;
        results.innerHTML = hits.length
          ? `<p class="search__label">${hits.length} ${hits.length === 1 ? "piece" : "pieces"}</p><div class="grid">${hits.slice(0, 8).map(cardHtml).join("")}</div>${hits.length > 8 ? `<p style="text-align:center;margin-top:24px"><a class="link-arrow" href="/shop/?q=${encodeURIComponent(input.value)}">See all results</a></p>` : ""}`
          : `<p class="search__empty">No pieces match “${esc(input.value)}”. Try “ring”, “tennis” or “yellow diamond” — or <a href="${esc(S.studio)}" style="text-decoration:underline">design it yourself</a>.</p>`;
        syncWish();
      }, 120);
    });
  }

  // ------------------------------------------------------------------ forms
  async function submitForm(form) {
    const status = $("[data-form-status]", form);
    const btn = $('[type="submit"]', form);
    btn?.classList.add("is-busy");
    if (status) { status.textContent = "Sending…"; status.className = "form-status"; }
    try {
      const data = new FormData(form);
      const hasFile = [...data.values()].some((v) => v instanceof File && v.size);
      const res = await fetch(form.getAttribute("action") || "/", hasFile
        ? { method: "POST", body: data }
        : { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(data).toString() });
      if (!res.ok) throw new Error(String(res.status));
      if (status) { status.textContent = form.dataset.success || "Thank you — we'll be in touch shortly."; status.className = "form-status is-success"; }
      return true;
    } catch {
      if (status) { status.textContent = "Sorry, that didn't send. Please try again or email us directly."; status.className = "form-status is-error"; }
      return false;
    } finally {
      btn?.classList.remove("is-busy");
    }
  }
  window.storeSubmitForm = submitForm;
  window.storeValidate = validate;
  function setupForms() {
    $$("[data-ajax-form]").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!validate(form)) return;
        if (await submitForm(form)) {
          form.reset();
          const done = document.createElement("div");
          done.className = "form-done";
          done.innerHTML = `${ICON.check}<p>${esc(form.dataset.success || "Thank you!")}</p>`;
          if (!form.closest(".footer-news")) { form.hidden = true; form.after(done); }
        }
      });
    });
    // Prefill from URL: /pages/contact/?topic=sourcing&product=Name
    const params = new URLSearchParams(location.search);
    $$("[data-prefill]").forEach((el) => {
      const v = params.get(el.dataset.prefill);
      if (!v) return;
      el.value = v;
      if (el.dataset.prefill === "product") {
        const msg = $("textarea[name=message]", el.form);
        if (msg && !msg.value) msg.value = `I'm interested in ${v}. `;
      }
    });
  }

  // ---------------------------------------------------- Stripe order result
  async function setupOrderResult() {
    const box = $("[data-checkout-result]");
    const id = new URLSearchParams(location.search).get("session_id");
    if (!box || !id) return;
    cart = []; saveCart();
    try {
      const res = await fetch(`/.netlify/functions/checkout-session?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (res.ok && data.paymentStatus === "paid") {
        $("[data-checkout-title]", box).textContent = "Thank you — your order is confirmed.";
        $("[data-checkout-message]", box).textContent = `We've received your payment of ${data.amountLabel}${data.email ? ` and sent a receipt to ${data.email}` : ""}. We'll be in touch personally with next steps.`;
      }
    } catch { /* keep the generic thank-you */ }
  }

  // ------------------------------------------------------------------ reveal
  function setupReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) { $$("[data-reveal]").forEach((el) => el.classList.add("is-visible")); return; }
    const els = $$(".section .section-head, .editorial__item, .service, .price-tile, .studio-feature__content, .quote blockquote, .tiles__list > li");
    els.forEach((el, i) => { el.dataset.reveal = ""; el.style.transitionDelay = `${(i % 6) * 60}ms`; });
    els.push(...$$("[data-reveal]").filter((el) => !els.includes(el)));
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }

  // ------------------------------------------------------------------ boot
  function boot() {
    setupHeader();
    setupAnnouncements();
    setupDrawers();
    setupCart();
    setupWishlist();
    setupSearch();
    setupQuickView();
    setupTryOn();
    setupProductPage();
    setupCollection();
    setupRails();
    setupTabs();
    setupCardSwatches();
    setupMoments();
    setupForms();
    setupOrderResult();
    setupReveal();
    $$("[data-modal-close]").forEach((b) => b.closest(".modal") && !b.closest("[data-quick-modal]") && !b.closest("[data-enquire-modal]") && b.addEventListener("click", () => closeLayer(b.closest(".modal"))));
    // Close the enquiry modal via its close buttons on non-product pages too.
    $$("[data-enquire-modal]").forEach((m) => { if (!$("[data-pdp]")) m.addEventListener("click", (e) => { if (e.target.closest("[data-modal-close]")) closeLayer(m); }); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
