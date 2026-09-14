# AR Try-On Upgrade Plan

Status: implementation in progress. The first all-type browser fitting pass is recorded in [AR V1 implementation and validation](ar-tryon-v1.md). The remaining phases and real-device release gates below are not yet complete.

Current user priority, 12 September: **necklace → bracelet → ring → earrings**, from worst to best in supplied screenshots. The [necklace/wrist continuation](ar-necklace-wrist-2026-09-12.md) removes face-driven necklace rotation, adds a torso-relative neck-base correction, and separates wrist depth from rigid-band seating. The later [placement/contact continuation](ar-placement-contact-2026-09-12.md) adds optional elbow–wrist observations and independent neck depth. Clothing perception and real-world quality remain unresolved.

12 September update: the [tracking timing and ownership batch](ar-tracking-timing-2026-09-12.md) implements source-media filter intervals, explicit frame-age provenance, bounded local diagnostics, and one-job ownership across session changes. Twenty-one synthetic scenario groups and 34 generated-video browser assertions passed. Neural surface/segmentation additions and real-camera qualification remain pending.

12 September contact update: the [joint-fitted ring body](ar-finger-contact-2026-09-12.md) replaces the selected finger's product-parented sleeve with a body surface fitted to MCP/PIP joints. Ring size and placement controls no longer determine that skin geometry. Geometry, projection, depth-pixel and full-model browser checks use generated joints; the width/shape prior and real-camera limits remain explicit.

12 September render update: the [shared render foundation](ar-render-foundation-2026-09-12.md) adds identical-metal instancing, source-hierarchy synchronization, explicit instance cleanup and bounded render diagnostics. Paired GPU image checks cover all 18 silhouettes; Tennis product draws fall from 1,493 to 83 while geometry, material identities and triangle counts are preserved. This removes submission overhead; neural perception, lighting and real-device performance remain separate work.

12 September appearance update: [shared camera appearance lighting](ar-appearance-lighting-2026-09-12.md) controls the HDR and direct lights coherently, samples only the displayed crop in linear light, bounds local clothing influence, and holds frozen-frame lighting. The final generated-video run passes 275 assertions across 18 silhouettes, including isolated custom-ray response and camera-pixel preservation. This is a bounded appearance heuristic; learned illumination and anatomical contact remain outstanding.

12 September placement update: [body contact and forearm fitting](ar-placement-contact-2026-09-12.md) separates the neck depth mask from jewellery controls and uses a matched elbow–wrist vector to reduce hand-flexion influence on bracelets. The optional worker-only Pose Lite observer is throttled and preserves hand-only fallback. Five new Node groups, 15 native-worker assertions and 181 body browser assertions pass; the actual auxiliary model and mobile inference cost remain unqualified.

Prepared: 11 September 2026, against the current V3.2 generator and existing browser AR implementation.

## 1. Goal and priority

Make jewellery look attached to a person, correctly proportioned, naturally articulated, and convincingly integrated into the camera image. Cover every currently supported type and silhouette, not just rings or diamonds.

**Order of work: correct assets and units → stable attachment → believable body contact → material and lighting integration → secondary motion and polish.** More sparkle cannot compensate for an earring attached to a cheek or a necklace floating across the chest.

The baseline remains browser-based camera try-on. Hardware depth, native apps, and paid tracking services are optional later investigations, not prerequisites. Monocular try-on is an appearance preview, not a certified body measurement or guarantee that a purchased item will fit.

### Required coverage

| Type | Existing silhouettes to support | Distinct fitting requirements |
| --- | --- | --- |
| Ring | Classic Round, Cigar Band, Split Shank, Tapered Shank, Stacked Double | Selected finger, band opening, dorsal orientation, adjacent-finger occlusion; retain all settings and side stones |
| Bracelet | Bangle, Tennis, Cuff, Station | Separate rigid oval fitting from flexible, length-constrained fitting |
| Earrings | Stud, Drop, Huggie, Chandelier | Independent piercing anchors and ear visibility; rigid studs versus articulated drops |
| Necklace | Pendant, Y-Drop, Lariat, Station, Choker | Neck/chest contact, style-specific chain topology, physical length, pendant attachment |

