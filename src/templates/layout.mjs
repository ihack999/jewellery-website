// The page shell: <head>, announcement bar, header + mega menu, drawers, footer.
import { h, cx, absoluteUrl, jsonForScript } from "../lib/util.mjs";
import { icon, trustStrip } from "./components.mjs";

export function themeCss(site) {
  const c = site.theme.colors;
  const fonts = site.theme.fonts;
  const faces = (site.theme.fontFiles || [])
    .map((f) => `@font-face{font-family:"${f.family}";font-style:${f.style || "normal"};font-weight:${f.weight || "400"};font-display:swap;src:url("${f.src}") format("woff2")}`)
    .join("");
  return `${faces}:root{--color-bg:${c.background};--color-surface:${c.surface};--color-tile:${c.tile};--color-ink:${c.ink};--color-text:${c.text};--color-muted:${c.muted};--color-line:${c.line};--color-accent:${c.accent};--color-accent-soft:${c.accentSoft};--color-inverse:${c.inverse};--color-success:${c.success};--color-danger:${c.danger};--font-display:${fonts.display};--font-body:${fonts.body};--radius:${site.theme.radius || "0px"};--card-ratio:${site.theme.productImageRatio || "4 / 5"}}`;
}

function announcement(site) {
  const items = site.announcements || [];
  if (!items.length) return "";
  return `<div class="announce" data-announce role="region" aria-label="Announcements">
  <button type="button" class="announce__btn" data-announce-prev aria-label="Previous announcement">${icon("chevronLeft", { size: 14 })}</button>
  <div class="announce__track" aria-live="polite">
    ${items.map((a, i) => `<p class="announce__item${i === 0 ? " is-active" : ""}"${i === 0 ? "" : " hidden"}>${a.href ? `<a href="${h(a.href)}">${h(a.text)}</a>` : h(a.text)}</p>`).join("")}
  </div>
  <button type="button" class="announce__btn" data-announce-next aria-label="Next announcement">${icon("chevronRight", { size: 14 })}</button>
</div>`;
}

function logo(site) {
  const b = site.brand;
  return `<a class="logo" href="/" aria-label="${h(b.name)} — home">${b.logoImage ? `<img src="${h(b.logoImage)}" alt="${h(b.name)}" height="28">` : `<span class="logo__text">${h(b.logoText || b.name)}</span>`}</a>`;
}

function megaPanel(item, index, ctx) {
  if (!item.mega) return "";
  const m = item.mega;
  return `<div class="mega" id="mega-${index}" data-mega-panel hidden>
  <div class="wrap mega__inner">
    <div class="mega__cols">
      ${(m.columns || []).map((col) => `<div class="mega__col">
        <p class="mega__title">${h(col.title)}</p>
        <ul>${col.links.map((l) => `<li><a href="${h(l.href)}">${h(l.label)}</a></li>`).join("")}</ul>
      </div>`).join("")}
    </div>
    <div class="mega__features">
      ${(m.features || []).map((f) => `<a class="mega__feature" href="${h(f.href)}">
        <span class="mega__feature-media">${ctx.images.tag(f.image, { alt: "", sizes: "240px", widths: [360, 540] })}</span>
        <span class="mega__feature-title">${h(f.title)} ${icon("arrowRight", { size: 14 })}</span>
      </a>`).join("")}
    </div>
  </div>
</div>`;
}

