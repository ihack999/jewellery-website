// The Design Studio page: the real-time 3D designer (assets/js/designer.js)
// wrapped in the storefront, plus a custom-request form it can fill in.
import fs from "node:fs";
import path from "node:path";
import { h, ROOT } from "../lib/util.mjs";
import { icon, breadcrumbs } from "./components.mjs";

const MARKUP = path.join(ROOT, "src", "studio", "studio-markup.html");

function requestForm(ctx) {
  const budgets = [["500 to 1000", "$500 – $1,000"], ["1000 to 5000", "$1,000 – $5,000"], ["5000 to 10000", "$5,000 – $10,000"], ["10000 plus", "$10,000+"]];
  return `<section class="section request" id="request-form" aria-labelledby="request-title">
  <div class="wrap request__grid">
    <div class="request__intro">
      <p class="eyebrow">Custom request</p>
      <h2 class="section-title" id="request-title">Tell us what you're imagining.</h2>
      <p>Send your studio design — or just an idea and a reference photo. We review every request personally and reply with next steps, a recommended direction and a quote.</p>
      <ol class="request__steps">
        <li><span>01</span><div><strong>Share the idea</strong><p>Your 3D design, references, budget and timing.</p></div></li>
        <li><span>02</span><div><strong>Refine together</strong><p>Stone, metal, proportions and wearability — in person in Toronto or virtually.</p></div></li>
        <li><span>03</span><div><strong>Approve &amp; create</strong><p>Price and timing are confirmed in writing before any work begins.</p></div></li>
      </ol>
      <a class="btn btn--ghost" href="#design-studio">${icon("cube", { size: 18 })} Back to the 3D studio</a>
    </div>

    <form class="request__form" name="custom-request" method="POST" action="${h(ctx.site.studio.path)}" data-netlify="true" netlify-honeypot="bot-field" enctype="multipart/form-data" data-custom-request>
      <input type="hidden" name="form-name" value="custom-request">
      <input type="hidden" name="design-summary" data-design-summary-field>
      <p class="visually-hidden"><label>Leave empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>

      <div class="design-brief" data-design-brief-card hidden>
        <div class="design-brief__media">
          <img data-design-brief-image alt="Your custom jewellery design" hidden>
          <div class="design-brief__placeholder" data-design-brief-placeholder>${icon("cube", { size: 28 })}</div>
        </div>
        <div class="design-brief__body">
          <p class="eyebrow">Your studio design</p>
          <h3 data-design-brief-title>Custom design</h3>
          <p data-design-brief-copy></p>
          <dl data-design-brief-specs></dl>
          <ol class="visually-hidden" data-design-brief-steps></ol>
        </div>
      </div>

      <div class="form-grid">
        <div class="field"><label for="full-name">Full name</label><input id="full-name" name="full-name" autocomplete="name" required></div>
        <div class="field"><label for="email-address">Email</label><input id="email-address" name="email-address" type="email" autocomplete="email" required></div>
        <div class="field"><label for="phone-number">Phone <span class="optional">(optional)</span></label><input id="phone-number" name="phone-number" type="tel" autocomplete="tel"></div>
        <div class="field"><label for="piece-type">Piece</label><input id="piece-type" name="piece-type" list="piece-types" placeholder="Ring, necklace, bracelet, earrings…" required><datalist id="piece-types"><option value="Ring"><option value="Engagement ring"><option value="Necklace"><option value="Bracelet"><option value="Earrings"></datalist></div>
        <div class="field"><label for="metal-preference">Metal</label><input id="metal-preference" name="metal-preference" placeholder="e.g. 18K yellow gold"></div>
        <div class="field"><label for="stone-preference">Stone</label><input id="stone-preference" name="stone-preference" placeholder="e.g. 1.5 ct oval lab-grown diamond"></div>
        <div class="field"><label for="finish-preference">Setting &amp; details</label><input id="finish-preference" name="finish-preference" placeholder="e.g. hidden halo, pavé band"></div>
        <div class="field"><label for="dimensions">Size &amp; measurements</label><input id="dimensions" name="dimensions" placeholder="Ring size, chain length…"></div>
        <div class="field"><label for="occasion">Occasion</label><input id="occasion" name="occasion" placeholder="Engagement, anniversary, just because…"></div>
        <div class="field"><label for="needed-by">Needed by <span class="optional">(optional)</span></label><input id="needed-by" name="needed-by" type="date"></div>
        <fieldset class="field field--wide">
          <legend>Budget</legend>
          <div class="pills">${budgets.map(([v, l]) => `<label class="pill"><input type="radio" name="budget" value="${v}"><span>${l}</span></label>`).join("")}</div>
        </fieldset>
        <div class="field field--wide">
          <span class="field__label">Inspiration</span>
          <div class="file-drop" data-file-picker>
            <input id="inspiration-upload" name="inspiration-upload" type="file" accept="image/*" data-file-input>
            <label for="inspiration-upload">
              ${icon("sparkle", { size: 22 })}
              <strong>Add a reference photo</strong>
              <span data-file-name>Your 3D design is attached here automatically when you send it from the studio.</span>
              <span class="file-drop__preview" data-design-preview hidden></span>
            </label>
          </div>
        </div>
        <div class="field field--wide"><label for="inspiration-link">Inspiration link <span class="optional">(optional)</span></label><input id="inspiration-link" name="inspiration-link" type="url" placeholder="https://"></div>
        <div class="field field--wide"><label for="description">Tell us about it</label><textarea id="description" name="description" rows="5" placeholder="What you love, what you'd change, who it's for…"></textarea></div>
        <fieldset class="field field--wide">
          <legend>Preferred contact</legend>
          <div class="pills">${["Email", "Phone", "WhatsApp"].map((v, i) => `<label class="pill"><input type="radio" name="preferred-contact" value="${v}"${i === 0 ? " checked" : ""}><span>${v}</span></label>`).join("")}</div>
        </fieldset>
      </div>
      <button class="btn btn--solid btn--block" type="submit">Send my custom request</button>
      <p class="form-fine">We confirm availability, specifications, price and timing in writing before any payment.</p>
      <p class="form-status" data-form-status role="status"></p>
    </form>
  </div>
</section>`;
}

