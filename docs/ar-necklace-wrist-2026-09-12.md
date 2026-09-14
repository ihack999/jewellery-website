# Necklace and bracelet attachment continuation

Implemented 12 September 2026 after the user supplied four current try-on screenshots and ranked the results: **necklace worst, then bracelet, then ring, with earrings best**. This supersedes the previous ring-first implementation priority.

## What the supplied images establish

The necklace's visible chain appears to end on the chest, with a poor transition around the neck. The bracelet has a conspicuous detached, open-looking arc. The ring and earrings still look brighter and sharper than the camera image. The images establish remaining visual problems; they do not reveal exact model landmarks, chosen physical sizes, calibration values, temporal jitter or measured body dimensions. An open cuff also intentionally has a gap, so the bracelet image alone does not prove broken product topology.

No camera was opened to investigate these reports. The supplied images were reviewed directly; the regression fixtures below are generated joint data, not a claim to have run inference on those photographs.

## Necklace changes

The old orientation solver gave face position a dominant role in its up direction. With stationary shoulders, moving the head sideways could rotate the necklace across the chest. The image-plane orientation now follows the shoulder line. Reliable, on-screen hip and shoulder observations add torso lean in depth; when those observations are absent or implausible, lean falls back to frontal. Face points can still contribute to the initial neck-height estimate, but no longer rotate the chest frame.

The new **Place neck base** control supplies a direct correction for the undetected attachment point:

1. Freeze a successfully tracked necklace preview and open the placement options.
2. Choose **Place neck base**, then tap the hollow at the base of the throat.
3. Resume live. The correction follows the torso and changes scale with camera distance.

The point is converted into torso-local millimetres through the projected basis, including oblique-view foreshortening. Picking switches neck height to manual, so subsequent head nods do not move that calibrated anchor. It clears conflicting generic side/lift offsets. It does not change chain length, neck circumference or product meshes. Neck circumference remains separately adjustable when the estimated wrap width is wrong.

Escape cancels picking without closing AR and returns focus to its button. Reset clears the picked offset; close and camera restart clear picking state. A valid frozen result is required, and a reference from an older/rejected result cannot calibrate a newer frame. Resizing a frozen necklace recomputes its placement reference. Storage remains opt-in through **Remember placement**.

## Bracelet changes

The wrist depth body is now scene-owned, like the selected finger body. The former sleeve inherited the bracelet's size and placement; the new rounded wrist approximation uses the hand-derived or manually supplied wrist width. Side, lift, tilt and preview scale no longer move the inferred skin along with the jewellery. Selected and adjacent hand depths receive the same display correction as the filtered band.

Rigid bangles and cuffs can translate towards gravity projected into their cross-section until the estimated wrist touches the opening. A bounded numerical search checks a sampled wrist ellipse inside a conservative approximation of the opening. It preserves product dimensions and vertices. It returns no displacement when the estimated wrist cannot fit, when gravity is nearly axial, or when the user deliberately applies a tilt adjustment. Flexible tennis/station bracelets retain their length-constrained fitting path.

This is a small rigid-placement calculation, not a general dynamics solver. Gravity is assumed to point down in the displayed camera image; it is not measured by an IMU. The wrist axis still comes from the hand/palm, so wrist flexion can disagree with the true forearm direction. The depth body has an estimated elliptical cross-section and an 80 mm rounded extent, not reconstructed skin.

MediaPipe supplies pose landmarks, world coordinates and visibility. Those outputs support the torso checks; they do not supply a detected throat hollow, clothing contact surface or personal neck cross-section. This batch uses the existing neural tracking models and adds no new weights or model downloads. [Google Pose Landmarker web documentation](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js)

## Files and verification

- `assets/js/ar/torso-fit.js`: torso frame and inverse projection for neck placement.
- `assets/js/ar/wrist-contact.js`: independent wrist depth, wrist orientation and rigid seating.
- `assets/js/ar-tryon.js`: fitting integration, controls, lifecycle and cache-entry coordination through `assets/js/main.js` / `customs.html`.
- `scripts/ar_body_fixtures.js`, `scripts/check_ar_body_fit.mjs`: generated observations and dependency-free solver checks.
- `scripts/ar_body_assertions.mjs`, `scripts/check_journeys.mjs --ar-body-fit`: real modal, full models, shaders, controls and depth-pixel checks. Add `--mobile` for a 390 × 844 viewport.

The Node suite passes five scenario groups: 9 head-only cases, 36 torso pose/mirror cases, 144 wrist seating cases, projected neck placement across distance, body/product independence, tracking loss and disposal. The established ring-contact and timing Node suites also pass (6 and 21 scenario groups respectively).

The generated-video tracking browser regression also passes all 34 assertions across the four placement types, with zero camera calls and runtime errors.

Browser coverage exercises Pendant, Y-Drop, Lariat, Station and Choker necklaces, and Bangle, Cuff, Tennis and Station bracelets. It checks frozen picking, cancellation/focus, projected placement, head movement, torso lean, storage remaining opt-in, reset, unchanged physical dimensions and mesh buffers, shader compilation and cleanup. A separate GPU test checks visible front fragments, hidden rear fragments and rounded proxy termination. Desktop and 390-pixel runs each pass 132 assertions with zero camera calls or browser/console errors. The established ring-contact browser suite passes 142 assertions, and the storefront journey suite passes 41. Static checks pass for 33 pages, 1,369 local references and 28 JSON-LD blocks; changed JavaScript syntax and whitespace checks pass.

Schematic renders in `/private/tmp/ar-body-necklace-synthetic.png` and `/private/tmp/ar-body-bracelet-synthetic.png` were visually inspected. They demonstrate rendering mechanics and estimated contact geometry, not anatomical realism. Browser runs use disposable profiles, denied camera/microphone permissions and blocked hardware-capture APIs. No participant recording, external submission or deployment occurred.

## Remaining priorities

1. Necklace: local neck/clothing observations, better wrap-width calibration and chest-surface fitting. The supplied image's exact attachment quality still needs a real-world retest; the new manual point is a correction path, not automatic anatomy detection.
2. Bracelet: independent elbow/forearm observations with confidence and timing alignment, especially during wrist flexion. Validate rigid seating across camera/device orientation and loose versus tight openings.
3. All types: match camera lighting, contrast and softness; qualify motion and sustained phone performance under the full rendering workload. Synthetic draw counts and solver passes do not establish those results.
4. Ring and earrings: retain the previous attachment improvements while improving contours and hair/ear boundaries.

Real-camera testing still requires fresh authorization. The user's quality assessment remains the release criterion; this batch is not labelled world class or physically accurate sizing.

One concrete rendering concern is retained for the next performance pass: the synthetic Tennis model reports 1,497 draw calls in this fixture, compared with 189 for Bangle. This identifies substantial rendering work to profile and consolidate; it is not a measured phone frame rate or a claim that inference is the bottleneck.
