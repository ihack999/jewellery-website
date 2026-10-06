// Collection / shop page (Ring Concierge-style layout: title, category tiles,
// horizontal filter bar, 4-up grid, editorial tile, load more).
import { h, absoluteUrl } from "../lib/util.mjs";
import { icon, productCard, categoryTiles, breadcrumbs } from "./components.mjs";

const PAGE_SIZE = 12;

function group(id, label, options, { type = "checkbox" } = {}) {
  if (options.length < 2) return "";
  return `<div class="filter" data-filter-group="${id}">
  <button type="button" class="filter__btn" aria-expanded="false" data-filter-toggle>${h(label)} <span class="filter__count" data-filter-count></span>${icon("chevronDown", { size: 14 })}</button>
  <div class="filter__panel" data-filter-panel hidden>
    <fieldset>
      <legend class="visually-hidden">${h(label)}</legend>
      ${options.map((o) => `<label class="check">
        <input type="${type}" name="${id}" value="${h(o.value)}">
        ${o.swatch ? `<span class="swatch swatch--static" style="--swatch:${h(o.swatch)}"></span>` : ""}
        <span>${h(o.label)}</span><span class="check__count">${o.count}</span>
      </label>`).join("")}
    </fieldset>
  </div>
</div>`;
}

function filterOptions(c, ctx) {
  const list = c.products;
  const count = (fn) => list.filter(fn).length;
  const v = ctx.vocab;
  const categories = Object.entries(v.categories).map(([value, label]) => ({ value, label, count: count((p) => p.category === value) })).filter((o) => o.count);
  const metals = Object.entries(v.metals).map(([value, m]) => ({ value, label: m.label, swatch: m.swatch, count: count((p) => p.metals.includes(value)) })).filter((o) => o.count);
  const stones = Object.entries(v.stones).map(([value, label]) => ({ value, label, count: count((p) => p.stones.includes(value)) })).filter((o) => o.count && o.value !== "none");
  const availability = Object.entries(v.availability).map(([value, label]) => ({ value, label, count: count((p) => p.availability === value) })).filter((o) => o.count);
  const prices = v.priceRanges.map((r) => ({ value: `${r.min}-${r.max ?? ""}`, label: r.label, count: count((p) => p.price !== null && p.price >= r.min && (r.max === null || p.price < r.max)) })).filter((o) => o.count);
  const onRequest = count((p) => p.price === null && p.availability !== "sold");
  if (onRequest) prices.push({ value: "request", label: "Price on request", count: onRequest });
  return { categories, metals, stones, availability, prices };
}

