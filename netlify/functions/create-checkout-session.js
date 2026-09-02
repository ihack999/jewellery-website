const { CHECKOUT_CATALOG } = require("./checkout-catalog");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function siteOrigin(event) {
  const configured = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (configured) return configured.replace(/\/$/u, "");

  const host = event.headers?.["x-forwarded-host"] || event.headers?.host;
  if (!host || !/^[A-Za-z0-9.-]+(?::\d{1,5})?$/u.test(host)) return "https://torontojewelscuration.com";
  const protocol = host.startsWith("localhost:") || host.startsWith("127.0.0.1:") ? "http" : "https";
  return `${protocol}://${host}`;
}

function normalizeItems(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) return null;
  const merged = new Map();

  for (const rawItem of value) {
    const product = CHECKOUT_CATALOG[rawItem?.slug];
    const quantity = Number(rawItem?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1) return null;
    const nextQuantity = (merged.get(rawItem.slug) || 0) + quantity;
    if (nextQuantity > product.maxQuantity) return null;
    merged.set(rawItem.slug, nextQuantity);
  }

  const items = [...merged].map(([slug, quantity]) => ({ slug, quantity, product: CHECKOUT_CATALOG[slug] }));
  if (new Set(items.map((item) => item.product.currency)).size !== 1) return null;
  return items;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { message: "Method not allowed." });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return json(503, { message: "Stripe checkout is not configured yet." });
  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    return json(503, { message: "The Stripe secret key is not valid." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return json(400, { message: "Invalid checkout request." });
  }

  const items = normalizeItems(payload.items);
  if (!items) return json(400, { message: "One or more checkout items are invalid or use different currencies." });

  const origin = siteOrigin(event);
  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${origin}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop.html?checkout=cancelled`,
    "billing_address_collection": "required",
    "phone_number_collection[enabled]": "true",
    "shipping_address_collection[allowed_countries][0]": "CA",
    "shipping_address_collection[allowed_countries][1]": "US",
    "allow_promotion_codes": "true",
    "customer_creation": "always",
    "submit_type": "pay",
    "metadata[source]": "website_checkout",
    "payment_intent_data[metadata][source]": "website_checkout"
  });

  if (items.some(({ product }) => product.requiresInitials)) {
    params.set("custom_fields[0][key]", "monogram");
    params.set("custom_fields[0][label][type]", "custom");
    params.set("custom_fields[0][label][custom]", "Monogram initials (1–4 characters)");
    params.set("custom_fields[0][type]", "text");
    params.set("custom_fields[0][optional]", "false");
    params.set("custom_fields[0][text][minimum_length]", "1");
    params.set("custom_fields[0][text][maximum_length]", "4");
  }

  items.forEach(({ slug, quantity, product }, index) => {
    const prefix = `line_items[${index}]`;
    params.set(`${prefix}[quantity]`, String(quantity));
    params.set(`${prefix}[price_data][currency]`, product.currency);
    params.set(`${prefix}[price_data][unit_amount]`, String(product.unitAmount));
    params.set(`${prefix}[price_data][product_data][name]`, product.name);
    params.set(`${prefix}[price_data][product_data][description]`, product.description);
    params.set(`${prefix}[price_data][product_data][images][0]`, `${origin}${product.image}`);
    params.set(`${prefix}[price_data][product_data][metadata][slug]`, slug);
  });

  try {
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });
    const result = await stripeResponse.json().catch(() => ({}));
    if (!stripeResponse.ok || !result.url) {
      console.error("Stripe Checkout Session creation failed", result.error?.type, result.error?.code);
      return json(502, { message: result.error?.message || "Stripe could not start checkout." });
    }
    return json(200, { url: result.url });
  } catch (error) {
    console.error("Stripe Checkout request failed", error.message);
    return json(502, { message: "Stripe could not be reached. Please try again." });
  }
};
