// Responsive images.
//
// Templates call `images.tag(src, options)` synchronously. We read the image's
// pixel size straight from the file header (no dependency), decide which
// widths to generate, and queue the work. After all pages are rendered,
// `images.flush()` resizes everything with `sharp` (if installed) into
// dist/media, caching results in .cache/media so rebuilds are instant.
// Without sharp the original file is served as-is — the site still works.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { ROOT, h, hash, slugify, ensureDir, rel } from "./util.mjs";

const require = createRequire(import.meta.url);

export const DEFAULT_WIDTHS = [360, 540, 720, 960, 1280, 1600];

function loadSharp() {
  const candidates = [null, process.env.SHARP_PATH].filter((v) => v !== undefined);
  for (const where of candidates) {
    try {
      return where ? require(where) : require("sharp");
    } catch {
      // try next
    }
  }
  return null;
}

/** Read width/height from PNG, JPEG, WebP or GIF headers. */
export function imageSize(file) {
  const fd = fs.openSync(file, "r");
  try {
    const head = Buffer.alloc(64 * 1024);
    const bytes = fs.readSync(fd, head, 0, head.length, 0);
    const b = head.subarray(0, bytes);
    // PNG
    if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    // GIF
    if (b.toString("ascii", 0, 3) === "GIF") return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
    // WebP
    if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
      const chunk = b.toString("ascii", 12, 16);
      if (chunk === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
      if (chunk === "VP8L") {
        const bits = b.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (chunk === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    }
    // JPEG: walk segments until a SOF marker.
    if (b[0] === 0xff && b[1] === 0xd8) {
      let offset = 2;
      let buffer = b;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) { offset += 1; continue; }
        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          let height = buffer.readUInt16BE(offset + 5);
          let width = buffer.readUInt16BE(offset + 7);
          const orientation = jpegOrientation(b);
          if (orientation >= 5 && orientation <= 8) [width, height] = [height, width];
          return { width, height };
        }
        offset += 2 + length;
        if (offset + 9 > buffer.length) {
          // Large EXIF blocks: read more of the file.
          const more = Buffer.alloc(offset + 64 * 1024);
          const read = fs.readSync(fd, more, 0, more.length, 0);
          if (read <= buffer.length) break;
          buffer = more.subarray(0, read);
        }
      }
    }
  } finally {
    fs.closeSync(fd);
  }
  return null;
}

function jpegOrientation(b) {
  const exif = b.indexOf("Exif\0\0", 0, "binary");
  if (exif < 0) return 1;
  const tiff = exif + 6;
  const little = b.toString("ascii", tiff, tiff + 2) === "II";
  const u16 = (o) => (little ? b.readUInt16LE(o) : b.readUInt16BE(o));
  const u32 = (o) => (little ? b.readUInt32LE(o) : b.readUInt32BE(o));
  try {
    const ifd = tiff + u32(tiff + 4);
    const entries = u16(ifd);
    for (let i = 0; i < entries; i++) {
      const entry = ifd + 2 + i * 12;
      if (u16(entry) === 0x0112) return u16(entry + 8);
    }
  } catch {
    return 1;
  }
  return 1;
}

