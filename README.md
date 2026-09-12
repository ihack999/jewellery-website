# Toronto Jewels Curation Website

Static, Netlify-ready website for Toronto Jewels Curation with crawlable collection, category, product, custom-service, and trust pages.

## Pages
- `index.html` - homepage
- `shop.html` - crawlable collection grid with enhanced client-side filtering
- `rings/`, `necklaces/`, `bracelets/`, `earrings/` - indexable category landing pages
- `products/*/` - static, indexable product detail pages with Product structured data
- `customs.html` - custom-made consultation and jewellery editor page
- `custom-jewellery-toronto/` - custom jewellery service landing page
- `custom-engagement-rings-toronto/` - custom engagement ring landing page
- `curated-luxuries.html` - Estate Luxuries appointment catalogue
- `about.html` - brand story and direction
- `contact.html` - direct contact and inquiry form
- `jewellery-care.html`, `shipping-returns.html`, `privacy.html` - customer information and trust pages
- `404.html` - custom not-found page
- `robots.txt` and `sitemap.xml` - crawler discovery files

## Run Locally

No install step is required. Run from the `jewellery-website` directory that contains `index.html`. If your terminal opens in the outer workspace folder, first run `cd jewellery-website`. Serving the outer folder breaks root-relative assets and product links.

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open `http://localhost:8000`.

## Personal Curation Storefront

The latest pass adds a plum-and-ivory visual identity, a photographic campaign homepage, a personal edit finder, a polished-first Rise Ring gallery, clearer product pages, and more reliable keyboard/dialog/form behavior. `assets/css/curation.css` and `assets/js/curation.js` enhance all public pages; product pages also load `assets/css/product-refinement.css`.

See the [curation design decisions, verified checks, and remaining launch work](docs/storefront-curation-upgrade.md). The existing Netlify, Stripe, and 3D/AR integrations remain in place.

## Editorial Storefront

The storefront uses a warm editorial design with a curated homepage, photographic finish study, compact catalogue discovery, and improved keyboard/mobile navigation. `assets/css/atelier.css` layers the shared visual system over the existing stylesheet; all public static pages load it.

The shop combines category, text, and CAD price filters with currency-aware sorting and shareable URLs, for example `/shop.html?category=rings&price=1500-3000&sort=price-low`. Product content and navigation remain available without JavaScript. Signup opens only when requested from the footer, not automatically.

See the [storefront audit, implementation, validation, and remaining quality gates](docs/storefront-editorial-upgrade.md). The existing studio/AR work remains intact. Camera testing always requires fresh permission.

## Jewellery Generator V3.2 Advanced Studio

Open `http://localhost:8000/customs.html#design-studio`.

- **Create Variation:** choose an artistic direction and seed; lock the stone, metal, or structure while exploring alternatives.
- **Extras & precision:** choose internal gemstone ray tracing or fast raster transmission; tune bounce budget, dispersion, absorption, inclusions and physical surface detail. Enter measured dimensions with cut-conflict diagnostics.
- **More actions:** undo/redo, editable versioned JSON, high-resolution PNG, metre-scale GLB and a downloadable background-worker mesh audit.
- **Advanced studio output:** export a self-contained Blender Cycles job with resolution, samples, camera, background, macro depth of field and optional three-band dispersion.
- All 13 centre-stone outlines now have closed planar-facet geometry. Round melee use independent cut proportions; tapered prongs and open-path sweeps have capped ends.
- **V3.1 repairs:** richer coloured-gem absorption, separate translucent opal/moonstone materials, inclusion-aware gem rays, restrained photographic lighting, adjustable textured bronze patina and frame-rate-independent damped sway.
- **V3.2 construction:** full-depth diamond or matching-colour ring accents on the outer shoulders, complete linked necklaces with real-scale bails and closures, and rebuilt oval bangles, tapered cuffs, articulated tennis and chain-station bracelets.
- Necklace **Macro** focuses on the pendant/station rather than enlarging the empty middle of the chain. Bracelet length, section, stone diameter and cuff opening have separate millimetre controls. Irrelevant ring controls are disabled.
- Prongs are fitted against actual rotated/tilted stone facets, with a contact report in **Extras & precision**. Unresolved prong–gem intersections block GLB/Cycles export.
- Preview meshes, material presets, and parameter checks are **not manufacturing certification**. Side stones now have complete faceted volumes, including tapered baguettes; seats, joints and clasps remain component-based visual constructions, not boolean-cut production CAD.

With Blender installed, render the downloaded job locally:

```bash
blender --background --factory-startup --python-exit-code 1 --python scripts/render_jewellery.py -- /path/to/design.cycles.glb --output renders/my-design
```

Use `--resolution 512 --samples 64 --device cpu` for a small proof. Output directories must be empty. The renderer produces a 16-bit PNG, scene-linear EXR, editable Blender scene and provenance manifest. This is a local CLI workflow, not a hosted render queue.

See [V3.2 construction and research notes](docs/generator-v3.2-construction.md), [advanced rendering details and limitations](docs/generator-v3-advanced.md), the [V2 foundation record](docs/generator-v2-foundation.md), and the [full roadmap](docs/jewellery-generator-upgrade-plan.md). Full spectral calibration and production CAD remain future work.

### AR V1 wearable fitting

AR now uses metre-normalised full models, stable hand selection, independent earring anchors, three-dimensional necklace wear paths, bounded pendant motion, and camera-background transmission. Coloured-stone absorption stays consistent across physical and display scales. Camera cancellation, opt-in placement storage, freeze/adjust, and diagnostics are included.

