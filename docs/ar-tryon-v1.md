# AR V1: wearable fitting implementation

Implementation record for the first all-type pass of the [AR upgrade plan](ar-tryon-upgrade-plan.md). This is not a claim that the entire roadmap or real-device qualification is complete.

## Implemented

- **Physical assets:** a separate metre-based tracking root preserves each builder's original geometry scale. AR no longer overwrites the millimetre assembly scale. Studio presentation tilt is removed from rings, and independent AR builds leave the visible design unchanged.
- **Design handoff:** AR awaits the full designer and uses its current state. A failed factory produces a recoverable error before requesting the camera, not a substitute ring for another jewellery type.
- **Rings:** explicit hand selection, temporal hand identity, foreshortening-aware scale estimates, logarithmic scale filtering, bounded positional prediction, and articulated adjacent-finger depth proxies. The selected ring dimensions do not auto-resize to an estimated finger.
- **Bracelets:** full V3.2 bangle, cuff, tennis, and station assemblies render at the correct units. Tennis/station wear paths now place slack beneath an estimated oval wrist instead of spreading two rows outside its sides. Rigid settings, links and clasps move along a length-constrained path; they are not stretched. The clasp starts on the underside. An optional wrist-width reference overrides the hand-derived estimate. Too-short flexible bracelets are hidden and labelled; bangles/cuffs retain their fixed opening. This is approximate cross-section fitting, not reconstructed skin or gravity-driven cloth physics.
- **Necklaces:** a separate three-dimensional wear path fits a coarse neck estimate while solving for the selected path length. Cable and other repeated chain links use instanced rigid geometry rather than moving a merged mesh. Bails, stations, Y junctions, lariat tails, and closures are built against the same path. A user-adjustable neck circumference rebuilds the wear path without changing the product's selected length. An impossible estimated fit is labelled and hidden instead of silently resizing the product.
- **Earrings:** semantic left/right groups, independent head-local piercing offsets, separate lobe positions, foreshortening-aware size estimates, and proper mirrored rotation rather than a reflected rotation basis. A coarse tracked face-depth fan replaces the ellipsoid when valid outline/nose landmarks are available. Conservative lateral visibility with hysteresis hides far earrings and holds hidden-ear anchors instead of following inferred landmarks across the cheek. Local lobe depth proxies cover pierced-ear hardware. These are not detected piercing, ear or hair surfaces.
- **Motion:** bounded, damped hinges for necklace pendants and drop/chandelier assemblies. Fixed substeps prevent unbounded catch-up after a stall. Motion respects the reduced-motion preference and can be disabled. Gems, prongs, and galleries remain rigidly attached.
- **Materials:** preserve the generator's material-specific roughness and finishes. Convert absorption distances into AR units and compensate for display scale so coloured stones do not become clear or change colour merely because the camera moves. Decorative sparkle lights and camera-as-panorama reflections are removed.
- **Crystal optics:** AR now installs the generator's internal BVH rays after the HDR environment loads, including supported coloured crystals and side stones. Up to 64 crystals use at most 12 bounces; small gems and bracelet stones use at most 6 without dispersion. Ray absorption uses physical metres, independent of tracking/display scale. Fast mode keeps raster materials; opal, moonstone and onyx retain their distinct material models. This is environment-exit transport, not refraction of the user's body or setting geometry.
- **Camera compositing:** an sRGB camera background uses the same crop and mirror mapping as tracking. Native transmission can sample the visible camera background rather than an unrelated studio background. The bundled Three.js video callback lifetime is avoided with an explicitly updated texture owned by the AR session.
- **Performance:** the designer's render loop pauses while AR owns the screen. Chain instancing, a capped pixel ratio, video-frame scheduling, one in-flight worker request, and stale-result rejection reduce unnecessary work. Main-thread fallback stays available at a reduced target rate.
- **Tracking corrections:** source timestamps reach all pose filters instead of being replaced by worker arrival times. Adaptive derivatives use consecutive raw samples; one-frame spikes are held for confirmation. Screen-plane rotation is unwrapped before filtering, and pitch/roll respond more promptly. Multiple palm baselines avoid scale collapse during edge-on motion. Prediction is capped at six screen pixels and decays to zero by 150 ms without a new detection. Adjacent-finger masks follow the same displayed pose as the jewellery; wrist/finger mask length no longer pulses with motion.
- **Privacy and recovery:** video-only camera requests; no frame uploads added; immediate close cancellation; cleanup of permission results that arrive after closing; explicit resume after background suspension; opt-in local placement persistence; forget controls; focus management; freeze/adjust; and clear approximate-size labels.
- **Diagnostics:** optional piece, units, inference cost, result age, hand identity, and scale-reference readout. The UI describes tracking stability instead of presenting a heuristic percentage as fit accuracy.

## Module ownership