export function createImagePipeline({ distDir, cacheDir = path.join(ROOT, ".cache", "media"), quality = 78, log = console.log } = {}) {
  const sharp = loadSharp();
  const jobs = new Map(); // output file -> { source, width }
  const sizes = new Map();
  const warnings = new Set();

  function resolveSource(src) {
    if (!src || /^(https?:)?\/\//.test(src) || src.startsWith("data:")) return null;
    const clean = decodeURI(src.split(/[?#]/)[0]);
    const file = path.join(ROOT, clean.replace(/^\//, ""));
    return fs.existsSync(file) ? file : null;
  }

  // Output names hash the image *content* (not its modification time), so a
  // fresh clone or another machine produces the same URLs and a deploy only
  // busts caches for images that really changed. Content hashes are memoised
  // on disk by path/size/mtime to keep rebuilds fast.
  const keysFile = path.join(cacheDir, "content-keys.json");
  let keys = {};
  try { keys = JSON.parse(fs.readFileSync(keysFile, "utf8")); } catch { keys = {}; }
  let keysDirty = false;
  function contentKey(file, stat) {
    const id = `${rel(file)}:${stat.size}:${stat.mtimeMs}`;
    if (!keys[id]) {
      keys[id] = hash(`${rel(file)}:${crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex")}`);
      keysDirty = true;
    }
    return keys[id];
  }
  function saveKeys() {
    if (!keysDirty) return;
    try { fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(keysFile, JSON.stringify(keys)); keysDirty = false; } catch { /* cache is optional */ }
  }

  function info(src) {
    if (sizes.has(src)) return sizes.get(src);
    const file = resolveSource(src);
    let result = null;
    if (file) {
      const stat = fs.statSync(file);
      let dims = null;
      try { dims = imageSize(file); } catch { dims = null; }
      result = { file, dims, key: contentKey(file, stat), base: slugify(path.basename(file, path.extname(file))).slice(0, 48) || "image" };
    } else if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith("data:")) {
      warnings.add(`Image not found: ${src}`);
    }
    sizes.set(src, result);
    return result;
  }

  /** Build srcset data for a source image. */
  function variants(src, widths = DEFAULT_WIDTHS) {
    const meta = info(src);
    if (!meta || !meta.dims || !sharp || /\.(svg|gif)$/i.test(meta.file)) {
      return { src, srcset: "", width: meta?.dims?.width, height: meta?.dims?.height };
    }
    const max = meta.dims.width;
    let list = widths.filter((w) => w < max * 1.02);
    if (!list.length || list[list.length - 1] < Math.min(max, widths[widths.length - 1])) list.push(Math.min(max, widths[widths.length - 1]));
    list = [...new Set(list)];
    const entries = list.map((w) => {
      const name = `${meta.base}-${meta.key}-${w}.webp`;
      jobs.set(name, { source: meta.file, width: w });
      return { url: `/media/${name}`, w };
    });
    const largest = entries[entries.length - 1];
    const fallback = entries.find((e) => e.w >= 960) || largest;
    return {
      src: fallback.url,
      srcset: entries.map((e) => `${e.url} ${e.w}w`).join(", "),
      width: meta.dims.width,
      height: meta.dims.height
    };
  }

  /** <img> tag with srcset/sizes/dimensions. */
  function tag(src, { alt = "", sizes = "100vw", className = "", loading = "lazy", priority = false, widths, attrs = "" } = {}) {
    if (!src) return "";
    const v = variants(src, widths);
    const dims = v.width && v.height ? ` width="${v.width}" height="${v.height}"` : "";
    const srcset = v.srcset ? ` srcset="${v.srcset}" sizes="${h(sizes)}"` : "";
    const load = priority ? ` fetchpriority="high"` : ` loading="${loading}"`;
    return `<img src="${h(v.src)}"${srcset}${dims} alt="${h(alt)}"${className ? ` class="${className}"` : ""} decoding="async"${load}${attrs ? " " + attrs : ""}>`;
  }

  /** Single best URL for a given width (for og:image, JSON, CSS backgrounds). */
  function url(src, width = 1280) {
    const v = variants(src, [width]);
    return v.src;
  }

  async function flush() {
    saveKeys();
    if (!sharp) {
      log("  images: sharp not installed — serving original files (run `npm install` for optimized images).");
      return { generated: 0, cached: 0 };
    }
    ensureDir(cacheDir);
    const outDir = path.join(distDir, "media");
    ensureDir(outDir);
    let generated = 0;
    let cached = 0;
    const list = [...jobs.entries()];
    const concurrency = 4;
    let index = 0;
    async function worker() {
      while (index < list.length) {
        const [name, job] = list[index++];
        const cachedFile = path.join(cacheDir, name);
        if (!fs.existsSync(cachedFile)) {
          await sharp(job.source, { failOn: "none" })
            .rotate()
            .resize({ width: job.width, withoutEnlargement: true })
            .webp({ quality, effort: 4 })
            .toFile(cachedFile);
          generated += 1;
        } else {
          cached += 1;
        }
        const target = path.join(outDir, name);
        try { fs.linkSync(cachedFile, target); } catch { fs.copyFileSync(cachedFile, target); }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));
    return { generated, cached };
  }

  return { tag, url, variants, info, flush, warnings, hasSharp: Boolean(sharp) };
}
