// Loads everything in /store, fills in defaults and validates it with
// friendly, specific error messages.

import fs from "node:fs";
import path from "node:path";
import { ROOT, readJson, listDirs, rel, slugify, BuildError } from "./util.mjs";

const STORE = path.join(ROOT, "store");
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

export function loadStore() {
  const errors = [];
  const warnings = [];
  const site = readJson(path.join(STORE, "site.json"));
  const collectionsFile = readJson(path.join(STORE, "collections.json"));
  const home = readJson(path.join(STORE, "home.json"));

  const vocab = site.vocabulary || {};
  vocab.categories ||= {};
  vocab.metals ||= {};
  vocab.stones ||= {};
  vocab.availability ||= {};
  vocab.priceRanges ||= [];
  site.brand.currency ||= "CAD";
  site.brand.locale ||= "en-CA";

  // ---------------------------------------------------------------- products
  const productDir = path.join(STORE, "products");
  const products = [];
  for (const folder of listDirs(productDir)) {
    if (folder.startsWith("_") || folder.startsWith(".")) continue; // _template etc.
    const dir = path.join(productDir, folder);
    const file = path.join(dir, "product.json");
    if (!fs.existsSync(file)) {
      warnings.push(`store/products/${folder}/ has no product.json — skipped.`);
      continue;
    }
    let raw;
    try {
      raw = readJson(file);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    const where = `store/products/${folder}/product.json`;
    const p = normalizeProduct(raw, { folder, dir, where, site, errors, warnings });
    if (p && p.availability !== "hidden" && !p.hidden) products.push(p);
  }

  const seen = new Map();
  for (const p of products) {
    if (seen.has(p.slug)) errors.push(`Two products use the URL "${p.slug}": ${seen.get(p.slug)} and ${p.where}.`);
    seen.set(p.slug, p.where);
  }
  products.sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999) || a.name.localeCompare(b.name));

  // ------------------------------------------------------------- collections
  const collections = (collectionsFile.collections || []).map((c) => {
    if (!c.handle) errors.push(`store/collections.json: a collection is missing "handle".`);
    const handle = slugify(c.handle);
    const pathName = c.path || `/collections/${handle}/`;
    return {
      ...c,
      handle,
      path: pathName.endsWith("/") ? pathName : `${pathName}/`,
      title: c.title || handle,
      tileLabel: c.tileLabel || c.title,
      match: c.match || {},
      tiles: c.tiles || collectionsFile.defaultTiles || []
    };
  });
  const byHandle = Object.fromEntries(collections.map((c) => [c.handle, c]));
  for (const c of collections) {
    c.products = products.filter((p) => matches(p, c.match));
    for (const t of c.tiles) if (!byHandle[t]) warnings.push(`Collection "${c.handle}" lists tile "${t}" but no collection has that handle.`);
    if (!c.products.length) warnings.push(`Collection "${c.handle}" currently has no products.`);
  }
  for (const p of products) {
    p.collections = collections.filter((c) => c.handle !== "all" && c.products.includes(p)).map((c) => c.handle);
    for (const r of p.related || []) if (!seen.has(r)) warnings.push(`${p.where}: related product "${r}" does not exist.`);
  }

  // ------------------------------------------------------------------- pages
  const pagesDir = path.join(STORE, "pages");
  const pages = [];
  if (fs.existsSync(pagesDir)) {
    for (const name of fs.readdirSync(pagesDir).sort()) {
      if (!name.endsWith(".html") || name.startsWith("_")) continue;
      const text = fs.readFileSync(path.join(pagesDir, name), "utf8");
      const fm = /^\s*<!--\s*(\{[\s\S]*?\})\s*-->/.exec(text);
      let meta = {};
      if (fm) {
        try { meta = JSON.parse(fm[1]); } catch (error) { errors.push(`store/pages/${name}: the settings comment at the top is not valid JSON (${error.message}).`); }
      }
      const slug = meta.slug || name.replace(/\.html$/, "");
      pages.push({ slug, path: meta.path || `/pages/${slug}/`, title: meta.title || slug, ...meta, body: fm ? text.slice(fm[0].length).trim() : text });
    }
  }

  if (errors.length) {
    throw new BuildError(`Found ${errors.length} problem${errors.length === 1 ? "" : "s"} in /store:\n\n  • ${errors.join("\n  • ")}\n`);
  }

  return { site, vocab, products, collections, byHandle, home, pages, warnings };
}

