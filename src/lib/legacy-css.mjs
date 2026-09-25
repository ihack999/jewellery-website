// Extracts just the CSS the 3D Design Studio needs from the original
// stylesheets, so the studio keeps working without the old site's global
// styles leaking into the new storefront.
//
// A rule is kept when every class in (one of) its selectors is actually used
// by the studio markup or the studio's JavaScript.

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./util.mjs";

function parse(css) {
  // Returns a list of nodes: { type: "rule", selector, body } | { type: "at", name, prelude, children|body }
  let i = 0;
  const n = css.length;

  function skipWs() {
    while (i < n) {
      if (css.startsWith("/*", i)) {
        const end = css.indexOf("*/", i + 2);
        i = end < 0 ? n : end + 2;
      } else if (/\s/.test(css[i])) {
        i++;
      } else break;
    }
  }

  function readUntil(chars) {
    let out = "";
    let depth = 0;
    while (i < n) {
      const ch = css[i];
      if (css.startsWith("/*", i)) {
        const end = css.indexOf("*/", i + 2);
        i = end < 0 ? n : end + 2;
        continue;
      }
      if (ch === '"' || ch === "'") {
        const q = ch;
        let j = i + 1;
        while (j < n && css[j] !== q) j += css[j] === "\\" ? 2 : 1;
        out += css.slice(i, j + 1);
        i = j + 1;
        continue;
      }
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (depth === 0 && chars.includes(ch)) break;
      out += ch;
      i++;
    }
    return out;
  }

  function readBlockBody() {
    // assumes css[i] === "{"; returns raw inner text
    let depth = 0;
    const start = i + 1;
    while (i < n) {
      const ch = css[i];
      if (css.startsWith("/*", i)) {
        const end = css.indexOf("*/", i + 2);
        i = end < 0 ? n : end + 2;
        continue;
      }
      if (ch === '"' || ch === "'") {
        const q = ch;
        i++;
        while (i < n && css[i] !== q) i += css[i] === "\\" ? 2 : 1;
        i++;
        continue;
      }
      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) {
          const body = css.slice(start, i);
          i++;
          return body;
        }
      }
      i++;
    }
    return css.slice(start);
  }

  function parseList(stopAtBrace) {
    const nodes = [];
    while (true) {
      skipWs();
      if (i >= n) break;
      if (stopAtBrace && css[i] === "}") { i++; break; }
      if (css[i] === "@") {
        const prelude = readUntil("{;").trim();
        const name = /^@([\w-]+)/.exec(prelude)?.[1] || "";
        if (css[i] === ";") { i++; nodes.push({ type: "at", name, prelude, body: null }); continue; }
        if (["media", "supports", "container", "layer"].includes(name)) {
          i++; // {
          nodes.push({ type: "at", name, prelude, children: parseList(true) });
        } else {
          nodes.push({ type: "at", name, prelude, body: readBlockBody() });
        }
      } else {
        const selector = readUntil("{").trim();
        if (i >= n) break;
        const body = readBlockBody();
        nodes.push({ type: "rule", selector, body });
      }
    }
    return nodes;
  }

  return parseList(false);
}

