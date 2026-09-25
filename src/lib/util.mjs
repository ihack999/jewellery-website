// Small helpers shared by the build. No dependencies.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

/** Escape text for HTML body/attribute context. */
export function h(value) {
  if (value === null || value === undefined || value === false) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Join truthy class names. */
export function cx(...names) {
  return names.flat().filter(Boolean).join(" ");
}

/** Turn "Emerald Drop Earrings!" into "emerald-drop-earrings". */
export function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function hash(value, length = 8) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, length);
}

/** Read JSON and explain *where* it is broken if it is. Strips `$comment`/`$help` keys. */
export function readJson(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    throw new BuildError(`Could not read ${rel(file)}: ${error.message}`);
  }
  try {
    return stripMeta(JSON.parse(text));
  } catch (error) {
    const match = /position (\d+)/.exec(error.message);
    let where = "";
    if (match) {
      const upTo = text.slice(0, Number(match[1]));
      const line = upTo.split("\n").length;
      const col = upTo.length - upTo.lastIndexOf("\n");
      where = ` (line ${line}, column ${col})`;
    }
    throw new BuildError(`${rel(file)} is not valid JSON${where}: ${error.message}\n  Tip: check for a missing comma, or a trailing comma before } or ].`);
  }
}

function stripMeta(value) {
  if (Array.isArray(value)) return value.map(stripMeta);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, inner] of Object.entries(value)) {
      if (key.startsWith("$")) continue;
      out[key] = stripMeta(inner);
    }
    return out;
  }
  return value;
}

export class BuildError extends Error {}

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export function rel(file) {
  return path.relative(ROOT, file) || ".";
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeFile(file, contents) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, contents);
}

/** Copy a directory tree, hard-linking files when possible (fast + no extra disk). */
export function linkTree(from, to, { skip = () => false } = {}) {
  if (!fs.existsSync(from)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.name === ".DS_Store" || skip(source, entry)) continue;
    if (entry.isDirectory()) {
      count += linkTree(source, target, { skip });
    } else if (entry.isFile()) {
      ensureDir(to);
      try {
        fs.linkSync(source, target);
      } catch {
        fs.copyFileSync(source, target);
      }
      count += 1;
    }
  }
  return count;
}

export function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

/** Format a price in the store currency, e.g. 2200 -> "$2,200". */
export function createMoney(locale, defaultCurrency) {
  const cache = new Map();
  return function money(amount, currency = defaultCurrency) {
    const key = currency;
    if (!cache.has(key)) {
      cache.set(key, new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0, currencyDisplay: "narrowSymbol" }));
    }
    const text = cache.get(key).format(amount);
    return currency !== defaultCurrency ? `${text} ${currency}` : text;
  };
}

/** Plain text paragraphs ("\n\n" separated) -> <p> tags. Allows **bold** and [links](/url). */
export function paragraphs(text) {
  if (!text) return "";
  return String(text)
    .split(/\n{2,}/)
    .map((block) => `<p>${inline(block.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

export function inline(text) {
  return h(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((\S+?)\)/g, (_, label, href) => `<a href="${href}">${label}</a>`);
}

export function absoluteUrl(base, pathname) {
  return base.replace(/\/$/, "") + pathname;
}

export function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
