import { cp, mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "build");
const publicDirectories = [
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
const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".txt", ".webmanifest", ".xml"]);
const publicRootFiles = new Set([
  "404.html",
  "image-sitemap.xml",
  "robots.txt",
  "site.webmanifest",
  "sitemap.xml"
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

async function collectText(directory, chunks) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "build", "renders"].includes(entry.name)) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await collectText(filename, chunks);
    else if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
      chunks.push(await readFile(filename, "utf8"));
    }
  }
}

const textChunks = [];
await collectText(root, textChunks);
const publicText = textChunks.join("\n");

await cp(path.join(root, "assets"), path.join(output, "assets"), {
  recursive: true,
  filter(source) {
    const relative = path.relative(root, source).split(path.sep).join("/");
    if (!relative.startsWith("assets/images/") && !relative.startsWith("assets/videos/")) return true;
    if (source === path.join(root, "assets/images") || source === path.join(root, "assets/videos")) return true;
    if (!path.extname(source)) return true;
    if (relative.includes("/studio/sources/")) return false;
    if (relative.startsWith("assets/images/responsive/")) {
      const stem = path.basename(relative).replace(/-\d+\.webp$/, "");
      return publicText.includes(stem);
    }
    return publicText.includes(relative);
  }
});

for (const directory of publicDirectories) {
  await cp(path.join(root, directory), path.join(output, directory), { recursive: true });
}

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && (entry.name.endsWith(".html") || publicRootFiles.has(entry.name))) {
    await cp(path.join(root, entry.name), path.join(output, entry.name));
  }
}

console.log(`Prepared static site in ${output}`);