const FAQ = [
  ["Is the 3D design the final piece?", "The studio is a realistic starting point — it captures silhouette, metal, stone and setting. Our atelier reviews every design for wearability and craftsmanship, then confirms final measurements and specifications with you before anything is made."],
  ["What does a custom piece cost?", "Price depends on the stone, metal, size and complexity. Share a budget range with your request and we'll recommend the strongest design within it. Everything is confirmed in writing before payment."],
  ["Can I choose natural or lab-grown diamonds?", "Yes. Both are real diamonds; the difference is origin. We'll compare specific stones with you — see our natural vs lab-grown guide for the key questions."],
  ["How long does it take?", "Timing depends on sourcing and the complexity of the design. If you have an important date, include it in your request and we'll confirm whether it's achievable before you commit."],
  ["Can I try it on?", "On supported devices, the studio's AR try-on gives an approximate preview on your hand, neck or wrist. It's a visual guide, not a sizing tool — we confirm sizing with you directly."]
];

export function renderStudio(ctx) {
  const studio = ctx.site.studio;
  const markup = fs.readFileSync(MARKUP, "utf8");
  const body = `<div class="tryon-launch" data-tryon-launch aria-live="polite">
  <div class="tryon-launch__inner">
    <span class="tryon-launch__mark">${icon("sparkle", { size: 26 })}</span>
    <p class="eyebrow">Virtual try-on</p>
    <p class="tryon-launch__title" data-tryon-launch-title>Preparing your try-on…</p>
    <span class="tryon-launch__bar"><span></span></span>
  </div>
</div>
<section class="studio-head">
  <div class="wrap">
    ${breadcrumbs([{ label: "Home", href: "/" }, { label: studio.title }])}
    <div class="studio-head__row">
      <div>
        <h1 class="collection-title">${h(studio.title)}</h1>
        <p class="collection-desc">${h(studio.intro)}</p>
      </div>
      <ol class="studio-head__steps">
        <li><span>1</span> Design in 3D</li>
        <li><span>2</span> Send to our atelier</li>
        <li><span>3</span> Receive your quote</li>
      </ol>
    </div>
  </div>
</section>
<div class="studio-shell legacy-studio" data-studio-shell>
${markup}
</div>
${requestForm(ctx)}
<section class="section section--surface">
  <div class="wrap wrap--narrow">
    <header class="section-head"><h2 class="section-title">Studio questions</h2></header>
    <div class="accordions accordions--faq">
      ${FAQ.map(([q, a], i) => `<details class="accordion"${i === 0 ? " open" : ""}><summary>${h(q)} ${icon("plus", { size: 16 })}</summary><div class="accordion__body prose"><p>${h(a)}</p></div></details>`).join("")}
    </div>
  </div>
</section>`;

  return {
    path: studio.path,
    title: "3D Jewellery Design Studio — Design Your Own Ring, Necklace or Bracelet",
    description: studio.intro,
    ogImage: "/assets/images/optimized/studio-ring-pink-gemstone-1600.jpg",
    bodyClass: "page--studio",
    bodyAttrs: 'data-page="customs"',
    // ?tryon=1 (from a product page) covers the studio at first paint and goes straight to the camera.
    head: `<script>if(/[?&]tryon=1(&|$)/.test(location.search))document.documentElement.classList.add("is-tryon-launch")</script>
<link rel="stylesheet" href="/static/studio.css?v=${ctx.assetVersion("studio.css")}">`,
    scripts: `<script type="module" src="/static/studio-page.js?v=${ctx.assetVersion("studio-page.js")}"></script>`,
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: `${ctx.site.brand.name} Design Studio`,
      applicationCategory: "DesignApplication",
      operatingSystem: "Any (WebGL browser)",
      url: ctx.site.brand.url + studio.path,
      offers: { "@type": "Offer", price: 0, priceCurrency: ctx.site.brand.currency }
    }
  };
}
