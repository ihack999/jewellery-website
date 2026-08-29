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

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { message: "Method not allowed." });
  const id = event.queryStringParameters?.id || "";
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/u.test(id)) return json(400, { message: "Invalid checkout confirmation." });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return json(503, { message: "Stripe checkout is not configured yet." });

  try {
    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}` }
    });
    const session = await stripeResponse.json().catch(() => ({}));
    if (!stripeResponse.ok) return json(502, { message: "Stripe could not verify this checkout." });

    const currency = String(session.currency || "cad").toUpperCase();
    const amountTotal = Number(session.amount_total || 0);
    const formatter = new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-CA", {
      style: "currency",
      currency
    });

    return json(200, {
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal,
      amountLabel: `${formatter.format(amountTotal / 100)} ${currency}`,
      currency,
      email: session.customer_details?.email || session.customer_email || ""
    });
  } catch (error) {
    return json(502, { message: "Stripe could not be reached. Please try again." });
  }
};
