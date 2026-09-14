// Camera pixels are display-referred sRGB, not a radiometric light probe.
// This supplies a bounded appearance gain; it does not estimate skin albedo,
// light direction, colour temperature or an unseen HDR environment.
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const linear = Float64Array.from({ length: 256 }, (_, byte) => {
  const value = byte / 255;
  return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
});
const bins = 256;
const quantile = (histogram, total, fraction) => {
  let sum = 0;
  for (let i = 0; i < bins; i++) {
    sum += histogram[i];
    if (sum >= total * fraction) return 2 ** (i / (bins - 1) * 12 - 12);
  }
  return 1;
};

// Match the displayed object-fit:cover region. Pixels outside the preview
// must not influence its lighting. The probe itself remains unmirrored.
export function cameraProbeRegion(sourceWidth, sourceHeight, metrics, roi, mirrored) {
  if (![sourceWidth, sourceHeight, metrics?.width, metrics?.height, metrics?.drawWidth, metrics?.drawHeight]
    .every((value) => Number.isFinite(value) && value > 0)
    || ![metrics.offsetX, metrics.offsetY].every(Number.isFinite)) return null;
  const sx = clamp(-metrics.offsetX / metrics.drawWidth, 0, 1);
  const sy = clamp(-metrics.offsetY / metrics.drawHeight, 0, 1);
  const sw = Math.min(1 - sx, metrics.width / metrics.drawWidth);
  const sh = Math.min(1 - sy, metrics.height / metrics.drawHeight);
  if (sw <= 0 || sh <= 0) return null;
  const target = roi && Number.isFinite(roi.x) && Number.isFinite(roi.y)
    ? { x: clamp(mirrored ? 1 - roi.x : roi.x, 0, 1), y: clamp(roi.y, 0, 1) } : null;
  return { sx: sx * sourceWidth, sy: sy * sourceHeight, sw: sw * sourceWidth, sh: sh * sourceHeight, roi: target };
}

export function measureCameraAppearance(pixels, width, height, roi = null) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2
    || !(pixels instanceof Uint8Array || pixels instanceof Uint8ClampedArray) || pixels.length !== width * height * 4) return null;
  const global = new Float64Array(bins), local = new Float64Array(bins);
  let count = 0, localWeight = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    if (pixels[offset + 3] < 250) continue;
    const luminance = .2126 * linear[pixels[offset]] + .7152 * linear[pixels[offset + 1]] + .0722 * linear[pixels[offset + 2]];
    const index = clamp(Math.round((Math.log2(Math.max(2 ** -12, luminance)) + 12) / 12 * (bins - 1)), 0, bins - 1);
    global[index]++; count++;
    if (roi) {
      const dx = (x / (width - 1) - roi.x) / .17;
      const dy = (y / (height - 1) - roi.y) / .22;
      const weight = Math.exp(-.5 * (dx * dx + dy * dy));
      local[index] += weight; localWeight += weight;
    }
  }
  if (count < width * height * .9) return null;
  // Percentiles suppress isolated highlights and sensor noise. Local contrast
  // is capped at one stop before blending, so a dark garment cannot alone
  // turn a normally lit necklace almost black.
  const sceneLuminance = quantile(global, count, .75);
  const localLuminance = localWeight > 0 ? quantile(local, localWeight, .60) : sceneLuminance;
  const localStops = clamp(Math.log2(localLuminance / sceneLuminance), -1, 1);
  const stops = clamp(.60 * (Math.log2(sceneLuminance / .18) + .25 * localStops), -3, .60);
  return { sceneLuminance, localLuminance, stops, gain: 2 ** stops };
}

export class AppearanceLighting {
  constructor() { this.reset(); }
  reset() { this.lastFrame = null; this.stops = 0; this.observation = null; }
  observe(observation, frameTime) {
    if (!observation || !Number.isFinite(observation.stops) || !Number.isFinite(frameTime) || frameTime < 0
      || (this.lastFrame !== null && frameTime <= this.lastFrame)) return false;
    const target = clamp(observation.stops, -3, .60);
    if (this.lastFrame === null) this.stops = target;
    else {
      const dt = Math.min(1, frameTime - this.lastFrame);
      const alpha = 1 - Math.exp(-dt / .55);
      this.stops += (target - this.stops) * alpha;
    }
    this.lastFrame = frameTime;
    this.observation = observation;
    return true;
  }
  get gain() { return 2 ** this.stops; }
  describe() { return this.observation ? `camera appearance ×${this.gain.toFixed(2)}` : "lighting reference pending"; }
}

export function applyAppearanceLighting(scene, renderer, lights, gain) {
  if (!Number.isFinite(gain)) return;
  const bounded = clamp(gain, .125, 2 ** .60);
  // r164 feeds scene.environmentIntensity to standard/physical materials
  // without their own envMap, including the custom gem-ray environment exits.
  scene.environmentIntensity = bounded;
  renderer.toneMappingExposure = 1;
  lights.hemi.intensity = .45 * bounded;
  lights.key.intensity = 1.05 * bounded;
  lights.fill.intensity = .35 * bounded;
  lights.rim.intensity = .25 * bounded;
  // Background intensity and colour are deliberately not adjusted: the
  // captured display image is already exposed and encoded by the camera.
}
