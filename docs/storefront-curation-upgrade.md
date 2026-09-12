# Storefront curation refinement — 11 September 2026

This pass builds on the earlier [editorial upgrade](storefront-editorial-upgrade.md). It gives Toronto Jewels Curation a more distinctive visual identity, a useful personal discovery tool, and clearer product decisions. The earlier report remains a record of its own work and validation.

## Design and implementation

- **A more recognizable storefront.** `assets/css/curation.css` adds warm paper, plum, and rose tones across all 33 static pages. The homepage combines a dark photographic campaign, generous typography, a selected collection, a Rise Ring story and finish study, category photography, bespoke work, estate pieces, journal links, and consultation booking. The shared footer gains a “Made personal.” signature through `assets/js/curation.js`.
- **Personal discovery.** A native dialog on Home and Shop recommends up to three catalogue pieces from jewellery type and budget preferences. CAD budget choices use published or starting prices; inquiry-only and USD pieces remain available under “Any budget.” No signup is required. Results link to existing product pages, and empty selections lead to a custom request with the chosen piece type. The mobile dialog has a sticky close header, explicit width limits, and shorter “All jewellery” and “Any budget” labels.
- **A clearer collection.** Shorter card titles and material summaries improve scanning while full product names remain on detail pages. The shop retains combined category, text, and price filters, currency-aware sorting, shareable filter URLs, saved pieces, and grid/list views. Price-label fallbacks now state CAD or USD explicitly.
- **Product detail hierarchy.** `assets/css/product-refinement.css` places complete product photography beside a clearer title, price, materials, actions, and ordering note. Numbered image choices, story/specification/care anchors, and delivery-policy links support closer inspection. The Rise Ring opens on its polished product image in both static HTML and the browser catalogue. Its full H1 remains intact, with the diamond designation styled at a smaller size. Finish-study controls remain visual previews, not order-option selections.
- **Interaction reliability.** The bag retains keyboard focus after quantity changes and removal, contains focus while open, and restores the opener on close. Estate appointment dialogs now isolate background interaction and restore focus. Form drafts are separated by form, identifiable legacy drafts migrate to the matching form, and unrelated drafts survive submission. Form status and failure recovery are clearer. FAQ buttons expose expanded state; long answers are not height-capped.
- **Progressive enhancement.** The new styling removes legacy reveal blur and hidden states so content remains readable during fast scrolling and without JavaScript. Static product content, image links, catalogue/category links, and mobile navigation remain available. FAQ answers are readable without JavaScript. The header is opaque, and motion is reduced where requested.

## Verification performed

Final static checks passed against the current files:

- All 33 HTML pages: local asset/link/anchor targets, duplicate IDs, and shared stylesheet/script inclusion order; all 28 JSON-LD blocks parsed.
- All 11 product destinations and 45 catalogue image references exist.
- Five shop-budget cases, three text-search cases, two currency-grouped sorting cases, and eight personal-finder cases passed. CAD/USD price-label fallbacks and the Rise Ring's static/catalogue opening-image agreement also passed.
- `node --check assets/js/main.js`, `node --check assets/js/curation.js`, and `git diff --check` passed.

The isolated journey audit passed 32 assertions before the final presentation refinements. It covered bag focus and totals, gallery selection state, estate-dialog keyboard behavior, form-draft isolation and migration, FAQ behavior, and form success/failure handling with mocked responses. External POST requests were intercepted, and camera acquisition was blocked. This audit did not verify a real checkout or form delivery.

The final live browser review checked Home and Shop at 320, 390, 768, 1024, and 1440 CSS pixels, with no horizontal overflow or broken loaded images, and the product page at 320 pixels and desktop width. It exercised the personal finder at the $1,500 budget, the empty earrings result, Escape and opener-focus restoration, product gallery view 2, and a two-Rise-Ring bag total of $4,400 CAD followed by removal. Shop search returned the correct monogram ring; the custom inquiry retained its Ring prefill at 320 pixels without overflow. The existing 3D studio opened and visibly rendered its ring without console errors or warnings; no camera was used. The complete isolated suite was not rerun after the last presentation changes; those received focused live review and the final static checks above.

## Remaining release work

1. Verify checkout sessions, payment outcomes, server/browser catalogue agreement, and form receipt in the deployment environment. Mocked responses and local bag arithmetic do not establish delivery or payment reliability.
2. Resolve the existing order-terms contradiction with the business: `shipping-returns.html` promises written terms before payment or commitment, while some product ordering text says size, colour, timing, or delivery will be confirmed after checkout, and those products expose immediate checkout actions. Decide which details must be agreed before payment and align product copy, policy, and checkout behavior. This pass did not invent commercial terms.
3. Qualify camera try-on separately on real devices with permission. Camera behavior, iOS/Android coverage, screen-reader journeys, production performance, and fulfilment were not certified by this storefront pass.

The result is a substantial local design and usability improvement. “Best in the world” remains an ambition that requires production reliability, consistent photography, clear commercial terms, and measured customer outcomes; it is not a claim established by these checks.
