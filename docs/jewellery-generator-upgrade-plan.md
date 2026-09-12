# Jewellery Generator: Comprehensive Upgrade Plan

Planning baseline: repository commit `05ed411`, reviewed September 11, 2026.

Implementation has begun: see the [V2 foundation](generator-v2-foundation.md) and [V3 advanced optics, topology and Cycles output](generator-v3-advanced.md) for delivered increments, verification and remaining limitations. The complete roadmap below is not marked complete; the baseline evidence is historical.

This is an implementation roadmap, not a report of completed upgrades. It develops the object-first approach in [realism-engine.md](realism-engine.md): generate a coherent physical design, then derive its images and delivery assets. Preserve the existing priority of improving the jewellery itself before AR and score presentation.

The target is a generator whose work holds up as a silhouette, a wearable object, a rotating product preview, and a close-up photograph. Success means accurate construction, convincing optical behavior, deliberate artistic composition, and repeatable output.

## 1. Current foundation and highest-priority gaps

The existing tool already includes useful capabilities:

- A shared millimetre-based specification, measured stone overrides, cut parameters, and preliminary construction checks in [jewellery-spec.js](../assets/js/jewellery-spec.js).
- Rings, necklaces, bracelets, and earrings; swept bands, curved prongs, stone settings, chain patterns, and arc-length placement in [designer.js](../assets/js/designer.js).
- Physical materials, HDR environments, procedural surface detail, photographic controls, and adaptive preview resolution.
- Shared geometry and physical metadata for [AR try-on](../assets/js/ar-tryon.js).
- Proposed CAD, hero-render, and AR delivery contracts in [pipeline-contracts.js](../assets/js/pipeline-contracts.js).

The upgrade should extend these foundations through the following priorities.

| Priority | Evidence from the current implementation | Planned improvement |
| --- | --- | --- |
| P0 | `materialForStone()` assigns `ior`, then `reflectivity: 1`. In the bundled Three.js r164, the reflectivity setter changes IOR. A direct constructor check returned `2.3333333333333335` for requested values `2.417`, `1.77`, and `1.582`. | Preserve each gemstone's intended optical parameters and verify the effective material values after construction. |
| P0 | `createPhysicalCutStoneGeometry()` rescales the generated mesh independently along its axes to match dimensions. | Solve dimensions and cut geometry together. Independent scaling can change facet angles even when metadata retains the requested angles; measure the resulting planes. |
| P0 | Some shapes share a brilliant-style topology mapped through different outlines; the tool also has dedicated step-cut and princess builders. | Introduce individually validated cut recipes and settings for each supported shape family. |
| P0 | Optical appearance combines physical materials with artistic controls, painted caustics, empirical intensity multipliers, and some approximate special-gem effects. | Establish a calibrated photographic baseline and make expressive treatments explicit alternatives. |
| P0 | Random design selection and many generated textures use `Math.random()`, although some inclusions and geometry variation are seeded. | Make the full design, surface variation, and presentation reproducible from saved seeds and asset versions. |
| P1 | The CAD and hero-render module defines requests; repository search found no application callers or corresponding implementations. | Implement the services, renderer capability checks, UI integration, and actual downloadable results. |
| P1 | Construction validation relies on parameter thresholds and approximate mass/load calculations. | Add geometry-derived measurements, process-specific rules, and workshop review for production release. |
| P1 | Preview quality tiers primarily vary resolution; the generator and presentation logic are concentrated in one large module. | Separate responsibilities and introduce budgets for geometry, transmission, shadows, textures, and effects. |

The code inspection and constructor check establish these priorities. A controlled visual and performance baseline remains the first implementation task; this plan does not claim to have measured current image quality or frame rate.

## 2. Build one authoritative design model

**Outcome:** every view and export describes the same jewellery, with explicit dimensions, material identities, and component relationships.

Evolve the current specification into a versioned design document containing:

