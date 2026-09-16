import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "build");
const publicDirectories = [
  "assets",
  "bracelets",
  "custom-engagement-rings-toronto",
  "custom-jewellery-toronto",
  "earrings",
  "estate-jewellery-toronto",
  "guides",
  "necklaces",
  "products",
  "rings"
];
const publicRootFiles = new Set([
  "404.html",
  "image-sitemap.xml",
  "robots.txt",
  "site.webmanifest",
  "sitemap.xml"
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const directory of publicDirectories) {
  await cp(path.join(root, directory), path.join(output, directory), { recursive: true });
}

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && (entry.name.endsWith(".html") || publicRootFiles.has(entry.name))) {
    await cp(path.join(root, entry.name), path.join(output, entry.name));
  }
}

console.log(`Prepared static site in ${output}`);