export function renderCollection(c, ctx) {
  const f = filterOptions(c, ctx);
  const promo = c.promo;
  const cards = c.products.map((p, i) => productCard(p, ctx, { priority: i < 4 }));
  if (promo && c.products.length > (promo.after || 6)) {
    cards.splice(promo.after || 6, 0, `<a class="promo-tile" href="${h(promo.href)}" data-promo-tile>
      ${ctx.images.tag(promo.image, { alt: "", sizes: "(max-width: 700px) 100vw, 50vw", className: "promo-tile__img" })}
      <span class="promo-tile__content">
        <span class="promo-tile__title">${h(promo.title)}</span>
        <span class="promo-tile__text">${h(promo.text)}</span>
        <span class="btn btn--light">${h(promo.cta)}</span>
      </span>
    </a>`);
  }
  const crumbs = [{ label: "Home", href: "/" }];
  if (c.parent) crumbs.push(c.parent);
  else if (c.handle !== "all") crumbs.push({ label: "Jewellery", href: ctx.byHandle.all?.path || "/shop/" });
  crumbs.push({ label: c.title });

  const body = `<section class="collection-head wrap">
  <h1 class="collection-title">${h(c.title)}</h1>
  ${c.description ? `<p class="collection-desc">${h(c.description)}</p>` : ""}
  ${c.steps?.length ? `<ol class="collection-steps">${c.steps.map((st, i) => `<li><span class="collection-steps__num">${String(i + 1).padStart(2, "0")}</span><strong>${h(st.title)}</strong>${st.text ? `<p>${h(st.text)}</p>` : ""}</li>`).join("")}</ol>` : ""}
  ${c.links?.length ? `<p class="collection-links">${c.links.map((l) => `<a class="link-arrow" href="${h(l.href)}">${h(l.label)} ${icon("arrowRight", { size: 14 })}</a>`).join("")}</p>` : ""}
</section>
<div class="wrap">${categoryTiles(c.tiles.filter((t) => ctx.byHandle[t]), ctx, { current: c.handle })}</div>
<div class="wrap">${breadcrumbs(crumbs)}</div>

<div class="collection" data-collection data-page-size="${PAGE_SIZE}">
  <div class="toolbar" data-toolbar>
    <div class="wrap toolbar__inner">
      <button type="button" class="toolbar__mobile" data-filters-open aria-controls="filters-${c.handle}">${icon("filter", { size: 18 })} Filter &amp; sort <span data-active-count></span></button>
      <form class="filters" id="filters-${c.handle}" data-filters aria-label="Filter products">
        <div class="filters__head">
          <p class="filters__title">Filter &amp; sort</p>
          <button type="button" class="icon-btn" data-filters-close aria-label="Close filters">${icon("close")}</button>
        </div>
        <div class="filters__groups">
          ${group("category", "Category", f.categories)}
          ${group("price", "Price", f.prices)}
          ${group("metal", "Metal", f.metals)}
          ${group("stone", "Stone", f.stones)}
          ${group("availability", "Availability", f.availability)}
          <div class="filter filter--sort" data-filter-group="sort">
            <button type="button" class="filter__btn" aria-expanded="false" data-filter-toggle>Sort <span class="filter__count" data-sort-label></span>${icon("chevronDown", { size: 14 })}</button>
            <div class="filter__panel" data-filter-panel hidden>
              <fieldset><legend class="visually-hidden">Sort by</legend>
                ${[["featured", "Featured"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["name", "Name A–Z"]].map(([v, l], i) => `<label class="check check--radio"><input type="radio" name="sort" value="${v}"${i === 0 ? " checked" : ""}><span>${l}</span></label>`).join("")}
              </fieldset>
            </div>
          </div>
        </div>
        <div class="filters__foot">
          <button type="button" class="btn btn--ghost" data-filters-clear>Clear all</button>
          <button type="button" class="btn btn--solid" data-filters-close>Show <span data-result-number>${c.products.length}</span> pieces</button>
        </div>
      </form>
      <p class="toolbar__count"><span data-result-number>${c.products.length}</span> ${c.products.length === 1 ? "piece" : "pieces"}</p>
    </div>
    <div class="wrap active-filters" data-active-filters hidden></div>
  </div>
  <div class="filters-scrim" data-filters-close hidden></div>

  <div class="wrap">
    <div class="grid" data-grid>
      ${cards.join("\n")}
    </div>
    <div class="grid-empty" data-grid-empty hidden>
      <p class="grid-empty__title">Nothing matches — yet.</p>
      <p>Try removing a filter, or design exactly what you have in mind.</p>
      <div class="grid-empty__actions"><button type="button" class="btn btn--ghost" data-filters-clear>Clear filters</button><a class="btn btn--solid" href="${h(ctx.site.studio?.path || "/design-studio/")}">Open the Design Studio</a></div>
    </div>
    <div class="load-more" data-load-more hidden>
      <p class="load-more__text">Showing <span data-shown></span> of <span data-total></span></p>
      <div class="load-more__bar"><span data-progress></span></div>
      <button type="button" class="btn btn--ghost" data-load-more-btn>Load more</button>
    </div>
  </div>
</div>
${c.seoText ? `<section class="section wrap wrap--narrow prose collection-seo">${c.seoText}</section>` : ""}`;

  const b = ctx.site.brand;
  return {
    path: c.path,
    title: c.seoTitle || `${c.title}${c.handle === "all" ? "" : " | Fine Jewellery"}`,
    description: c.seoDescription || c.description,
    ogImage: c.image,
    bodyClass: "page--collection",
    body,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: c.title,
        url: absoluteUrl(b.url, c.path),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: c.products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(b.url, p.url), name: p.name }))
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((cr, i) => ({ "@type": "ListItem", position: i + 1, name: cr.label, item: absoluteUrl(b.url, cr.href || c.path) }))
      }
    ]
  };
}
