// Creates a Stripe Checkout Session from the bag.
//
// Prices are NEVER taken from the browser: every line is re-priced from
// netlify/functions/lib/catalog.json, which `npm run build` generates from
// /store/products. Only runs when store/site.json → checkout.mode is "stripe"
// and STRIPE_SECRET_KEY is set in Netlify's environment variables.

const catalog = require("./lib/catalog.json");

function json(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) };
}

function priceLine(item) {
  const product = catalog.products[item?.slug];
  if (!product) return { error: `Unknown product: ${item?.slug}` };
  if (!product.purchasable || product.price === null) return { error: `${product.name} is available by enquiry only.` };
  const quantity = Math.max(1, Math.min(product.maxQuantity || 1, Number.parseInt(item.quantity, 10) || 1));
  const chosen = item.options && typeof item.options === "object" ? item.options : {};
  let unit = product.price;
  const described = [];
  for (const option of product.options) {
    const value = typeof chosen[option.name] === "string" ? chosen[option.name].trim() : "";
    if (!value) {
      if (option.required) return { error: `Please choose ${option.name} for ${product.name}.` };
      continue;
    }
    if (option.type === "text") {
      if (option.maxLength && value.length > option.maxLength) return { error: `${option.name} is too long.` };
      described.push(`${option.name}: ${value}`);
      continue;
    }
    const match = option.values.find((v) => v.value === value);
    if (!match) return { error: `${value} is not a valid ${option.name} for ${product.name}.` };
    if (match.inquire) return { error: `${product.name} (${value}) is quoted personally — please send an enquiry.` };
    unit += match.add || 0;
    described.push(`${option.name}: ${value}`);
  }
  return { product, quantity, unit, described };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { message: "Method not allowed." });

  if (catalog.checkoutMode !== "stripe") {
    return json(409, {
      code: "ORDER_CONFIRMATION_REQUIRED",
      message: "Orders are confirmed in writing before payment. Please send your bag as an order request — it has been kept for you."
    });
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return json(503, { message: "Card checkout is not configured yet. Please send an order request instead." });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { message: "Invalid request." }); }
  const items = Array.isArray(body.items) ? body.items.slice(0, 25) : [];
  if (!items.length) return json(400, { message: "Your bag is empty." });

  const lines = [];
  for (const item of items) {
    const line = priceLine(item);
    if (line.error) return json(400, { message: line.error });
    lines.push(line);
  }
  const currencies = new Set(lines.map((l) => l.product.currency));
  if (currencies.size > 1) return json(400, { message: "Your bag mixes currencies — please send an order request so we can confirm it with you." });
  const currency = [...currencies][0].toLowerCase();

  const origin = process.env.URL || `https://${event.headers.host}`;
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${origin}/order/success/?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${origin}/shop/`);
  form.set("billing_address_collection", "required");
  (catalog.shippingCountries || ["CA", "US"]).forEach((c, i) => form.set(`shipping_address_collection[allowed_countries][${i}]`, c));
  lines.forEach((l, i) => {
    form.set(`line_items[${i}][quantity]`, String(l.quantity));
    form.set(`line_items[${i}][price_data][currency]`, currency);
    form.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(l.unit * 100)));
    form.set(`line_items[${i}][price_data][product_data][name]`, l.product.name);
    if (l.described.length) form.set(`line_items[${i}][price_data][product_data][description]`, l.described.join(" · ").slice(0, 500));
    if (l.product.image) form.set(`line_items[${i}][price_data][product_data][images][0]`, l.product.image);
    form.set(`metadata[item_${i}]`, `${l.quantity} x ${l.product.name}${l.described.length ? ` (${l.described.join(", ")})` : ""}`.slice(0, 480));
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form
  });
  const session = await response.json().catch(() => ({}));
  if (!response.ok || !session.url) return json(502, { message: "Stripe could not start checkout. Please try again or send an order request." });
  return json(200, { url: session.url, id: session.id });
};
