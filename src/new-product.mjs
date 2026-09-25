#!/usr/bin/env node
// Creates a new product folder from store/products/_template.
//
//   npm run new -- "Emerald Drop Earrings"
//   npm run new -- "Emerald Drop Earrings" --category earrings --price 3400

import fs from "node:fs";
import path from "node:path";
import { ROOT, slugify, readJson } from "./lib/util.mjs";
import { formatJson } from "./lib/format-json.mjs";

const args = process.argv.slice(2);
const flags = {};
const words = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) flags[args[i].slice(2)] = args[++i];
  else words.push(args[i]);
}
const name = words.join(" ").trim();
if (!name) {
  console.log(`\n  Usage: npm run new -- "Product name" [--category rings] [--price 2500]\n`);
  process.exit(1);
}

const slug = slugify(flags.slug || name);
const dir = path.join(ROOT, "store", "products", slug);
if (fs.existsSync(dir)) {
  console.error(`\n  ✗ store/products/${slug}/ already exists.\n`);
  process.exit(1);
}

const site = readJson(path.join(ROOT, "store", "site.json"));
const categories = Object.keys(site.vocabulary.categories);
const category = flags.category || categories[0];
if (!categories.includes(category)) {
  console.error(`\n  ✗ Unknown category "${category}". Use one of: ${categories.join(", ")}\n`);
  process.exit(1);
}

const template = JSON.parse(fs.readFileSync(path.join(ROOT, "store", "products", "_template", "product.json"), "utf8"));
template.name = name;
template.category = category;
if (flags.price !== undefined) template.price = flags.price === "null" ? null : Number(flags.price);
delete template.images; // use every photo dropped into the folder
if (category !== "rings") template.options = (template.options || []).filter((o) => o.type !== "size");
if (template.studio) template.studio.piece = { rings: "Ring", necklaces: "Necklace", bracelets: "Bracelet", earrings: "Earrings" }[category] || template.studio.piece;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "product.json"), formatJson(template));

console.log(`
  ✓ Created store/products/${slug}/product.json

  Next:
    1. Drop the photos into store/products/${slug}/  (they show in filename order: 01.jpg, 02.jpg…)
    2. Edit store/products/${slug}/product.json  (name, price, description, options)
    3. npm run dev   → preview at http://localhost:8000/products/${slug}/
`);
