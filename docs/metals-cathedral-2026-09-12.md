# Editor metal appearance and cathedral shoulders — 12 September 2026

The user requested more realistic editor metals while retaining the gemstone rendering, and reported cathedral supports protruding through the ring band.

## Changes

Bare-metal colours now represent conductor reflectance instead of dark cosmetic swatches. Silver and platinum use the reference sRGB values in Filament's material table. Gold alloys, white/black surface treatments and champagne gold use explicit appearance approximations; karat alone cannot specify their measured reflectance. The values are decoded once into Three's linear working space. Metalness remains 1, without an added clearcoat, sheen or iridescence. For a conductor, base colour controls reflected light rather than diffuse paint colour. [Filament material reference](https://google.github.io/filament/main/materials.html#materialmodels/standardmodel/basecolor)

High Polish now has a nominal roughness of 0.105, with subtle roughness texture variation. It no longer receives the generic brushed normal map or an arbitrary anisotropy direction. Milgrain uses a polished base surface; the decorative edge geometry remains separate. Brushed/satin finishes retain directional scattering, aligned with the surface UVs. Finish strength now changes roughness as well as surface normals and anisotropy, with bounded values. Polishing marks increase local roughness instead of making pits artificially smoother. [Three physical material reference](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)

The band previously shared the same vertices across its texture wrap, interpolating from the last UV back to zero across the final triangles. This produced a narrow shading/texture discontinuity. The new unwrapping duplicates boundary vertices while copying the existing averaged normals and positions exactly. Repeat counts are rounded to whole tiles so the texture closes as well. Ring dimensions, surface positions and triangle count are preserved; the requested finish repeat size is approximated by the nearest whole repeat count.

Cathedral supports previously started on the camera-facing crown of the shank and travelled as straight cylinders toward the basket. The replacement intersects the actual shank mesh to locate an outer attachment, then sweeps a curved, capped shoulder around the band's exterior to the lower gallery rail. Split and stacked shanks receive attachments for both rails. Bypass construction searches the actual open shank and takes precedence over the nominal silhouette. Small overlap at attachment points represents the welded joint; this is not a Boolean-unioned manufacturing solid.

Gemstone geometry, optical parameters, shader code, the studio HDR environment, exposure and light rig are unchanged. The metal changes apply through the shared model factory, including models used by AR. Shared asset import keys were refreshed.

## Verification

- `node scripts/check_metals.mjs`: three groups, including 63 band combinations covering all seven finishes, three band profiles and three texture scales. Checks cover exact position/normal continuity, no triangle spanning a UV wrap, finite attributes, preserved triangle counts, reflectance bounds and finish-strength response.
- `node scripts/check_journeys.mjs --metals`: **142 checks**. Sixty cathedral builds cover five silhouettes, six band styles, two stone sizes and a thin 1.1 mm shank. All 144,480 generated support vertices stay outside the finger opening. Sixty-three metal/finish builds preserve the gemstone position buffers and optical-parameter signatures. The real editor controls render all nine metal choices and all seven finishes, with desktop/mobile review and zero runtime exceptions.
- Shared-model rendering: **317 checks across all 18 silhouettes**, including real shader rendering, batching equivalence and resource cleanup. No shader errors or camera calls.
- Side-setting regression: 72 construction configurations / 5,872 finite meshes and 16 browser assertions. Design-session checks: 18 passed.
- Established site journeys: 41 browser assertions passed with mocked submissions and zero runtime exceptions.
- Static validation: 34 pages, 1,425 local references and 29 JSON-LD blocks, with zero errors. Syntax and whitespace checks pass.

Editor screenshots were inspected for yellow gold, white gold, rose gold, platinum and finish changes. Reproduce captures with `TJC_SCREENSHOT_DIR=/private/tmp node scripts/check_journeys.mjs --metals`. The browser uses a disposable profile and blocks camera and external requests.

These tests qualify the stated geometry and rendering behaviour, not “100% realism.” Alloy composition, plating, finish scale and the reference lighting remain approximations. True scene-dependent metal self-reflections and measured physical samples remain beyond this pass. Extreme combinations outside the tested fixture range still need visual evaluation.
