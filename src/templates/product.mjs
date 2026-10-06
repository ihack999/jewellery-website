// Product detail page.
import { h, cx, paragraphs, absoluteUrl } from "../lib/util.mjs";
import { icon, priceHtml, badgeHtml, breadcrumbs, productCard, carousel } from "./components.mjs";

/** Options can carry a `step` title ("Choose your stone") — they are then shown as
 *  numbered steps, the simple bridal flow: stone → carat → ring size. */
export function optionFields(p, ctx) {
  let stepNo = 0;
  return p.options.map((o) => {
    const html = optionField(p, o, ctx);
    if (!o.step) return html;
    stepNo += 1;
    return `<div class="option-step"><p class="option-step__head"><span class="option-step__num">${String(stepNo).padStart(2, "0")}</span>${h(o.step)}</p>${html}</div>`;
  }).join("\n");
}

function optionField(p, o, ctx) {
  {
    const id = `opt-${p.slug}-${o.id}`;
    if (o.type === "text") {
      return `<div class="option">
  <label class="option__label" for="${id}">${h(o.name)}${o.required ? "" : ' <span class="optional">(optional)</span>'}</label>
  <input class="option__input" id="${id}" name="${h(o.name)}" type="text" ${o.maxLength ? `maxlength="${o.maxLength}"` : ""} placeholder="${h(o.placeholder || "")}"${o.required ? " required" : ""} data-option data-option-text${o.uppercase ? " data-uppercase" : ""} autocomplete="off">
  ${o.help ? `<p class="option__help">${h(o.help)}</p>` : ""}
</div>`;
    }
    if (o.type === "size") {
      return `<div class="option">
  <div class="option__row"><label class="option__label" for="${id}">${h(o.name)}</label>${p.category === "rings" ? `<a class="option__aside" href="/pages/contact/?topic=sizing">Size guide</a>` : ""}</div>
  <div class="select"><select id="${id}" name="${h(o.name)}"${o.required ? " required" : ""} data-option>
    <option value="">Select ${h(o.name.toLowerCase())}</option>
    ${o.values.map((v) => `<option value="${h(v.value)}">${h(v.label)}</option>`).join("")}
  </select>${icon("chevronDown", { size: 14 })}</div>
</div>`;
    }
    const swatch = o.type === "swatch";
    return `<fieldset class="option" data-option-group>
  <legend class="option__label">${h(o.name)}: <span class="option__value" data-option-value>${h(o.values[0].label)}</span></legend>
  <div class="${swatch ? "option__swatches" : "option__buttons"}">
    ${o.values.map((v, i) => {
      const data = [
        v.add ? `data-add="${v.add}"` : "",
        v.inquire ? "data-inquire" : "",
        v.image !== undefined ? `data-image="${v.image}"` : "",
        STUDIO_METALS[v.metal] ? `data-studio-metal="${h(STUDIO_METALS[v.metal])}"` : ""
      ].filter(Boolean).join(" ");
      return `<label class="${swatch ? "swatch-choice" : "pill"}"${swatch ? ` title="${h(v.label)}"` : ""}>
        <input type="radio" name="${h(o.name)}" value="${h(v.value)}"${i === 0 ? " checked" : ""} data-option ${data}>
        ${swatch ? `<span class="swatch swatch--lg" style="--swatch:${h(ctx.vocab.metals[v.metal]?.swatch || v.swatch || "#ddd")}"></span><span class="visually-hidden">${h(v.label)}</span>` : `<span>${h(v.label)}${v.add ? ` <small>+${h(ctx.money(v.add, p.currency))}</small>` : ""}</span>`}
      </label>`;
    }).join("")}
  </div>
</fieldset>`;
  }
}