Every type must retain the selected metal, finish, stone material, cut, proportions, and supported design details. Future anklets, brooches, body jewellery, and larger hoop styles require their own generator assets and attachment adapters; they must not silently reuse an unsuitable existing type.

## 2. What the current implementation actually needs

These are source-inspection findings, not a camera-session accuracy assessment. No camera was activated for this plan.

| Current implementation | Upgrade implication |
| --- | --- |
| `assets/js/ar-tryon.js` already contains four tracking paths, smoothing, calibration controls, lighting, occluders, and snapshots | Preserve useful behaviour; extract and verify it incrementally rather than replace everything at once |
| `assets/js/ar-tracking-worker.js` already runs inference off the UI thread | Extend its protocol and scheduling, rather than introduce a duplicate tracking system |
| Worker hand results omit handedness; pose results omit segmentation masks | Return the data required for stable hand selection and optional mask compositing |
| Failed or unavailable designer builds fall back to `buildRing()` regardless of selected type | Load the correct factory or show a recoverable, type-specific error; never substitute a ring for a necklace |
| Necklace wrapping changes direct-child transforms; V3.2 chain links are merged inside geometry buffers | Introduce wearable chain paths and articulated instances. Moving a merged chain mesh cannot independently wrap its links |
| Necklace fitting still includes legacy display-space offsets; non-ring inner radius is estimated as 84% of outer bounds | Replace display-bound guesses with explicit attachment and physical-dimension metadata |
| Scale uses assumed ear breadth, shoulder span, finger ratios, and wrist ratios | Treat these as uncertain initial estimates, not personalised measurement |
| Earlobes are inferred from face-edge landmarks and a fixed offset | Add explicit per-ear calibration and visibility handling; these are not detected piercing positions |
| Hand silhouettes are painted from landmarks onto a fixed-depth plane | Add articulated depth proxies and better boundaries; the current mask is not reconstructed hand depth |
| MediaPipe runtime is pinned to `0.10.14`, but the pose model URL contains `latest` | Pin and validate runtime, WASM, and model assets together; do not blindly upgrade dependencies |

Inspect the mixed geometry conventions carefully: V3.2 assemblies build millimetre geometry beneath a `0.12` scale, while other builders use converted local coordinates. Audit the entire transform chain before changing scale formulas. A root-scale mismatch is a risk to test, not an accuracy result established by this inspection.

## 3. Shared technical foundation

### 3.1 A wearable asset contract

Add a versioned contract alongside `buildJewellerySpec()` and the assembly builders:

- Design revision, piece type, silhouette, physical dimensions, unit convention, and canonical wear orientation.
- Named anchors: ring bore and head direction; bracelet inner opening and clasp; left/right piercing points; necklace neck supports, chain junctions, pendant bail, and closure.
- Rigid assemblies that must move together: gem, gallery, prongs, bezel, and their mounting hardware.
- Flexible paths with rest arc length, ordered link/station identifiers, attachment sockets, and joint limits.
- Explicit distinction between presentation pose and wear pose. Studio zoom, pair spacing, display tilt, and Macro focus must not affect try-on.

Normalise an AR-owned asset once, using its recorded transforms and units. Place it beneath a separate tracking-pose node. Use metres for the new AR scene contract and millimetres for product dimensions; document the conversion boundary. Do not overwrite a builder scale while also applying that conversion elsewhere.

Use the same design snapshot as the visible generator, with a revision identifier. Avoid relying solely on an older local-storage snapshot. Updating AR must not mutate the studio model, its materials, or export data. Define ownership and disposal of cloned geometries, textures, and shader resources.

**Exit check:** the same selected design has identical physical dimensions before AR, during camera movement, and after closing AR; unavailable types produce an honest error.

### 3.2 Camera coordinates and temporal alignment

Document and isolate conversions between source-video pixels, inference crops, mirrored display coordinates, landmark coordinates, camera space, and physical asset space. Test portrait/landscape, front/rear cameras, resize, and CSS `object-fit` cropping with synthetic points.

