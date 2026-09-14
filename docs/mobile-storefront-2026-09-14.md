# Mobile storefront repairs — 14 September 2026

The reported iPhone screenshots showed platform-rendered emoji replacing the decorative asterisk and diagonal arrows. The storefront now uses fixed-size, current-colour SVGs in static pages and JavaScript-created controls. The invitation ornament is restrained and clipped behind its content.

## Layout and interaction

- Product cards now contain their photo choices and purchase controls. An inherited `height: 100%` on the product link had pushed these controls below their card, over subsequent rows and the invitation.
- The invitation uses `overflow: clip`. Its oversized ornament previously created a hidden scroll container: focusing or scrolling a nested button could scroll the heading and eyebrow out of the frame. Regression checks explicitly cover this case.
- The phone hero is more compact, header buttons have 44px targets, and mobile form controls have 16px text. Safe-area spacing and dynamic viewport bounds protect navigation, the bag, galleries, and the finder.
- Search listens to the visual viewport while open, so its results and close control fit when the available screen height changes. Listeners are removed on close; pinch zoom remains available.
- Product-page, quick-view, and full-screen galleries accept horizontal touch swipes. Vertical scrolling, cancelled gestures, and additional touch pointers do not advance the photo. A swipe does not also activate the image's zoom action.
- Image changes animate after decoding, with stale selections ignored. The finder has a short entrance/results animation, buttons have press feedback, and vector arrows respond to desktop hover. Reduced-motion preferences disable the new motion. Page content remains visible without reveal animations or JavaScript.
- Repeated Add to bag taps reset one feedback timer and restore the original label and SVG.

## Loading and scrolling

There are 278 responsive WebP variants for 56 existing photographs. Small cards, search results, thumbnails, and the personal finder select appropriate image widths. Static HTML and dynamic image changes use the same manifest; finish changes update `srcset` as well as `src`. Full-screen viewing keeps the original photo. Original photography is unchanged.

The optional Pillow build script applies source orientation and colour profiles, preserves alpha, and uses source-content hashes to avoid stale CDN copies after photo replacement. It removes only superseded variants referenced by the previous generated manifest.

The existing Cormorant Garamond and Manrope Latin fonts are now served locally; their upstream SIL OFL notices and source URLs are included. The two principal fonts are preloaded. Ordinary browsing still does not load the studio, Three.js, or camera models.

Scroll progress now updates a transform on its own element, using cached page dimensions refreshed by ResizeObserver. It no longer changes an inherited root variable or reads document height on each scroll frame. Touch devices skip legacy hero parallax, and opaque header/mobile caption surfaces avoid unnecessary backdrop blur.

## Measurements

Three cold-cache samples per width, a local gzip server, unthrottled Chrome, DPR 1, and a four-second initial-load window. [Comparison data](mobile-performance-comparison-2026-09-14.json) and [latest full report](performance-lab.json) retain the method and limits.

| Metric | 390px before → after | 1440px before → after |
|---|---:|---:|
| Median homepage image bytes | 247,635 → 117,407 (53% less) | 917,517 → 247,163 (73% less) |
| Median lab LCP | 156 → 68 ms | 212 → 52 ms |
| Maximum sampled CLS | 0 → 0 | 0.0023 → 0.0069 |
| External font hosts requested | 2 → 0 | 2 → 0 |

These are local measurements, not production Web Vitals or promised phone timings. The baseline Resource Timing report omitted external font binary bytes; after self-hosting it includes font bytes. Consequently total resource-byte figures are not directly comparable across that change. The image-only comparison uses the same measurement scope. Desktop layout shift remains small but did not improve in every sample.

## Verification and limits

- `python3 scripts/check_static.py`: 34 pages, 2,086 local references, 29 JSON-LD blocks; no errors.
- `node scripts/check_journeys.mjs --mobile-site`: 221 assertions at 320, 375, 390, 430, 844 landscape, and 1440px. Covers overflow, card containment, invitation clipping, touch targets, form sizes, finder/menu bounds and focus, swiping versus vertical scroll, rapid image changes, search resizing, local photo selection, and reduced motion.
- `node scripts/check_journeys.mjs`: 41 existing shopping/inquiry assertions; no runtime errors.
- `node scripts/check_journeys.mjs --accessibility`: 16 checks, including enlarged-page and reduced-motion cases.
- JavaScript syntax and `git diff --check` pass. Phone screenshots of the hero and invitation were visually reviewed. Screenshots are written to `/private/tmp/tjc-mobile-*.png` by the focused suite.

Tests use disposable Chrome touch emulation, not physical iPhone Safari. Safari browser chrome, the actual iOS keyboard, and real-device scroll performance still need device qualification. No camera access, external form delivery, payment, or deployment was performed.

Technical references: [WebKit viewport units](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/), [responsive image selection](https://web.dev/learn/design/responsive-images), [CSS clipping versus scroll containers](https://drafts.csswg.org/css-overflow-3/#valdef-overflow-clip), and [visual viewport/keyboard behavior](https://developer.chrome.com/blog/viewport-resize-behavior).
