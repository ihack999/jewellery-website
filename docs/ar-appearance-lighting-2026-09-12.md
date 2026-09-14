# Shared AR appearance lighting — 12 September 2026

All four jewellery types now adapt the HDR environment and direct lights together to the displayed camera image. Previously, the sampler changed direct lights and renderer exposure while leaving `scene.environmentIntensity` at 1. That left an important source of metal reflections and ray-traced crystal brightness largely disconnected from the camera's appearance.

This pass addresses the visible brightness mismatch in the supplied screenshots. It does not reconstruct the room, recover physical illumination, or establish real-camera visual quality.

## Research and source findings

A narrow camera view contains limited information about the surrounding light field. Apple's EnvMapNet research learns an HDR environment estimate from such an image; that is a trained prediction, with a specific native implementation, rather than a capability provided by averaging camera pixels. This pass implements a bounded appearance adjustment before attempting that more demanding model integration. [Apple: HDR Environment Map Estimation for Real-Time Augmented Reality](https://machinelearning.apple.com/research/hdr-environment-map-estimation)

Inspection of the bundled Three r164 renderer identified the actual control point: standard/physical materials without an explicit material environment receive `scene.environmentIntensity`. The custom gem shader also uses that environment-intensity uniform for its internal ray exits. The new browser test isolates a ray-traced gem, disables all direct lights, and verifies its response. [Pinned r164 renderer source](https://github.com/mrdoob/three.js/blob/r164/src/renderers/WebGLRenderer.js)

The camera texture is already marked sRGB. r164's background path exempts sRGB image backgrounds from the scene's tone mapping; this pass preserves that behaviour and verifies the camera pixels directly. [Pinned r164 background implementation](https://github.com/mrdoob/three.js/blob/r164/src/renderers/webgl/WebGLBackground.js)

## Changes

`assets/js/ar/appearance-lighting.js` contains the camera-region mapping, robust luminance measurement, temporal adaptation and renderer application. `ar-tryon.js` supplies current camera frames and the shared light rig.

- A 48 × 32 probe samples only the `object-fit: cover` region visible in the preview, at most once per 260 ms. Off-screen bright areas no longer affect the measurement. The tracked region is correctly mapped between selfie display coordinates and the unmirrored probe.
- sRGB bytes are converted to linear light before applying luminance weights. A histogram in logarithmic luminance suppresses isolated highlights and avoids treating encoded channel averages as light energy.
- The frame's 75th luminance percentile supplies the main reference. A tracked neighbourhood uses a weighted 60th percentile, with its difference limited to one stop and then blended at 25%. Its maximum contribution to the final gain is 0.15 stops. A dark garment therefore has limited influence beyond the overall image brightness.
- The appearance gain uses an explicit heuristic: 0.18 linear luminance as a reference, a 0.60 response slope, and bounds of −3 to +0.60 stops (0.125–1.516×). These values are engineering priors, not measured illumination or calibrated camera response.
- Adaptation uses distinct source-video times with a 0.55-second time constant in stops. Repeated, backwards, invalid or unavailable observations cannot accumulate adjustment. Freeze holds lighting, and camera replacement resets the observation history.
- One gain controls the HDR environment and the neutral reference light rig. The renderer exposure stays at 1; the camera background is not dimmed or recoloured. Material colours, absorption, roughness, cut geometry, optical bounces and physical dimensions are preserved.
- Removed the image-gradient-driven key-light movement and skin-colour-derived warmth tint. A tiny or cropped-image gradient no longer produces a full-strength direction change. Light direction remains an explicit reference-rig prior.
- The existing opt-in diagnostics show `camera appearance ×…`. This is labelled as an appearance adjustment, not a confidence score or an HDR estimate.

The HDR texture is reused, including after it loads asynchronously. Necklace rebuilds inherit the scene's current gain with their new optical materials. The obsolete live-environment cleanup branch was removed; no live panorama was being constructed by that code.

## Verification

The new Node suite passes six groups covering linear colour conversion, all 256 grey levels, bounded gain, off-centre uniform regions, isolated highlights, local clothing influence, six crop/mirror configurations, frame-rate-independent filtering, duplicate/invalid observations, and separation between object lighting and background exposure.

The browser suite uses canvas-generated video through the actual HTML video element, production `CameraTexture`, real AR modal/model factory, local HDR, standard materials and custom ray shaders. No camera or microphone is used.

- Initial desktop run: **271 assertions across all 18 silhouettes**.
- Final narrow-viewport run: **275 assertions across all 18 silhouettes**, adding the isolated ray-gem and portrait-crop checks.
- For an sRGB grey-32 source, the appearance gain is approximately **0.220×**. For grey 170, it reaches the bounded **1.516×**.
- In the dim fixture, summed displayed RGB values on reference-selected jewellery fragments fall to **44–58%** of the unit-gain reference, depending on the style. This is a controlled rendered-pixel response, not a measurement of human realism or physical radiance.
- Background pixels remain identical when only the gain changes, and generated camera grey survives the video/texture round trip within three channel levels.
- The isolated ray-traced gemstone responds to environment gain with every direct light disabled.
- Bright margins outside a portrait cover crop do not brighten the necklace.
- The real Freeze control pauses video and holds lighting. Closing clears lighting history and ends all generated video tracks. Necklace rebuild preserves the current gain.
- Every run reports zero camera requests and zero runtime/shader errors.

Generated pendant reference/adapted renders were inspected at `/private/tmp/ar-lighting-reference-synthetic.png` and `/private/tmp/ar-lighting-adapted-synthetic.png`. The reference uses the same current rig at unit gain; these are not before/after participant images.

The existing render comparison also passes **317 assertions across 18 silhouettes**, retaining batching savings and paired-image equivalence. Existing Node suites pass 21 tracking, six contact, five torso/wrist and five render groups. Browser regressions pass 132 necklace/wrist assertions at a narrow viewport, 34 generated-video tracking assertions and 41 storefront assertions. Static checks pass 33 pages, 1,369 local references and 28 JSON-LD blocks with zero errors.

## Reproduce

From the site directory:

```sh
node scripts/check_ar_lighting.mjs
node scripts/check_journeys.mjs --ar-lighting
node scripts/check_journeys.mjs --ar-lighting --mobile
node scripts/check_journeys.mjs --ar-rendering
```

The browser harness uses a disposable Chrome profile, blocks external requests, denies camera/microphone permissions, and intercepts hardware capture APIs. Native canvas capture supplies generated test video. No new model, participant dataset or deployment is involved.

## Remaining limits

Camera image brightness mixes illumination, surface reflectance, sensor exposure and image processing. This bounded adjustment cannot separate them. A scene dominated by dark or bright surfaces can still produce an imperfect gain; clipping, strong colour casts and unseen lights remain unresolved. The HDR's reflection structure is still a reference environment, not a reconstruction of the user's room.

Real-device assessment must evaluate the complete camera, tracking, probe and rendering workload, including low light and exposure transitions. The 48 × 32 readback is throttled but is not a measured mobile performance guarantee.

The user's priority remains necklace, bracelet, ring, earrings. Neck/clothing contact and an independently observed forearm axis are still the largest fitting candidates. Local ear/finger surfaces, camera softness and measured or learned environment estimates remain further work. No world-class appearance or physical-fit accuracy is claimed from synthetic tests.
