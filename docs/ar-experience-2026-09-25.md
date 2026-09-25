# AR try-on — experience, realism and product launch (2026-09-25)

## What changed

**Tracking speed & stability**
- MediaPipe tasks-vision 0.10.14 and all models are self-hosted (`assets/vendor/mediapipe-0.10.14/`, `assets/models/`). The CDN is only a fallback (`CDN_FALLBACK` in `ar-tryon.js`).
- The tracking worker is a module worker; MediaPipe calls `importScripts()`, which module workers lack. A small shim at the top of `ar-tracking-worker.js` loads the script synchronously, so inference really runs off the main thread (before, the worker failed to start and tracking silently fell back to the main thread).
- Photo mode ignores frame staleness (a still image never goes stale), so slow devices still get a stable fit.
- `palmScale()` (`ar/body-fit.js`) keeps the world model's hand shape but anchors knuckle breadth to 66–92 mm unless the shopper measured it. On a foreshortened back-of-hand the world model reported a 2.4 cm hand, which made bracelets render about 3.5× too large. Rings were also too large.
- Without an elbow in view, the bracelet's forearm pitch comes from the palm, which includes wrist flexion. It is now damped by 0.6× and clamped to ±40°.

**Premium experience** (`ar/experience.js`)
- Intro screen: line-art guide per piece, tips, loading progress, **Start camera** or **Use a photo instead**, and a privacy line.
- Dock: live metal and stone swatches (`applyDesignChange()` rebuilds the piece and keeps its pose), a before/after **Compare** slider, a shutter with a watermarked JPEG, and **Save**/**Share** (Web Share with a file).
- A silhouette guide appears after 0.9 s without a target. The piece fades out (canvas opacity) instead of blinking.
- Photo mode letterboxes the photo to the stage aspect ratio, so ears and fingers aren't cropped off.

**Realism**
- `ar/glints.js`: per-gem crown-facet normals are tested against the key and fill lights every frame. Aligned facets flash small additive stars, so the stones sparkle as the hand moves.
- `ar/hair-occlusion.js`: runs after the jewellery render and erases jewellery pixels (custom blending) where:
  - the hair segmenter mask covers a necklace, or covers an earring whose lobe is itself under hair;
  - a forearm or hand capsule from the pose model sits more than about 6 cm in front of the shoulder plane (necklace only).
- Render resolution follows camera sharpness.

**Try on from every product**
- A product with `studio` gets `[data-tryon]` links on the PDP (a gallery pill and a button) and in quick view. The link is `/design-studio/?<studio>&metal=<product metal>&tryon=1&product=<slug>`.
  - The metal currently selected on the product form is copied into the link on click.
  - Hovering or touching the link prefetches the AR modules, WASM and the model for that piece.
- `studio-page.js`:
  - `tryon=1` shows a full-screen cover at first paint (an inline head script adds `html.is-tryon-launch`).
  - It reads `/products.json` (`tryon`, `tryonMetals`) and sets `window.__arContext` (title, metals, no stone rail, share text, and `onClose` that returns to the product).
  - It then waits for the designer and opens the try-on.
- On `/design-studio/` itself, the metal and stone picked in the try-on are copied back to the studio controls (`onVariant`).

## Verified (Chromium + SwiftShader harness, fake camera / photo)
- Onboarding, launch cover, product title and metal rail, return to the product on close, and metal sync to the studio.
- Photo mode for all four pieces:
  - A stud lands on the visible lobe.
  - A necklace is hidden behind a raised hand.
  - A tennis bracelet sits at the wrist at believable size.
  - A ring sits at the base of the ring finger.
- Existing assertion suites pass: `scripts/check_ar_{body_fit,tracking,placement,contact,render,lighting}.mjs`.

SwiftShader is too slow to judge live tracking smoothness, so test on real phones (iOS Safari and Android Chrome) before launch.
