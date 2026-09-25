#!/usr/bin/env node
// Validates everything in /store without building: `npm run check`.
import { loadStore } from "./lib/load.mjs";
import { BuildError } from "./lib/util.mjs";

try {
  const store = loadStore();
  console.log(`\n  ✓ store/ looks good: ${store.products.length} products, ${store.collections.length} collections, ${store.pages.length} pages.`);
  if (store.warnings.length) console.log(`\n  Notes:\n    - ${store.warnings.join("\n    - ")}`);
  console.log("");
} catch (error) {
  console.error(error instanceof BuildError ? `\n  ✗ ${error.message}\n` : error);
  process.exit(1);
}
