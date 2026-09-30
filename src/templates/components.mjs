// Reusable HTML pieces: icons, prices, product cards, tiles, section headers.
import { h, cx } from "../lib/util.mjs";

// ---------------------------------------------------------------- icons
const ICONS = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20Z"/>',
  bag: '<path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  menu: '<path d="M3.5 7h17M3.5 12h17M3.5 17h17"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronLeft: '<path d="m15 5-7 7 7 7"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  filter: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  truck: '<path d="M3 6.5h11v9H3zM14 10h4l3 3v2.5h-7"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/>',
  shield: '<path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6l-7-2.5Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  certificate: '<rect x="4" y="3.5" width="16" height="12" rx="1"/><path d="M8 8h8M8 11h5"/><circle cx="12" cy="18" r="2.5"/><path d="m10.5 20-1 2.5M13.5 20l1 2.5"/>',
  ring: '<circle cx="12" cy="14.5" r="6"/><path d="m9.5 8.7-1.3-2.4L10 4h4l1.8 2.3-1.3 2.4"/>',
  document: '<path d="M6.5 3.5h8l3 3v14h-11z"/><path d="M14.5 3.5v3h3M9 11h6M9 14.5h6M9 18h3.5"/>',
  diamond: '<path d="M6.5 4h11l3.5 5-9 11L3 9z"/><path d="M3 9h18M9.5 4 12 9l2.5-5M12 9v11"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="1"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  chat: '<path d="M4 5.5h16v10H9l-5 4z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="1"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
  tiktok: '<path d="M14 3.5v11.2a3.8 3.8 0 1 1-3.3-3.8"/><path d="M14 3.5c.4 2.6 2.2 4.4 5 4.6"/>',
  pinterest: '<circle cx="12" cy="12" r="8.5"/><path d="m10.5 20 2-8.5M10 13.5c-.8-2.6.8-5 3.2-5 2 0 3.2 1.4 3 3.3-.2 2.2-1.6 3.8-3.2 3.6-1-.1-1.5-.9-1.3-1.8"/>',
  whatsapp: '<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.2 18.4z"/><path d="M9.2 9c0 3 2.8 5.8 5.8 5.8l1.3-1.3-1.8-1-1 .8a4.3 4.3 0 0 1-2.8-2.8l.8-1-1-1.8z"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  pause: '<path d="M8 5.5v13M16 5.5v13"/>',
  zoom: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M11 8v6M8 11h6"/>',
  camera: '<path d="M4 8h3.2L9 5.5h6L16.8 8H20v11H4z"/><circle cx="12" cy="13.2" r="3.6"/>',
  cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.1"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.3-3.6 4.1-5.5 7.5-5.5s6.2 1.9 7.5 5.5"/>',
  location: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>'
};

export function icon(name, { size = 20, label = "", className = "" } = {}) {
  const body = ICONS[name] || ICONS.info;
  const a11y = label ? `role="img" aria-label="${h(label)}"` : 'aria-hidden="true"';
  return `<svg class="icon${className ? " " + className : ""}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${body}</svg>`;
}

// ---------------------------------------------------------------- price
export function priceText(p, ctx) {
  if (p.availability === "sold") return "Sold";
  if (p.priceLabel) return p.priceLabel;
  if (p.price === null) return "Price on request";
  const amount = ctx.money(p.price, p.currency);
  return p.priceFrom ? `From ${amount}` : amount;
}

export function priceHtml(p, ctx, { className = "price" } = {}) {
  const text = priceText(p, ctx);
  const compare = p.compareAtPrice && p.price !== null ? ` <s class="price__compare">${h(ctx.money(p.compareAtPrice, p.currency))}</s>` : "";
  const quiet = p.price === null || p.availability === "sold" ? " price--quiet" : "";
  return `<p class="${className}${quiet}" data-price-display>${h(text)}${compare}</p>`;
}

// ---------------------------------------------------------------- badges
export function badgeHtml(p) {
  if (!p.badge) return "";
  const tone = p.availability === "sold" ? " badge--sold" : /estate|rare/i.test(p.badge) ? " badge--estate" : "";
  return `<span class="badge${tone}">${h(p.badge)}</span>`;
}

// ---------------------------------------------------------------- card
const CARD_SIZES = "(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw";

