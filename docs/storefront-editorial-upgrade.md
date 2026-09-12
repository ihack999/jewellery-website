# Editorial storefront upgrade — 11 September 2026

## Audit

The strongest existing assets were the actual jewellery photography, crawlable product pages, personal consultation flow, and substantial 3D studio. The presentation competed with those strengths:

- The automatic welcome drawer covered the first visit before visitors could see the collection.
- The homepage repeated similar photography, messages, and calls to action across a very long page.
- A large shop hero and multiple introductory sections pushed actual products below the first screen.
- Layered gradients, shadows, card treatments, and magnetic/tilting effects created an inconsistent visual identity.
- Catalogue search, mobile navigation, and the welcome drawer needed stronger keyboard and focus handling.
- Related products were chosen by catalogue order rather than relevance.

## Implemented

### Art direction and discovery

- A warm ivory, olive-black, and muted gold editorial identity, shared across all 33 static pages through `assets/css/atelier.css`.
- A photographic homepage with a clear collection action, four-piece curated edit, interactive category selection, a polished/satin Rise Ring finish study, jewellery categories, bespoke studio entry, estate story, journal, and retained consultation booking.
- The finish study changes photography only. It does not silently change the product, bag, price, or selected order finish.
- Cleaner product cards with full, uncropped product images, accessible image selectors, saved pieces, comparison, quick view, and local-bag actions.
- Related products ranked by jewellery category, estate status, and currency. Saved and recently viewed shelves no longer displace the catalogue above the grid.

### A usable collection, not just a grid

- Combined jewellery-type, multi-term text, and price-range filtering.
- Explicit CAD price buckets, an inquiry-only option, and currency-grouped price sorting. USD prices are not treated as CAD equivalents. Ranges use published or starting prices, not a final bespoke quote.
- Shareable `category`, `q`, `price`, and `sort` URL parameters; validated initial state; browser Back/Forward restoration; unrelated query parameters preserved.
- Remembered grid/list preference, active-filter summary, result announcements, and an empty state with clear-filter and bespoke alternatives.
- Compact mobile discovery controls and a shorter collection introduction.

### Calm, accessible interaction

- No automatically opened welcome offer. The existing signup is available deliberately from the footer.
- Visible search close control, multi-term matching, combobox/listbox keyboard navigation, safe empty results, focus containment, inert background, and focus restoration.
- Full-width mobile navigation positioned below the actual header, Escape handling, a focus loop, background scroll locking, and restored background interaction on close or desktop resize.
- Visible keyboard focus, reduced-motion support, and removal of product-card tilt/magnetic button effects in the editorial experience.
- Static catalogue/product content and category links remain usable without JavaScript. Mobile navigation has a no-JavaScript fallback; the finish-study buttons enable only when their handler is ready.
- Studio deep links scroll to the studio after its hidden section becomes available. Loading failures provide a recovery message.

## Validation

- `node --check assets/js/main.js` and `git diff --check`.
- Static checks across 33 HTML pages: one main landmark and H1 per page, no duplicate IDs, valid JSON-LD, and existing local image/link targets.
- 92 passing isolated Chromium assertions covering filtering, currency-aware sorting, URL restoration, saving, local bag addition, quick view, comparison selection, product lightbox, homepage finish/category controls, manual signup, keyboard search/navigation, reduced motion, and no-JavaScript content.
- Homepage, shop, Rise Ring product page, custom page, and rings category checked at 320, 390, 768, 1024, and 1440 CSS pixels without horizontal page overflow.
- No runtime exceptions or HTTP error responses in that regression run. Visual review of desktop/mobile entry points, product presentation, menu, signature story, bespoke section, and booking.
- 3D remains unloaded on normal storefront visits. Opening the studio requests its module without loading AR.
- A final focused pass also checked mobile About, Contact, Estate, and Journal pages, the compact 320/390px shop layout, and successful studio initialization and deep-link positioning. Those checks passed without page overflow or runtime exceptions.

These are local browser checks, not production Core Web Vitals, screen-reader certification, or real-device qualification. The isolated browser denied camera and microphone permissions and blocked media acquisition before navigation. No real-camera testing, checkout session, form submission, deployment, or changes to the jewellery/AR rendering implementation were performed.

## Next quality gates

1. **Real-device qualification:** iOS Safari, Android Chrome, keyboard-only and screen-reader journeys; 200% zoom; slower connections and lower-end devices. Camera tests require fresh, explicit permission.
2. **Production measurement:** field LCP, INP, and CLS, image transfer budgets, server caching, and conversion drop-off. Do not infer a Lighthouse or performance score from these local checks.
3. **Commercial verification:** confirm published prices, availability, gemstone documentation, warranty/resizing coverage, the welcome offer, and delivery/return terms with the business before launch. Existing business claims and checkout prices were not rewritten in this pass.
4. **Photography consistency:** commission matched-scale, colour-managed product angles and worn references for every SKU; preserve honest stone colours and the complete piece silhouette.
5. **Content and architecture:** edit remaining legacy landing-page copy and consolidate the older CSS layers incrementally. Keep static catalogue descriptions and the browser/server checkout catalogues synchronized when products change.
6. **End-to-end release check:** explicitly authorize test-mode checkout and Netlify form verification in the deployment environment before publishing.

A strong visual redesign is one part of a world-class jewellery experience. Production reliability, truthful product information, photography quality, fulfilment, and measured customer outcomes still need ongoing verification.
