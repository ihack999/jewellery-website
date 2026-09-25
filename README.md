# Jewellery Storefront (white-label) + 3D Design Studio

A fast, static jewellery store with a real-time 3D design studio. Everything a
shop owner changes — products, collections, homepage, pages, brand colours,
contact details — lives in **`/store`** as plain JSON/HTML. One command turns
it into a complete website in **`/dist`**.

Currently branded for **Toronto Jewels Curation**. To re-brand for another
jeweller, edit `store/site.json` (see [White-label in 5 minutes](#white-label-in-5-minutes)).

```
store/                  ← the only folder you normally edit
  site.json               brand, colours, fonts, menu, footer, contact, checkout mode
  home.json               homepage sections (reorder / remove / duplicate)
  collections.json        category + collection pages and their rules
  products/<slug>/        one folder per product: product.json + photos
  pages/*.html            About, Contact, Guides, policies…
src/                    ← the engine (build, templates, CSS/JS). Rarely touched.
assets/                 ← shared media, fonts, and the 3D studio (assets/js/designer.js)
netlify/functions/      ← order checkout (Stripe), SMS alerts, AI render helpers
dist/                   ← generated website (never edit; rebuilt every time)
legacy-v1/              ← the previous hand-written pages, kept for reference only
```

## Quick start

```bash
npm install        # once — installs the image optimizer (sharp). Optional but recommended.
npm run dev        # builds the site and opens a live preview at http://localhost:8000
```

`npm run dev` rebuilds automatically when you save anything in `/store` or `/src`.
Forms and checkout are accepted locally but only really send once deployed on Netlify.

## Add a product in 3 steps

1. **Create it**
   ```bash
   npm run new -- "Emerald Drop Earrings" --category earrings --price 3400
   ```
   (or copy `store/products/_template/` and rename the folder — the folder name becomes the URL `/products/emerald-drop-earrings/`)
2. **Add photos** — drop them into `store/products/emerald-drop-earrings/`. They appear in filename order (`01.jpg`, `02.jpg`, …). The first is the main image, the second is shown when hovering over the card. Any size/format works; the build creates optimized WebP versions automatically.
3. **Fill in `product.json`** — name, price, description, details, options. Then `npm run dev` to preview, and push to deploy.

That's it — the product automatically appears in the shop, the right category and collections, search, filters, the sitemap, Google structured data, and the checkout price list.

### What goes in `product.json`

| Field | Example | Notes |
|---|---|---|
| `name` | `"The Rise Ring"` | required |
| `subtitle` | `"1 ct Oval Lab-Grown Diamond"` | shown under the name |
| `category` | `"rings"` | one of `site.json → vocabulary.categories` |
| `price` | `2200` | a number (no `$` or commas). `null` = “Price on request” + an enquiry button |
| `priceFrom` | `true` | shows “From $2,200” |
| `currency` | `"USD"` | only if different from the store currency |
| `availability` | `"made-to-order"` | `ready`, `made-to-order`, `one-of-a-kind`, `sold`, or `hidden` (unpublished) |
| `badge` | `"Best Seller"` | small label on the photo |
| `tags` | `["signature","tennis"]` | used by collections (`collections.json`) |
| `metals` / `stones` | `["yellow-gold"]` / `["lab-diamond"]` | power the filters and colour dots |
| `images` | `[{ "src": "01.jpg", "alt": "…", "note": "…" }]` | optional — leave it out to use every photo in the folder |
| `videos` | `[{ "src": "/assets/videos/x.mp4" }]` | added to the end of the gallery |
| `summary`, `description` | text | blank line = new paragraph; `**bold**` and `[links](/url)` work |
| `details` | `{ "Metal": "14K gold" }` | the Details table |
| `options` | see below | metal swatches, buttons, size dropdown, engraving text |
| `studio` | `{ "piece": "Ring", "shape": "Oval" }` | adds **“Try it on”** (live camera AR) and **“Make it yours in 3D”** (Design Studio, pre-set) |
| `related` | `["the-rise-ring"]` | hand-picked “You may also like” (auto-filled otherwise) |
| `sort` | `10` | lower = earlier in “Featured” order |

Options:

```json
"options": [
  { "name": "Metal", "type": "swatch", "values": [
    { "label": "14K Yellow Gold", "metal": "yellow-gold", "image": 0 },
    { "label": "14K White Gold",  "metal": "white-gold",  "image": 2 }
  ]},
  { "name": "Diamonds", "type": "button", "values": [
    { "label": "Lab-grown" },
    { "label": "Natural", "inquire": true },
    { "label": "2 ct centre", "add": 1500 }
  ]},
  { "name": "Ring size", "type": "size", "values": "ringSizes" },
  { "name": "Initials", "type": "text", "maxLength": 3, "required": true }
]
```

`image` switches the gallery to that photo (counting from 0), `add` increases the price, `inquire` turns the button into “Enquire” for that choice.

If something is wrong, the build tells you exactly which file and what to fix (`npm run check` validates without building).

## Everything else you can change without code

| I want to… | Edit |
|---|---|
| Change the logo text, colours, fonts | `store/site.json → brand`, `theme` |
| Change the top menu / mega menu | `store/site.json → navigation` |
| Change the announcement bar | `store/site.json → announcements` |
| Add a collection (e.g. “Under $1,000”, “Bridal”) | add an entry to `store/collections.json` — it gets its own page at `/collections/<handle>/` |
| Reorder or edit homepage sections | `store/home.json` |
| Add a content page | create `store/pages/<slug>.html` (published at `/pages/<slug>/`) |
| Add a new metal, stone or category | `store/site.json → vocabulary` |
| Add a redirect for an old URL | `store/site.json → redirects` |
| Footer links, contact details, socials, trust badges | `store/site.json → footer`, `contact`, `trust` |

Content pages start with a small settings comment and can use shortcodes:

```html
<!-- { "title": "Bridal", "intro": "…", "image": "/assets/images/…" } -->
<h2>Heading</h2>
<p>Text…</p>
{{products collection="tennis" limit="4"}}
{{button label="Book an appointment" href="/pages/contact/"}}
{{contact}}  {{contact-form}}  {{image src="/assets/…" alt="…" caption="…"}}
```

## Checkout: order requests or Stripe

`store/site.json → checkout.mode`

- **`"request"`** (current): the bag becomes an **order request** — customers send their pieces, options and contact details (Netlify form `order-request`), and you confirm availability, sizing, timing and final price in writing before taking payment.
- **`"stripe"`**: instant card checkout. Set `STRIPE_SECRET_KEY` in Netlify → Site settings → Environment variables. Prices are always recalculated on the server from `netlify/functions/lib/catalog.json` (generated by the build), never trusted from the browser.

## Forms

All forms are Netlify Forms: `order-request`, `product-inquiry`, `custom-request` (Design Studio, with the design image attached), `contact`, `vip-welcome` (newsletter). Submissions appear in Netlify → Forms. If Twilio variables are set (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_TO_PHONE`, and `TWILIO_FROM_PHONE` or `TWILIO_MESSAGING_SERVICE_SID`), `netlify/functions/submission-created.js` texts you a summary of every submission.

## The 3D Design Studio

Lives at `/design-studio/`. The engine is `assets/js/designer.js` (Three.js) plus `assets/js/ar-tryon.js` for camera try-on; its markup is `src/studio/studio-markup.html`. The storefront wraps it with the site header/footer, a custom-request form it fills automatically (“Send design to request form” attaches a rendered image), and a studio stylesheet generated from the original CSS (`src/lib/legacy-css.mjs`, re-coloured to the brand).

Any product with a `studio` field links into the studio with its settings (e.g. `?piece=Ring&shape=Oval&setting=Bezel`). The studio stamps `brand.monogram` as the hallmark inside rings.

### Virtual try-on (AR)

Every product with a `studio` field gets a **Try it on** button (on the photo, under Add to bag, and in quick view). It opens `/design-studio/?…&tryon=1&product=<slug>`, which goes straight to the camera with the product's name, only the metals the product is made in (`metals`), and returns to the product page when closed. Rings track the hand, bracelets the wrist, earrings the face and necklaces the shoulders.

- **Runs on the device, nothing uploaded.** Google MediaPipe runs in a Web Worker so the page stays smooth. Everything is self-hosted: the library in `assets/vendor/mediapipe-0.10.14/`, the models in `assets/models/` (checksums in `SHA256SUMS.txt`; `scripts/fetch-ar-models.sh` downloads them again). A public CDN is used only as a fallback.
- **Experience** (`assets/js/ar/experience.js`): an intro screen with tips, **Use a photo instead** (no camera needed), metal/stone swatches that swap live without losing the fit, a before/after **Compare** slider, and a shutter that saves or shares a branded photo.
- **Camera-matched realism**: metal and diamonds reflect the real room and follow its white balance (`ar/camera-environment.js`); the piece gets the camera's own grain, lens softness and motion blur, plus a soft shadow on the skin (`ar/camera-match.js`).
- **Realism**: diamond glints that follow real facet/light geometry (`ar/glints.js`); hair in front of earrings or a necklace, and a hand raised in front of a necklace, hide the jewellery behind them (`ar/hair-occlusion.js`); the piece fades instead of blinking when tracking drops; true-to-scale sizing anchored to an adult hand.
- Shoppers can fine-tune the fit with **Adjust**. It is a visual preview, not a sizing tool.

Detailed studio, AR, Blender render and test notes: [docs/README-v1.md](docs/README-v1.md) and `docs/ar-*.md`.

## Deploy

**Netlify (recommended):** connect the GitHub repo. `netlify.toml` already sets build command `npm run build` and publish directory `dist`. Every push rebuilds the site.

Any static host works too: run `npm run build` and upload `dist/`. (Forms and checkout need Netlify.)

## White-label in 5 minutes

1. `store/site.json` → `brand` (name, logo text or `logoImage`, monogram, URL, currency), `theme.colors`, `theme.fonts`, `contact`, `footer`.
2. Replace the products in `store/products/` and images referenced in `store/home.json` / `store/collections.json`.
3. Update `store/pages/*.html` (About, policies).
4. `npm run build`.

Colours are applied as CSS variables, the favicon is generated from the monogram, and the designer’s screenshots and hallmark pick up the new brand automatically.
