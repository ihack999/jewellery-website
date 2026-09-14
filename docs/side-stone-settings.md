# Ring side-stone settings — 12 September 2026

## Bounded change

User-requested ticket 09a: different ring side-stone hardware without changing the centre setting, gemstone material, or storefront.

In **Fit & detail → Side-stone setting**:

- **Bezel:** individual open-back enclosing walls and rounded rims, without claws. The cavity follows the round or tapered-baguette outline rather than covering the gem with a solid cap.
- **Channel:** opposing continuous shoulder walls and upper rails, without claws. Eternity styles continue the channel around the lower shank. Channel uses one stone row rather than colliding rails between pavé rows.
- **Prong:** the existing separate baskets and individual claws.
- **Original band setting:** backward-compatible automatic selection, including the former channel construction for old channel-band designs.

New rings, presets, and unlocked variations start with bezel accents. Old saved states/URLs without `accentSetting` retain their original setting. Explicit choices survive save/reload, JSON documents, undo/redo, and structure-locked variations. Material remains independent through Clear Diamond / Match Center. Centre and halo hardware are unchanged.

## Files

- `customs.html`: ring-only selector, accessible name and explanation.
- `assets/js/designer.js`: defaults, sanitization, field synchronization, request description, and presets.
- `assets/js/jewellery-assemblies.js`: setting resolution, enclosing bezel geometry, channel walls, spacing, and construction metadata.
- `assets/js/design-session.js`: variation defaults and structure locking.
- `assets/js/main.js`, `assets/js/ar-tryon.js`: synchronized lazy-module cache keys; no tracking or camera-lifecycle changes.
- `scripts/check_side_settings.mjs`, `scripts/side_settings_assertions.mjs`, `scripts/check_journeys.mjs`: durable geometry and isolated browser checks.

## Validation

```bash
node scripts/check_side_settings.mjs
node scripts/check_design_session.mjs
node scripts/check_journeys.mjs --side-settings
node scripts/check_journeys.mjs
```

- 72 configurations: six band families × three settings × two shank widths × diamond/matching sapphire. Checked 5,872 finite component meshes, zero claws for bezel/channel, representative enclosing-hardware topology/orientation, gem counts, materials, serialized settings, structure locks, and ring dimensions after round-trip.
- 16 browser assertions passed: actual generated hardware, new-design default, centre independence, save/reload, undo/redo, legacy URL behavior, and visible/focusable control at 390px. Desktop and phone screenshots reviewed; no runtime exceptions.
- Existing 18-assertion session harness and 41-assertion shopping/enquiry suite passed. Static checks: 33 pages, 1,369 local references, 28 JSON-LD blocks. Syntax and whitespace checks passed.
- Camera/microphone access denied in disposable browsers; external requests/submissions blocked. AR was not opened. No export, payment, external submission, or deployment.

Optional screenshots: set `TJC_SCREENSHOT_DIR` to an existing local directory for the side-settings browser command.

## Limits and next action

These are enclosed/recessed-style visual assemblies, **not a true flush-drilled shank or manufacturing-ready CAD**. Full faceted gems are retained; the existing shank is not boolean-cut. Metal joints can overlap. Component checks do not certify bearing fit, stone security, wall strength, or polishing access. A genuine flush/burnished setting requires a separate shank-seat construction ticket, not hiding pavilions inside solid metal.

Terminology references: [GIA's melee-setting discussion](https://www.gia.edu/UK-EN/design-with-melee) and [GIA's ring-setting guide](https://www.gia.edu/articles/gia-news-research-purchase-diamond-engagement-ring). These distinguish prong, bezel, and channel settings; they do not validate this generator's manufacturing geometry.

Next ticket remains 08c: representative non-ring session and dimension reliability. Native-device/AR qualification and production order-policy/delivery work remain pending.