function normalizeProduct(raw, { folder, dir, where, site, errors, warnings }) {
  const vocab = site.vocabulary;
  const fail = (msg) => errors.push(`${where}: ${msg}`);
  if (!raw.name) fail(`"name" is required.`);
  if (!raw.category) fail(`"category" is required (one of: ${Object.keys(vocab.categories).join(", ")}).`);
  else if (!vocab.categories[raw.category]) fail(`category "${raw.category}" is not defined. Use one of: ${Object.keys(vocab.categories).join(", ")} — or add it to "vocabulary.categories" in store/site.json.`);

  const price = raw.price === undefined || raw.price === "" ? null : raw.price;
  if (price !== null && !(typeof price === "number" && price >= 0)) fail(`"price" must be a number like 2500 (no $ or commas), or null for "price on request".`);

  for (const m of raw.metals || []) if (!vocab.metals[m]) fail(`metal "${m}" is not defined. Use one of: ${Object.keys(vocab.metals).join(", ")}.`);
  for (const s of raw.stones || []) if (!vocab.stones[s]) fail(`stone "${s}" is not defined. Use one of: ${Object.keys(vocab.stones).join(", ")}.`);
  const availability = raw.availability || "made-to-order";
  if (availability !== "hidden" && !vocab.availability[availability]) fail(`availability "${availability}" must be one of: ${Object.keys(vocab.availability).join(", ")}, hidden.`);

  // Images: explicit list, or every image file in the product folder (sorted by name).
  let images = raw.images;
  if (!images || !images.length) {
    images = fs.readdirSync(dir).filter((f) => IMAGE_EXT.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (!images.length) {
      warnings.push(`${where}: skipped for now — add photos to store/products/${folder}/ (or list them under "images") to publish it.`);
      return null;
    }
  }
  images = images.map((item, i) => {
    const img = typeof item === "string" ? { src: item } : { ...item };
    if (!img.src) { fail(`image #${i + 1} has no "src".`); return img; }
    if (!/^(https?:)?\/\//.test(img.src) && !img.src.startsWith("/")) {
      // Relative to the product folder.
      const local = path.join(dir, img.src);
      if (!fs.existsSync(local)) fail(`image "${img.src}" was not found in store/products/${folder}/.`);
      img.src = "/" + path.relative(ROOT, local).split(path.sep).join("/");
    } else if (img.src.startsWith("/") && !fs.existsSync(path.join(ROOT, img.src.slice(1)))) {
      fail(`image "${img.src}" does not exist.`);
    }
    img.alt ||= i === 0 ? raw.name : `${raw.name} — view ${i + 1}`;
    return img;
  });

  const options = (raw.options || []).map((o, i) => {
    const opt = { type: "button", required: true, ...o };
    if (!opt.name) fail(`option #${i + 1} needs a "name".`);
    opt.id = slugify(opt.name) || `option-${i + 1}`;
    if (opt.type === "size" && typeof opt.values === "string") opt.values = vocab[opt.values] || [];
    if (opt.type !== "text") {
      opt.values = (opt.values || []).map((v) => (typeof v === "string" ? { label: v } : v));
      if (!opt.values.length) fail(`option "${opt.name}" has no values.`);
      for (const v of opt.values) {
        v.value ||= v.label;
        if (v.metal && !vocab.metals[v.metal]) fail(`option "${opt.name}" uses metal "${v.metal}" which is not defined in site.json.`);
        if (v.image !== undefined && !images[v.image]) {
          warnings.push(`${where}: option "${v.label}" points to image ${v.image}, but there are only ${images.length} images (counting from 0) — ignoring it.`);
          delete v.image;
        }
      }
    } else {
      opt.required = o.required ?? false;
    }
    return opt;
  });

  const slug = slugify(raw.slug || folder);
  const tags = (raw.tags || []).map(slugify);
  return {
    ...raw,
    where,
    folder,
    slug,
    url: `/products/${slug}/`,
    price,
    priceFrom: Boolean(raw.priceFrom),
    currency: raw.currency || site.brand.currency,
    compareAtPrice: raw.compareAtPrice || null,
    availability,
    tags,
    metals: raw.metals || [],
    stones: raw.stones || [],
    images,
    videos: raw.videos || [],
    hoverImage: raw.hoverImage === undefined ? (images[1] ? 1 : 0) : raw.hoverImage,
    options,
    details: raw.details || {},
    maxQuantity: raw.maxQuantity || (availability === "one-of-a-kind" ? 1 : 5),
    purchasable: price !== null && availability !== "sold",
    sort: raw.sort ?? 999
  };
}

/** Does a product match a collection rule? */
export function matches(p, rule = {}) {
  const any = (value, list) => [].concat(list).includes(value);
  const overlap = (values, list) => values.some((v) => [].concat(list).includes(v));
  if (rule.category && !any(p.category, rule.category)) return false;
  if (rule.tags && !overlap(p.tags, rule.tags)) return false;
  if (rule.excludeTags && overlap(p.tags, rule.excludeTags)) return false;
  if (rule.stones && !overlap(p.stones, rule.stones)) return false;
  if (rule.metals && !overlap(p.metals, rule.metals)) return false;
  if (rule.availability && !any(p.availability, rule.availability)) return false;
  if (rule.excludeAvailability && any(p.availability, rule.excludeAvailability)) return false;
  if (rule.minPrice !== undefined && (p.price === null || p.price < rule.minPrice)) return false;
  if (rule.maxPrice !== undefined && (p.price === null || p.price > rule.maxPrice)) return false;
  if (rule.products && !rule.products.includes(p.slug)) return false;
  return true;
}
