# Shared AR render foundation — 12 September 2026

The shared wearable renderer now batches identical opaque metal parts across all four jewellery types. In the camera-free product comparison, Tennis drops from 1,493 to 83 draw calls, Pendant from 417 to 65, Bangle from 185 to 41, Classic Round from 206 to 150, and Stud from 222 to 110. These are draw-call reductions, not measured real-device FPS gains or evidence of better anatomical attachment.

## Why this follows the research

The existing neural tracking worker and the gemstone renderer share a finite device budget. Before adding more perception models, the previous browser fixtures exposed 1,497 draw calls for a tracked Tennis bracelet. Inspection found hundreds of identical metal settings, claws, and hinge parts submitted separately. This pass removes redundant submission work while preserving the product and its moving parts.

Three's pinned r164 documentation describes instancing for objects that share geometry and material while retaining independent transforms. Its lifecycle and buffer-update requirements inform this implementation: [r164 InstancedMesh documentation](https://github.com/mrdoob/three.js/blob/r164/docs/api/en/objects/InstancedMesh.html). The integration uses the scene callback before render-list collection in the actual bundled renderer: [r164 WebGLRenderer source](https://github.com/mrdoob/three.js/blob/r164/src/renderers/WebGLRenderer.js).

## Implementation

`assets/js/ar/render-batches.js` builds an AR-specific rendering representation after the wearable's physical dimensions and bracelet-fitting bindings are established.

- Candidates must have matching material identity, geometry attribute layout, draw range, groups, layers and render properties. Geometry buffers are hashed, then compared byte for byte before joining a batch; a hash collision cannot make different parts equivalent.
- The original objects, geometry buffers and hierarchy remain intact. A source object's zero layer mask suppresses its own draw without hiding its children. The batch draws the matching geometry and material at that object's transform.
- Each frame resolves transforms within the wearable hierarchy. Settings follow wrist fitting, pendant hinges follow articulation, and individual or ancestor visibility changes remove the relevant instances. Ordinary tracking-root movement does not upload unchanged instance transforms.
- Gemstones, transmission/transparent materials, depth proxies, existing instances, custom render callbacks and skinning are excluded. Negative-scale, collapsed or sheared local transforms use the original individual draw. Replacing a participating geometry or material also restores the individual draw. Geometry buffers are immutable in this wearable lifecycle; changed product geometry requires rebuilding the wearable.
- A scene callback synchronizes batches before every AR render, including freeze/adjust renders. Moving instances bypass stale frustum bounds.
- Close and necklace rebuild release instance buffers and restore source layers. Shared geometry and material disposal is deduplicated in the ordinary wearable cleanup. The studio generator and export representation are not rewritten.

The additional `render-timing.js` records a bounded window of 120 local samples: CPU render-submission time, render-start interval, draw calls, triangles and device pixel ratio. The existing opt-in tracking diagnostics show these alongside inference/turnaround measurements. CPU submission includes scene traversal and driver calls; it does not measure GPU completion or sensor-to-display latency. Pause gaps are excluded by explicitly ending the cadence interval; slow active frames remain in the measurements. No images or landmarks are stored in these diagnostics.

## Measurements

The product comparison uses the real AR modal, real model factory, local HDR environment and production optical shaders. It toggles batching on the same asset, renders to a 480 × 360 drawing buffer, and reads the resulting GPU pixels. Source dimensions, optical material identities and geometry buffers must remain unchanged.

| Product fixture | Individual draws | Batched draws | Reduction |
| --- | ---: | ---: | ---: |
| Ring — Classic Round | 206 | 150 | 27.2% |
| Necklace — Pendant | 417 | 65 | 84.4% |
| Necklace — Y-Drop | 421 | 69 | 83.6% |
| Necklace — Lariat | 434 | 76 | 82.5% |
| Necklace — Station | 119 | 59 | 50.4% |
| Necklace — Choker | 417 | 65 | 84.4% |
| Bracelet — Bangle | 185 | 41 | 77.8% |
| Bracelet — Cuff | 42 | 42 | 0% |
| Bracelet — Tennis | 1,493 | 83 | 94.4% |
| Bracelet — Station | 121 | 47 | 61.2% |
| Earrings — Stud | 222 | 110 | 50.5% |
| Earrings — Drop | 234 | 122 | 47.9% |
| Earrings — Huggie | 90 | 60 | 33.3% |
| Earrings — Chandelier | 468 | 314 | 32.9% |

The other four ring silhouettes also changed from 206 to 150 in these configurations. Cuff has no eligible repeated hardware and stays on its original path. Counts include the renderer's relevant material passes and depend on selected design details. The separate body/contact fixtures include depth draws: tracked Tennis now reports 87, Pendant 67, and Bangle 45.

Three poses per silhouette cover rotations, pendant articulation, flexible wrist widths of 45/55/62 mm, and one-sided earring visibility. The final suite passes 317 assertions across 18 silhouettes and 54 paired images. Maximum observed RGB RMSE was about 0.144 on the 0–255 channel scale; at most four pixels in a 480 × 360 frame differed by more than eight levels. The acceptance limits are RMSE below 1 and fewer than 0.2% such pixels. Triangle counts match between each paired render.

The initial desktop comparison passed 313 assertions. The final run additionally asserts that the Left earring is actually hidden and passes 317 using a 390-pixel browser viewport. Both use the same fixed drawing-buffer dimensions for comparison; this is not mobile hardware qualification. A generated product preview was inspected at `/private/tmp/ar-render-tennis-synthetic.png`.

## Reproducible checks

Run from the site directory:

```sh
node scripts/check_ar_render.mjs
node scripts/check_journeys.mjs --ar-rendering
node scripts/check_journeys.mjs --ar-rendering --mobile
node scripts/check_ar_tracking.mjs
node scripts/check_ar_contact.mjs
node scripts/check_ar_body_fit.mjs
node scripts/check_journeys.mjs --ar-tracking
node scripts/check_journeys.mjs --ar-contact
node scripts/check_journeys.mjs --ar-body-fit
```

The new Node suite passes five scenario groups, including 90 motion frames, visibility, resource replacement, fallback transforms, real Tennis fitting, disposal and timing semantics. Existing Node suites pass 21 tracking, six contact and five torso/wrist groups. Existing browser suites pass 34 tracking, 142 contact and 132 body-fit assertions. Static checks pass 33 pages, 1,369 local references and 28 JSON-LD blocks with zero errors.

Browser tests run in disposable Chrome profiles. External requests are blocked; camera/microphone permissions are denied and capture APIs are intercepted. Every completed AR browser run reports zero camera requests and zero runtime/shader errors. No deployment or participant footage was used.

## Remaining foundation work

Tennis still submits approximately 1.08 million triangles in the body fixture. This pass preserves mesh detail and crystal optics; fewer draw calls do not eliminate vertex, shading or thermal costs. Real-device profiling should now use the combined render and tracking diagnostics to select the next bottleneck rather than assume inference is responsible.

The user's visual priority remains necklace, bracelet, ring, earrings. Next perception work should target neck/clothing contact and an independently observed forearm/wrist axis, then camera lighting integration and local finger/ear surfaces. A larger neural model should be adopted only after demonstrating useful observations and acceptable combined browser cost. The existing approximate body priors, lack of clothing/hair segmentation and real-camera qualification gaps remain.
