# Generator V3: Advanced Optics and Offline Output

Implemented locally on September 11, 2026. This extends the [V2 foundation](generator-v2-foundation.md); it is not a claim that the entire [upgrade programme](jewellery-generator-upgrade-plan.md) or manufacturing validation is complete.

## V3.2 Construction Update

The [V3.2 construction notes](generator-v3.2-construction.md) supersede the earlier shoulder-accent and necklace/bracelet limitations below. Shoulder stones now use complete faceted geometry, small gems can use BVH transport, necklaces have complete linked loops, and bracelets have dedicated articulated or oval-section builders. Workshop CAD validation remains a separate requirement.

## V3.1 Appearance and Contact Repairs

### Coloured Stones

`gem-appearance.js` resolves all 17 presets into clear, translucent or opaque optical treatments. Transparent coloured stones no longer mix a white diffuse body into their transmitted colour. Their absorption colours and millimetre distances were retuned independently: sapphire, ruby and emerald retain stronger colour, while aquamarine, morganite and other pale stones retain lighter transmission. Diamond keeps its existing white absorption and polished surface. These are illustrative presets, not measured spectral data; hue, tone, saturation and cut jointly affect appearance, as described in [GIA's coloured-stone quality discussion](https://www.gia.edu/gia-news-research/value-factors-design-cut-quality-colored-gemstone-value-factors).

Fire opal uses an orange translucent body, moonstone a milky blue-grey body, and onyx an opaque polished material rather than treating all three as white diamond-like glass. Opal and moonstone currently use raster transmission. This does not implement physical opalescence or adularescence. Fire opal does not inherently require rainbow play-of-colour; see [GIA's opal quality factors](https://origin.prod.gia.edu/opal-quality-factor). Alexandrite retains an artistic lighting-temperature colour interpolation, not a spectral colour-change model.

Internal gem rays now include up to 32 analytic inclusion occluders for emerald and salt-and-pepper presets. The particles use sphere bounds and opacity, not true feather geometry or scattering. Absorption path lengths account for the mesh's world transform, including nonuniform scale. The existing inclusion-density and absorption controls remain editable and saved with the design.

### Lighting, Metal and Motion

- Photographic mode reduces redundant fill, rim and hemisphere energy and disables the artificial punch/table/under lights and animated micro-sparkle lights. Inspection preserves the selected exposure instead of replacing it with a brightness boost.
- The offline Cycles softboxes also use lower energy; this prevents diffuse oxide and the charcoal ground from washing out while retaining bright reflected light sources in polished surfaces.
- Fake reflection rings, plinth glow and caustic decals are restricted to Expressive mode; inspection hides the stage. This is a lighting cleanup, not scene-wide real-time path tracing.
- Bronze patina uses seeded, tileable colour, roughness, metalness and normal maps. Exposed bronze stays conductive; oxide patches are rough and mostly dielectric. **Bronze patina coverage** ranges from bare bronze to full oxide, survives JSON round-trips and belongs to the metal lock group. Browser canvas textures preserve these maps in GLB/Cycles exports. The pattern is UV-based and illustrative, not simulated corrosion chemistry or wear-by-contact.
- Hanging pieces start at rest rather than receiving an artificial rebuild impulse. A damped oscillator replaces frame-dependent Euler updates, and orbit/camera smoothing uses elapsed time. Reduced-motion preferences disable autonomous orbit and sway. This remains a presentation model, not articulated chains or rigid-body collision physics.

### Prong–Gem Contact

`setting-contact.js` builds lazy BVHs from actual transformed gemstone triangles. Outward signed-distance queries use a ray-side test so concave Heart outlines, rotations, tilts and mirrored transforms are handled. Tapered-post cross-sections move outward as whole sections; claw/bead bounds are fitted conservatively. A 0.025 mm visual margin prevents near-coplanar flicker. Both-direction edge/triangle tests and containment checks report remaining intersections after fitting.

The readout in **Extras & precision**, GLB metadata and downloaded mesh audit include the result. GLB/Cycles export refuses a setting with unresolved detected prong–gem intersections. Component bounds are reported in millimetres in piece-build coordinates. This checks tagged prongs/claws/beads against supported closed gemstone meshes, **not** bezel/gallery contacts, all self-intersections, bearing-seat machining, mechanical retention or manufacturing tolerances. Conservative fitting may require a goldsmith to redesign the seat; `productionValidated` remains false.

## Internal Gemstone Transport

`gem-ray-kernel.js` builds a median-split triangle BVH with four-triangle leaves. `gem-ray-material.js` uploads nodes and triangles to float textures and traverses them in the fragment shader. The surface still uses Three.js physical shading; transmitted radiance follows the actual faceted gemstone boundary rather than a single screen-space thickness estimate.

The internal path uses Snell refraction, dielectric Fresnel weighting, total internal reflection and Beer–Lambert absorption. Each bounce contributes its escaping transmission and continues the remaining reflected energy until its budget is exhausted. The transport equations follow the dielectric treatment in [Physically Based Rendering](https://www.pbr-book.org/4ed/Reflection_Models/Dielectric_BSDF).

Dispersion uses a Cauchy approximation anchored at the reference IOR and samples 650, 550 and 460 nm. These are **three RGB bands**, not a sampled spectrum or calibrated spectral colour integration. The base reflection retains Three.js's approximate Fresnel BRDF. Residual energy at the bounce limit is discarded, so insufficient budgets can darken deeply trapped paths.

### Controls and Bounds

- Choose **Ray Traced** or **Fast** in Extras & precision.
- Request 8, 12 or 20 internal bounces; adaptive low-quality rendering can reduce this to 8.
- Tune dispersion from 0–2× and body absorption from 0.1–3×. These are artistic overrides, not measured gemological values.
- At most eight transparent gems at least 2 mm wide are traced. Other stones retain the fast physical material.
- BVHs exceeding 511 nodes or the supported stack depth retain the fast material. Per-mesh setup failures also fall back rather than breaking the whole designer.
- Ray textures are disposed with the piece; adaptive changes update uniforms without rebuilding the BVH.

### Deliberate Limits

Exiting rays sample the studio environment, **not surrounding metal or other gems**. Full setting reflections, actual particle geometry through refraction and inter-object transport require the Cycles path. The inclusion-density control affects the existing emerald and salt-and-pepper particle recipes; other profiles intentionally remain clean. Particle shapes and placement are illustrative, not a microstructural model. AR and portable GLB retain standard physical materials rather than this custom shader. Rough-surface scattering, fluorescence, birefringence, opalescence and observer/camera spectral sensitivity are not simulated physically.

## Geometry and Topology

Heart now uses a concave 32-point outline, homothetic crown/girdle/pavilion tiers and ear-clipped caps. Each side facet is planar, the cleft is retained, and width/length/depth match the physical specification. This is a procedural tiered recipe, not a certified commercial heart-brilliant facet diagram. Antique perturbations currently apply to the convex brilliant recipes, not the Heart or step recipes.

All thirteen centre-stone outlines share physical geometry metadata and the same setting outline. Round melee use their own neutral round proportions rather than inheriting elongated centre-stone dimensions. Flush/channel stones and certain tapered baguette accents remain simplified legacy constructions.

`sweep-geometry.js` adds flat end caps with separate cap normals and UVs. Curved tapered prongs also receive corrected outward triangle winding. Cuff, bypass and other open-path tubes close their surface ends without closing their intended design gaps. Components still overlap at joints; this is not a boolean-unioned CAD body.

## Mesh Audit

**More actions → Download Mesh Audit** snapshots an unnormalised piece in millimetres and sends typed arrays to a module worker. A 0.0001 mm positional weld finds coincident vertices across normal/UV seams. The report includes:

- Finite/index validity and collapsed/degenerate triangles.
- Boundary and non-manifold edge incidence, inconsistent shared-edge orientation.
- Connected shells, closed-component signed volume, reversed shells and bounds.
- Per-component results and a revision-stamped summary.

The audit excludes AO discs, sprites, hallmark overlays and inclusion particles. It has a six-million-vertex input limit and a 90-second worker timeout. It does **not** check vertex-link manifoldness, self-intersections, Boolean contacts, minimum walls, tool access, stone security or manufacturing tolerances. A zero-flag report is not certification. Summed closed-component volume can double-count overlaps and includes gems; it must not be used as metal mass. `productionValidated` remains false.

## Blender Cycles Workflow

1. Open **Advanced studio output · Blender Cycles**.
2. Choose resolution, sample budget, RGB or three-band transport, camera, background and aperture.
3. Export the `.cycles.glb` job. It embeds meshes, material textures, physical specification, editable design parameters, seed and render settings. No cloud submission happens.
4. Run from the repository:

```bash
blender --background --factory-startup --python-exit-code 1 \
  --python scripts/render_jewellery.py -- /path/to/design.cycles.glb \
  --output renders/my-design --device cpu
```

On macOS, `/Applications/Blender.app/Contents/MacOS/Blender` can replace `blender`. Tested with Blender **5.2.1 LTS**; the APIs target Blender 4.2+, but other versions need verification. Factory startup avoids inheriting a user's scene or render settings. No third-party Python packages need installation; NumPy ships with Blender.

### Scene and Outputs

- Metre-scale GLB import, bounded automatic camera framing, optional macro DOF focused on the largest tagged gem, and Charcoal/Ivory ground or transparent output.
- Four area-light softboxes, neutral world illumination, Cycles multi-bounce transport, reflection/refraction caustics enabled, adaptive sampling and denoising.
- A 24-bounce total budget and 20 transmission bounces by default. Caustic sampling remains noisy at low sample counts; enabled caustics are not a guarantee of converged jewel fire.
- AgX display transform applied once to the 16-bit `jewellery.png`; `jewellery.exr` and per-pass EXRs preserve scene-linear float data.
- An editable `jewellery.blend` with original reference IORs restored. A normal re-render of that scene is RGB; rerun the script for three-band compositing.
- `manifest.json` records SHA-256 input identity, Blender version, selected device, settings, dimensions, output statistics, elapsed time and completion/failure status.

Three-band mode renders the entire scene three times with wavelength-dependent gemstone IORs, then assembles the corresponding linear RGB channels before display transformation. This captures scene interactions per band but still uses RGB materials and lights; it is not full spectral path tracing. Transparent silhouettes use the maximum pass alpha. Denoising and finite sampling can alter small spectral highlights.

### Operational Safety

Only self-contained studio GLBs with embedded resources and metre metadata are accepted (128 MB asset/16 MB JSON limits). The renderer does not fetch external resources or open supplied `.blend` files. Settings and physical bounds are constrained. Existing nonempty output directories are refused rather than overwritten.

CPU is the default, verified device. `--device auto` selects an available supported GPU or CPU if none is detected. First-time GPU kernel compilation can take several minutes. GPU render/kernel failures are reported, not silently retried; use `--device cpu` and a new output directory to retry. `--resolution`, `--samples`, `--transport` and `--background` override embedded settings. The manifest updates its setup/render-pass/save phase. Normal render cancellation records `cancelled`; a render exception records failure. Forced process termination may leave a `running` manifest and partial EXRs. Such output is not complete. Jobs run serially from the CLI; there is no hosted queue, scheduling UI or automatic recovery service.

## Compatibility and Verification

Generator/material versions are 3.1.0; the exported design schema remains V3. V2 JSON files still import, defaulting to Fast optics, but upgraded geometry means pixel-identical old output is not promised. Specification and revision metadata are recalculated from imported controls. Changed browser modules share `20260911-repair-v31` cache keys.

Temporary validation harnesses, without introducing a project test framework, cover 65 geometry cases across all 13 shapes, 17 material profiles, 780 BVH/brute-force ray comparisons, per-channel transport energy accounting, malformed/open/reversed/disconnected topology fixtures, capped sweeps, cut constraints, version migration, deterministic jobs, history and binary GLB units/materials. Browser checks exercise real worker audits and actual exported render jobs. Cycles RGB and three-band output have been rendered and visually inspected locally.

V3.1 adds 78 rotated/tilted/mirrored two-prong fixtures across all 13 cuts, including 74 initially penetrating posts; all finish with zero reported intersections. Additional checks cover all 17 resolved appearance profiles, deterministic patina maps and roughness/metalness separation, oscillator equivalence at 30/60/144 Hz, passive energy decay, inclusion uniforms/disposal and rejection of intersecting exports. Browser inspection covers sapphire, emerald, ruby, aquamarine, fire opal and moonstone, plus successful textured bronze GLB/Cycles export and the contact-aware worker audit. These are targeted local checks, not exhaustive device or design-space coverage.

The 512 × 512, 64-sample CPU proof in `renders/sapphire-patina-v31-neutral-proof/` verifies sapphire absorption and exported patina textures under the corrected offline lights. The source ring has 24 checked prong/bead components and zero detected prong–gem intersections. Its separate topology audit still flags 40 legacy flush-accent/seat meshes among 112 components; these are not manufacturing-ready solids, and were not silently relabelled as valid.

The repaired Heart ring reports 16/16 closed, oriented component meshes (previously five had open prong ends). The local CPU proof in `renders/heart-v3-cpu-proof/` is 768 × 768 with 64 samples per band; RGB, transparent alpha, 16-bit PNG, macro DOF configuration, bounds and external-resource rejection were also checked. A Metal GPU trial remained in first-kernel compilation for about five minutes and was stopped; GPU rendering is **not verified** on this machine. Use `--device cpu` for the verified path.

## Remaining Engineering Gates

1. Measured alloy/finish/absorption calibration and reference photographs under controlled illumination.
2. Scene-wide real-time ray tracing, measured fancy-cut facet diagrams, higher-fidelity flush/channel/baguette recipes and physical inclusion scattering.
3. Robust manufacturing solids/booleans, true contact and wall-thickness analysis, stone-setting validation and workshop-approved CAD formats.
4. Full spectral rendering, convergence/image-regression benchmarks, hosted queue operations and device/AR performance coverage.
