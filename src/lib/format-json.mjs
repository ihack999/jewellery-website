// Pretty JSON that keeps short arrays/objects on one line (easier to read and edit by hand).
export function formatJson(value) {
  return fmt(value) + "\n";
}

function fmt(v, indent = "") {
  const next = indent + "  ";
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    const flat = JSON.stringify(v);
    if (v.every((x) => typeof x !== "object" || x === null) && flat.length < 90) return flat.replace(/","/g, '", "');
    if (v.every((x) => x && typeof x === "object" && !Array.isArray(x)) && v.every((x) => JSON.stringify(x).length < 120 && Object.values(x).every((y) => typeof y !== "object"))) {
      return "[\n" + v.map((x) => next + inlineObj(x)).join(",\n") + "\n" + indent + "]";
    }
    return "[\n" + v.map((x) => next + fmt(x, next)).join(",\n") + "\n" + indent + "]";
  }
  if (v && typeof v === "object") {
    const keys = Object.keys(v);
    if (!keys.length) return "{}";
    if (keys.every((k) => typeof v[k] !== "object") && JSON.stringify(v).length < 100) return inlineObj(v);
    return "{\n" + keys.map((k) => `${next}${JSON.stringify(k)}: ${fmt(v[k], next)}`).join(",\n") + "\n" + indent + "}";
  }
  return JSON.stringify(v);
}
function inlineObj(o) { return "{ " + Object.entries(o).map(([k, x]) => `${JSON.stringify(k)}: ${JSON.stringify(x)}`).join(", ") + " }"; }