Retain worker inference. Schedule new video frames with feature-detected `requestVideoFrameCallback()`, with a deduplicated animation-frame fallback. Carry the source timestamp, frame identifier, crop transform, active design revision, and session generation through processing. Reject stale results after camera/type changes; allow at most one in-flight inference per tracker and discard queued old frames. Video callbacks provide frame timing but do not guarantee exact synchronisation with display. [MDN video-frame callback documentation](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback)

Return handedness and maintain temporal hand IDs; landmark-array order is not an identity. Keep hand and pose coordinate origins distinct when combining trackers: the documented hand world coordinates are hand-centred, whereas pose world coordinates are hip-centred. Align them explicitly rather than concatenate them. [Google Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js), [Google Pose Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js)

Retune the existing position and quaternion filters against replay footage. Use confidence hysteresis, outlier rejection, bounded prediction, and degenerate-axis handling. Avoid stacking smoothers until everything lags. On target loss, briefly hold only within a bounded grace period, then fade and explain how to reacquire; never continue following stale landmarks indefinitely.

### 3.3 Honest sizing and calibration

Provide two clearly labelled modes:

1. **Quick appearance preview:** inferred body proportions, approximate scale, no fit claim.
2. **Calibrated size preview:** explicit user measurement or a guided known-size reference, with its method and uncertainty shown.

Support manual ring/finger measurement, wrist circumference and optional oval dimensions, and necklace-length comparison using a measured cord. A ruler or plain calibration marker can supply a local scale reference when visible near the same depth plane as the target. Reject strongly tilted, occluded, or distant references. Do not require identity documents or payment cards.

Separate camera calibration, placement adjustment, and product size. Changing an overlay to fit the person must not secretly resize the actual product. A deliberate size change should update the design only after confirmation. Invalidate relevant calibration when camera, zoom, resolution/crop, wearer, or reference conditions change. Store calibration only by explicit choice, locally, with reset/delete controls.

## 4. Type-specific upgrades

### 4.1 Rings: secure seating, believable rotation

- Track the chosen hand and finger explicitly. Start with the existing supported fingers; add thumb support only with its own anatomy and tests.
- Construct the finger frame from the proximal segment, palm orientation, and neighbouring landmarks. Use a stable dorsal direction so a large centre stone does not flip to the palm side.
- Fit an elliptical, tapered finger proxy. Seat the band on the intended proximal segment, accounting for broad cigar bands, split shoulders, stacked bands, and high settings.
- Use the actual inner opening to assess approximate contact. Do not infer ring fit from the centre-stone bounding box or stretch the ring to absorb tracking noise.
- Occlude the rear band and parts hidden by adjacent fingers using articulated proxies. Do not clip the visible head simply because it overlaps the hand silhouette in screen space.
- Keep prongs, side stones, galleries, and the centre stone rigidly related; reuse construction contact checks after any asset adaptation.

**Acceptance scene:** both hands, finger switching, palm/back views, finger bending, slow wrist rotation, partial occlusion, and exit/re-entry. The ring stays on the selected finger, does not flip, and its stone dimensions remain constant.

### 4.2 Bracelets: rigid and flexible are different systems

- Estimate wrist centre and cross-section separately from hand width. Use a visible forearm/elbow cue when available, optionally combining hand and pose tracking within the device budget.
- Align the opening with the forearm axis, stabilise rotation, and offer a calibrated oval-width/depth adjustment. Hand-only tracking cannot reliably resolve every forearm pose; degrade gracefully when evidence is missing.
- **Bangle:** preserve the rigid opening and section. Allow restrained sliding/rotation around the wrist, not rubber-like scaling.
- **Cuff:** preserve the gap, tapered ends, and opening orientation. Report an apparent mismatch rather than closing the gap to fake a fit.
- **Tennis:** articulate complete setting units along a length-constrained wrist path. Keep stone sizes, hinge spacing, clasp, and safety hardware intact.
- **Station:** wrap chain segments around the wrist while keeping bezel stations and connector sockets attached. Preserve total length rather than expanding every component.
- Add wrist/forearm depth occlusion and conservative sleeve handling. Expose snug versus loose appearance as clearance or product-length choices, not arbitrary whole-object scaling.

