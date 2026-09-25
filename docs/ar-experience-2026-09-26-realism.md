# AR try-on — camera-matched realism (2026-09-26)

The goal: the jewellery should look photographed by the same phone, not pasted on top.

## Live room reflections (`assets/js/ar/camera-environment.js`)
- About every 1.2 s, and only when the view has changed (4 s when the device is busy), a 64×48 copy of the camera frame is wrapped around the piece.
  - Behind the piece it shows what the camera sees.
  - In front of the piece it shows that same view mirrored, the usual stand-in for the half the camera can't see.
- That camera wrap is blended with the studio HDR. The HDR's bright lights are kept at full strength, so stones still sparkle, while the room colours the rest.
- The blend is pre-filtered (PMREM) into the scene's existing environment target, so no shaders recompile.
- White balance: a gentle illuminant tint is taken from the brightest ~6 % of the frame (bounded to ±14 %). It tints the reflections and the key/fill/rim/hemisphere lights.
- Debug: `window.__arNoCameraEnv = true` before opening the try-on disables it.

## Camera-matched compositing (`assets/js/ar/camera-match.js`)
The piece is rendered on its own into a 4× MSAA half-float target and composited over the camera in one pass. That pass applies:
- **Tone mapping before the MSAA resolve.** The target is flagged like an XR target, so materials tone-map exactly as they do for the canvas. Without this, HDR specular edges average into glowing outlines.
- **Sensor grain, only on the jewellery.** Noise is measured from an unscaled 96×72 crop of the live frame with Immerkær's estimator (calibrated for the 60 % trimmed mean), then scaled by how large the frame is shown on screen.
- **Lens softness.** About half a camera pixel, and only when the camera image is enlarged on screen.
- **Motion blur** along the piece's on-screen velocity. It is 0.6× the physical estimate and capped at 14 px.
- **A soft cast shadow** from the key light onto the skin or clothes under the piece. It scales with the piece's on-screen size and the scene brightness, and skews warm the way shadows on skin do.
- Blending happens in display space, exactly as the browser composited the old direct render. The camera frame is decoded manually, because three.js uploads video frames raw.
- It falls back to the direct render where WebGL2 half-float targets aren't available. Debug: `window.__arNoMatch = true`.

## Other fixes
- Glint sprites add light but no alpha, so they neither cast shadows nor hide the camera.
- Photo-mode captures are cropped to the photo, with the watermark sized to it.

## Verified
- A/B screenshots from the same frozen frame, taken in photo mode on customer photos, for ring, bracelet and earrings: background pixels are identical, and the jewellery shows the new shadow, grain and room tint with no halos.
- Live fake-camera run without errors.
- Unit checks: the white point stays neutral for a neutral scene and turns warm for a warm lamp; the noise estimator returns 2.02 and 5.03 for true σ of 2 and 5.
- `scripts/check_ar_*` suites pass.
