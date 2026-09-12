# Live AR test — 11 September 2026

## Method and limits

User-consented Chrome webcam preview, inspected at discrete screen checkpoints. No video was recorded and no camera images were saved or exported as project artifacts. This record contains written observations only. No body measurements or fit certification were inferred.

This is an initial defect-finding pass, not all-style qualification. Movement instructions were issued, but not every requested pose was captured; unobserved side views, target-loss timing and reacquisition are not marked as passed.

## Initial observations

| Configuration | Observed result | Follow-up |
| --- | --- | --- |
| Classic Round ring, platinum, oval clear diamond, halo and side stones, US 7 | Ring and index selection move the anchor to different fingers. The head rolls sideways and the band appears to cross the stone in near-front views. | Correct the hand orientation solver, then inspect front, edge-on and palm views. |
| Platinum bangle, 63 mm opening | Acquires the wrist, but apparent tilt and the hidden band section change substantially between near-front checkpoints. | Remove discontinuous pitch/roll estimates; forearm tracking remains approximate. |
| Platinum tennis bracelet, blue sapphire, 178 mm | Blue stones remain visibly blue. The clasp/visible arc changes substantially while the wrist remains roughly frontal. | Retest orientation and depth occlusion after the shared hand fix. |
| Yellow-gold pendant, oval blue sapphire, 450 mm chain | Body tracking reports stable. Visible chain begins low on the chest; central controls cover much of the necklace. | Hide controls by default; separately refine neck anchoring and proxy clipping. |
| Yellow-gold sapphire studs | Both stones appear in front view. Piercing placement remains high and changes with chin lift; hardware becomes visible below the stones. | Improve piercing anchors and head-pitch behavior; do not treat head-proxy occlusion as ear/hair segmentation. |

All initial previews retain their generic framing hint even after acquiring a target. Hand modes keep reporting “Adjust framing” despite valid detections; ring diagnostics at sampled checkpoints show approximately 50–51 ms inference. These are isolated samples, not a benchmark or end-to-end latency measurement.

## Shared corrections

- Replace the hand-normal screen projection with a full 3D palm normal, signed using the model's handedness and transformed consistently into mirrored or unmirrored stage coordinates.
- Measure roll against the finger/forearm frame, unwrap it continuously, and remove the former ±1.1-radian clamp. A palm-facing view must be able to put the stone behind the hand.
- Derive pitch directly from the world-space axis. Remove the image-foreshortening fallback whose magnitude borrowed a noisy depth sign; the bracelet also compared different palm endpoints in that fallback.
- Treat finite hand landmarks as valid geometry rather than interpreting unsupported per-landmark visibility defaults as absence. Body-pose visibility checks remain unchanged. “Stable” is still a heuristic tracking indicator, not measured accuracy.
- Add **Adjust placement / Hide adjustments**, initially closed. **Freeze / adjust** opens the controls. Hide the generic framing hint while a visible target is acquired.
- Version the changed AR module graph so reopening a cached runtime is not mistaken for testing the correction.

The hand task's documented outputs are coordinates, world coordinates and handedness—not per-point hand visibility probabilities. See the [official Web result contract](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js). The sign convention also needs real left/right-hand qualification; the [MediaPipe handedness convention](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/hands.md) documents the mirrored-input assumption. UI hand-label normalization is not changed in this patch.

## Automated regression checks

Temporary, non-shipped fixtures pass:

- 168 orientation cases across both model labels, mirrored/unmirrored views, finger/forearm axes, pitch, roll and in-plane rotation; reconstructed frames have determinant +1 and the expected dorsal normal.
- 721 continuous-roll samples spanning two revolutions, including angle wrapping and degenerate-input fallback.
- Real controller ring/bracelet paths with synthetic zero-visibility hand results; both acquire a forward-facing dorsal pose and can exceed the heuristic stable threshold.
- Placement-toggle state and accessibility attributes.
- The existing 27-configuration geometry, optical-unit, path-length, frame-gate, hand-identity, articulation and camera-cancellation checks.

Numerical success does not close the live orientation/occlusion defects. Post-correction live observations must be logged separately.

## Post-correction live observations

The cache-refreshed `ar-live1` page was opened in a separate Chrome test tab and the original platinum/oval-diamond ring was restored.