**Acceptance scene:** hand flexion and forearm rotation, front/back wrist views, sleeve boundaries, and all four silhouettes. No detached settings, clipped front stones, stretched clasps, or implausibly shrinking cuffs.

### 4.3 Earrings: real attachment points, independent sides

- Split the presentation pair into semantic left/right earring roots. Keep each earring's physical size independent of face width and pair spacing.
- Use the face transformation for head pose, then maintain separate calibrated piercing anchors. Face Landmarker supplies facial landmarks and an optional transformation matrix; it is not a dedicated piercing detector. [Google Face Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js)
- Offer a freeze-frame, tap-to-position flow for each visible piercing. Save offsets in head-local coordinates, not screen pixels. Let users adjust height, depth, and outward angle independently.
- **Stud:** align the post with the estimated piercing direction and rest the decorative front against the lobe proxy.
- **Huggie:** fit the hoop opening around the lobe, with front/back occlusion and an adjustable hinge orientation.
- **Drop:** keep the attachment fixed and articulate the drop around its connection using damped motion.
- **Chandelier:** give each tier its own limited joint; keep gems and their settings rigid while preventing excessive tier overlap.
- Hide or reduce confidence for the far ear and hair-covered regions. If the anchor cannot be observed, ask for repositioning instead of confidently placing jewellery on the cheek.

**Acceptance scene:** unequal manual piercing positions, head yaw/roll, one ear leaving view, hair crossing the ear, and glasses. Earrings do not grow with head turns or swing as one rigid pair.

### 4.4 Necklaces: a wearable path, not a flattened display model

- Estimate neck base, shoulder frame, and a coarse upper-chest surface from pose cues, with optional head-pose assistance. Provide manual neck-base and chest-depth adjustments because sparse landmarks do not reconstruct individual anatomy or clothing.
- Replace direct-child wrapping with a length-constrained chain rig. Sample rigid link transforms along an updated path using stable tangent frames; instance repeated links where possible. Do not non-uniformly stretch chain wire, stone baskets, or bails.
- Route the rear chain behind the neck, the sides around the neck/shoulder transition, and the front onto the chest proxy. Anchor clasps and pendant sockets to the same path data to prevent separation.
- **Pendant:** solve front drape and keep the bail attached at its chain position; let the pendant hang from that connection.
- **Y-Drop:** preserve the two upper branches, central junction, and separate vertical drop length.
- **Lariat:** model the crossing/slider and two tails explicitly, with constrained total length and separate tail motion.
- **Station:** preserve stone count and arc-length spacing while transporting complete bezel assemblies around the path.
- **Choker:** use a close neck-fitting path with controlled clearance, not a uniformly shortened pendant necklace.
- Add an over-clothing preview option with a coarse surface offset, clearly labelled approximate. Do not infer a tight body fit through bulky clothing.
- If selected length cannot reach around the estimated neck or satisfy the chosen topology, show a mismatch and keep dimensions unchanged.

**Acceptance scene:** all five silhouettes, changing shoulder angle, torso rotation, chin lowering, neckline boundaries, and hands crossing the chest. Necklaces follow the body without floating, stretching links, or pulling pendants away from bails.

## 5. Realistic compositing, materials, and motion

### 5.1 Occlusion and contact

Use a hybrid pipeline: articulated hand/wrist proxies, a face surface proxy, coarse neck/chest geometry, and confidence-weighted segmentation boundaries. Keep occluders depth-only, then composite subtle contact darkening separately.

Pose segmentation is optional and indicates person membership, not metric depth. A full person mask must not erase all jewellery in front of the person. Evaluate hair/skin/clothing segmentation only where it improves measured results; model outputs differ by model choice. [Google Pose Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js), [Google Image Segmenter](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter)

Temporal mask smoothing must respect motion and source timestamps to avoid trailing silhouettes. Transfer mask buffers deliberately and release MediaPipe resources. Test fingers crossing gems, hair covering earrings, sleeves over bracelets, and necklaces at clothing boundaries. Treat ambiguous depth as uncertainty, not a reason to paint an aggressive black mask over the object.

### 5.2 Lighting and every material family

