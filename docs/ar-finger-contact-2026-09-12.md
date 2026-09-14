# Joint-fitted ring contact

Implemented 12 September 2026, following the [tracking timing batch](ar-tracking-timing-2026-09-12.md) and AR/neural research.

## Problem and resulting behavior

The selected finger previously used a fixed 55 mm capsule parented to the jewellery. Its initial dimensions and radius limits depended on the selected ring. Moving or tilting the preview could therefore move the depth-only “skin” with the ring, even though the detected finger stayed still. Neighbouring fingers already used scene-owned articulated proxies, leaving the selected finger on a different contact path.

The ring now uses a separate, scene-owned proximal-finger body fitted between the detected MCP and PIP joint centres. Its side-to-depth ellipse and per-finger taper remain explicit application approximations. Rounded caps follow the joints, and the supplied radius is normalized to the ring seat along the segment. The geometry buffer is reused during updates.

- Finger width comes from the existing slowly filtered hand-width prior. The chosen ring size no longer bounds the selected finger's depth geometry. Manual knuckle width remains a scale reference, not a finger-diameter measurement.
- Side, lift, preview scale and tilt adjustments change jewellery placement without changing the raw body fit. Deliberate ring-placement edits reset pose filters so a partially filtered edit cannot temporarily displace the skin proxy.
- Selected and adjacent finger depths receive the same correction from the raw jewellery pose to the displayed pose. This keeps their timing consistent with the existing filtered, bounded-prediction renderer. It does not eliminate the remaining lag between an inferred pose and the camera image.
- The proximal segment is drawn once; the neighbouring-finger mesh continues to handle the other 14 segments. Bracelet wrist fitting retains its existing path.
- Invalid, collapsed or implausibly elongated segments clear the selected depth surface. These are numerical/geometry guards, not calibrated model confidence. Tracking loss, reset, reacquisition and close update visibility and release resources.
- Contact-shadow strength falls when placement moves off the finger centreline or beyond its joints. Jewellery is not snapped, stretched or compressed to create a snug fit.

The existing MediaPipe model supplies joint landmarks, world coordinates and handedness. This batch improves how those neural outputs drive explicit body geometry; it adds no new network, segmentation model, skin-colour classifier or model weights. [Google Hand Landmarker documentation](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)

## Implementation

- `assets/js/ar/finger-contact.js`: reusable joint-fitted depth mesh, surface validation, display-transform application and contact-shadow gate.
- `assets/js/ar-tryon.js`: selected-finger integration, independent body dimensions, placement controls, visibility and disposal. Obsolete ring-size-accuracy comments and inactive compression calculations were removed.
- `assets/js/main.js`, `customs.html`: updated AR entry cache references. The existing designer/side-stone module references are preserved.
- `scripts/ar_contact_fixtures.js`: generated joint data shared by the camera-free checks.
- `scripts/check_ar_contact.mjs`: real geometry and placement checks without a browser.
- `scripts/ar_contact_assertions.mjs`, `scripts/check_journeys.mjs --ar-contact`: isolated WebGL, model-handoff and modal-control checks.

## Verification

`node scripts/check_ar_contact.mjs` passes six scenario groups, including 72 projection cases and 90 motion frames. Coverage includes all four selectable fingers, both mirror states, three screen crops, hand rotations and finger bends. Ray intersections verify the actual tapered surface radius at the ring seat. Other checks cover fixed-body behavior across product sizes and placement adjustments, shared display corrections, shadow gating, invalid geometry, loss/reacquisition and exactly-once disposal. Camera and network calls are blocked and remain zero.

The `--ar-contact` browser suite passes 142 assertions with zero camera calls, uncaught exceptions or console errors. It checks actual GPU depth pixels: jewellery in front remains visible, jewellery behind is rejected without painting over the background, and a marker beyond the joint cap remains visible. Moving a marker off the finger and rejecting malformed joints both remove the previous occlusion.

It also opens the real AR modal and builds the full designer models for Classic Round, Cigar Band, Split Shank, Tapered Shank and Stacked Double rings, plus Bangle and Tennis bracelet regressions. It exercises placement inputs, finger switching, HDR/material initialization, drawing and cleanup, while comparing physical dimensions, unit conversion and product vertex buffers before and after fitting. Capture and inference are replaced with generated joints; the browser does not load a vision model or request a camera. A schematic render is written to `/private/tmp/ar-finger-contact-synthetic.png` for visual review; it is not participant imagery.

Regression checks also pass: 21 tracking/timing scenario groups, 34 generated-video browser assertions, and all 41 established storefront journey assertions. Static validation reports 33 pages, 1,369 local references and 28 JSON-LD blocks with zero errors. Changed JavaScript syntax and whitespace checks pass. The schematic image was inspected; it verifies rendering mechanics rather than anatomical realism.

## Limits and next direction

Joint landmarks do not provide a personal skin contour, piercing point or calibrated physical measurement. Width, taper and depth ratio remain approximate; touching fingers, extreme foreshortening, cropped hands and ambiguous model depth still need real-world qualification. The shadow gate is an appearance heuristic, not a contact or soft-tissue simulation. The colourless depth body can over- or under-occlude wherever its inferred surface differs from the wearer.

The next perception experiment can now compare local finger-contour observations against a body baseline that is independent of the product. Any refinement should carry confidence, retain the geometric fallback and preserve selected dimensions. Ear/hair boundaries and necklace/clothing contact remain separate work. No real-camera improvement, mobile performance, measurement accuracy or deployment is claimed by these synthetic checks. Real-camera testing requires fresh authorization.