- With no hand visible, no jewellery is drawn and a hand-framing instruction appears.
- Once the hand appears, the readout reaches **Stable** and the generic framing hint disappears.
- In the captured palm-facing view, the head/stone is hidden and only the visible band remains. Returning to the back-of-hand view makes the head visible again. This is a useful improvement, not a full motion-accuracy qualification.
- Front-view rendering still looks transparent/outline-like, with the band visible across the stone and an unconvincing body fit. The orientation correction alone does not fix gemstone transport or depth compositing. Keep that defect open.
- Controls start hidden; **Freeze / adjust** changes to **Resume live** and opens the placement panel. **Hide adjustments** and closing the AR modal work through the live UI.
- The test session was closed after this checkpoint. No snapshot download or video recording was used.

Bracelets, necklaces and earrings were not requalified after the shared patch. Both-hand label mapping, precise fit, target-loss latency and full style/material coverage remain unverified.

## Second correction pass: `ar-live2`

This pass uses only synthetic inputs. The user's camera remains off; no new live tracking qualification is claimed.

### Changes

- **Crystals and side stones:** AR previously bypassed the studio's internal gem-ray installer. It now installs bounded BVH transport after the environment loads, with material-specific absorption, IOR and dispersion. Physical ray distances exclude the tracking root's presentation scale, including when HDR finishes loading after acquisition. Rebuilding a necklace installs its optics too; close/rebuild disposes the per-gem BVH textures. Fast mode and opaque/translucent material distinctions are preserved.
- **Neck anchor:** remove an erroneous half-shoulder-width offset from the weighted face reference. Add **Neck base above shoulders (mm, estimate)**, default 40, range 0–90, with opt-in persistence and reset. Shoulder world-space foreshortening now compensates the approximate scale during turns; yaw is no longer reduced to less than a third of a full side view. The average shoulder-width assumption and approximate neck proxy remain.
- **Earring placement:** lower lateral face-outline landmarks 132/361 replace a fixed screen-down displacement from 234/454. Small outward offsets, independent ear adjustments and drop calibration are applied in head-local space. Local anchor smoothing no longer cancels parent position/scale smoothing. A conservative facing gate hides a far ear at large yaw; the head proxy follows the new reference origin. This is still inferred placement, not ear/piercing detection.
- **Hand contact:** remove roll-dependent proxy flattening. The existing 3D rotation already supplies foreshortening; unwrapped full rotations must not progressively squash the finger/wrist occluder.
- **Diagnostics:** show traced-crystal and raster-fallback counts; cache-version the modified AR import graph.

The lower-outline reference uses the topology in MediaPipe's [official canonical face model](https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/modules/face_geometry/data/canonical_face_model.obj). The [Face Landmarker output contract](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js) provides face landmarks and optional transforms, not piercing locations. Neither source establishes an exact ear-fit measurement.

### Validation and visual observations

- Existing 27-configuration geometry/lifecycle checks and 168-orientation/721-frame hand regressions still pass.
- New numerical fixtures pass 10 shoulder-projection cases, 9 necklace height/turn cases, 18 mirrored/unmirrored head pitch/yaw cases, and 7 crystal/translucent/opaque material cases. Checks cover zero-height persistence, head-local anchor invariance, presentation-independent ray absorption and BVH texture disposal.
- Thirteen isolated desktop Chrome sessions pass initialization, shader checks and close cleanup, with no captured application exceptions or console errors. Each session also builds all 18 silhouettes without changing the studio design. Inputs are generated landmarks and schematic canvases; `getUserMedia` is explicitly forbidden in the fixture.
- The first eight sessions cover five ring materials plus sapphire tennis bracelet, pendant and drop earrings. Counts include 13 ray-traced crystals on the ring, 51 on the tennis bracelet, one on the pendant and two on the drops. Opal/onyx centres stay raster while their 12 diamond side stones use rays.
- Five close-up comparison sessions cover oval diamond, sapphire and emerald, sapphire Fast mode, and the existing absorption-strength control. The initial palm-view ring captures are not treated as front-view appearance evidence. In the corrected front-view fixtures, internal rays remove the straight band-through-gem artifact visible in the Fast comparison. Sapphire remains deep blue, emerald green; lower absorption produces a lighter sapphire without changing the shipped defaults. Dense dark facets, sparkle aliasing and the environment-only approximation remain visible limitations.
- Necklace and earring screenshots verify the new code path on a schematic body, not anatomical fit. Real chin-lift drift, neck clipping, hair occlusion, both-hand label mapping and sustained mobile performance remain open. The temporary validation page is removed after the checks; no public test page or new test framework is shipped.

## `ar-live2` live retest

The user explicitly agreed to another camera pass. A fresh Chrome tab used `customs.html?qa=ar-live2-camera#design-studio`. Five configurations were inspected across all four jewellery types. Observations are intermittent screen checkpoints, not a recorded video, annotated tracking dataset, or latency benchmark. No snapshot download or video recording was used, and no camera images were written into the repository. This entry contains only written observations about the jewellery preview.