export function productCard(p, ctx, { priority = false, headingLevel = 3, className = "" } = {}) {
  const primary = p.images[0];
  const hover = p.images[p.hoverImage] && p.hoverImage !== 0 ? p.images[p.hoverImage] : null;
  const metalOption = p.options.find((o) => o.type === "swatch");
  const swatches = metalOption
    ? metalOption.values
    : p.metals.map((m) => ({ label: ctx.vocab.metals[m]?.label, metal: m }));
  const swatchHtml = swatches.length > 1
    ? `<ul class="card__swatches" aria-label="Available in">${swatches.map((s, i) => {
        const image = s.image !== undefined ? p.images[s.image] : null;
        const data = image ? ` data-swatch-image="${h(ctx.images.url(image.src, 720))}"` : "";
        return `<li><button type="button" class="swatch${i === 0 ? " is-active" : ""}" style="--swatch:${h(ctx.vocab.metals[s.metal]?.swatch || "#ddd")}" aria-label="${h(s.label)}" title="${h(s.label)}"${data}></button></li>`;
      }).join("")}</ul>`
    : swatches.length === 1 ? `<p class="card__metal">${h(swatches[0].label || "")}</p>` : "";
  const tag = `h${headingLevel}`;
  const data = [
    `data-slug="${h(p.slug)}"`,
    `data-price="${p.price ?? ""}"`,
    `data-category="${h(p.category)}"`,
    `data-metals="${h(p.metals.join(" "))}"`,
    `data-stones="${h(p.stones.join(" "))}"`,
    `data-tags="${h([...p.tags, ...p.collections].join(" "))}"`,
    `data-availability="${h(p.availability)}"`,
    `data-sort="${p.sort}"`,
    `data-name="${h(p.name.toLowerCase())}"`
  ].join(" ");
  return `<article class="${cx("card", p.availability === "sold" && "card--sold", className)}" data-product-card ${data}>
  <div class="card__frame">
    <a class="card__media" href="${p.url}" tabindex="-1" aria-hidden="true">
      ${ctx.images.tag(primary.src, { alt: "", sizes: CARD_SIZES, className: "card__img", priority, widths: [360, 540, 720, 960] })}
      ${hover ? ctx.images.tag(hover.src, { alt: "", sizes: CARD_SIZES, className: "card__img card__img--hover", widths: [360, 540, 720, 960] }) : ""}
    </a>
    ${badgeHtml(p)}
    <button type="button" class="card__wish" data-wish="${h(p.slug)}" aria-pressed="false" aria-label="Save ${h(p.name)} to wishlist">${icon("heart", { size: 20 })}</button>
    <button type="button" class="card__quick" data-quick-view="${h(p.slug)}" aria-label="Quick view ${h(p.name)}">Quick view</button>
  </div>
  <div class="card__body">
    <${tag} class="card__title"><a href="${p.url}">${h(p.name)}</a></${tag}>
    ${priceHtml(p, ctx, { className: "card__price" })}
    ${swatchHtml}
  </div>
</article>`;
}

// ---------------------------------------------------------------- tiles
export function categoryTiles(handles, ctx, { current = "", title = "" } = {}) {
  const items = handles.map((hdl) => ctx.byHandle[hdl]).filter(Boolean);
  if (!items.length) return "";
  return `<nav class="tiles" aria-label="${h(title || "Browse categories")}">
  <ul class="tiles__list" style="--tile-cols:${items.length <= 6 ? items.length : Math.ceil(items.length / 2)}">
    ${items.map((c) => `<li><a class="${cx("tile", c.handle === current && "is-current")}" href="${c.path}"${c.handle === current ? ' aria-current="page"' : ""}>
      <span class="tile__media">${ctx.images.tag(c.image || c.products[0]?.images[0]?.src, { alt: "", sizes: "(max-width: 700px) 38vw, 16vw", widths: [360, 540, 720] })}</span>
      <span class="tile__label">${h(c.tileLabel)}</span>
    </a></li>`).join("\n    ")}
  </ul>
</nav>`;
}

export function sectionHead({ eyebrow = "", title = "", text = "", cta = null, align = "center", id = "" }) {
  if (!title && !eyebrow) return "";
  return `<header class="section-head section-head--${align}">
  ${eyebrow ? `<p class="eyebrow">${h(eyebrow)}</p>` : ""}
  ${title ? `<h2 class="section-title"${id ? ` id="${id}"` : ""}>${h(title)}</h2>` : ""}
  ${text ? `<p class="section-text">${h(text)}</p>` : ""}
  ${cta ? `<a class="link-arrow" href="${h(cta.href)}">${h(cta.label)} ${icon("arrowRight", { size: 16 })}</a>` : ""}
</header>`;
}

export function button(label, href, { style = "solid", className = "", attrs = "" } = {}) {
  return `<a class="${cx("btn", `btn--${style}`, className)}" href="${h(href)}"${attrs ? " " + attrs : ""}>${h(label)}</a>`;
}

export function breadcrumbs(items) {
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items
    .map((item, i) => (i === items.length - 1 ? `<li aria-current="page">${h(item.label)}</li>` : `<li><a href="${h(item.href)}">${h(item.label)}</a></li>`))
    .join("")}</ol></nav>`;
}

export function carousel(items, { label = "Products", className = "" } = {}) {
  return `<div class="${cx("rail", className)}" data-rail>
  <div class="rail__track" data-rail-track role="list" aria-label="${h(label)}">${items.map((item) => `<div class="rail__item" role="listitem">${item}</div>`).join("")}</div>
  <div class="rail__controls">
    <button type="button" class="rail__btn" data-rail-prev aria-label="Previous">${icon("chevronLeft", { size: 18 })}</button>
    <button type="button" class="rail__btn" data-rail-next aria-label="Next">${icon("chevronRight", { size: 18 })}</button>
  </div>
</div>`;
}

export function trustStrip(ctx) {
  const items = ctx.site.trust || [];
  if (!items.length) return "";
  return `<section class="trust" aria-label="Our promise">
  <ul class="wrap trust__list">
    ${items.map((t) => `<li class="trust__item">${icon(t.icon, { size: 26 })}<div><strong>${h(t.title)}</strong><span>${h(t.text)}</span></div></li>`).join("\n    ")}
  </ul>
</section>`;
}
