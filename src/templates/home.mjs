// Homepage: renders the ordered sections from store/home.json.
import { h, cx } from "../lib/util.mjs";
import { icon, productCard, categoryTiles, sectionHead, button, carousel } from "./components.mjs";

const sections = {
  hero(s, ctx) {
    const imgs = s.images || [];
    return `<section class="hero${imgs.length > 1 ? " hero--split" : ""}">
  <div class="hero__media">
    ${imgs.map((img, i) => `<div class="hero__frame${i > 0 ? " hero__frame--secondary" : ""}">${ctx.images.tag(img.src, { alt: img.alt || "", sizes: imgs.length > 1 ? "(max-width: 800px) 100vw, 50vw" : "100vw", priority: i === 0, loading: i === 0 ? "eager" : "lazy", attrs: img.position ? `style="object-position:${h(img.position)}"` : "" })}</div>`).join("")}
  </div>
  <div class="hero__content">
    ${s.eyebrow ? `<p class="eyebrow eyebrow--light">${h(s.eyebrow)}</p>` : ""}
    <h1 class="hero__title">${h(s.title)}</h1>
    ${s.text ? `<p class="hero__text">${h(s.text)}</p>` : ""}
    <div class="hero__ctas">${(s.ctas || []).map((c) => button(c.label, c.href, { style: c.style === "ghost" ? "ghost-light" : "light" })).join("")}</div>
  </div>
</section>`;
  },

  categoryTiles(s, ctx) {
    return `<section class="section section--tight">
  <div class="wrap">
    ${sectionHead({ title: s.title })}
    ${categoryTiles(s.collections, ctx, { title: s.title })}
  </div>
</section>`;
  },

  productTabs(s, ctx, index) {
    const tabs = (s.tabs || []).map((t) => ({ ...t, c: ctx.byHandle[t.collection] })).filter((t) => t.c && t.c.products.length);
    return `<section class="section" data-tabs>
  <div class="wrap">
    ${sectionHead({ eyebrow: s.eyebrow, title: s.title })}
    <div class="tabs" role="tablist" aria-label="${h(s.title)}">
      ${tabs.map((t, i) => `<button type="button" role="tab" class="tab${i === 0 ? " is-active" : ""}" id="tab-${index}-${i}" aria-controls="panel-${index}-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${h(t.label)}</button>`).join("")}
    </div>
    ${tabs.map((t, i) => `<div class="tab-panel" role="tabpanel" id="panel-${index}-${i}" aria-labelledby="tab-${index}-${i}"${i === 0 ? "" : " hidden"}>
      ${carousel(t.c.products.slice(0, 10).map((p) => productCard(p, ctx)), { label: t.label })}
      <p class="tab-panel__more"><a class="link-arrow" href="${t.c.path}">Shop ${h(t.c.title)} ${icon("arrowRight", { size: 16 })}</a></p>
    </div>`).join("")}
  </div>
</section>`;
  },

  productRow(s, ctx) {
    const c = ctx.byHandle[s.collection];
    if (!c) return "";
    return `<section class="section">
  <div class="wrap">
    ${sectionHead({ eyebrow: s.eyebrow, title: s.title || c.title, cta: { label: s.ctaLabel || "Shop all", href: c.path } })}
    ${carousel(c.products.slice(0, s.limit || 10).map((p) => productCard(p, ctx)), { label: s.title || c.title })}
  </div>
</section>`;
  },

  studioFeature(s, ctx) {
    const image = s.image && ctx.images.info(s.image) ? s.image : s.fallbackImage;
    return `<section class="studio-feature">
  <div class="studio-feature__media">
    ${ctx.images.tag(image, { alt: "The 3D Design Studio showing a custom ring", sizes: "(max-width: 900px) 100vw, 55vw" })}
    <span class="studio-feature__badge">${icon("cube", { size: 16 })} Live 3D</span>
  </div>
  <div class="studio-feature__content">
    <p class="eyebrow eyebrow--light">${h(s.eyebrow)}</p>
    <h2 class="studio-feature__title">${h(s.title)}</h2>
    <p class="studio-feature__text">${h(s.text)}</p>
    <ol class="studio-feature__steps">${(s.steps || []).map((step, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span>${h(step)}</li>`).join("")}</ol>
    ${button(s.cta.label, s.cta.href, { style: "light" })}
  </div>
</section>`;
  },

  editorialSplit(s, ctx) {
    return `<section class="section">
  <div class="wrap editorial">
    ${(s.items || []).map((item) => `<a class="editorial__item" href="${h(item.cta?.href || "#")}">
      <span class="editorial__media">${ctx.images.tag(item.image, { alt: "", sizes: "(max-width: 800px) 100vw, 50vw" })}</span>
      <span class="editorial__content">
        <span class="eyebrow eyebrow--light">${h(item.eyebrow)}</span>
        <span class="editorial__title">${h(item.title)}</span>
        <span class="editorial__text">${h(item.text)}</span>
        ${item.cta ? `<span class="btn btn--light">${h(item.cta.label)}</span>` : ""}
      </span>
    </a>`).join("")}
  </div>
</section>`;
  },

  priceTiles(s, ctx) {
    return `<section class="section">
  <div class="wrap">
    ${sectionHead({ title: s.title })}
    <ul class="price-tiles">
      ${(s.items || []).map((t) => `<li><a class="price-tile" href="${h(t.href)}">
        <span class="price-tile__media">${ctx.images.tag(t.image, { alt: "", sizes: "(max-width: 700px) 100vw, 33vw", widths: [360, 540, 720, 960] })}</span>
        <span class="price-tile__text"><span class="price-tile__label">${h(t.label)}</span><span class="price-tile__amount">${h(t.amount)}</span>${t.sub ? `<span class="price-tile__sub">${h(t.sub)}</span>` : ""}</span>
      </a></li>`).join("")}
    </ul>
  </div>
</section>`;
  },

  clientMoments(s, ctx) {
    const items = (s.videos || []).map((v) => `<figure class="moment">
      <a class="moment__media" href="${h(v.href || "#")}" aria-label="${h(v.label)}">
        <video muted loop playsinline preload="none" ${v.poster ? `poster="${h(ctx.images.url(v.poster, 540))}"` : ""} data-src="${h(v.src)}" data-moment-video></video>
        <span class="moment__play" aria-hidden="true">${icon("play", { size: 14 })}</span>
      </a>
      <figcaption>${h(v.label)}</figcaption>
    </figure>`);
    return `<section class="section section--surface">
  <div class="wrap">
    ${sectionHead({ eyebrow: s.eyebrow, title: s.title, text: s.text })}
    ${carousel(items, { label: s.title, className: "rail--moments" })}
  </div>
</section>`;
  },

  services(s, ctx) {
    return `<section class="section">
  <div class="wrap">
    ${sectionHead({ title: s.title })}
    <ul class="services">
      ${(s.items || []).map((it) => `<li class="service">
        <a href="${h(it.href)}" class="service__media" tabindex="-1" aria-hidden="true">${ctx.images.tag(it.image, { alt: "", sizes: "(max-width: 800px) 100vw, 33vw", widths: [360, 540, 720, 960] })}</a>
        <h3 class="service__title">${h(it.title)}</h3>
        <p class="service__text">${h(it.text)}</p>
        <a class="link-arrow" href="${h(it.href)}">${h(it.cta)} ${icon("arrowRight", { size: 16 })}</a>
      </li>`).join("")}
    </ul>
  </div>
</section>`;
  },

  quote(s) {
    return `<section class="section quote">
  <div class="wrap wrap--narrow">
    ${icon("diamond", { size: 28, className: "quote__icon" })}
    <blockquote><p>${h(s.text)}</p>${s.cite ? `<footer>— ${h(s.cite)}</footer>` : ""}</blockquote>
  </div>
</section>`;
  },

  trust() {
    return ""; // The trust strip is rendered by the layout above the footer.
  }
};

export function renderHome(ctx) {
  const home = ctx.home;
  const unknown = [];
  const body = (home.sections || [])
    .map((s, i) => {
      const fn = sections[s.type];
      if (!fn) { unknown.push(s.type); return ""; }
      return fn(s, ctx, i);
    })
    .join("\n");
  if (unknown.length) ctx.warn(`store/home.json: unknown section type(s): ${unknown.join(", ")} (available: ${Object.keys(sections).join(", ")}).`);
  const b = ctx.site.brand;
  return {
    path: "/",
    title: home.seo?.title || b.name,
    description: home.seo?.description,
    bodyClass: "page--home",
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "JewelryStore",
      name: b.name,
      url: b.url,
      description: b.description,
      email: ctx.site.contact?.email,
      address: { "@type": "PostalAddress", addressLocality: (ctx.site.contact?.city || "").split(",")[0], addressCountry: "CA" },
      sameAs: [ctx.site.contact?.instagram, ctx.site.contact?.tiktok].filter(Boolean)
    }
  };
}

export const homeSectionTypes = Object.keys(sections);