| Configuration | Checkpoints | Result |
| --- | --- | --- |
| Platinum classic ring, US 7, 1.40 ct oval diamond, diamond frame and side stones | Back of hand, changed distance/angle, held palm view | The centre has internal facet detail rather than a hollow outline. The head disappears in the held palm view while the visible band remains. The band still looks too wide/disconnected at finger edges in front/oblique checkpoints. Physical size and fit are not verified. |
| Same ring with blue sapphire | Back of hand and changed hand angle | The centre stays recognisably deep blue with changing light/dark facets; halo/side stones remain distinct. The earlier straight band-through-centre artifact is not apparent in these checkpoints. Edge contact/width still looks unconvincing. |
| Platinum sapphire tennis bracelet, 178 mm, 2.8 mm round stones | Raised wrist, oblique wrist, held palm-forward view | The bracelet follows the wrist and rotates; blue stones and settings are visible. Curled/doubled rows and abrupt-looking ends at the wrist outline make the wrap look disconnected. The prepared oval/depth proxy combination is not a convincing fitted bracelet. |
| Yellow-gold sapphire pendant, 450 mm chain, oval centre with diamond frame | Neutral torso, frozen height adjustment, resumed frontal and oblique torso | At the default 40 mm neck-base height, the visible chain starts below the neck. An unsaved adjustment to 80 mm raises the chain in the same frozen view. After resume, the full pendant is visible, but the chain still ends/floats beside the neck; a torso turn exposes asymmetric neck contact. This is not resolved by the height control. |
| Yellow-gold oval sapphire studs | Near-neutral, lowered chin, held raised chin, head turns both directions | The lower placement is visible and follows the sampled pitch changes, but exact lobe attachment is not established. Gold backing/post hardware is visible around the studs. On both head turns, the far stud appears on the cheek near the nose/mouth instead of being hidden. The near stud also looks detached beneath the lobe in profile. |

The UI reports **Stable** during these visible defects. That label remains a heuristic about tracking confidence, not evidence of correct fit, occlusion, or rendering. The necklace diagnostics report 21 ray gems and zero crystal fallbacks, confirming the new optics path is active. A sampled inference readout is about 48 ms; no end-to-end latency or sustained frame-rate claim follows from that sample.

**User motion feedback:** the preview feels mostly smooth, but very jumpy during motion. Treat motion-triggered jumping as an unresolved quality defect, even though the user expected it. This subjective report does not identify whether landmark noise, pose prediction, scale changes, inference timing or rendering is responsible.

**Session end:** the AR modal was closed and the studio was visibly restored. The test tab remains on yellow-gold sapphire studs for follow-up. Remember-placement stayed unchecked, so the experimental 80 mm neck-height correction was not saved. No application-code changes were made during this live retest.

## Priorities after the retest

1. **Far-ear occlusion:** reproduce both yaw directions in a synthetic regression. Correct the face-depth/ear-anchor relationship so a hidden ear cannot render on the cheek; do not merely relabel the confidence indicator. Inspect backing/post occlusion and near-lobe attachment alongside it.
2. **Neck/body contact:** separate the neck-base estimate from the neck wrap/clipping problem. Validate frontal and oblique joins with the body proxy and selected circumference. Do not change everyone's default height to 80 mm based on this single user.
3. **Finger/wrist contact:** inspect apparent band width, side-stone visibility, overlapping bracelet rows and proxy termination at silhouettes. Keep the selected physical product size intact; an uncalibrated preview does not establish that US 7 or 178 mm fits this wearer.
4. **Motion stability:** reproduce the user-reported jumping with controlled movements, then inspect timestamp alignment, pose/scale discontinuities and frame pacing. Add measured timing and sustained real-device checks; do not hide the issue with excessive smoothing that adds lag.
5. **Remaining coverage:** both-hand label mapping, target loss/reacquisition, bangle/cuff/station bracelets, all other necklace/earring styles, other stones and bronze patina remain unqualified by this pass. Retest affected cases after each correction before expanding the matrix.

## Camera-free correction pass

The user authorised code fixes and explicitly prohibited further camera use without fresh permission. No real camera, existing camera tab, recorded participant footage, or microphone was accessed for this pass. Validation uses generated landmarks and drawn schematic bodies. Headless Chrome runs in a separate temporary profile, with camera/microphone permissions denied and capture APIs blocked before page navigation.

### Changes