- Replace blanket reflection-intensity boosts with an AR-specific exposure, white-balance, and lighting controller. Use robust, slowly varying camera statistics and conservative bounds.
- Treat the camera image as limited lighting evidence, not a recovered 360-degree HDR environment. Blend a restrained fallback environment with plausible directional illumination; do not promise exact room reflections from one image.
- Preserve gold, silver/platinum, rose gold, bronze, and patina identities across bright and dim scenes. Patina needs patchy roughness/colour variation and restrained oxidised regions, not a uniform green overlay or plastic clearcoat.
- Keep coloured stones' absorption, transmission, and facet contrast distinct. Test the full material catalogue, including opaque/translucent options where supported, rather than calibrating everything against diamonds.
- Audit `gemLocalToPhysical` and all transmission/thickness inputs across AR conversions. Optical path length must depend on physical stone dimensions, not viewport zoom or body-estimation scale.
- Add a camera-background render target for supported screen-space transmission approximations. Ensure visible skin/clothing can contribute behind transparent gems; never refract an unrelated studio floor through the wearer. Document off-screen and self-refraction limitations.
- Budget advanced internal-ray optics for large visible gems. Use stable, physically motivated lower-cost shading for melee, not glowing dots. Preserve closed geometry and material identity when reducing quality.
- Disable decorative sparkle lights in the authenticity preset. Highlights should respond to orientation and illumination; keep expressive effects opt-in and clearly separate.
- Match antialiasing, subtle contact shadows, and image sharpness without blurring away prongs and facets. Keep the camera feed out of accidental double tone-mapping.

### 5.3 Restrained physics

Start with a stable quasi-static contact solution. Then add fixed-step, bounded-substep dynamics to genuine joints: earring drops, necklace pendants/tails, and flexible bracelet segments. Apply damping, angular limits, length constraints, and coarse body collisions. Reset velocities on reacquisition, camera changes, and tab resume.

Camera motion alone must not cause artificial gravity swings. Express forces in a consistent body/camera frame; use conservative screen-down gravity when physical orientation is unavailable. Device orientation is optional and permission-gated. Provide a reduced-motion/static option. This is visual articulation, not a simulation of certified mechanical behaviour or skin deformation.

## 6. Performance, reliability, and user experience

### Runtime strategy

- Lazy-load only trackers required by the selected type. Run secondary pose/face cues and segmentation at lower rates when useful; do not launch every model for every ring.
- Benchmark the current worker CPU path against supported alternatives on actual devices. An inference GPU delegate is not automatically faster once gem rendering competes for the same GPU.
- Use repeatable device tiers: target 30 rendered FPS on the baseline mobile tier, with 60 FPS as a higher-tier goal; tune tracking around 15–30 FPS and optional masks around 8–15 FPS. These are initial budgets, not measured promises.
- Reduce internal resolution, off-screen effects, secondary inference, and optical bounce budgets before sacrificing attachment stability or physical dimensions. Use hysteresis to avoid rapid quality switching.
- Reuse materials, instance repeated links, and avoid per-frame geometry rebuilding. Clamp catch-up physics work after stalls.
- Pin compatible model/runtime/WASM versions and document licences and payload sizes. Consider self-hosting assets; handle unavailable CDN, offline reopening, and partial model-load failures explicitly.
- Handle late camera permission, track ending, camera switching, backgrounding, WebGL context loss, and repeated opening/closing. Tear down workers, streams, frame callbacks, masks, and owned GPU resources deterministically.

### Try-on flow