/** "Our Promise To You" (store/site.json → promise), shown on the categories it lists. */
function promiseBlock(p, ctx) {
  const pr = ctx.site.promise;
  if (!pr || (pr.categories && !pr.categories.includes(p.category))) return "";
  const rp = ctx.site.returnsPolicy;
  return `<section class="promise" aria-labelledby="promise-title">
  <h2 class="promise__title" id="promise-title">${h(pr.title || "Our promise to you")}</h2>
  ${pr.text ? `<p class="promise__text">${h(pr.text)}</p>` : ""}
  ${pr.items?.length ? `<p class="promise__lead">${h(pr.includedTitle || "Included with every purchase:")}</p>
  <ul class="promise__list">${pr.items.map((item) => `<li>${icon(item.icon || "check", { size: 16 })}<span>${h(item.text || item)}</span></li>`).join("")}</ul>` : ""}
  ${pr.note ? `<p class="promise__note">${h(pr.note)}</p>` : ""}
  ${rp?.text ? `<div class="promise__policy"><p class="promise__policy-title">${h(rp.title || "Refund policy")}</p><p>${h(rp.text)}</p></div>` : ""}
</section>`;
}

export function studioHref(p, ctx) {
  if (!p.studio || !ctx.site.studio?.enabled) return "";
  const params = new URLSearchParams(p.studio === true ? {} : p.studio);
  const q = params.toString();
  return `${ctx.site.studio.path}${q ? `?${q}` : ""}#design-studio`;
}

// Store metal keys (store/site.json vocab) → names the 3D studio / try-on understands.
export const STUDIO_METALS = { "yellow-gold": "Yellow Gold", "white-gold": "White Gold", "rose-gold": "Rose Gold", "platinum": "Platinum" };

/** Live AR try-on link for any product with a `studio` recipe: opens the studio straight into the camera. */
export function tryOnHref(p, ctx) {
  if (!p.studio || !ctx.site.studio?.enabled) return "";
  const params = new URLSearchParams(p.studio === true ? {} : p.studio);
  const metal = tryOnMetals(p)[0];
  if (!params.get("metal") && metal) params.set("metal", metal);
  params.set("tryon", "1");
  params.set("product", p.slug);
  return `${ctx.site.studio.path}?${params}#design-studio`;
}

/** Metals the try-on offers for this product (only the ones it's actually made in). */
export function tryOnMetals(p) {
  const list = (p.metals || []).map((m) => STUDIO_METALS[m]).filter(Boolean);
  return [...new Set(list)];
}

function gallery(p, ctx) {
  const items = p.images.map((img, i) => `<figure class="gallery__item${i === 0 ? " gallery__item--lead" : ""}" data-gallery-item data-index="${i}">
    <button type="button" class="gallery__zoom" data-zoom="${i}" aria-label="Zoom image ${i + 1} of ${p.images.length}">
      ${ctx.images.tag(img.src, { alt: img.alt, sizes: i === 0 ? "(max-width: 900px) 100vw, 58vw" : "(max-width: 900px) 100vw, 29vw", priority: i === 0, loading: i < 3 ? "eager" : "lazy", widths: [540, 720, 960, 1280, 1600] })}
    </button>
    ${img.note ? `<figcaption class="gallery__note">${h(img.note)}</figcaption>` : ""}
  </figure>`);
  const videos = p.videos.map((v) => `<figure class="gallery__item gallery__item--video" data-gallery-item>
    <video controls muted playsinline preload="none"${v.poster ? ` poster="${h(ctx.images.url(v.poster, 720))}"` : ""}><source src="${h(v.src)}" type="video/mp4"></video>
    ${v.label ? `<figcaption class="gallery__note">${h(v.label)}</figcaption>` : ""}
  </figure>`);
  const all = [...items, ...videos];
  const tryon = tryOnHref(p, ctx);
  return `<div class="gallery" data-gallery>
  ${tryon ? `<a class="gallery__tryon" href="${h(tryon)}" data-tryon>${icon("camera", { size: 16 })}<span>Try it on</span></a>` : ""}
  <div class="gallery__track" data-gallery-track>${all.join("")}</div>
  <div class="gallery__dots" aria-hidden="true">${all.map((_, i) => `<span class="gallery__dot${i === 0 ? " is-active" : ""}"></span>`).join("")}</div>
  <p class="gallery__counter" aria-hidden="true"><span data-gallery-current>1</span> / ${all.length}</p>
</div>`;
}

