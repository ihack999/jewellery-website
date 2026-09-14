# The interactive atelier — 14 September 2026

The storefront now connects editorial browsing, a guided personal edit, saved pieces and an optional 3D material study. The existing burgundy, cream and serif identity continues across all 34 public pages.

## Customer experience

- Page entrances keep the header steady while incoming content appears. Hero text, editorial sections and product cards enter with short, restrained motion. Fine-pointer product photos respond subtly to movement; buttons provide press feedback. Ordinary links and page content remain available without the enhancements.
- The homepage's floating chapter navigation connects Discover, The edit, 3D atelier and Your story. The heart opens a shared saved-piece drawer on customer pages, using the existing favourites. It supports saving, removal, actual catalogue prices, cross-page persistence and an explicit copy-to-clipboard action.
- The personal finder has three steps: mood, category/budget, and matching pieces. Mood changes the order of real catalogue matches; category and CAD budget remain strict filters. Empty results offer another budget or a custom conversation.
- The 3D atelier opens only when requested. A purpose-built bezel-ring concept can be dragged, pinched, zoomed, reset or inspected with keyboard arrows. Choose yellow/white/rose gold, mirror polish/soft satin, and daylight/after-hours lighting. The full editor receives those selections through its existing design URL.
- The study uses the existing conductor metal references, physically based lighting and ray-based diamond material. It is an illustrative starting point, not a digital replica of a saleable catalogue item or manufacturing-ready model.

## Motion and rendering

`experience.css` and `experience.js` provide the shared enhancements; `curation.js` owns the existing finder. `material-study.js` is a separate lazy module, so the full designer and Three.js are not downloaded for ordinary homepage browsing.

The study caps its drawing buffer at 650,000 pixels, stops GPU rendering while paused, offscreen or in a hidden document, and redraws on changes. It releases geometry, materials, diamond acceleration structures, reflection targets, listeners and its graphics context when leaving. Interrupted startup cannot replace a restored page. Missing HDR lighting falls back to a procedural environment; graphics failure preserves the selected design route and offers retry.

Reduced motion cancels entrance animations and automatic rotation. Touch controls meet a 44px minimum. Native dialogs manage keyboard containment, Escape and restored focus. Floating controls make room for the full editor and open navigation/dialogs; toast messages sit above the dock.

Page arrival uses progressive Web Animations on incoming content. Direct links to forms/studio and back/forward restoration keep their location immediately. Normal navigation is never delayed or intercepted, and application errors are not globally suppressed. Browser page-snapshot transitions were excluded after regression testing found intermittent cancellation during rapid enquiry handoffs.

Implementation references: [MDN Web Animations](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) and [Three.js renderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html). The local Three.js r164 implementation remains the authority for APIs used here.

## Generated artwork and provenance

Generated with the **built-in image-generation tool**. No CLI or external API key was used. The abstract gold ribbon is atmospheric artwork; existing catalogue and wearer photographs remain intact. Responsive WebP encoding changes format and size only.

Saved assets:

- [Original generated PNG](../assets/images/experience/material-ribbon-source.png), 1536 × 1024.
- [480px WebP](../assets/images/experience/material-ribbon-480.webp), 10,120 bytes.
- [768px WebP](../assets/images/experience/material-ribbon-768.webp), 23,376 bytes.
- [1280px WebP](../assets/images/experience/material-ribbon-1280.webp), 60,508 bytes.

Final generation prompt:

> Use case: stylized-concept. Asset type: atmospheric editorial image for the interactive material atelier of Toronto Jewels Curation, a warm refined fine-jewellery website. Create a breathtaking photoreal macro sculpture of a single broad ribbon of softly brushed champagne gold curling through black-cherry and espresso darkness, with one deep garnet-red silk fold at the lower edge. Abstract material study, NOT a saleable jewellery product: no ring, no diamonds, no clasp, no people. The golden ribbon enters at lower left, twists gracefully through the centre and leaves toward the upper right, very sculptural and dimensional; deep negative space especially on the left-middle to support HTML text. Cinematic large softbox reflections, rich dark reflections and fine tactile surface grain, very restrained warm light, luminous highlights without clipped whites, subtle depth of field. Landscape 3:2 composition, high-end art direction, perfectly clean. No text, no logo, no watermark, no frame.

## Validation

The disposable browser runner denies camera/microphone access and blocks external submissions. Run `node scripts/check_journeys.mjs --experience` for viewport layouts, lazy loading, the finder, saved pieces, actual WebGL rendering, drag/pinch, pause/resume, graphics loss, retry, missing HDR, interrupted startup and the full-editor handoff. Set `TJC_SCREENSHOT_DIR=/private/tmp` to save visual review captures.

Passing checks:

- Experience: 46 assertions, no runtime errors; desktop and 320/390/430px layouts, plus a 3× phone drawing-buffer check.
- Mobile storefront: 221 assertions.
- Customer journeys: 41 assertions.
- Keyboard, focus, reduced motion and zoom: 16 assertions.
- Mobile editor recovery, framing and export: 58 assertions.
- Static validation: 34 pages, 2,161 local references and 29 JSON-LD blocks; no errors.

Visual review includes the homepage, phone invitation, guided finder, saved drawer, rose-gold satin and white-gold polished 3D renders, and the phone viewer. These checks use disposable Chrome and synthetic input. Physical iPhone Safari GPU/gesture qualification and deployment remain separate from this local implementation.

## Local performance observations

The shared CSS/JS additions, including the finder changes, add approximately **10.5 KB gzip** over the previous bundle. This excludes HTML and the lazy poster image. The original generated PNG is not referenced by the page; responsive WebP downloads range from 10–61 KB. Three.js, the diamond module and HDR lighting load only after opening the study.

The updated [performance report](performance-lab.json) records three unthrottled local gzip samples at each width, with cache disabled. All six had no failed requests, no horizontal overflow and loaded the local fonts. Phone CLS was 0 throughout; desktop CLS was approximately 0.00142. Median local LCP was 60 ms at 390px and 52 ms at 1440px, versus 68/52 ms in the previous recorded run. Those small differences are within the noise of this local method; this is not a production speed score, an actual iPhone measurement or evidence of improved Core Web Vitals.