1. Show the selected design and type-specific framing guide before asking for the camera.
2. Explain camera processing, then request video only. Handle denial, unavailable hardware, and an unanswered prompt without trapping the user. Camera access requires a secure context and permission. [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
3. Show meaningful states: loading, finding target, approximate preview, calibrated preview, tracking lost, or unsupported device. Do not label a heuristic confidence score as fit accuracy.
4. Expose only relevant controls: hand/finger; wrist clearance; separate piercing offsets; necklace length/neck-base position. Keep placement reset separate from product reset.
5. Allow freeze-and-adjust and explicit snapshot download. Preserve correct crop/mirroring in captures, and release temporary image data after use.
6. Keep camera frames and landmarks on-device by design. Make clear that initial asset downloads still involve network requests. Do not upload recordings, body measurements, or debugging landmarks by default.
7. Provide keyboard access, labelled controls, focus management, escape/close, reduced motion, and a non-camera 3D fallback. Stop camera tracks on close and require an explicit resume after suspension.

## 7. Proposed module boundaries

Keep `assets/js/ar-tryon.js` as the public entry point while moving responsibilities gradually:

| Proposed module | Responsibility |
| --- | --- |
| `assets/js/ar/session.js` | Lifecycle, active design revision, state machine, UI integration |
| `assets/js/ar/camera.js` | Camera acquisition, crop/mirror mapping, frame scheduling |
| `assets/js/ar/tracking.js` | Worker protocol, tracker selection, temporal identity and filtering |
| `assets/js/ar/calibration.js` | Coordinate contracts, scale estimates, uncertainty, user adjustments |
| `assets/js/ar/wearable-asset.js` | Generator metadata adapter, unit normalisation, resource ownership |
| `assets/js/ar/wearables/ring.js` | Finger attachment and contact |
| `assets/js/ar/wearables/bracelet.js` | Rigid/flexible wrist fitting |
| `assets/js/ar/wearables/earrings.js` | Per-ear anchors and visibility |
| `assets/js/ar/wearables/necklace.js` | Neck/chest fitting and style-specific paths |
| `assets/js/ar/articulation.js` | Shared path constraints, joint motion, collision proxies |
| `assets/js/ar/compositor.js` | Occlusion, masks, camera-background transmission, contact shading |
| `assets/js/ar/lighting.js` | Exposure matching, material integration, performance tiers |

Extend the existing `ar-tracking-worker.js`; do not duplicate it. Add wearable metadata to the appropriate generator/spec builders. Keep interface extractions small enough to compare old and new behaviour before switching a type over.

## 8. Delivery order and release gates

| Phase | Work package | Dependency | Exit gate |
| --- | --- | --- | --- |
| 0 — Baseline | Capture current behaviour, enumerate type/style fixtures, instrument transforms and frame timing | None | Reproducible baseline for all four types; known failures recorded |
| 1 — Correctness | Wearable contract, unit conversion, current-design handoff, correct-type loading, coordinate/worker protocol | Phase 0 | Every type loads the selected asset at consistent dimensions; no stale results or wrong-type fallback |
| 2 — Stable attachment | Ring and rigid-bracelet adapters; per-ear anchors; static necklace and flexible-bracelet path fitting | Phase 1 | All types attach plausibly in slow movement with manual calibration; no need for sparkle or dynamic physics |
| 3 — Contact | Articulated depth proxies, segmentation evaluation, connected chain paths, type-specific occlusion | Phase 2 | Front/back occlusion and construction connectivity pass each type's acceptance scenes |
| 4 — Appearance | AR lighting, coloured stones, patina/metals, transmission integration and quality tiers | Phase 3 | No diamond-only tuning; material comparison set passes under bright, dim, warm, and cool lighting |
| 5 — Motion and usability | Bounded articulation, freeze/adjust, calibration UX, accessibility, privacy/lifecycle hardening | Phases 2–4 | Stable target loss/recovery, restrained motion, correct snapshots, reliable teardown |
| 6 — Device qualification | Browser/device matrix, sustained-use tests, regression review, per-type feature flags | All earlier phases | Each type independently passes release gates before enabling it by default |

Phases describe dependency order, not a promised calendar. Baseline capture determines realistic effort and whether an ear-specific model or more sophisticated surface fitting is justified. Necklace and earring work must not be deferred behind an indefinitely polished ring demo.

### First implementation batch

1. Add an opt-in diagnostic overlay for axes, attachment anchors, design revision, units, frame age, and resource counts; no automatic recording.
2. Define wearable metadata and deterministic fixtures for all current silhouettes.
3. Correct designer readiness and remove wrong-type fallback behaviour.
4. Introduce AR-owned normalised assets under separate pose nodes and verify scale invariants.
5. Preserve handedness and source/session metadata across the worker boundary.
6. Establish the four adapters behind feature flags, initially using static fitting and existing rendering.

Do not begin with new sparkle, global exposure increases, aggressive tracking prediction, or unconstrained chain physics.

## 9. Verification and definition of done

### Automated and repeatable checks

Use small deterministic validation scripts and fixtures consistent with the repository's existing script-based workflow; no new test framework is required initially.

- Unit/transform checks: millimetre/metre conversion, nested assembly scales, mirror/crop inversion, pose composition, ring bore and earring-size invariants, and optical path units.
- Asset checks: every silhouette, extreme supported dimensions, setting/stone attachment, chain socket continuity, joint limits, and unchanged generator/export state after AR disposal.
- Tracking replays: synthetic landmarks plus explicitly consented clips; two-hand identity crossing, camera changes, missing landmarks, confidence oscillation, out-of-order messages, and reopening mid-load.
- Compositing comparisons: fixed camera frames with labelled occlusion boundaries and material reference renders. Geometry-only replays do not establish real-camera tracking accuracy.
- Lifecycle checks: denied/ignored permissions, worker/model errors, hidden tab, camera unplug, context loss, and at least 20 open/close or type-switch cycles without growing resource counts.

### Initial measurable targets

Treat these as provisional engineering targets to confirm against Phase 0, not existing performance claims:

| Metric | Initial target and measurement conditions |
| --- | --- |
| Asset integrity | No wrong-type substitutions; unchanged stone and rigid-part dimensions within numerical tolerance |
| Static attachment | 95th-percentile jitter below 2 pixels, measured in 720p source coordinates over a stationary 5-second sequence |
| Visible anchor alignment | Median error below 4 pixels and 95th percentile below 10 pixels against independently annotated, clearly visible anchors at 720p |
| Calibrated scale | Median error within 5% on controlled known-size, same-depth-plane fixtures; report worst cases and invalid-calibration rejection separately |
| Responsiveness | Baseline-tier median rendering at least 30 FPS, 95th-percentile frame interval below 50 ms, and tracking-result age below 100 ms during ordinary motion |
| Tracking recovery | Stable reacquisition within 1 second once the target is clearly visible; no persistent hand swap or 180-degree orientation flip |
| Articulation | No disconnected sockets or changing rigid-part dimensions; chain path-length residual below 1% in supported fixtures |
| Privacy and cleanup | No frame/landmark uploads in a network audit; all camera tracks ended on close; no monotonic resource growth across repeated sessions |

Report acquisition failure rate and time without a valid target too; accuracy metrics must not hide failures by scoring only successful frames. Separate calibrated versus uncalibrated results and manual versus automatic anchor placement. Landmark confidence is not a substitute for measured accuracy.

Test current and previous supported browser versions on real iPhones/iPads, lower- and mid-tier Android phones, and desktop webcams; record exact devices and versions at qualification time. Include front/rear cameras, portrait/landscape, different skin tones and body sizes, hair styles, glasses, sleeves, necklines, low light, backlight, and busy backgrounds. Use only consented participant data and define deletion dates for any retained QA recordings.

Release behind independent type flags. Compare against the baseline and roll back a type if it regresses; do not lower the entire generator's material quality to mask one AR problem. Final acceptance requires all current silhouettes, not one favourable ring screenshot.

## 10. Optional advanced work after the baseline passes

- Compare an ear-specific keypoint model against manual piercing calibration using a consented evaluation set; adopt only with a demonstrated accuracy gain, acceptable licence, and mobile cost.
- Evaluate hardware depth or a native companion only where available and where depth resolution helps at jewellery scale. Browser WebXR has limited availability, so it must not be a universal dependency. [MDN WebXR overview](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- Investigate higher-quality body surfaces, depth-aware lighting, and more detailed self-collision behind capability checks, with explicit fallback behaviour.
- Add simultaneous outfit previews only after individual adapters pass: necklace plus earrings first, then bracelet/ring combinations. Reuse tracking results and avoid loading redundant models.
- Expand to new jewellery categories only with explicit physical assets, anchors, fit controls, occlusion rules, and acceptance fixtures.

The completion standard is convincing, stable, honest try-on across the supported catalogue—not a claim of perfect measurement, exact reconstructed lighting, or manufacturing validation.