- Components with stable IDs: shanks, shoulders, galleries, prongs, bezels, stones, chains, clasps, posts, backs, and decorative elements.
- A separate specification for every gemstone, including identity, dimensions, cut recipe, orientation, material, and whether measurements are supplied or estimated.
- Local attachment frames and constraints such as “this bearing contacts this girdle” or “this bail connects to this chain link.”
- Surface regions identifying alloy, plating, finish direction, finish scale, and optional wear.
- A feature history for editing dimensions, patterns, cuts, and joins without flattening everything into an anonymous mesh.
- Locked parameters, reference provenance, random seeds, generator versions, material versions, and lighting/camera presets.

Use millimetres internally for design measurements and explicit conversion at renderer and exporter boundaries. Keep display framing separate from physical scale: zooming to fit a large pendant must not change its actual size.

Define a clear precedence policy: supplied measurements and locked values are authoritative; dependent values are solved; inconsistent constraints produce an explanation. Do not silently stretch a stone to satisfy conflicting depth and angle inputs.

Derive browser meshes, final-render meshes, and CAD geometry from a shared solved feature description. If separate builders are required, compare dimensions, silhouette, attachment points, and surface deviation automatically. A shared JSON input alone does not guarantee matching geometry.

Incrementally extract the existing code into specification, geometry, materials, rendering, editor, and delivery modules. Preserve saved designs and shared URLs through versioned migrations. Upgrade the bundled renderer through isolated compatibility checks, with pinned core and addon versions.

**Acceptance:** reloading a saved design preserves its parameters and seeded details; all output adapters agree on dimensions and component identities; invalid constraints identify the affected feature.

## 3. Upgrade shapes, surfaces, and construction

**Outcome:** the jewellery looks intentionally crafted from every angle, including its underside and attachment details.

### Parametric surfaces and natural flow

Extend the existing band sweep into a general sweep-and-loft system. Support independently controlled inner and outer profiles, shoulder taper, thickness variation, cross-section rotation, and local blends. Provide comfort-fit, rounded, flat, knife-edge, split-shank, cathedral, bypass, signet, and organic profiles.

Use Bézier or NURBS curves for controlled design lines. Apply tangent continuity at ordinary joins and curvature continuity where long polished highlights should flow without a kink. Preserve intentional ridges and sharp gemstone facet boundaries.

Use rotation-minimizing frames along curves so long sweeps, chain patterns, and brushed finishes do not twist unexpectedly. Use curvature-aware tessellation, allocating detail where the silhouette or reflection needs it.

For final solids, evaluate a CAD kernel for lofts, booleans, fillets, shape healing, and meshing. Open CASCADE provides relevant modeling algorithms; benchmark it against the project's smallest bearings, fillets, and dense setting assemblies before selecting tolerances. [Open CASCADE modeling algorithms](https://occt3d.com/dev/doc/overview/html/occt_user_guides__modeling_algos.html).

### Construction by jewellery category

| Category | Shape and proportion upgrades | Construction details |
| --- | --- | --- |
| Rings | Independent shank width/thickness, controlled shoulder transitions, balanced head height, coordinated side stones, wedding-band clearance | Real gallery openings, shaped stone seats, bearing cuts, protective corner prongs, bezels, reinforcing bridges |
| Necklaces | Gravity-informed drape, measured total length, pendant weight and orientation, smooth size graduation | Interlocked links, functional bail clearances, jump rings, clasp assemblies, articulation limits |
| Bracelets | Wrist-shaped profiles, comfortable taper, tennis-link articulation, consistent stone graduation | Hinges, clasp mechanisms, safety catches, cuff end treatment, collision checks through motion |
| Earrings | Lobe contact, front-to-back balance, coordinated pairs, controlled drop length and swing | Posts, backs, hinges, connecting rings, load-bearing joints, separate anchors for each earring |

Use analytic hanging curves as an initial necklace pose where appropriate, then solve articulated links against neck or display forms. A freely hanging curve alone does not capture a chain resting on a body.

Treat contact intentionally: stones sit in their bearings, prongs close onto the girdle, and moving links maintain their allowed clearances. Collision checking must distinguish intended contact from unwanted penetration; separate articulated parts must not be fused together.

### Complex ornament with structural logic

