# V3.2 — ring accents, necklaces and bracelets

## Construction changes

### Ring shoulders

- Replaced the flattened, open crown caps and dark circular seat decals used for shoulder stones with independent closed brilliant-cut gems, open galleries, small curved claws, rounded claw tips and supporting feet.
- Accents now sit on the radial outside of the shank, rather than its front/back side walls. The centre head reserves its own angular space. Double-row pavé is only used on sufficiently wide bands; row spacing and pitch prevent the previous overlapping rows.
- White diamond is the default accent material, independently of the centre stone. **Fit & detail → Side & halo stones → Match Center** enables coloured accents.
- Three-stone shoulders use smaller independent baskets. Tapered baguettes are clipped from a genuine trapezoidal outline with planar step facets, not distorted copies of a rectangular gem. Channel shoulders have continuous opposing rails. Eternity accents continue around the shank but reserve space beneath the centre head.
- All eligible small crystal accents can use internal BVH rays. Up to 80 crystals are processed; small stones use six bounces and a single, non-dispersive transport path. Larger stones retain the adaptive multi-band option. Opaque/translucent materials retain their distinct raster treatment.

### Necklaces

- Replaced the incomplete chain arc with a full necklace loop, arc-length-spaced interlocking-link geometry and a closure joining nearby back endpoints. Nominal chain length includes the closure interval.
- Fine-chain defaults are approximately 0.34 mm **wire diameter**, not finished chain width. Cable links are approximately 3.8 wire diameters wide. Explicit saved wire dimensions are preserved; an old design with a heavy explicit gauge does not silently become a delicate chain.
- Pendant and choker styles use restrained bails and open-back settings. Optional pendant halos use complete diamond melee. Y-drops use actual chain links, not beads. Lariats close through a front slider and place the stones at the two hanging ends, not near the shoulders.
- Pendant halo spacing has a hardware-dependent minimum for the central claws; the effective gap is recorded on the setting. Mitered outline offsets and chord-distance checks avoid crowding at pointed and rectangular cuts.
- Station necklaces interrupt the chain with five connected round bezel settings; chain segments do not continue through the stones.
- Cable, curb, box, rope, snake, Figaro, wheat, herringbone, Byzantine and mariner have separate link recipes. Their geometry is batched to avoid a draw call per link. These are visual pattern approximations, not supplier-certified chain engineering.
- Overview framing preserves the full necklace. **Macro** centres on the largest gem/station while preserving the underlying physical dimensions for export. Necklaces are now a stable posed construction, not a whole-chain rigid pendulum masquerading as link physics.

### Bracelets

- **Tennis:** close-spaced independent round-stone baskets, alternating fork/tongue hinge knuckles and axle pins, plus a box closure with safety details. No rigid torus or large ring head underneath the stone row.
- **Station:** a real linked chain interrupted by five open-back round bezels, with selectable chain and clasp.
- **Bangle:** an anatomical oval with a softly rounded rectangular section, closure and hinge detail, rather than a circular pipe. Optional small bezel-set accents follow the outer surface.
- **Cuff:** the oval section opens at a controlled arc gap and tapers toward the rounded terminals. Optional small terminal settings replace the old oversized focal head.
- Flexible length defaults to 178 mm, independently of rigid-bangle opening. Width, radial thickness, round-stone diameter and cuff gap have separate physical inputs. Bracelets deliberately use calibrated round stones; centre-carat and fancy-cut controls are disabled rather than pretending they change these assemblies.
- Mass estimates now distinguish linked chain, articulated baskets and solid oval sections. They remain rough estimates, not manufacturing weights.

## Rendering and geometry contracts

`assets/js/jewellery-assemblies.js` builds in millimetres and applies the existing 0.12 display-world conversion at its root. No viewport normalisation is exported. Gem thickness is expressed in its mesh-local units; attenuation remains a physical distance. Internal-ray absorption uses the original physical transform so switching between a full necklace and pendant Macro does not change the stone's body colour merely because the display scale changed.

Closed sweep ends include standard Three.js repeated-seam topology. The contact fitter now understands that layout, keeping duplicate seam vertices and flat cap vertices together while fitting the entire curved claw to the actual gem triangles. Unresolved prong intersections continue to block GLB/Cycles export.

The new hardware has finite, closed component meshes. This does **not** mean the assembly is one watertight solid: solder joints overlap, clasp mechanisms are posed, bead seats are not boolean-cut, and links are not a rigid-body collision simulation. Prong checking does not certify gem-to-gem, chain-to-chain, clasp, minimum-wall, polishing or tool-access clearances. Workshop review remains required.

## Research references

- [GIA: Guide to ring settings](https://4cs.gia.edu/en-us/blog/guide-to-ring-settings/) — distinguishes prong, bezel, channel and other securing methods from the overall design. Used to separate real hardware from decorative dark seat decals.
- [GIA: Design with melee](https://www.gia.edu/UK-EN/design-with-melee) — reference for the role and proportions of small accent stones. The generator does not claim GIA manufacturing approval.
- [Stuller: What to know about choosing a jewelry chain](https://blog.stuller.com/what-to-know-about-choosing-a-jewelry-chain/) and [chain catalog](https://www.stuller.com/chain-catalog) — reference for distinct link families, fine finished-chain widths and practical closures. Finished width is not wire diameter.
- [Tiffany diamond bracelet reference](https://www.tiffany.com/jewelry/bracelets/platinum-diamond-bracelets-1526111100.html) — retail length/proportion reference, not a copied branded motif or engineering specification.
- The site's existing tennis bracelet and graduated necklace product photographs were also used to compare setting scale, articulation and drape.

## Validation workflow

The local validation harness exercises all five necklace silhouettes across ten chain families, all four bracelet constructions at three stone sizes, six ring-accent families, all thirteen pendant outlines with halos, and all six clasps. It checks finite geometry, selected component topology/orientation and actual prong–gem intersections. Separate existing harnesses cover cut facets, BVH transport, material profiles, design-file round trips, export units and damped presentation motion.

Browser QA should include a coloured-centre ring with white accents; pendant Overview and Macro; necklace Station, Y-Drop and Lariat; tennis, station, bangle and cuff bracelets; a downloaded GLB and mesh audit. Browser rays do not trace surrounding metal: use the existing local Cycles workflow for scene-wide reflection, refraction and shadow transport.

### Verified locally — 2026-09-11

- 87 construction configurations passed: 678 generated gems, 2,158 audited closed/oriented component meshes and 3,974 prong/tip checks with no unresolved intersections in those fixtures.
- Browser-exported sapphire pavé ring: **184/184** meshes closed and consistently oriented; **108** prong/tip checks, zero unresolved intersections.
- Browser-exported 190 mm tennis bracelet with 3.2 mm diamonds: **726/726** meshes closed and consistently oriented; **384** prong/tip checks, zero unresolved intersections. Length and diameter controls were verified in the actual editor.
- Necklace GLB checked for the 0.001 metre root scale, correct mesh-local gemstone thickness and V3.2 metadata. Additional checks cover new-field round trips/locks, exclusion of irrelevant ring overrides from bracelet dimensions, unchanged physical absorption across display zoom and the lariat's total chain-path length.
- Existing cut, material, BVH, contact and motion regression harnesses pass. No browser console errors were reported during final preview checks.
- Local Blender CPU proofs completed at 512 × 512 / 64 samples: `renders/necklace-v32-proof/jewellery.png` and `renders/tennis-bracelet-v32-proof/jewellery.png`, with EXR, editable scenes and manifests beside them. Generated renders remain ignored by Git.

These checks are representative regression coverage, not proof that every possible control combination, GPU or manufacturing process is supported.
