#!/usr/bin/env node
// Builds the storefront into /dist from the data in /store.
//
//   npm run build        → full build
//   npm run dev          → build, serve on http://localhost:8000 and rebuild on changes
//
// You normally never edit this file. Products, collections, pages and brand
// settings all live in /store.

import fs from "node:fs";
import path from "node:path";
import { ROOT, BuildError, writeFile, linkTree, hash, createMoney, absoluteUrl, ensureDir, h } from "./lib/util.mjs";
import { loadStore } from "./lib/load.mjs";
import { createImagePipeline } from "./lib/images.mjs";
import { buildStudioCss } from "./lib/legacy-css.mjs";
import { layout } from "./templates/layout.mjs";
import { renderHome } from "./templates/home.mjs";
import { renderCollection } from "./templates/collection.mjs";
import { renderProduct } from "./templates/product.mjs";
import { renderStudio } from "./templates/studio.mjs";
import { renderPage, renderWishlist, renderNotFound, renderOrderSuccess } from "./templates/pages.mjs";
import { priceText } from "./templates/components.mjs";

const DIST = path.join(ROOT, "dist");
const STATIC_SRC = path.join(ROOT, "src", "static");

export async function build({ quiet = false } = {}) {
  const started = Date.now();
  const log = quiet ? () => {} : (...a) => console.log(...a);
  const warnings = [];

  const store = loadStore();
  warnings.push(...store.warnings);

  fs.rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);

  // 1. Static files: legacy assets (fonts, videos, studio JS), product-folder photos, storefront CSS/JS.
  const assetCount = linkTree(path.join(ROOT, "assets"), path.join(DIST, "assets"), {
    skip: (file) => file.includes(`${path.sep}images${path.sep}responsive`)
  });
  linkTree(path.join(ROOT, "store", "products"), path.join(DIST, "store", "products"), {
    skip: (file, entry) => entry.isFile() && !/\.(jpe?g|png|webp|avif|gif|mp4|webm)$/i.test(file)
  });
  linkTree(STATIC_SRC, path.join(DIST, "static"), { skip: (file) => file.endsWith("studio-overrides.css") });
  for (const file of ["robots.txt"]) if (fs.existsSync(path.join(ROOT, "store", file))) fs.copyFileSync(path.join(ROOT, "store", file), path.join(DIST, file));

  // 2. Studio stylesheet (generated from the original CSS).
  const legacy = (name) => path.join(ROOT, "assets", "css", name);
  const studioCss = buildStudioCss({
    markupFile: path.join(ROOT, "src", "studio", "studio-markup.html"),
    scriptFiles: ["designer.js", "ar-tryon.js", "material-study.js"].map((f) => path.join(ROOT, "assets", "js", f)).filter((f) => fs.existsSync(f)),
    cssFiles: ["styles.css", "generator-v2.css", "experience.css", "photography.css"].map(legacy).filter((f) => fs.existsSync(f)),
    varsSelector: "body[data-page=\"customs\"]",
    scope: ".legacy-studio",
    overrides: fs.readFileSync(path.join(STATIC_SRC, "studio-overrides.css"), "utf8")
  });
  writeFile(path.join(DIST, "static", "studio.css"), studioCss);

  // 3. Render context shared by every template.
  const versions = new Map();
  const images = createImagePipeline({ distDir: DIST, log });
  const ctx = {
    ...store,
    images,
    money: createMoney(store.site.brand.locale, store.site.brand.currency),
    version: hash(Date.now()),
    warn: (msg) => warnings.push(msg),
    assetVersion(file) {
      if (!versions.has(file)) {
        const full = path.join(DIST, "static", file);
        versions.set(file, fs.existsSync(full) ? hash(fs.readFileSync(full)) : "0");
      }
      return versions.get(file);
    }
  };
  // Auto-detect video posters generated into assets/images/store/posters.
  for (const p of store.products) {
    for (const v of p.videos) {
      if (!v.poster) {
        const guess = `/assets/images/store/posters/${path.basename(v.src, path.extname(v.src))}.jpg`;
        if (fs.existsSync(path.join(ROOT, guess.slice(1)))) v.poster = guess;
      }
    }
  }

  const pages = [];
  const emit = (page) => {
    const html = layout(ctx, page);
    const file = page.path.endsWith(".html") ? path.join(DIST, page.path) : path.join(DIST, page.path, "index.html");
    writeFile(file, html);
    pages.push(page);
  };

  // 4. Pages.
  emit(renderHome(ctx));
  for (const c of store.collections) emit(renderCollection(c, ctx));
  for (const p of store.products) emit(renderProduct(p, ctx));
  if (store.site.studio?.enabled) emit(renderStudio(ctx));
  for (const page of store.pages) emit(renderPage(page, ctx));
  emit(renderWishlist(ctx));
  emit(renderOrderSuccess(ctx));
  emit(renderNotFound(ctx));

  // 5. Data for the browser (search, wishlist, quick view, bag).
  const catalog = store.products.map((p) => ({
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle || "",
    url: p.url,
    price: p.price,
    priceFrom: p.priceFrom,
    priceText: priceText(p, ctx),
    currency: p.currency,
    availability: p.availability,
    purchasable: p.purchasable,
    maxQuantity: p.maxQuantity,
    category: p.category,
    categoryLabel: store.vocab.categories[p.category],
    tags: [...p.tags, ...p.collections],
    metals: p.metals,
    stones: p.stones,
    badge: p.badge || "",
    summary: p.summary || "",
    image: images.url(p.images[0].src, 720),
    hover: p.images[p.hoverImage] && p.hoverImage ? images.url(p.images[p.hoverImage].src, 720) : "",
    images: p.images.slice(0, 6).map((img) => ({ src: images.url(img.src, 960), alt: img.alt })),
    options: p.options.map((o) => ({
      id: o.id, name: o.name, type: o.type, required: o.required, maxLength: o.maxLength, placeholder: o.placeholder, help: o.help,
      values: o.type === "text" ? undefined : o.values.map((v) => ({ label: v.label, value: v.value, add: v.add || 0, inquire: Boolean(v.inquire), image: v.image, swatch: store.vocab.metals[v.metal]?.swatch || v.swatch }))
    }))
  }));
  writeFile(path.join(DIST, "products.json"), JSON.stringify(catalog));

  // 6. Server-side price list for the checkout function (never trust prices from the browser).
  const serverCatalog = {
    generatedAt: new Date().toISOString(),
    currency: store.site.brand.currency,
    checkoutMode: store.site.checkout?.mode || "request",
    shippingCountries: store.site.checkout?.shippingCountries || ["CA", "US"],
    products: Object.fromEntries(store.products.map((p) => [p.slug, {
      name: p.name,
      price: p.price,
      currency: p.currency,
      purchasable: p.purchasable,
      maxQuantity: p.maxQuantity,
      image: absoluteUrl(store.site.brand.url, images.url(p.images[0].src, 720)),
      options: p.options.map((o) => ({ name: o.name, type: o.type, required: o.required, maxLength: o.maxLength, values: o.type === "text" ? undefined : o.values.map((v) => ({ value: v.value, add: v.add || 0, inquire: Boolean(v.inquire) })) }))
    }]))
  };
  writeFile(path.join(ROOT, "netlify", "functions", "lib", "catalog.json"), JSON.stringify(serverCatalog, null, 2) + "\n");

  // 7. SEO + platform files.
  const b = store.site.brand;
  const indexable = pages.filter((p) => !p.noindex && !p.path.endsWith(".html"));
  writeFile(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/2000/sitemaps/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${indexable.map((p) => {
    const product = store.products.find((x) => x.url === p.path);
    const imgs = product ? product.images.slice(0, 5).map((img) => `<image:image><image:loc>${h(absoluteUrl(b.url, images.url(img.src, 1280)))}</image:loc></image:image>`).join("") : "";
    return `<url><loc>${h(absoluteUrl(b.url, p.path))}</loc>${imgs}</url>`;
  }).join("\n")}
</urlset>
`);
  if (!fs.existsSync(path.join(DIST, "robots.txt"))) {
    writeFile(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /.netlify/\nDisallow: /wishlist/\n\nSitemap: ${absoluteUrl(b.url, "/sitemap.xml")}\n`);
  }
  writeFile(path.join(DIST, "site.webmanifest"), JSON.stringify({
    name: b.name, short_name: b.shortName || b.name, description: b.description, start_url: "/", display: "standalone",
    background_color: store.site.theme.colors.background, theme_color: store.site.theme.colors.ink,
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }]
  }, null, 2));
  const mono = (b.monogram || b.shortName || b.name.slice(0, 1)).slice(0, 3);
  writeFile(path.join(DIST, "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${store.site.theme.colors.ink}"/><text x="32" y="${mono.length > 2 ? 39 : 41}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${mono.length > 2 ? 20 : 26}" letter-spacing="1" fill="${store.site.theme.colors.background}">${h(mono)}</text></svg>\n`);
  const redirects = (store.site.redirects || []).map((r) => `${r.from}  ${r.to}  ${r.status || 301}`);
  writeFile(path.join(DIST, "_redirects"), `# Generated from store/site.json → "redirects"\n${redirects.join("\n")}\n`);

  // 8. Images.
  const imageStats = await images.flush();
  warnings.push(...images.warnings);

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  log(`\n  ✓ Built ${pages.length} pages · ${store.products.length} products · ${store.collections.length} collections in ${seconds}s`);
  log(`    images: ${imageStats.generated} generated, ${imageStats.cached} from cache · ${assetCount} asset files linked`);
  if (warnings.length) log(`\n  Notes:\n    - ${warnings.join("\n    - ")}`);
  log(`\n  Output: dist/\n`);
  return { pages, warnings };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("build.mjs")) {
  build().catch((error) => {
    if (error instanceof BuildError) {
      console.error(`\n  ✗ ${error.message}\n`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });
}