Add reusable design features for pavé, shared-prong rows, channels, hidden halos, baskets, filigree, pierced galleries, scrollwork, granulation, milgrain, engraved relief, and mixed-metal inlays.

Place repeated features by physical arc length or surface distance. Solve gaps and boundary transitions; a pattern should not bunch up around a tight curve or end in half a stone. Give filigree and under-gallery ornament real supports and space for finishing tools.

Create true geometric engraving for final models, with font outlines, depth, corner treatment, and surface wrapping. Use a preview approximation only when needed for speed, and retain the same engraving specification for final export.

**Acceptance:** no unexplained disconnected supports, duplicate faces, or component collisions; smooth highlight flow on polished joins; ornament remains legible in macro views; known dimensions survive tessellation and export.

## 4. Rebuild gemstone geometry around actual cuts

**Outcome:** a stone's cut is recognizable from its facet arrangement and changing reflections, as well as its outline.

Start with validated round brilliant, emerald, oval, cushion, and pear recipes. Extend to princess, Asscher, marquise, heart, baguette, trillion, hexagon, kite, rose cuts, antique variants, and cabochons after the shared solver passes its quality gates.

Each recipe should define:

- Facet adjacency and named facet groups.
- Girdle outline and thickness, crown and pavilion structure, table, culet, and shape-specific parameters.
- Valid relationships between dimensions, ratios, angles, and facet intersections.
- Symmetry rules, permitted antique variation, and attachment zones for compatible settings.

Solve facet planes and intersect them to obtain shared vertices. Keep facets planar and edges crisp. Generate intentional antique variation by changing constrained planes or recipe parameters, then re-solving intersections; unrestricted vertex jitter can warp facets.

When the input contains only length, width, and depth, present the cut as a plausible reconstruction. Those measurements do not uniquely determine every facet. Store supplied carat weight independently and compare it with a volume-and-density estimate instead of forcing all stones of equal carat into the same proportions.

Add controlled optical inspection views for face-up brightness, dark/light patterning during rotation, fire, and leakage. Validate each cut family against suitable references. GIA's documented overall cut system considers brightness, fire, scintillation, polish, symmetry, weight, and durability for standard round brilliants; do not convert an internal metric into an asserted laboratory grade. [GIA cut-quality research](https://www.gia.edu/gems-gemology/fall-2004-grading-cut-quality-brilliant-diamond-moses).

**Acceptance:** measured final dimensions and facet planes match the solved specification; supported recipes have valid adjacency and closed geometry; characteristic cut patterns survive rotation and zoom.

## 5. Build a calibrated material and finish library

**Outcome:** alloys, gems, coatings, and finishes remain recognizable under several lighting environments.

### Metals

Create versioned material records for representative yellow and rose gold alloys, unplated and rhodium-plated white gold, platinum alloys, silver, bronze, and explicit coating systems. Record composition or supplier reference where available; karat alone does not determine alloy color or density.

Use measured reflectance or fitted reference photography to calibrate browser metal materials. For the offline reference, support wavelength-dependent conductor data where available. Treat uncertain alloy values as fitted presets with documented provenance.

Separate bare alloy, plating, oxidation, lacquer, and residue. Use spatial material regions for two-tone designs and real surface layers where their effect matters. Replace empirical cloth-like sheen on metal with calibrated reflection behavior unless it is an intentional artistic treatment.

### Surface finishes at the right scale

| Finish | Planned representation |
| --- | --- |
| Mirror/high polish | Low, calibrated roughness; polished edge radii; very restrained optional polishing marks |
| Brushed | Directional microstructure following the actual polishing path; adjustable grain spacing and strength |
| Satin | Broader, softer directional scattering calibrated against reference samples |
| Sandblasted | Fine, mostly isotropic roughness with physically scaled microtexture |
| Hammered | Actual depressions or displacement for visible relief, with a separate fine surface response |
| Milgrain | Repeated bead geometry with deliberate spacing, attachment, and edge profile |
| Patinated or worn | Local oxide/coating coverage and plausible wear distribution, controlled independently from the base alloy |

