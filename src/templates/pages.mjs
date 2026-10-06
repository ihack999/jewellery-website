// Content pages from store/pages/*.html plus built-in utility pages.
import { h } from "../lib/util.mjs";
import { icon, breadcrumbs, productCard } from "./components.mjs";

/** Expand simple shortcodes inside page bodies. */
function shortcodes(body, ctx) {
  return body
    // {{products collection="tennis" limit="4"}}
    .replace(/\{\{\s*products\s+([^}]*)\}\}/g, (_, args) => {
      const a = Object.fromEntries([...args.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
      let list = a.collection ? ctx.byHandle[a.collection]?.products || [] : ctx.products;
      if (a.slugs) list = a.slugs.split(",").map((s) => ctx.products.find((p) => p.slug === s.trim())).filter(Boolean);
      list = list.slice(0, Number(a.limit || 4));
      return `<div class="grid grid--inline">${list.map((p) => productCard(p, ctx)).join("")}</div>`;
    })
    // {{image src="/assets/..." alt="..."}}
    .replace(/\{\{\s*image\s+([^}]*)\}\}/g, (_, args) => {
      const a = Object.fromEntries([...args.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
      return `<figure class="page-figure">${ctx.images.tag(a.src, { alt: a.alt || "", sizes: "(max-width: 900px) 100vw, 760px" })}${a.caption ? `<figcaption>${h(a.caption)}</figcaption>` : ""}</figure>`;
    })
    // {{contact}} — contact details block
    .replace(/\{\{\s*contact\s*\}\}/g, () => contactBlock(ctx))
    // {{contact-form}}
    .replace(/\{\{\s*contact-form\s*\}\}/g, () => contactForm(ctx))
    // {{button label="..." href="..." style="ghost"}}
    .replace(/\{\{\s*button\s+([^}]*)\}\}/g, (_, args) => {
      const a = Object.fromEntries([...args.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
      return `<a class="btn btn--${h(a.style || "solid")}" href="${h(a.href)}">${h(a.label)}</a>`;
    });
}

function contactBlock(ctx) {
  const c = ctx.site.contact || {};
  const rows = [
    c.email && ["mail", "Email", `<a href="mailto:${h(c.email)}">${h(c.email)}</a>`],
    c.whatsapp && ["whatsapp", "WhatsApp", `<a href="https://wa.me/${h(c.whatsapp)}" target="_blank" rel="noopener">${h(c.whatsappLabel || c.whatsapp)}</a>`],
    c.phone && ["chat", "Phone", `<a href="tel:${h(c.phone.replace(/[^+\d]/g, ""))}">${h(c.phone)}</a>`],
    c.instagram && ["instagram", "Instagram", `<a href="${h(c.instagram)}" target="_blank" rel="noopener">@${h(c.instagram.replace(/\/$/, "").split("/").pop())}</a>`],
    c.city && ["location", "Studio", `${h(c.city)}${c.hours ? `<br><span class="muted">${h(c.hours)}</span>` : ""}`]
  ].filter(Boolean);
  return `<ul class="contact-list">${rows.map(([ic, label, value]) => `<li>${icon(ic, { size: 22 })}<div><span class="contact-list__label">${label}</span>${value}</div></li>`).join("")}</ul>`;
}

function contactForm() {
  const topics = [["general", "General question"], ["appointment", "Book an appointment"], ["custom", "Custom design"], ["sourcing", "Estate & private sourcing"], ["engagement", "Engagement ring"], ["wedding-band", "Wedding band"], ["sizing", "Sizing help"], ["order", "An existing order"]];
  return `<form class="contact-form" name="contact" method="POST" data-netlify="true" netlify-honeypot="company" data-ajax-form data-contact-form data-success="Thank you — we'll reply personally, usually within one business day.">
  <input type="hidden" name="form-name" value="contact">
  <input type="hidden" name="product" data-prefill="product">
  <p class="visually-hidden"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></p>
  <div class="form-grid">
    <div class="field"><label for="c-name">Full name</label><input id="c-name" name="name" autocomplete="name" required></div>
    <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email" required></div>
    <div class="field"><label for="c-phone">Phone <span class="optional">(optional)</span></label><input id="c-phone" name="phone" type="tel" autocomplete="tel"></div>
    <div class="field"><label for="c-topic">Topic</label><div class="select"><select id="c-topic" name="topic" data-prefill="topic">${topics.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select>${icon("chevronDown", { size: 14 })}</div></div>
    <div class="field field--wide"><label for="c-date">Preferred appointment date <span class="optional">(optional)</span></label><input id="c-date" name="preferred-date" type="date"></div>
    <div class="field field--wide"><label for="c-msg">Message</label><textarea id="c-msg" name="message" rows="5" required></textarea></div>
  </div>
  <button class="btn btn--solid" type="submit">Send message</button>
  <p class="form-status" data-form-status role="status"></p>
</form>`;
}

export function renderPage(page, ctx) {
  const crumbs = [{ label: "Home", href: "/" }];
  if (page.parent) crumbs.push(page.parent);
  crumbs.push({ label: page.navTitle || page.title });
  const hero = page.image
    ? `<section class="page-hero">
        <div class="page-hero__media">${ctx.images.tag(page.image, { alt: "", sizes: "100vw", priority: true })}</div>
        <div class="page-hero__content wrap">${page.eyebrow ? `<p class="eyebrow eyebrow--light">${h(page.eyebrow)}</p>` : ""}<h1 class="page-hero__title">${h(page.heading || page.title)}</h1>${page.intro ? `<p class="page-hero__intro">${h(page.intro)}</p>` : ""}</div>
      </section>`
    : `<section class="page-head wrap ${page.layout === "wide" ? "" : "wrap--narrow"}">
        ${page.eyebrow ? `<p class="eyebrow">${h(page.eyebrow)}</p>` : ""}
        <h1 class="collection-title">${h(page.heading || page.title)}</h1>
        ${page.intro ? `<p class="collection-desc">${h(page.intro)}</p>` : ""}
      </section>`;
  const body = `<div class="wrap">${breadcrumbs(crumbs)}</div>
${hero}
<div class="page-body wrap ${page.layout === "wide" ? "" : "wrap--narrow"} prose">
${shortcodes(page.body, ctx)}
</div>`;
  return {
    path: page.path,
    title: page.seoTitle || page.title,
    description: page.description || page.intro,
    ogImage: page.image,
    bodyClass: `page--content page--${page.slug}`,
    body,
    jsonLd: page.jsonLd
  };
}

export function renderWishlist(ctx) {
  return {
    path: "/wishlist/",
    title: "Wishlist",
    noindex: true,
    bodyClass: "page--wishlist",
    body: `<section class="collection-head wrap">
  <h1 class="collection-title">Your wishlist</h1>
  <p class="collection-desc">Pieces you've saved on this device. Share the list with us and we'll help you choose.</p>
</section>
<div class="wrap">
  <div class="grid" data-wishlist-grid></div>
  <div class="grid-empty" data-wishlist-empty hidden>
    <p class="grid-empty__title">Nothing saved yet</p>
    <p>Tap the ${icon("heart", { size: 16 })} on any piece to keep it here.</p>
    <div class="grid-empty__actions"><a class="btn btn--solid" href="/shop/">Shop jewellery</a></div>
  </div>
  <p class="wishlist-share" data-wishlist-share hidden><a class="btn btn--ghost" data-wishlist-email href="#">${icon("mail", { size: 18 })} Email my wishlist to the atelier</a></p>
</div>`
  };
}

export function renderNotFound(ctx) {
  const picks = ctx.products.filter((p) => p.tags.includes("signature")).slice(0, 4);
  return {
    path: "/404.html",
    title: "Page not found",
    noindex: true,
    bodyClass: "page--404",
    body: `<section class="section wrap wrap--narrow notfound">
  <p class="eyebrow">404</p>
  <h1 class="collection-title">This page has been moved — or was one of a kind.</h1>
  <p class="collection-desc">Try searching, or start with a few favourites.</p>
  <div class="grid-empty__actions"><a class="btn btn--solid" href="/shop/">Shop jewellery</a><button type="button" class="btn btn--ghost" data-search-open>Search</button></div>
</section>
<div class="wrap"><div class="grid">${picks.map((p) => productCard(p, ctx)).join("")}</div></div>`
  };
}

export function renderOrderSuccess(ctx) {
  return {
    path: "/order/success/",
    title: "Thank you",
    noindex: true,
    bodyClass: "page--success",
    body: `<section class="section wrap wrap--narrow notfound" data-checkout-result>
  <p class="eyebrow">${icon("check", { size: 18 })} Received</p>
  <h1 class="collection-title" data-checkout-title>Thank you.</h1>
  <p class="collection-desc" data-checkout-message>We've received your request and will reply personally — usually within one business day — to confirm every detail in writing.</p>
  <div class="grid-empty__actions"><a class="btn btn--solid" href="/shop/">Continue shopping</a><a class="btn btn--ghost" href="/pages/contact/">Contact us</a></div>
</section>`
  };
}