function header(ctx, currentPath) {
  const { site } = ctx;
  const nav = site.navigation || [];
  const isCurrent = (href) => href !== "/" && currentPath.startsWith(href.replace(/[?#].*$/, ""));
  return `<header class="site-header" data-header>
  <div class="wrap header__bar">
    <div class="header__left">
      <button type="button" class="icon-btn header__menu" data-menu-open aria-label="Open menu" aria-controls="mobile-menu" aria-expanded="false">${icon("menu", { size: 22 })}</button>
      <nav class="primary-nav" aria-label="Main">
        <ul>
          ${nav.map((item, i) => `<li class="primary-nav__item"${item.mega ? " data-mega" : ""}>
            <a class="${cx("primary-nav__link", isCurrent(item.href) && "is-current")}" href="${h(item.href)}"${item.mega ? ` aria-haspopup="true" aria-expanded="false" aria-controls="mega-${i}"` : ""}>${h(item.label)}</a>
            ${megaPanel(item, i, ctx)}
          </li>`).join("")}
        </ul>
      </nav>
      <button type="button" class="icon-btn header__search-mobile" data-search-open aria-label="Search">${icon("search")}</button>
    </div>
    ${logo(site)}
    <div class="header__right">
      ${(site.headerRight || []).map((l) => `<a class="header__text-link" href="${h(l.href)}">${h(l.label)}</a>`).join("")}
      <button type="button" class="icon-btn header__search" data-search-open aria-label="Search">${icon("search")}</button>
      <a class="icon-btn" href="/wishlist/" aria-label="Wishlist">${icon("heart")}<span class="count" data-wish-count hidden>0</span></a>
      <button type="button" class="icon-btn" data-cart-open aria-label="Shopping bag" aria-controls="cart" aria-expanded="false">${icon("bag")}<span class="count" data-cart-count hidden>0</span></button>
    </div>
  </div>
</header>`;
}

function mobileMenu(ctx) {
  const { site } = ctx;
  const c = site.contact || {};
  return `<div class="drawer drawer--left" id="mobile-menu" data-drawer="menu" hidden>
  <div class="drawer__scrim" data-drawer-close></div>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu" tabindex="-1">
    <div class="drawer__head">
      <span class="drawer__title">Menu</span>
      <button type="button" class="icon-btn" data-drawer-close aria-label="Close menu">${icon("close")}</button>
    </div>
    <nav class="drawer__body mobile-nav" aria-label="Mobile">
      <ul>
        ${(site.navigation || []).map((item) => item.mega ? `<li><details>
          <summary>${h(item.label)} ${icon("plus", { size: 16 })}</summary>
          ${item.mega.columns.map((col) => `<p class="mobile-nav__title">${h(col.title)}</p><ul>${col.links.map((l) => `<li><a href="${h(l.href)}">${h(l.label)}</a></li>`).join("")}</ul>`).join("")}
        </details></li>` : `<li><a class="mobile-nav__top" href="${h(item.href)}">${h(item.label)}</a></li>`).join("")}
        ${(site.headerRight || []).map((l) => `<li><a class="mobile-nav__top" href="${h(l.href)}">${h(l.label)}</a></li>`).join("")}
        <li><a class="mobile-nav__top" href="/wishlist/">Wishlist</a></li>
      </ul>
      <div class="mobile-nav__feature">
        ${ctx.images.tag("/assets/images/optimized/studio-ring-pink-gemstone-1600.jpg", { alt: "", sizes: "80vw", widths: [540, 720] })}
        <div><p class="eyebrow">${h(site.studio?.title || "Design Studio")}</p><a class="btn btn--solid btn--block" href="${h(site.studio?.path || "/design-studio/")}">Design your own</a></div>
      </div>
      <div class="mobile-nav__contact">
        ${c.email ? `<a href="mailto:${h(c.email)}">${icon("mail", { size: 18 })} ${h(c.email)}</a>` : ""}
        ${c.whatsapp ? `<a href="https://wa.me/${h(c.whatsapp)}" target="_blank" rel="noopener">${icon("whatsapp", { size: 18 })} ${h(c.whatsappLabel || "WhatsApp")}</a>` : ""}
      </div>
    </nav>
  </div>
</div>`;
}

function cartDrawer(ctx) {
  const co = ctx.site.checkout || {};
  const request = co.mode !== "stripe";
  return `<div class="drawer drawer--right" id="cart" data-drawer="cart" hidden>
  <div class="drawer__scrim" data-drawer-close></div>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1">
    <div class="drawer__head">
      <span class="drawer__title" id="cart-title">Your bag <span data-cart-count-inline></span></span>
      <button type="button" class="icon-btn" data-drawer-close aria-label="Close bag">${icon("close")}</button>
    </div>
    <div class="drawer__body" data-cart-body>
      <div class="cart-empty" data-cart-empty>
        <p class="cart-empty__title">Your bag is empty</p>
        <p>Start with our signatures, or design something that's entirely yours.</p>
        <div class="cart-empty__links">
          <a class="btn btn--solid" href="/shop/">Shop jewellery</a>
          <a class="btn btn--ghost" href="${h(ctx.site.studio?.path || "/design-studio/")}">Design your own</a>
        </div>
      </div>
      <ul class="cart-lines" data-cart-lines></ul>
      ${request ? `<form class="cart-request" data-cart-request name="${h(co.requestFormName || "order-request")}" method="POST" data-netlify="true" netlify-honeypot="company" hidden>
        <input type="hidden" name="form-name" value="${h(co.requestFormName || "order-request")}">
        <input type="hidden" name="order" data-cart-order-field>
        <input type="hidden" name="order-total" data-cart-total-field>
        <p class="visually-hidden"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></p>
        <p class="cart-request__intro">Tell us where to reach you — we'll confirm availability, sizing, timing and the final price in writing before any payment.</p>
        <div class="field"><label for="cr-name">Full name</label><input id="cr-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="cr-email">Email</label><input id="cr-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="cr-phone">Phone <span class="optional">(optional)</span></label><input id="cr-phone" name="phone" type="tel" autocomplete="tel"></div>
        <div class="field"><label for="cr-notes">Notes <span class="optional">(sizes, dates, questions)</span></label><textarea id="cr-notes" name="notes" rows="3"></textarea></div>
        <button class="btn btn--solid btn--block" type="submit" data-cart-submit>Send order request</button>
        <button class="btn btn--link" type="button" data-cart-back>Back to bag</button>
        <p class="form-status" data-form-status role="status"></p>
      </form>` : ""}
    </div>
    <div class="drawer__foot" data-cart-foot hidden>
      <div class="cart-total"><span>Estimated total</span><strong data-cart-total>—</strong></div>
      <p class="cart-note">${h(co.requestNote || "")}</p>
      <button type="button" class="btn btn--solid btn--block" data-cart-checkout>${request ? "Request to order" : "Checkout"}</button>
      <a class="btn btn--link" href="/shop/" data-drawer-close>Continue shopping</a>
    </div>
  </div>
</div>`;
}

function searchOverlay(ctx) {
  const popular = ctx.collections.filter((c) => ["rings", "necklaces", "tennis", "estate", "lab-grown"].includes(c.handle));
  return `<div class="search" data-search hidden>
  <div class="search__scrim" data-search-close></div>
  <div class="search__panel" role="dialog" aria-modal="true" aria-label="Search">
    <div class="wrap">
      <form class="search__form" action="/shop/" role="search" data-search-form>
        ${icon("search", { size: 22 })}
        <label class="visually-hidden" for="search-input">Search jewellery</label>
        <input id="search-input" name="q" type="search" placeholder="Search rings, tennis, yellow diamond…" autocomplete="off" data-search-input>
        <button type="button" class="icon-btn" data-search-close aria-label="Close search">${icon("close")}</button>
      </form>
      <div class="search__suggest" data-search-suggest>
        <p class="search__label">Popular</p>
        <ul class="search__chips">${popular.map((c) => `<li><a class="chip" href="${c.path}">${h(c.title)}</a></li>`).join("")}<li><a class="chip" href="${h(ctx.site.studio?.path || "/design-studio/")}">Design Studio</a></li></ul>
      </div>
      <div class="search__results" data-search-results aria-live="polite"></div>
    </div>
  </div>
</div>`;
}

function footer(ctx) {
  const { site } = ctx;
  const f = site.footer || {};
  const c = site.contact || {};
  const n = site.newsletter || {};
  const socials = [
    ["instagram", c.instagram, "Instagram"],
    ["tiktok", c.tiktok, "TikTok"],
    ["pinterest", c.pinterest, "Pinterest"],
    ["whatsapp", c.whatsapp ? `https://wa.me/${c.whatsapp}` : "", "WhatsApp"]
  ].filter(([, href]) => href);
  return `<footer class="site-footer">
  ${n.enabled ? `<section class="footer-news">
    <div class="wrap footer-news__inner">
      <div>
        <p class="eyebrow eyebrow--light">The private list</p>
        <h2 class="footer-news__title">${h(n.title)}</h2>
        <p class="footer-news__text">${h(n.text)}</p>
      </div>
      <form class="footer-news__form" name="${h(n.formName || "newsletter")}" method="POST" data-netlify="true" netlify-honeypot="company" data-ajax-form data-success="Welcome to the list — your welcome offer is on its way.">
        <input type="hidden" name="form-name" value="${h(n.formName || "newsletter")}">
        <input type="hidden" name="offer" value="${h(n.title)}">
        <p class="visually-hidden"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></p>
        <div class="footer-news__row">
          <label class="visually-hidden" for="news-email">Email address</label>
          <input id="news-email" name="email-address" type="email" placeholder="Email address" autocomplete="email" required>
          <button class="btn btn--light" type="submit">${h(n.button || "Subscribe")}</button>
        </div>
        <p class="footer-news__fine">By joining you agree to receive emails from ${h(site.brand.name)}. Unsubscribe anytime. <a href="/pages/privacy/">Privacy</a>.</p>
        <p class="form-status" data-form-status role="status"></p>
      </form>
    </div>
  </section>` : ""}
  <div class="wrap footer__main">
    <div class="footer__brand">
      ${logo(site)}
      <p>${h(f.about || site.brand.description)}</p>
      <ul class="footer__social">${socials.map(([name, href, label]) => `<li><a href="${h(href)}" target="_blank" rel="noopener" aria-label="${label}">${icon(name, { size: 20 })}</a></li>`).join("")}</ul>
    </div>
    ${(f.columns || []).map((col) => `<div class="footer__col">
      <h3 class="footer__heading">${h(col.title)}</h3>
      <ul>${col.links.map((l) => `<li><a href="${h(l.href)}">${h(l.label)}</a></li>`).join("")}</ul>
    </div>`).join("")}
    <div class="footer__col">
      <h3 class="footer__heading">Contact</h3>
      <ul class="footer__contact">
        ${c.email ? `<li><a href="mailto:${h(c.email)}">${h(c.email)}</a></li>` : ""}
        ${c.phone ? `<li><a href="tel:${h(c.phone.replace(/[^+\d]/g, ""))}">${h(c.phone)}</a></li>` : ""}
        ${c.whatsapp ? `<li><a href="https://wa.me/${h(c.whatsapp)}" target="_blank" rel="noopener">${h(c.whatsappLabel || "WhatsApp")}</a></li>` : ""}
        ${c.city ? `<li>${h(c.city)}</li>` : ""}
        ${c.hours ? `<li class="muted">${h(c.hours)}</li>` : ""}
      </ul>
    </div>
  </div>
  <div class="wrap footer__legal">
    <p>© <span data-year>${new Date().getFullYear()}</span> ${h(site.brand.name)}</p>
    <ul>${(f.legal || []).map((l) => `<li><a href="${h(l.href)}">${h(l.label)}</a></li>`).join("")}</ul>
  </div>
</footer>`;
}

export function layout(ctx, page) {
  const { site } = ctx;
  const b = site.brand;
  const title = page.title ? (page.title.includes(b.name) ? page.title : `${page.title} | ${b.name}`) : b.name;
  const description = page.description || b.description;
  const canonical = absoluteUrl(b.url, page.path || "/");
  const og = page.ogImage || b.ogImage;
  const ogUrl = og ? (/^https?:/.test(og) ? og : absoluteUrl(b.url, og.startsWith("/media/") ? og : ctx.images.url(og, 1280))) : "";
  const preloads = (site.theme.fontFiles || []).filter((f) => f.preload).map((f) => `<link rel="preload" href="${f.src}" as="font" type="font/woff2" crossorigin>`).join("\n");
  const jsonLd = [].concat(page.jsonLd || []).map((d) => `<script type="application/ld+json">${jsonForScript(d)}</script>`).join("\n");
  const storeConfig = {
    currency: b.currency,
    locale: b.locale,
    brand: b.name,
    monogram: b.monogram || b.shortName || "",
    checkout: { mode: site.checkout?.mode || "request", formName: site.checkout?.requestFormName || "order-request" },
    catalog: `/products.json?v=${ctx.version}`,
    studio: site.studio?.path || "/design-studio/"
  };
  return `<!doctype html>
<html lang="${h((b.locale || "en").split("-")[0])}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${h(title)}</title>
<meta name="description" content="${h(description)}">
<link rel="canonical" href="${h(canonical)}">
${page.noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="theme-color" content="${h(site.theme.colors.background)}">
<meta property="og:type" content="${page.ogType || "website"}">
<meta property="og:site_name" content="${h(b.name)}">
<meta property="og:title" content="${h(title)}">
<meta property="og:description" content="${h(description)}">
<meta property="og:url" content="${h(canonical)}">
${ogUrl ? `<meta property="og:image" content="${h(ogUrl)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/site.webmanifest">
${preloads}
<style>${themeCss(site)}</style>
<link rel="stylesheet" href="/static/store.css?v=${ctx.assetVersion("store.css")}">
${page.head || ""}
<script>window.STORE=${jsonForScript(storeConfig)};document.documentElement.classList.add("js");</script>
<script src="/static/store.js?v=${ctx.assetVersion("store.js")}" defer></script>
${page.scripts || ""}
${jsonLd}
</head>
<body class="${cx("page", page.bodyClass)}"${page.bodyAttrs ? " " + page.bodyAttrs : ""}>
<a class="skip" href="#main">Skip to content</a>
${announcement(site)}
${header(ctx, page.path || "/")}
<main id="main">
${page.body}
</main>
${page.hideTrust ? "" : trustStrip(ctx)}
${footer(ctx)}
${mobileMenu(ctx)}
${cartDrawer(ctx)}
${searchOverlay(ctx)}
<div class="modal" data-quick-modal hidden>
  <div class="modal__scrim" data-modal-close></div>
  <div class="modal__panel" role="dialog" aria-modal="true" aria-label="Quick view" tabindex="-1">
    <button type="button" class="icon-btn modal__close" data-modal-close aria-label="Close">${icon("close")}</button>
    <div class="modal__body" data-quick-body></div>
  </div>
</div>
<div class="toasts" data-toasts aria-live="polite"></div>
</body>
</html>`;
}