Keep roughness, normals, height, and base color as separate signals. Validate texture channels, normal orientation, tangents, and color-space handling. Three.js explicitly distinguishes anisotropy direction/strength data, attenuation distance, transmission, and color textures; use that distinction to build material validation. [Three.js physical-material documentation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html).

Express texture scale in physical units. Enlarging the jewellery or changing tessellation must not enlarge the polishing scratches. Use mipmapping and specular antialiasing so fine grains do not shimmer at distance.

Make pristine product photography the default. Offer subtle handmade variation, vintage wear, or stronger surface character as deliberate controls with stable seeds.

### Transparent, translucent, and exceptional materials

Correct the existing IOR override first. Represent transparent gems with consistent dielectric reflection, refraction, absorption, and actual light-path length. Avoid applying the same color independently to multiple optical terms unless the reference model supports it.

Store absorption with explicit distance units and convert it consistently with the scene. Specify dispersion through a supported wavelength model or calibrated approximation; a renderer's dispersion slider is not interchangeable with an Abbe number or a measured refractive-index difference.

Extend the existing inclusion system with per-stone density, size, orientation, and depth controls. Inclusions should remain inside the stone and be seen through its optics. Separate surface damage from internal features.

Add distinct models for pearls and nacre, enamel, ceramic, opaque stones, translucent cabochons, and optional wood or leather. Give these appropriate scattering and surface behavior rather than routing everything through a diamond shader.

