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

function cleanValue(value, limit = 500) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const webhookUrl = process.env.DREAM_LEAD_ZAPIER_WEBHOOK_URL || process.env.DREAM_LEAD_SHEET_WEBHOOK_URL;

  if (!webhookUrl) {
    return json(200, {
      ok: true,
      skipped: true,
      message: "Dream Design lead webhook is not configured."
    });
  }

  let payload;

  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid request body" });
  }

  const lead = {
    submittedAt: new Date().toISOString(),
    source: "dream-design",
    name: cleanValue(payload.name),
    email: cleanValue(payload.email),
    phone: cleanValue(payload.phone),
    page: cleanValue(payload.page || "Dream Design")
  };

  if (!lead.name || !lead.email) {
    return json(400, {
      error: "missing_required_fields",
      message: "Name and email are required before sending a dream design lead."
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    });
    const text = await response.text();

    if (!response.ok) {
      return json(502, {
        error: "lead_webhook_failed",
        message: "Dream Design lead webhook did not accept the lead.",
        details: text.slice(0, 500)
      });
    }

    return json(200, { ok: true });
  } catch (error) {
    return json(502, {
      error: "lead_webhook_unreachable",
      message: "Dream Design lead webhook could not be reached.",
      details: error?.message || "Unknown error"
    });
  }
};