| Module | Responsibility |
| --- | --- |
| `assets/js/ar/wearable-asset.js` | Physical conversion, per-ear anchors, optical-distance conversion |
| `assets/js/ar/gem-optics.js` | Bounded internal crystal rays, fixed physical absorption and material ownership |
| `assets/js/ar/body-fit.js` | Robust palm scale, weighted face reference and shoulder foreshortening/yaw estimates |
| `assets/js/ar/wearable-paths.js` | Length-constrained necklace and flexible-bracelet wear paths |
| `assets/js/ar/bracelet-fit.js` | Rigid hardware transport along an estimated wrist wrap |
| `assets/js/ar/face-occlusion.js` | Coarse face-depth surface and hysteretic ear visibility |
| `assets/js/ar/pose-filter.js` | Capture-clock adaptive filtering, transient-spike gating and bounded prediction time |
| `assets/js/ar/tracking.js` | Stable hand selection and timestamp/generation gates |
| `assets/js/ar/articulation.js` | Bounded pendant/drop hinges |
| `assets/js/ar/camera-texture.js` | Camera background texture and crop/mirror mapping |
| `assets/js/ar-tryon.js` | Existing public entry point, pose solvers, UI, lifecycle, lighting and depth proxies |
| `assets/js/ar-tracking-worker.js` | CPU inference, handedness, frame identifiers and source timestamps |

The runtime remains pinned to MediaPipe Tasks Vision `0.10.14`. Hand, face, and pose models use explicit version `1` URLs. The versioned pose URL was checked successfully before removing the mutable `latest` URL. This does not replace actual-device compatibility testing.

## Validation record

Temporary local validation fixtures use generated landmarks and a drawn background, not a real person's camera stream. They are not shipped as a public page or a new test framework.

- Geometry checks: 27 necklace/bracelet configurations, 6,446 rigid chain instances, 231 gemstone meshes, and 18 path-length cases.
- Numerical checks: metre conversion, finite vertices, rigid instance transforms, default necklace fit including the choker, hand identity across result reordering, stale/duplicate frame rejection, and bounded articulation/reset.
- Optical checks: absorption-distance conversion and display-scale invariance; visual inspection caught and corrected a colour-loss regression in blue sapphire.
- Lifecycle checks: immediate cancellation of an unanswered camera request, stopping a stream delivered after close, opt-in placement persistence, and unavailable-factory handling without camera activation.
- Browser checks: all 18 current silhouettes build and obtain synthetic try-on poses without changing the studio design. The final matrix passes 20 AR sessions, including repeated opening/closing, late-permission cleanup, and unavailable-factory handling, with no uncaught application errors. Desktop and 390-pixel mobile-sized layouts were inspected.

These checks do **not** measure tracking accuracy, physical fit error, native mobile frame rate, battery usage, or performance across skin tones and clothing. A desktop browser with an emulated narrow viewport is not an iPhone/Android qualification result.

## Manual verification

The user-consented camera passes and subsequent camera-free corrections are recorded in [Live AR test — 11 September 2026](ar-live-test-2026-09-11.md). Fresh permission is required before any further real-camera verification. The following checklist is for a future explicitly authorised session, not permission to start one.

1. Refresh the custom-design page, open the studio, choose a type/style, and select **Try On (AR)**.
2. Check the correct model appears before adjusting anything. Open **Adjust placement** for controls; rings and bracelets support **Hand** selection under **Placement, sizing & privacy**.
3. For earrings, use **Freeze / adjust**, select an ear, and adjust its outward/height offset. Resume the live feed after placement.
4. For necklaces, use a known neck circumference where available. New unsaved placements estimate the neck base from the mouth/shoulder projection, bounded to 35–85 mm. Turn off **Estimate neck base from pose** to use **Manual neck base above shoulders**. Previously saved manual heights remain manual, including zero. Neither mode detects the anatomical notch. Compare frontal/oblique chain joins; short-chain warnings must retain the selected physical length.
5. Compare stones and finishes under different room lighting; change camera distance and check that stone colour does not wash out merely because its on-screen size changes.
6. Close, reopen, switch cameras, and background the page. Check camera capture stops on close and does not unexpectedly restart after backgrounding.

## Remaining roadmap work

- Real-camera replay data and independently annotated accuracy measurements, collected with consent.
- Actual iOS/Android qualification, sustained-use and memory/resource profiling, and measured adaptive quality tiers.
- Hair, skin, and clothing segmentation, with timestamp-aware depth compositing; current proxies do not detect hair or sleeves.
- Better piercing localisation, optional forearm/pose fusion, calibrated body-scale uncertainty, and camera-specific calibration profiles.
- Full wrist/forearm reconstruction and gravity/contact simulation beyond the current fitted cross-section, torso/clothing surface fitting, per-tier chandelier articulation, and collision-aware secondary motion. Existing hinge limits are not a full body collision solver.
- More comprehensive scene-wide refraction, lighting reconstruction, and optional hardware-depth experiments. The camera background does not reconstruct off-screen geometry or a full HDR environment.
- Feature-flagged rollout and the roadmap's statistical release gates. No deployment or device certification is implied by this local implementation.