Treat opal play-of-color, moonstone adularescence, directional color variation, and illuminant-driven color change as distinct phenomena. Use dedicated calibrated approximations initially, with specialized optical models where justified. Keep fluorescence and ordinary self-emission separate. [GIA guide to phenomenal gems](https://www.gia.edu/articles/gems-gemology-summary-guide-to-phenomenal-gems).

**Acceptance:** materials pass a neutral-light comparison plus daylight, warm-light, and dark-studio checks; finish direction follows geometry; surface detail remains stable at different distances; the chosen stone retains its effective optical parameters.

## 6. Deliver convincing rendering at three quality levels

**Outcome:** editing stays responsive while final images support much more expensive light transport.

### Interactive preview

Continue with Three.js as the initial delivery platform. Build a stable physical-material baseline, consistent exposure, high-quality environment lighting, accurate normals, and contact shadows. Reduce unnecessary transparent sorting and overdraw.

Prototype a dedicated gem shader using mesh ray intersections accelerated by a bounding-volume hierarchy. Trace entry and exit surfaces, internal reflections, and transmission through a closed stone. Handle transformed normals, ray offsets, and medium boundaries correctly. Compare the result with the offline reference before replacing the existing shader.

Use adaptive bounce counts and approximation levels based on projected stone size. Gem-only tracing can improve internal appearance, but complete interactions with nearby prongs and surrounding objects require additional scene visibility information. Document this preview limitation.

### Progressive inspection

When interaction stops, accumulate higher-quality samples where supported. Reset accumulation whenever the design, lighting, camera, or relevant pose changes. Increase reflection quality, shadow quality, and gemstone sampling selectively.

Evaluate WebGPU and browser path tracing as optional implementations after device testing. Preserve a reliable WebGL/fallback experience while that work matures.

### Final photographic rendering

Implement the existing hero-render request path as an asynchronous job pipeline. Submit an immutable design revision, build the appropriate geometry, apply the calibrated materials and studio, render, validate the result, and return downloadable assets.

Benchmark a practical product-rendering engine such as Blender/Cycles alongside a spectral reference such as PBRT or Mitsuba. Select the production backend using actual jewellery scenes, measured quality, integration effort, runtime, and cost.

True gemstone dispersion requires refraction that varies with wavelength; spectral color storage alone is insufficient. PBRT documents wavelength-dependent dielectric handling. Mitsuba supports spectral variants, but its documented standard dielectric exposes scalar interior/exterior IOR values, so a dispersive material implementation must be demonstrated rather than assumed. [PBRT dielectric materials](https://www.pbr-book.org/4ed/Textures_and_Materials/Material_Interface_and_Implementations), [Mitsuba variants](https://mitsuba.readthedocs.io/en/stable/src/key_topics/variants.html), [Mitsuba dielectric reference](https://mitsuba.readthedocs.io/en/stable/src/generated/plugins_bsdfs.html#smooth-dielectric-material-dielectric).

Require reference scenes for total internal reflection, dispersion, colored absorption, and multiple metal/gem interactions. Refraction, reflection, and conductor behavior should follow established transport models. [PBRT reflection and transmission](https://www.pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission).

Treat caustics as a separate renderer qualification task. Test small sources, multiple stones, prong occlusion, and difficult light paths. Evaluate supported bidirectional, photon-based, or specialized caustic sampling where needed; enabling a checkbox or increasing samples does not establish correctness or convergence.

Make sampling adaptive to measured convergence and a quality/time budget. Retain an un-denoised reference crop when qualifying denoisers; tiny prongs, facet boundaries, and genuine fire must survive denoising. Keep speculative polarization or advanced crystal optics in a later research track.

**Acceptance:** final renders preserve design geometry and dimensions, pass the optical reference scenes, and deliver repeatable output with recorded renderer/material versions and measured cost.

## 7. Design the lighting and camera like a product shoot

Build physically coherent studio presets: neutral catalogue, daylight, dark editorial, and macro inspection. Use area lights, diffusion surfaces, strip reflections, and dark cards to reveal metal curvature. Provide source size, direction, intensity, and environment rotation controls.

Keep lighting responsible for illumination and materials responsible for material identity. Calibrate a single exposure and display pipeline before adding stylization. Ensure the browser and offline pipelines have a documented visual match; sharing a tone-mapping name alone is insufficient.

Use fixed photographic lights for standard turntables. Let changes in geometry and view produce changing highlights. Keep stronger sparkle effects optional and label them as presentation choices. Ordinary jewellery photography does not require a global coherent-wave sparkle model.

Replace decorative caustic projections in photographic final output with computed transport. Match floor reflections, support geometry, and contact shadows so pieces sit convincingly on their displays.

Add focal length, aperture, focus target, and composition controls with jewellery-specific defaults. Use focus stacking for catalogue macro images and selective depth of field for editorial images. Provide front, profile, underside, three-quarter, on-body, and turntable presets.

Export matched image sets: a product hero, detail crops, construction views, and an animation. Offer opaque-background PNG/JPEG/WebP outputs and a scene-linear EXR master where supported. Transparent delivery needs a defined treatment for refractive gems; an RGBA image cannot reproduce refraction against every future background.

**Acceptance:** the same finish and alloy remain identifiable across presets; important details remain in focus in catalogue views; no arbitrary changes to geometry or color occur during image export.

## 8. Make variation artistically coherent and editing precise

**Outcome:** users can discover distinctive designs and then refine them without losing control.

Replace independent random option selection with a constrained design grammar. Curate families such as classic solitaire, Art Deco, botanical, sculptural minimal, vintage, and contemporary asymmetric. Each family defines compatible settings, proportion ranges, motif vocabulary, detail hierarchy, and supported materials.

Use independent controls for silhouette, structural delicacy, ornament density, symmetry, and material contrast. Complexity should be distributed deliberately: one dominant focal feature, supporting details, and enough negative space for the design to read clearly.

Generate variations around a selected design while preserving locked features. Useful commands include “lower the basket,” “make the shoulder transition softer,” “reduce pavé density,” and “keep the stone and silhouette, change only the metal finish.”

Provide direct component selection, numeric dimensions with units, curve handles, measurement overlays, cross-sections, symmetry tools, surface-finish painting by region, engraving controls, undo/redo, saved versions, and side-by-side comparisons under identical lighting.

Group controls into accessible essentials and advanced detailing. Make keyboard input and numeric alternatives available for drag interactions. Show before/after previews for proposed corrections and explain which parameters must change when constraints conflict.

Add language and reference-image assistance as a later input layer that proposes edits to the canonical specification. Preserve editable component structure and user locks. A reference image supplies design cues, while hidden dimensions and construction remain explicit assumptions until confirmed.

Keep style ranking distinct from geometry validation. A high style score must not conceal a disconnected prong, and a physically valid design can still need artistic revision. Use preference feedback to improve recommendations without treating an internal score as objective beauty.

**Acceptance:** saved variations are reproducible; locked choices survive regeneration; edits affect the selected component; expert reviewers can identify intentional proportion and detail hierarchies across generated families.

## 9. Make delivery, manufacturing, and AR faithful

Implement separate export paths from the same design revision:

- Editable design JSON with seeds, versions, references, and component metadata.
- GLB for web and AR, with tested material fallbacks for features the target viewer cannot reproduce.
- STEP for validated CAD solids, plus STL/3MF meshes generated from those solids as appropriate.
- Final images, turntables, and a design sheet listing dimensions, materials, stone specifications, and open review items.

Normalize glTF transforms explicitly: the format uses metres after global transforms. Preserve millimetre metadata as metadata rather than relying on it to alter the file's unit interpretation. Select and validate the appropriate compression path instead of assuming all compression options can be applied indiscriminately. [glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units).

Replace universal manufacturing thresholds with workshop profiles that include alloy, fabrication process, stone-setting method, finishing allowances, and inspection requirements. Measure wall thickness and clearances on actual geometry; calculate metal volume from valid solids rather than primitive approximations.

Separate preliminary feasibility, measured geometry validation, and workshop production approval. True tension settings and other mechanically sensitive designs need qualified engineering input; a stone-type whitelist is insufficient evidence of a reliable assembly.

Implement job IDs, progress, cancellation, retries, deduplication, revision-based caching, bounded resource use, and clear failure states for heavy services. Keep long-running rendering and CAD work in suitable workers, with the website providing submission and result retrieval.

After the object and rendering foundations pass, improve AR with calibrated scale, correct body occlusion, environment matching, stable contact, and articulated drape. Record calibration uncertainty; camera try-on alone does not prove physical fit. Preserve the same component geometry and attachment frames across studio and AR.

**Acceptance:** downloaded assets reopen at the intended scale; declared materials and features have known viewer fallbacks; manufacturing reports refer to measured geometry; AR improvements preserve the underlying design.

## 10. Establish quality gates and performance budgets

Create a compact reference suite before changing the renderer: a polished solitaire, step-cut ring, oval halo, coloured-gem pendant, dense pavé piece, tennis bracelet, and articulated drop earrings. Add neutral material samples and edge-case parameter combinations.

Capture fixed views, controlled rotations, and macro crops under documented illumination. Use photographed or workshop-measured references where available. Compare each upgrade with the current version under the same presentation conditions.

| Area | Proposed gate | Measurement |
| --- | --- | --- |
| Dimension fidelity | Start with a 0.01 mm numerical agreement target on locked key dimensions | Compare solved specification, exact model, and exported measurements; this is not a fabrication tolerance |
| Facets | Planarity and angle residuals within documented numerical tolerances | Fit planes to the final vertices and compare with the solved recipe |
| Solids | No unexplained open boundaries or non-manifold topology for intended closed bodies | CAD validity and mesh checks, with separate articulated bodies preserved |
| Tessellation | Start with a 0.02 mm maximum deviation target for standard final meshes | Measure against the authoritative surface and tighten for small optical or mechanical features |
| Contacts | No unintended overlaps or unsupported floating attachments | Component-aware clearance checks with specified contact allowances |
| Optical behavior | Pass material and transport reference scenes | Check refraction, absorption, total internal reflection, and light-dependent highlights |
| Visual improvement | Proposed gate: at least 80% preference for upgraded output across a defined blind comparison set | Independent jewellery and rendering reviewers; record defects separately from preferences |
| Interactive performance | Initial targets: 60 fps on a named desktop reference and 30 fps on a named mid-range phone | Report p95 frame time at fixed viewport/DPR, including dense settings and sustained interaction |
| Edit latency | Initial target: visible local feedback within 100 ms; heavy jobs provide progress | Measure input-to-preview latency and background solve times separately |
| Reproducibility | Identical design and seeds produce identical geometry/material assignments on a pinned version | Hashes and parameter comparisons; compare images with tolerances across different hardware |
| Final rendering | Quality-qualified completion within a stated time and cost budget per scene | Record resolution, samples/convergence, hardware, queue delay, and render duration |

These are proposed engineering targets to calibrate during the baseline phase, not observed performance or universal jewellery standards.

Introduce meaningful tests for specification migrations, solver invariants, material construction, topology, and export round trips. Use visual regression in a pinned environment and human review for aesthetic quality. Sample the parameter space systematically and include difficult combinations instead of testing only attractive presets.

For performance, instance repeated stones and links; cache reusable cuts; rebuild only affected components; use workers for expensive geometry tasks; cancel stale requests; and track texture, geometry, and GPU-resource disposal. Adapt transmission, shadows, postprocessing, and mesh detail in addition to resolution. Preserve recognizable form and material identity when reducing quality.

## 11. Delivery roadmap and dependencies

Estimates below are planning ranges, not commitments. Assume two to three engineers spanning geometry, graphics, and application services, plus regular jewellery CAD/goldsmith and technical-art review. Re-estimate after the first prototype. A complete multi-category program is likely a several-month effort; approximately five to nine months is a reasonable initial planning envelope with overlap between workstreams. Specialized optics and advanced mechanisms can extend it.

| Stage | Indicative effort window | Concrete deliverable and exit gate |
| --- | --- | --- |
| 0. Baseline and decisions | 1–2 weeks | Reference scenes, device matrix, effective-material audit, photographed targets, and measured bottlenecks |
| 1. Optical correctness and architecture | 2–3 weeks | Correct IOR behavior, explicit optical units, seeded output, calibrated neutral preview, and migrated design schema |
| 2. Flagship geometry | 4–6 weeks | One excellent solitaire family, round and step-cut recipes, solved bearings and shoulders, independent geometry measurements |
| 3. Material and rendering prototype | 3–5 weeks, overlapping stage 2 | Calibrated metal/finish library, gem shader comparison, qualified offline-render prototype, matched photographic views |
| 4. Final-render service and precision editor | 3–6 weeks | Revision-bound render jobs, reliable final images, component editing, locks, undo, and comparison workflow |
| 5. Breadth and artistic generation | 4–8 weeks | Additional cut families, ornamental grammar, necklaces, bracelets, earrings, and category-specific validation |
| 6. Delivery and release qualification | 2–4 weeks | Qualified exports, process-specific reports, performance/resource checks, documented limitations, staged release |
| Follow-on | Separate estimates | Advanced AR, special optical phenomena, intricate mechanical assemblies, and reference-assisted generation |

Dependencies matter: physical geometry precedes optical calibration; closed, correctly oriented gemstones precede reliable internal tracing; solved components precede precise editing; shared units precede trustworthy export and AR.

Use the flagship ring as a complete vertical slice through specification, geometry, materials, preview, final render, and export. Do not expand every category before that slice demonstrates the intended quality standard.

Ship completed slices behind feature flags and preserve the existing generator while validating migrations. Each stage should end with inspectable assets, comparison images, measured results, and a clear list of unsupported cases.

## 12. First implementation backlog

1. Save a small set of reference designs and fixed lighting/camera presets; capture baseline images and performance.
2. Correct the IOR/reflectivity interaction and verify effective values for several gem materials.
3. Specify physical units for absorption, thickness, optical coefficients, and every export conversion.
4. Introduce stable seeds and design/material version tracking without breaking saved links.
5. Measure final facet angles and dimensions to expose conflicts caused by independent rescaling.
6. Extract the material and cut-building interfaces needed for isolated validation.
7. Build a constrained round-brilliant solitaire with accurate bearings, gallery, shoulder transitions, and underside details.
8. Calibrate polished gold, platinum, brushed gold, diamond, and one coloured gemstone under matched studio lighting.
9. Compare the corrected preview, a gem-tracing prototype, and an offline reference on that identical design.
10. Use the comparison to select the final-render backend and set the next milestone's quality and cost budgets.

The first major release should deliver a visibly superior, repeatable jewellery object and its photographic output. Broader variation, specialized optics, and richer AR then build on a quality standard that has already been demonstrated.
