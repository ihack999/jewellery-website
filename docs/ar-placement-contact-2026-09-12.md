# AR placement and body contact — 12 September 2026

This continuation addresses two causes of jewellery appearing detached: the bracelet previously followed the palm when the wrist bent, and the necklace's neck depth mask inherited jewellery adjustments. The bracelet can now use an independently observed elbow–wrist direction. The neck depth body now belongs to the scene and follows the calibrated body anchor independently of product fit controls.

The user's priority remains **necklace, bracelet, ring, earrings**, from worst to best. These changes improve placement mechanics; synthetic verification does not establish realistic appearance on a person.

## Research applied

MediaPipe Pose Landmarker returns 33 landmarks, including elbows and wrists, with image coordinates, world coordinates and visibility. Its world coordinates use a hip-centred origin. Hand Landmarker uses a separate hand-centred world origin. The new solver therefore matches the two observations in image space and takes only the elbow-minus-wrist vector from pose world coordinates; it never treats a pose wrist position as a hand-world position. [Pose Landmarker web guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js), [Hand Landmarker web guide](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js)

The Pose guide also documents that synchronous video detection blocks its calling thread and recommends workers. The extra observation runs only in the existing tracking worker. The main-thread fallback continues with the hand model alone. [Pose Landmarker web guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js)

The separation of body shape from jewellery controls is an implementation decision: changing a product's position or size should not move or resize the skin used to hide its rear surface. It follows the same ownership and display-timing approach already used for finger and wrist contact.

## Bracelet placement

`assets/js/ar/forearm-fit.js` matches the selected hand wrist to a visible pose wrist and elbow. It rejects off-image or low-visibility landmarks, distant or ambiguous wrist matches, implausible vector lengths, severe foreshortening, inconsistent image/world directions, and observations at least 350 ms old. Age includes both cached observation age and delivery delay. Confidence fades during the final 130 ms of the allowed age window.

The precise anchor and scale still come from hand tracking. The accepted forearm vector replaces the palm-derived longitudinal axis; the hand's dorsal direction is projected onto the forearm plane to retain pronation while reducing wrist-flexion influence. Degenerate or contradictory orientations keep the hand-based estimate.

The band now seats 10 mm toward the elbow from the tracked wrist joint, with a foreshortened screen offset. This is an explicit placement prior, not a measured preferred wearing location. Physical product dimensions, manual wrist references, independent wrist depth, rigid-band gravity seating and length-preserving flexible bracelet fitting remain active. The uncalibrated wrist-width ratio is labelled as a prior in the code.

Only bracelets request the pinned MediaPipe Pose Lite model. Primary hand tracking becomes available while the auxiliary model loads. Missing or failed auxiliary initialization preserves hand-only tracking. Detection uses the same transferred bitmap as the hand result, with no additional frame queue. The auxiliary task runs at most once per 220 ms, slows according to measured pose cost, and is skipped when the hand task already takes 45 ms or more. Cached pose data expires and clears when the camera generation changes. Auxiliary inference failures disable that task without discarding the hand result; obsolete model initialization is disposed after a tracker-session replacement.

The existing opt-in diagnostics identify `elbow/wrist observation` or `palm estimate`. The bracelet hint now says **Show your wrist; include your elbow when possible**. Rings, earrings and necklaces do not load this additional model.

## Necklace body contact

`assets/js/ar/neck-contact.js` owns a rounded, depth-only neck body. The calibrated throat anchor and torso orientation determine its source transform. Side, lift, tilt and product fit adjustments affect the jewellery without changing that source body. **Place neck base** remains the explicit body-anchor correction.

The body receives the same filtered/interpolated display correction as the jewellery, keeping their motion timing aligned. Tracking reset or loss hides it; model rebuild reuses it, and closing removes and disposes it. Invalid dimensions or scale cannot leave a stale body visible.

The broad necklace contact shadow fades as jewellery moves away from its contact configuration. This avoids retaining a strong apparent contact shadow after a large manual offset, tilt or fit adjustment.

This pass does not change the necklace's chain-path construction or automatically detect the anatomical neck notch. The depth body remains a rounded geometric estimate; it does not observe clothing, chest shape, hair or folds.

## Verification

All browser checks use generated landmarks, bitmaps or video in disposable Chrome profiles. Camera and microphone permissions are denied, hardware capture calls are intercepted, and external requests are blocked. The worker tests substitute a synthetic vision API while exercising the production worker's scheduling, serialization, transfer and lifecycle code. **The new Pose Lite model was not downloaded or run during these checks.**

- The new Node placement suite passes five groups: 60 neck adjustment cases, 90 neck motion frames, forearm association/rejection and origin-independence checks, 30 hand-bending cases, and production-worker scheduling/failure checks. In those generated bending cases, the bracelet anchor and longitudinal axis stay fixed relative to the unchanged wrist and elbow.
- The native browser worker suite passes **15 assertions**, covering nonblocking auxiliary loading, same-frame observations, visibility serialization, cached age, camera-generation reset, type-specific configuration, model failure, overload and late initialization cleanup.
- The expanded body browser suite passes **181 assertions** across all five necklace and four bracelet styles. It exercises actual controls, full models and cleanup. Rendered depth-pixel checks verify that a neck hides a rear marker while retaining front/outside markers, and that invalid fitting hides the stale mask. An earlier narrow-viewport run passed 177 assertions before the four neck pixel checks were added.
- Regression browser suites pass **34 tracking**, **142 ring/contact**, and **41 established site journey** assertions, with zero runtime errors and zero camera requests in the AR suites.
- Existing Node suites pass 21 tracking, six contact and five torso/wrist groups. Static checks pass 33 pages, 1,369 local references and 28 JSON-LD blocks.

Generated neck and bracelet previews were inspected at `/private/tmp/ar-body-necklace-synthetic.png` and `/private/tmp/ar-body-bracelet-synthetic.png`. They show test geometry, not a participant or a measured before/after result.

Run from the site directory:

```sh
node scripts/check_ar_placement.mjs
node scripts/check_journeys.mjs --ar-placement
node scripts/check_journeys.mjs --ar-body-fit
node scripts/check_journeys.mjs --ar-body-fit --mobile
node scripts/check_journeys.mjs --ar-tracking
node scripts/check_journeys.mjs --ar-contact
```

## Remaining qualification

Real-model elbow detection, its additional memory/CPU cost, hand–pose alignment under motion, and real-device appearance still require evaluation. An elbow outside the camera view cannot supply an observed forearm axis. Throttled observations can lag motion or temporarily revert to the palm estimate; the existing filters soften those changes but do not recover missing measurements.

Neck width/depth, wrist cross-section, monocular scale and the 10 mm bracelet seat remain estimates. A clothing-aware chest surface and better neck-base observations are the next necklace placement candidates. No camera, participant footage or deployment was used in this pass, and physical fit or world-class visual quality is not claimed.