function splitSelectors(selector) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of selector) {
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function classesIn(selector) {
  return [...selector.replace(/\[[^\]]*\]/g, "").matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
}

export function buildStudioCss({ markupFile, scriptFiles, cssFiles, varsSelector, scope = "", unscoped = [], overrides = "" }) {
  const used = new Set();
  const markup = fs.readFileSync(markupFile, "utf8");
  for (const m of markup.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).forEach((c) => c && used.add(c));
  for (const file of scriptFiles) {
    const js = fs.readFileSync(file, "utf8");
    for (const m of js.matchAll(/["'`]([^"'`\n]{1,400})["'`]/g)) {
      for (const token of m[1].split(/[\s.]+/)) if (/^-?[_a-zA-Z][\w-]*$/.test(token)) used.add(token);
    }
    for (const m of js.matchAll(/class(?:Name)?=\\?"([^"\\]*)/g)) m[1].split(/\s+/).forEach((c) => c && used.add(c));
  }
  // Never pull in the old site's page chrome.
  for (const c of ["site-header", "footer", "page-shell", "primary-nav", "nav-open", "header-actions", "hero", "vip-welcome", "back-to-top", "scroll-progress"]) used.delete(c);

  const vars = [];
  const out = [];
  const keptText = [];

  function scopeSelector(sel, scopeClass) {
    if (!scopeClass || unscoped.some((c) => classesIn(sel).includes(c))) return sel;
    const where = `:where(${scopeClass})`;
    const m = /^((?:html|body|:root)[^\s>+~]*)\s*([>+~]?)\s*(.*)$/.exec(sel);
    if (m) return m[3] ? `${m[1]} ${where} ${m[2] ? m[2] + " " : ""}${m[3]}` : sel;
    return `${where} ${sel}`;
  }

  function keepSelector(sel) {
    if (/^(:root|html|body)\b/.test(sel) && !/\bbody\[data-page=/.test(sel)) return false;
    const classes = classesIn(sel);
    if (!classes.length) return false;
    return classes.every((c) => used.has(c));
  }

  function filterNodes(nodes, depth) {
    const result = [];
    for (const node of nodes) {
      if (node.type === "rule") {
        if (depth === 0 && /^:root$/.test(node.selector.trim())) { vars.push(node.body.trim()); continue; }
        const kept = splitSelectors(node.selector).filter(keepSelector).map((sel) => scopeSelector(sel, scope));
        if (kept.length) {
          result.push(`${kept.join(",\n")} {${node.body}}`);
          keptText.push(node.body);
        }
      } else if (node.children) {
        const inner = filterNodes(node.children, depth + 1);
        if (inner.length) result.push(`${node.prelude} {\n${inner.join("\n")}\n}`);
      } else if (node.name === "keyframes" || node.name === "-webkit-keyframes") {
        result.push({ keyframes: node });
      }
    }
    return result;
  }

  for (const file of cssFiles) {
    const nodes = parse(fs.readFileSync(file, "utf8"));
    out.push(`/* ---- from ${path.relative(ROOT, file)} ---- */`, ...filterNodes(nodes, 0));
  }
  const allKept = keptText.join("\n");
  const final = out
    .map((item) => {
      if (typeof item === "string") return item;
      const name = item.keyframes.prelude.split(/\s+/)[1];
      return new RegExp(`\\b${name}\\b`).test(allKept) ? `${item.keyframes.prelude} {${item.keyframes.body}}` : "";
    })
    .filter(Boolean)
    .join("\n");

  const recolor = (text) => text
    .replace(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi, (m, hex) => {
      const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
      const out = neutral(r, g, b);
      return out ? `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}` : m;
    })
    .replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)/g, (m, r, g, b, alpha = "") => {
      const out = neutral(+r, +g, +b);
      return out ? (alpha ? `rgba(${out.join(", ")}${alpha})` : `rgb(${out.join(", ")})`) : m;
    });

  return recolor(`/* Generated by src/lib/legacy-css.mjs — do not edit. Studio-only styles extracted from the original stylesheets. */
${varsSelector} {
${vars.join("\n")}
}
${final}
`) + `\n${overrides}\n`;
}

// Teal/blue-green tones from the original theme -> neutral greys (dark/light) or the accent (mid tones).
function neutral(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  if (d < 0.02) return null;
  const sat = d / (1 - Math.abs(2 * l - 1));
  let hue;
  const [R, G, B] = [r / 255, g / 255, b / 255];
  if (max === R) hue = 60 * (((G - B) / d) % 6);
  else if (max === G) hue = 60 * ((B - R) / d + 2);
  else hue = 60 * ((R - G) / d + 4);
  if (hue < 0) hue += 360;
  if (hue < 140 || hue > 215 || sat < 0.05) return null;
  if (l < 0.3 || l > 0.72) {
    const v = Math.round(l * 255);
    return l > 0.72 ? [Math.min(255, v + 2), v, Math.max(0, v - 4)] : [v, v, v];
  }
  return [168, 138, 92];
}
