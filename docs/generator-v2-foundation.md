# Generator V2: Foundation Increment

Historical V2 implementation record. The [V3 advanced increment](generator-v3-advanced.md) supersedes the Heart, optics, mesh-audit, versioning and offline-rendering status described here.

Implemented locally on September 11, 2026. This is the first working increment of the [upgrade roadmap](jewellery-generator-upgrade-plan.md), not completion of the entire programme. No deployment or manufacturing approval is implied.

## Geometry and Dimensions

`assets/js/gemstone-cut.js` resolves a consistent width-section cut before geometry is generated:

- Measured stone depth takes precedence over a conflicting depth percentage; the conflict is reported.
- Explicit crown/pavilion angles with no depth override determine the depth.
- A depth override plus one angle solves the other angle.
- Specifying incompatible depth and both angles produces an error. The preview remains available for correction, but GLB export is blocked.
- Zero-angle degenerate cuts produce an error. Blank controls use defaults rather than becoming zero or the minimum allowed value.

Reported angles describe a **nominal section across the stone width**. They are not a claim that every main, star, half, and step facet has that angle, nor that a fancy cut meets a grading standard.

`assets/js/gemstone-geometry.js` constructs convex cuts by clipping against explicit facet planes. Face normals remain flat; triangle fans do not introduce arbitrary diagonal shading breaks. Millimetre dimensions are applied before rendering-unit conversion instead of stretching completed facets independently along three axes.

Supported plane-based shapes: Round, Oval, Cushion, Princess, Emerald, Asscher, Marquise, Pear, Trillion, Baguette, Hexagon, and Kite. Emerald/Asscher/Baguette have tiered step facets; the other shapes use shape-adapted brilliant-style recipes. These are procedural recipes, not certified replicas of every commercial facet arrangement. A bounded cache avoids recomputing identical cuts and outlines.

Heart remains on the legacy concave-cut builder, explicitly identified in the precision editor. Some melee/flush-set accent geometry also remains legacy. Validated gemstone boundaries do **not** make the assembled jewellery a watertight manufacturing solid.

Ring size, shank dimensions, stone dimensions, necklace length/wire gauge, bracelet opening/tube size, and earring post/hoop/drop controls feed the shared specification. Cross-piece preset and history restoration rebuild the silhouette options before selecting a style. Platinum is normalised to 950 rather than being labelled 18K.

## Materials and Rendering

`assets/js/jewellery-materials.js` separates finish and optical parameters from scene construction.

- Removed the `reflectivity: 1` assignment that overwrote gemstone IOR in the bundled Three.js r164 material setter.
- Transparent stones use dielectric transmission rather than alpha blending, untinted boundary colour, and volume absorption. Onyx retains an opaque body colour.
- Thickness follows the stone's rendered dimensions. Attenuation distances use the shared millimetre-to-world conversion.
- Bare metal has no automatic clearcoat, sheen layer, or rainbow coating. Finish presets control roughness, anisotropy, and normal relief.
- Swept bands/tubes use distance-based UVs for surface spacing. Detail strength adjusts normal relief, anisotropy, and the hammered band's geometric relief.
- Procedural texture construction and design geometry use deterministic random streams. Inclusion variation also incorporates the design seed. Hallmark textures are reused between equivalent builds.

The scene renders into a linear half-float HDR target where `EXT_color_buffer_float` is available, with an unsigned-byte fallback. Bloom/compositing happens before the final AgX tone mapping and sRGB conversion. The old final pass omitted the output transform and the old scene target clipped HDR values.

**Photographic** is the restrained default: no decorative caustic overlay, fake contact discs around gems, animated grain, screen-wide chromatic aberration, or starburst filter. Bloom is reduced, and glow requires Expressive mode. **Expressive** retains the optional artistic effects. These names describe presentation intent, not physically exact spectral rendering.

Camera tilt now presents the ring crown toward the viewer. Non-ring pieces use a shallower tilt. View/backdrop/variation-lock changes do not rebuild the jewellery mesh, and input-driven rebuilding is limited to the next animation frame.

### Optical Limits

The preview still uses rasterised Three.js transmission and environment lighting. It does not trace complete internal reflection paths, solve spectral transport, or produce true refractive caustics. Diamond extinction/fire, inclusions, opal, moonstone, and colour-change materials are still approximations. The material presets have not been calibrated against a measured reference dataset. Browser screenshots are not a replacement for the planned offline hero-render service.

## Editing and Reproducibility

`assets/js/design-session.js` provides:

- Seeded Classic, Art Deco, Romantic, Sculptural, and Vintage variation families.
- Independent stone/cut, metal/finish, and structural locks. Variations preserve fit inputs rather than randomly changing the customer's size.
- A bounded undo/redo history with branch truncation; pending slider edits are committed before undo. Rapid changes to different fields are separate history entries.
- Canonical state serialization, a non-cryptographic revision identifier, and generator/material version metadata.
- `tjc.design.v2` editable JSON documents, limited to 1 MB on import. Imports use the parameter state, not an untrusted stored specification; the specification is recalculated and the controls are sanitised.

