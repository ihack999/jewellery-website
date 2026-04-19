function buildMessage(formName, fields) {
  const title = formName === "custom-request"
    ? "New custom request"
    : formName === "contact-inquiry"
      ? "New contact inquiry"
      : "New site submission";

  const lines = [title];

  for (const field of fields) {
    if (!field || !field.label || !field.value) {
      continue;
    }

    lines.push(`${field.label}: ${field.value}`);
  }

  const message = lines.join("\n");
  return message.length > 1500 ? `${message.slice(0, 1497)}...` : message;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_FROM_PHONE;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const toPhone = process.env.TWILIO_TO_PHONE;

  if (!accountSid || !authToken || !toPhone || (!fromPhone && !messagingServiceSid)) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Twilio environment variables are incomplete" })
    };
  }

  let payload;

  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body" })
    };
  }

  const messageBody = buildMessage(payload.formName, Array.isArray(payload.fields) ? payload.fields : []);
  const params = new URLSearchParams({
    To: toPhone,
    Body: messageBody
  });

  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else {
    params.set("From", fromPhone);
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  const resultText = await twilioResponse.text();

  if (!twilioResponse.ok) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Twilio request failed", details: resultText })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
};