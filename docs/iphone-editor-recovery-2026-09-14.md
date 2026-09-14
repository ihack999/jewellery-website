# iPhone editor rendering and recovery — 14 September 2026

The supplied iPhone screenshot matches `drawFallback()` in `assets/js/designer.js`: a 2D band outline and flat blue oval, rather than the Three.js jewellery. The exact exception on that phone is not available from the screenshot. Local inspection confirmed silent, permanent fallback after any initialization exception; an optional HDR-loader import on the critical path; desktop-first allocations on phones; unused texture canvases; and separate mobile framing/typography defects.

## Changes

- Start coarse-pointer/small-screen devices at DPR ≤ 1.5, with a 750,000-pixel drawing-buffer ceiling (including fullscreen). Use 1024² shadows and 384² reflections initially. Disable unnecessary default-framebuffer MSAA on mobile; the scene is rendered through the existing post-processing targets. Preserve full geometry, conductor metal materials and BVH gemstone optics, with the existing adaptive bounce budget. Recovery starts at DPR ≤ 1 and 256² reflections.
- Remove allocation of 17 unused 768² stone-body canvases and four unused 512² effect canvases. Their RGBA8 base backing stores alone represented approximately **42.25 MiB**; this is an allocation calculation, not a measured whole-process memory reduction. No current material consumed these maps.
- Load optional textures/environment concurrently and keep the HDR loader inside the optional environment path. If those requests fail, the 3D model still receives procedural environment lighting.
- Retry startup once automatically on a fresh canvas with reduced allocations. Dispose partial scenes, render targets, texture canvases, observers, animation and input handlers before retrying. Show an explicit simplified-preview notice with a 44px retry action when graphics remain unavailable.
- Preserve design state, undo history and shared AR/export builder availability across manual recovery. Handle real WebGL context loss/restoration. Disable 3D-dependent controls while unavailable. Store initialization/failure stages in root data attributes for diagnosis.
- Skip GPU rendering when the editor is hidden, offscreen, in a background document or superseded by AR. Observe stage size changes. Bound phone image exports to 1600px per dimension.
- Correct the fallback canvas aspect ratio and reserve space for its notice. Centre the jewellery in the dedicated viewer, compensate for narrow camera aspect ratios, shorten the oversized introduction and remove the mobile `8.5ch` heading constraint. Keep both expand and auto-balance controls usable without overlap.
- Refresh loader/cache URLs and make a failed studio module load retryable from the entry button.

At 390 × 844 with device scale factor 3, the default preview changed from a 696 × 880 buffer (612,480 pixels) to 522 × 582 (303,804 pixels), approximately **50% fewer pixels**. These are local Chrome viewport measurements, not iPhone FPS or battery claims.

## Verification

- `node scripts/check_journeys.mjs --studio-mobile`: **58 checks passed**, covering phone portrait/landscape layouts, all four jewellery types, retained gemstone optics, visible rendered pixels, hidden-editor GPU suspension, real `WEBGL_lose_context` loss/restoration, manual recovery, injected initial context/texture-allocation failures, blocked optional assets, fallback aspect ratio, preserved edits/undo, fullscreen, and PNG/GLB exports. Camera/microphone denied; network limited to local test resources; downloads intercepted.
- `node scripts/check_journeys.mjs --metals`: 142 checks, including 60 cathedral constructions and 63 metal/finish combinations.
- `node scripts/check_metals.mjs`: three groups covering 63 bands, conductor reflectance and finish response.
- `node scripts/check_journeys.mjs`: 41 customer-journey checks, mocked submissions only.
- Static checks: 34 pages, 2,086 local references, 29 JSON-LD blocks; no errors.

The mobile regressions emulate viewport/touch/DPR in Chrome; they do **not** establish actual iPhone Safari GPU compatibility. Physical iPhone startup, rotation, background/resume and thermal performance remain to be checked. No camera was accessed and no production deployment was performed.

The resource/recovery approach follows [MDN's WebGL memory-budget and resource-release guidance](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices). [WebKit's canvas debugging documentation](https://webkit.org/blog/8452/canvas-debugging/) describes inspecting active contexts and backing-store memory when qualifying an actual device.