Repeatability covers parameters and generated geometry within this version. Exact image pixels may still differ with GPU/browser, environment loading, animation pose, and quality tier. Revision IDs are convenience identifiers, not security checksums. Future release changes require versioned migration rather than assuming identical output from old parameters.

## Delivery

- **PNG:** targets 2400 px width, preserving the current aspect ratio, with a 4096 px/GPU dimension cap. It renders at export resolution, then restores the interactive renderer size. The 2D fallback exports at its existing canvas resolution.
- **Design JSON:** preserves the editable parameter state, seed, revision, physical specification, and version metadata.
- **GLB:** exports a fresh, unnormalised piece rather than the display-scaled studio scene. Root scale converts world units to metres. World-space attenuation distance converts to metres; local-space thickness follows the node transform and is not converted twice. The distinction follows [KHR_materials_volume](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_volume).
- Preview exports exclude decorative contact-AO discs and sprites. They omit the studio lighting/background. Physical material appearance depends on the receiving viewer's extension support; bump engraving requires `EXT_materials_bump` and is not carved geometry.
- JSON/specification/GLB metadata explicitly indicate visual-preview status and `productionValidated: false`. Parameter errors block GLB export; passing the rules does not certify manufacture. The UI labels the score as heuristic parameter checks.

The local exporter and texture helper are vendored from Three.js **r164**, matching the existing renderer: [GLTFExporter](https://github.com/mrdoob/three.js/blob/r164/examples/jsm/exporters/GLTFExporter.js), [TextureUtils](https://github.com/mrdoob/three.js/blob/r164/examples/jsm/utils/TextureUtils.js). Their imports were changed to local paths. The upstream licence is preserved in `assets/js/THREE-LICENSE.txt`.

Changed generator modules use the `20260911-generator-v2` cache key, including the custom page bootstrap and AR's shared-spec import. Keep these keys aligned when shipping another generator release because site assets have long-lived caching.

## Verification Performed

The repository has no installed test framework. A temporary Node validation harness was run without adding dependencies or a permanent test suite:

- **60 cut meshes:** twelve supported shapes × default, small, large with culet, measured-dimension, and antique cases. Checked finite values, exact bounds, positive volume, outward winding, unit normals, facet planarity, and two incident triangles per welded edge.
- **17 gemstone profiles:** checked IOR preservation, dielectric metalness, opacity/transparency mode, and absence of default clearcoat/iridescence.
- Checked angle/depth conflicts, measured-depth precedence, deterministic variations and locks, bounded undo/redo branching, canonical revisions, and JSON round trips/rejection of malformed documents.
- Inspected binary GLB header, node conversion, IOR, volume attenuation, and local-space thickness.
- Chrome interaction checks covered all four categories, 500 mm necklace length/1.25 mm wire, 68 mm bracelet opening/3.2 mm tube, 1.1 mm earring posts, locked successive variations, undo/redo, and conflicting-cut export rejection.
- All thirteen UI shape choices, seven finish choices, both presentation modes, and a cross-category Drop earring preset were exercised without JavaScript errors.
- Actual browser exports produced an editable JSON, a 2400 × 1709 PNG, and a roughly 3.1 MB ring GLB containing 180 meshes and embedded textures. No new shader errors occurred; the exporter reports its expected roughness/metalness texture merge warning.
- JavaScript syntax checks and `git diff --check` were run. File-picker interaction, AR camera tracking, mobile GPU coverage, and offline render/CAD integration still need additional verification.

### Manual Release Check

1. Serve the repository with `python3 -m http.server 8000` and open `customs.html#design-studio`.
2. Switch shapes and finishes under Photographic and Expressive rendering; inspect crown, profile, and underside.
3. Create two variations with stone/metal locks, undo/redo, and check that the locked fields and fit stay fixed.
4. Enter incompatible depth/angles, verify the diagnostic and blocked GLB export, then clear the conflict.
5. Export all three formats; reopen the design JSON and compare state, including a cross-category non-default silhouette.
6. Open the GLB in a second viewer, verify millimetre-scale dimensions after metre conversion, and check required material-extension support.

## Next Engineering Gates

1. Implement complete gemstone internal-ray transport and a reference-render comparison suite; retain the fast raster fallback.
2. Build topology-specific Heart and higher-fidelity fancy/melee recipes, with measured facet-angle and stone-setting contact checks.
3. Add manufacturing solids/robust booleans, connectivity, minimum-wall/clearance analysis, volume-derived mass, and workshop review.
4. Calibrate alloys, finishes, absorption, and inclusions against controlled material photographs and measured data.
5. Integrate a real offline render queue with quality/provenance manifests, cancellation, failure handling, and image-regression gates.
6. Validate cross-device performance, accessibility, AR delivery, and production export formats.
