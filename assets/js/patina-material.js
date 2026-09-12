import { createSeededRandom } from "./design-session.js?v=20260911-construction-v32";

const smooth = (value) => { const bounded = Math.max(0, Math.min(1, value)); return bounded * bounded * (3 - 2 * bounded); };

export function buildPatinaPixels(size = 256, coverage = 0.45, seed = "atelier-001", metalRoughness = 0.25) {
  const random = createSeededRandom(`${seed}:bronze-patina`);
  const fields = [3, 7, 19, 47].map((period) => ({ period, values: Array.from({ length: period * period }, random) }));
  const noise = (horizontal, vertical, field) => {
    const positionX = horizontal * field.period;
    const positionY = vertical * field.period;
    const floorX = Math.floor(positionX);
    const floorY = Math.floor(positionY);
    const blendX = smooth(positionX - floorX);
    const blendY = smooth(positionY - floorY);
    const sample = (offsetX, offsetY) => field.values[((floorY + offsetY) % field.period) * field.period + (floorX + offsetX) % field.period];
    return (sample(0, 0) * (1 - blendX) + sample(1, 0) * blendX) * (1 - blendY) + (sample(0, 1) * (1 - blendX) + sample(1, 1) * blendX) * blendY;
  };
  const color = new Uint8Array(size * size * 4);
  const physical = new Uint8Array(size * size * 4);
  const height = new Float32Array(size * size);
  for (let vertical = 0; vertical < size; vertical += 1) {
    for (let horizontal = 0; horizontal < size; horizontal += 1) {
      const samples = fields.map((field) => noise(horizontal / size, vertical / size, field));
      const field = samples[0] * 0.52 + samples[1] * 0.29 + samples[2] * 0.15 + samples[3] * 0.04;
      const oxide = coverage <= 0 ? 0 : coverage >= 1 ? 1 : smooth((field - (0.83 - coverage * 0.7)) / 0.17);
      const wear = smooth(samples[1]);
      const bronze = [163 + wear * 33, 110 + wear * 36, 53 + wear * 28];
      const verdigris = [37 + samples[2] * 32, 77 + samples[2] * 43, 66 + samples[2] * 37];
      const offset = (vertical * size + horizontal) * 4;
      for (let axis = 0; axis < 3; axis += 1) color[offset + axis] = Math.round(bronze[axis] * (1 - oxide) + verdigris[axis] * oxide);
      color[offset + 3] = 255;
      physical[offset] = 255;
      physical[offset + 1] = Math.round(255 * (Math.max(0.18, metalRoughness) * (1 - oxide) + (0.66 + samples[3] * 0.16) * oxide));
      physical[offset + 2] = Math.round(255 * (1 - oxide * 0.97));
      physical[offset + 3] = 255;
      height[vertical * size + horizontal] = oxide * 0.65 + samples[3] * 0.07;
    }
  }
  const normal = new Uint8Array(size * size * 4);
  for (let vertical = 0; vertical < size; vertical += 1) for (let horizontal = 0; horizontal < size; horizontal += 1) {
    const sample = (offsetX, offsetY) => height[((vertical + offsetY + size) % size) * size + (horizontal + offsetX + size) % size];
    const gradient = [(sample(-1, 0) - sample(1, 0)) * 3, (sample(0, -1) - sample(0, 1)) * 3, 1];
    const magnitude = Math.hypot(...gradient);
    const offset = (vertical * size + horizontal) * 4;
    for (let axis = 0; axis < 3; axis += 1) normal[offset + axis] = Math.round((gradient[axis] / magnitude * 0.5 + 0.5) * 255);
    normal[offset + 3] = 255;
  }
  return { color, physical, normal, size };
}

export function createPatinaMaps(THREE, coverage, seed, roughness) {
  const pixels = buildPatinaPixels(256, coverage, seed, roughness);
  return Object.fromEntries(["color", "physical", "normal"].map((name) => {
    let texture;
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = pixels.size;
      const context = canvas.getContext("2d");
      const image = context.createImageData(pixels.size, pixels.size);
      image.data.set(pixels[name]);
      context.putImageData(image, 0, 0);
      texture = new THREE.CanvasTexture(canvas);
      texture.flipY = false;
    } else texture = new THREE.DataTexture(pixels[name], pixels.size, pixels.size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(0.25, 0.25);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    if (name === "color") texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return [name, texture];
  }));
}