function related(p, ctx) {
  let list = (p.related || []).map((slug) => ctx.products.find((x) => x.slug === slug)).filter(Boolean);
  if (list.length < 8) {
    const score = (x) => (x.category === p.category ? 3 : 0) + x.tags.filter((t) => p.tags.includes(t)).length + (x.availability === "sold" ? -5 : 0);
    const extra = ctx.products.filter((x) => x !== p && !list.includes(x)).sort((a, b) => score(b) - score(a) || a.sort - b.sort);
    list = [...list, ...extra].slice(0, 8);
  }
  return list;
}

export function renderProduct(p, ctx) {
  const category = ctx.vocab.categories[p.category];
  const categoryCollection = ctx.collections.find((c) => c.match.category === p.category && Object.keys(c.match).length === 1);
  const crumbs = [{ label: "Home", href: "/" }, { label: category, href: categoryCollection?.path || "/shop/" }, { label: p.name }];
  const studio = studioHref(p, ctx);
  const inquireOnly = !p.purchasable;
  const sold = p.availability === "sold";
  const c = ctx.site.contact || {};
  const whatsappText = encodeURIComponent(`Hello ${ctx.site.brand.name}, I have a question about ${p.name}.`);
  const details = Object.entries(p.details || {});
  const availabilityLabel = ctx.vocab.availability[p.availability] || "";

  const primaryAction = sold
    ? `<a class="btn btn--solid btn--block" href="/pages/contact/?topic=sourcing&product=${encodeURIComponent(p.name)}">Find me something similar</a>`
    : `<button type="submit" class="btn btn--solid btn--block" data-add-to-bag${inquireOnly ? " hidden" : ""}>Add to bag</button>
       <button type="button" class="btn btn--${inquireOnly ? "solid" : "ghost"} btn--block" data-enquire${inquireOnly ? "" : " hidden"}>${p.availability === "one-of-a-kind" ? "Request a private viewing" : "Enquire about this piece"}</button>`;

  const body = `<div class="wrap">${breadcrumbs(crumbs)}</div>
<article class="wrap pdp" data-pdp data-slug="${h(p.slug)}">
  <div class="pdp__gallery">${gallery(p, ctx)}</div>
  <div class="pdp__info">
    <div class="pdp__sticky">
      <p class="pdp__meta">${badgeHtml(p)}${availabilityLabel && availabilityLabel.toLowerCase() !== String(p.badge || "").toLowerCase() ? `<span>${h(availabilityLabel)}</span>` : ""}</p>
      <h1 class="pdp__title">${h(p.name)}</h1>
      ${p.subtitle ? `<p class="pdp__subtitle">${h(p.subtitle)}</p>` : ""}
      ${priceHtml(p, ctx, { className: "pdp__price" })}
      ${p.summary ? `<p class="pdp__summary">${h(p.summary)}</p>` : ""}
      <form class="pdp__form" data-product-form novalidate>
        ${optionFields(p, ctx)}
        <p class="pdp__inquire-note" data-inquire-note hidden>${icon("info", { size: 16 })} This option is quoted personally — send an enquiry and we'll reply with pricing.</p>
        <div class="pdp__actions">
          ${primaryAction}
          <button type="button" class="pdp__wish" data-wish="${h(p.slug)}" aria-pressed="false" aria-label="Save to wishlist">${icon("heart", { size: 22 })}</button>
        </div>
        <p class="form-status" data-form-status role="status"></p>
      </form>
      ${tryOnHref(p, ctx) ? `<a class="btn btn--ghost btn--block pdp__tryon" href="${h(tryOnHref(p, ctx))}" data-tryon>${icon("camera", { size: 18 })} Try it on with your camera</a>` : ""}
      ${studio ? `<a class="studio-cta" href="${h(studio)}">
        <span class="studio-cta__icon">${icon("cube", { size: 22 })}</span>
        <span><strong>Make it yours in 3D</strong><span>Open this design in the Design Studio and change the metal, stone or setting.</span></span>
        ${icon("arrowRight", { size: 18 })}
      </a>` : ""}
      ${promiseBlock(p, ctx) || `<ul class="promises">${(ctx.site.productPromises || []).filter((pr) => !(pr.excludeCategories || []).includes(p.category) && (!pr.categories || pr.categories.includes(p.category))).map((pr) => `<li>${icon(pr.icon, { size: 18 })}<span>${h(pr.text)}</span></li>`).join("")}</ul>`}
      <div class="pdp__help">
        <span>Questions?</span>
        <a href="/pages/contact/?product=${encodeURIComponent(p.name)}">${icon("calendar", { size: 16 })} Book an appointment</a>
        ${c.whatsapp ? `<a href="https://wa.me/${h(c.whatsapp)}?text=${whatsappText}" target="_blank" rel="noopener">${icon("whatsapp", { size: 16 })} WhatsApp</a>` : ""}
      </div>
      <div class="accordions">
        <details class="accordion" open>
          <summary>Description ${icon("plus", { size: 16 })}</summary>
          <div class="accordion__body prose">${paragraphs(p.description || p.summary)}</div>
        </details>
        ${details.length ? `<details class="accordion">
          <summary>Details ${icon("plus", { size: 16 })}</summary>
          <div class="accordion__body"><dl class="specs">${details.map(([k, v]) => `<div><dt>${h(k)}</dt><dd>${h(v)}</dd></div>`).join("")}</dl></div>
        </details>` : ""}
        ${p.care ? `<details class="accordion">
          <summary>Care ${icon("plus", { size: 16 })}</summary>
          <div class="accordion__body prose">${paragraphs(p.care)}<p><a href="/pages/jewellery-care/">Read the full care guide</a></p></div>
        </details>` : ""}
        <details class="accordion">
          <summary>Ordering, shipping &amp; returns ${icon("plus", { size: 16 })}</summary>
          <div class="accordion__body prose">${paragraphs(p.shipping || "")}${paragraphs(ctx.site.checkout?.requestNote || "")}${ctx.site.returnsPolicy?.text ? `<p><strong>${h(ctx.site.returnsPolicy.title || "Refund policy")}.</strong> ${h(ctx.site.returnsPolicy.text)}</p>` : ""}<p><a href="/pages/shipping-returns/">Shipping &amp; returns policy</a></p></div>
        </details>
      </div>
    </div>
  </div>
</article>

<div class="sticky-atc" data-sticky-atc hidden>
  <div class="sticky-atc__info">
    ${ctx.images.tag(p.images[0].src, { alt: "", sizes: "48px", widths: [360] })}
    <div><p class="sticky-atc__name">${h(p.name)}</p>${priceHtml(p, ctx, { className: "sticky-atc__price" })}</div>
  </div>
  <button type="button" class="btn btn--solid" data-sticky-action>${sold ? "Find similar" : inquireOnly ? "Enquire" : "Add to bag"}</button>
</div>

<section class="section">
  <div class="wrap">
    <header class="section-head section-head--left"><h2 class="section-title">You may also like</h2></header>
    ${carousel(related(p, ctx).map((x) => productCard(x, ctx)), { label: "You may also like" })}
  </div>
</section>

<section class="section section--tight" data-recent hidden>
  <div class="wrap">
    <header class="section-head section-head--left"><h2 class="section-title">Recently viewed</h2></header>
    <div class="rail" data-rail><div class="rail__track" data-rail-track data-recent-track role="list" aria-label="Recently viewed"></div></div>
  </div>
</section>

${p.collections.length ? `<section class="section section--tight">
  <div class="wrap related-chips">
    <p class="eyebrow">Shop related</p>
    <ul>${p.collections.map((hdl) => ctx.byHandle[hdl]).filter(Boolean).map((col) => `<li><a class="chip" href="${col.path}">${h(col.title)}</a></li>`).join("")}</ul>
  </div>
</section>` : ""}

<div class="modal modal--form" data-enquire-modal hidden>
  <div class="modal__scrim" data-modal-close></div>
  <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="enq-title" tabindex="-1">
    <button type="button" class="icon-btn modal__close" data-modal-close aria-label="Close">${icon("close")}</button>
    <div class="modal__body enquire">
      <div class="enquire__product">${ctx.images.tag(p.images[0].src, { alt: "", sizes: "96px", widths: [360] })}<div><p class="eyebrow">Enquiry</p><h2 id="enq-title">${h(p.name)}</h2></div></div>
      <form name="product-inquiry" method="POST" data-netlify="true" netlify-honeypot="company" data-ajax-form data-success="Thank you — we'll be in touch personally, usually within one business day.">
        <input type="hidden" name="form-name" value="product-inquiry">
        <input type="hidden" name="product" value="${h(p.name)}">
        <input type="hidden" name="product-url" value="${h(absoluteUrl(ctx.site.brand.url, p.url))}">
        <input type="hidden" name="selected-options" data-enquire-options>
        <p class="visually-hidden"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></p>
        <div class="field"><label for="enq-name">Full name</label><input id="enq-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="enq-email">Email</label><input id="enq-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="enq-phone">Phone <span class="optional">(optional)</span></label><input id="enq-phone" name="phone" type="tel" autocomplete="tel"></div>
        <div class="field"><label for="enq-msg">Message</label><textarea id="enq-msg" name="message" rows="4" placeholder="Sizing, timing, viewing an estate piece, natural vs lab-grown…"></textarea></div>
        <label class="check"><input type="checkbox" name="wants-appointment" value="yes"><span>I'd like to book a private appointment</span></label>
        <button class="btn btn--solid btn--block" type="submit">Send enquiry</button>
        <p class="form-status" data-form-status role="status"></p>
      </form>
    </div>
  </div>
</div>

<div class="lightbox" data-lightbox hidden>
  <button type="button" class="icon-btn lightbox__close" data-lightbox-close aria-label="Close">${icon("close", { size: 24 })}</button>
  <button type="button" class="icon-btn lightbox__nav lightbox__nav--prev" data-lightbox-prev aria-label="Previous image">${icon("chevronLeft", { size: 28 })}</button>
  <figure class="lightbox__figure"><img data-lightbox-img alt=""></figure>
  <button type="button" class="icon-btn lightbox__nav lightbox__nav--next" data-lightbox-next aria-label="Next image">${icon("chevronRight", { size: 28 })}</button>
  <template data-lightbox-sources>${JSON.stringify(p.images.map((img) => ({ src: ctx.images.url(img.src, 1600), alt: img.alt })))}</template>
</div>`;

  const b = ctx.site.brand;
  const offers = p.price !== null ? {
    "@type": "Offer",
    url: absoluteUrl(b.url, p.url),
    priceCurrency: p.currency,
    price: p.price,
    availability: sold ? "https://schema.org/SoldOut" : p.availability === "ready" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
    itemCondition: p.tags.includes("estate") ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition"
  } : undefined;
  return {
    path: p.url,
    title: p.seo?.title || `${p.name}${p.subtitle ? ` — ${p.subtitle}` : ""}`,
    description: p.seo?.description || p.summary,
    ogImage: p.images[0].src,
    ogType: "product",
    bodyClass: "page--product",
    body,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        description: p.summary,
        sku: p.slug,
        brand: { "@type": "Brand", name: p.subtitle && p.category === "watches" ? p.subtitle : b.name },
        category: category,
        image: p.images.slice(0, 4).map((img) => absoluteUrl(b.url, ctx.images.url(img.src, 1280))),
        url: absoluteUrl(b.url, p.url),
        ...(offers ? { offers } : {})
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((cr, i) => ({ "@type": "ListItem", position: i + 1, name: cr.label, item: absoluteUrl(b.url, cr.href || p.url) }))
      }
    ]
  };
}