- **Motion:** worker capture timestamps now drive all four pose pipelines and stale-result expiry; duplicate/backwards source times are rejected. One-Euro derivatives use raw-to-raw deltas. Large transient changes require confirmation, orientation is unwrapped before filtering, and pitch/roll no longer use the very slow previous settings. Prediction has a six-pixel displacement ceiling and stops after 150 ms without fresh data. Adjacent-finger masks share the jewellery's displayed transform instead of stepping ahead of it; motion no longer lengthens the body mask.
- **Scale/contact:** multiple projected palm baselines replace a single nearly collapsed knuckle line during edge-on motion. Finger/wrist radius estimates no longer divide a raw screen measurement by a differently delayed display scale. Product ring sizes and rigid bangle/cuff openings remain unchanged.
- **Earrings:** a coarse tracked face-depth surface, conservative lateral visibility and hysteresis replace the far-side-cheek behaviour in synthetic yaw tests. Hidden ear anchors stop following inferred contour landmarks across the face. Landmark positions are unprojected at their estimated depth before conversion to head-local coordinates, removing the extra outward perspective shift on the near ear. Local lobe masks cover pierced-ear posts/backings; small visible-lobe regions are delegated to those masks so the coarse nose-to-outline triangles do not clip the front of the stud. Default lateral placement is 2.5 mm closer to the lower contour than before. Exact piercing location remains adjustable and unverified on the participant.
- **Necklaces:** the new continuous elliptical neck wrap stays outside the estimated neck cross-section and transitions into the front drape without Catmull–Rom corner cutting. The rounded lower neck proxy replaces the flat termination. Selected chain length is retained. New unsaved placements can estimate neck height from mouth/shoulder separation, bounded to 35–85 mm; manual mode and existing saved heights remain supported. This is a placement heuristic, not notch detection or clothing reconstruction.
- **Bracelets:** tennis/station assemblies now fit a length-constrained wrist cross-section with slack below the wrist instead of a uniformly oversized oval. Complete settings, links and clasp move rigidly; their dimensions are unchanged. The clasp starts on the underside. A session-only wrist-width measurement can override the hand estimate. Too-short fits are hidden with an explanation rather than stretched. This is not a full gravity/contact solver.
- **Diagnostics:** the confidence label now reads **Tracking well**, not **Stable**; neither means correct fit. Close releases the added fitting/occlusion references. Material-specific AR crystal optics remain intact.

### Synthetic verification

- Existing suites still pass: 27 assembly configurations, 6,446 rigid instances, 231 stones, 168 orientation cases, 721 continuous-roll samples, 10 shoulder projections, 9 explicit manual neck heights, 18 head-pose/anchor cases and 7 optical material cases. The old neck-height checks explicitly select manual mode; anchor expectations reflect the intentional 2.5 mm lateral adjustment.
- New checks pass: 7 palm rotations including near-edge-on views, 18 necklace length/neck-clearance cases, 20 bracelet length/body-clearance cases, reversible rigid fitting for tennis and station styles, and 30 mirrored/unmirrored head pitch/yaw cases. Far anchors remain fixed when the synthetic hidden contour is moved onto the cheek.
- Controlled 30/60 Hz render traces include variable 25–80 ms delivery delays and a single-frame finger-position spike. Maximum displayed steps are approximately 11.6/7.0 pixels for that trace; prediction remains within six pixels and settles after movement. A separate 120 px/s filter ramp has a maximum 6.7 px lag. These are test-specific numbers, not measured human motion, device latency or production jitter guarantees.
- Browser rendering checks cover all 18 model silhouettes, supported coloured-crystal and opaque/opal material paths, shader compilation, model handoff, and session cleanup. Generated front/profile earring renders exposed partial stud clipping, which prompted the separate lobe-depth regions. Every completed synthetic session reports zero camera requests. Schematic bodies check rendering mechanics, not anatomical accuracy.

No new real-camera observations are claimed. The original live defects are **awaiting an explicitly authorised real-world retest**, including exact lobe contact, necklace/clothing joins, wrist fit under rotation and the subjective motion improvement. No deployment, device qualification, or physical-fit guarantee is implied.

### Reference basis

MediaPipe's documented face-landmark/transformation outputs inform the head-pose path; the outline indices follow its official connection data. The new depth fan and local-lobe treatment are application approximations, not MediaPipe's full face mesh or an ear detector: [Face Landmarker web guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js), [official face connection data](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/python/solutions/face_mesh_connections.py). The isolated browser's denial settings use [Chrome DevTools permission overrides](https://chromedevtools.github.io/devtools-protocol/tot/Browser/#method-setPermission).