The follow-up fitting pass adds capture-timestamp smoothing, motion-spike rejection, tracked face-depth occlusion, rounded neck wraps, automatic/manual neck-base placement, and length-preserving tennis/station bracelet fitting with an optional wrist-width reference. These corrections are checked with synthetic inputs; real-camera verification requires fresh permission.

Try-on remains an **approximate appearance preview, not a sizing guarantee**. See [implemented features and validation limits](docs/ar-tryon-v1.md) and the [remaining AR upgrade roadmap](docs/ar-tryon-upgrade-plan.md). Hair/clothing segmentation, more advanced body fitting, and real-mobile qualification remain outstanding.

## Deploy to Netlify

This site is ready for static hosting on Netlify.

Option 1: Drag and drop deploy

```bash
zip -r jewellery-website-netlify.zip . -x ".git/*" ".github/*" "renders/*" "*/__pycache__/*" "jewellery-website-netlify.zip"
```

Then upload the zip at `https://app.netlify.com/drop`.

Option 2: Import from GitHub

- Publish directory: `.`
- Build command: leave empty

## Twilio SMS Setup

The site can send an SMS after a successful form submission using a Netlify Function and Twilio.

Add these environment variables in the Netlify site settings before using SMS notifications:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_TO_PHONE` - destination phone number in E.164 format, for example `+14164518578`
- One of the following:
	- `TWILIO_FROM_PHONE` - your Twilio phone number in E.164 format
	- `TWILIO_MESSAGING_SERVICE_SID` - if you send through a Twilio Messaging Service

After adding the variables, redeploy the site from Netlify or with the Netlify CLI.

## Project Structure

```text
assets/
	css/styles.css
	css/atelier.css
	js/main.js
	js/designer.js
	js/ar-tryon.js
	images/
netlify/
	functions/send-sms.js
index.html
shop.html
customs.html
curated-luxuries.html
about.html
contact.html
robots.txt
sitemap.xml
```

## Notes

- Canonical URLs, Open Graph URLs, structured data, `robots.txt`, and `sitemap.xml` currently use `https://torontojewelscuration.com`. Update them together if the production hostname changes.
- Product pages are static so names, descriptions, images, pricing, and links remain available without JavaScript. `assets/js/main.js` progressively adds galleries, saved pieces, comparison, and recently viewed tools.
- Legacy `product.html?slug=...` URLs are permanently redirected to clean `/products/.../` URLs in `netlify.toml`; the generic product shell is `noindex` as a fallback.
- The large custom design preview and AR modules load only when a visitor opens those features.
- Looping videos use poster images and begin loading near the viewport rather than on initial page load.
- The forms submit to Netlify and can email notifications through Netlify form hooks.
- SMS alerts require Twilio credentials in Netlify environment variables.
- Published-price pieces use a shopping bag and prefilled order enquiry. All orders require written confirmation before payment; public Stripe session creation is currently blocked.

## Payment status

The public checkout endpoint returns HTTP 409 until an approved-order payment process is implemented. Setting a Stripe key does not enable checkout. Existing session verification remains available; live payment and enquiry delivery still require qualification. Keep the retained server catalogue aligned with published product facts.

## Local regression checks

Run `python3 scripts/check_static.py` from the site directory. Python 3 is the only dependency; no server, credentials, or network access is needed. The command returns nonzero for broken local links/assets/anchors, duplicate IDs, or invalid JSON-LD. It checks HTML `href`, `src`, `poster`, and ordinary `srcset` references.

Run the combined suite with `node scripts/check_journeys.mjs` (Node 22+, Python 3, and Chrome). On macOS it finds Chrome in Applications; elsewhere it uses `google-chrome`. Set `CHROME_BIN` to override the executable path.

The combined command runs the static checks, starts a loopback server on a free port, and launches a disposable headless Chrome profile. It checks bag totals/focus, gallery selection, finder filtering, draft migration/isolation, mocked form failure/retry, and product/bag enquiry handoff at desktop and 390px widths. External page requests are blocked, submissions receive mock responses, and camera/microphone access is denied. The server, browser, and test profile are removed on completion or test failure. Assertion failures return nonzero.

These checks do not qualify live enquiry delivery, payments, real-device AR, external links, or schema semantics. The static checker does not inspect CSS/JavaScript-created URLs.

## Local performance baseline

Run `node scripts/check_journeys.mjs --performance` to measure the homepage with local gzip compression and Google Fonts enabled. It records three samples at phone and desktop widths in `docs/performance-lab.json`. This command updates that report and requires network access to Google Fonts; it makes no form submissions. See [measurement method and limitations](docs/homepage-performance.md). It is a measurement mode, not the browser regression suite or a production performance score.

Run `node scripts/check_journeys.mjs --accessibility` for the focused keyboard, dialog, reduced-motion, phone-width, form-label, and 200% page-scale audit. It uses the same disposable browser and loopback server as the journey suite. See [the audit record](docs/accessibility-audit-2026-09-12.md); this does not replace real-device, screen-reader, or production testing.

Run `node scripts/check_journeys.mjs --screen-reader` for the Chrome accessibility-tree and 200% text-scaling audit across representative Home, Shop, product, and Custom Made pages. See [the semantic audit record](docs/accessibility-screen-reader-2026-09-12.md). It is a lab proxy and does not replace real screen readers or iOS/Android device testing.

Run `node scripts/check_design_session.mjs` for the dependency-free design-session reliability checks. It covers deterministic seeds and variations, locked fields, physical dimensions, undo/redo branching, v2 migration, v3 JSON round trips, version metadata, and malformed-document guards. It makes no network requests or browser changes.

Native Chrome review is recorded in [accessibility-native-2026-09-12.md](docs/accessibility-native-2026-09-12.md). Safari and Android coverage require connected, authorized device/browser access.
