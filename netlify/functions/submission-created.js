// Netlify calls this automatically after every verified form submission
// (event-triggered function). If Twilio is configured, it texts you a summary
// using send-sms.js. Without Twilio variables it does nothing.

const { handler: sendSms } = require("./send-sms.js");

const LABELS = {
  "full-name": "Name", name: "Name", "email-address": "Email", email: "Email", "phone-number": "Phone", phone: "Phone",
  product: "Product", "selected-options": "Options", order: "Order", "order-total": "Total", "piece-type": "Piece",
  budget: "Budget", topic: "Topic", message: "Message", notes: "Notes", description: "Description", "design-summary": "Design"
};

exports.handler = async (event) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_TO_PHONE) {
    return { statusCode: 200, body: "SMS not configured" };
  }
  let payload = {};
  try { payload = JSON.parse(event.body || "{}").payload || {}; } catch { return { statusCode: 200, body: "ignored" }; }
  const data = payload.data || {};
  const fields = Object.entries(LABELS)
    .filter(([key]) => data[key])
    .map(([key, label]) => ({ label, value: String(data[key]).slice(0, 300) }));
  return sendSms({ httpMethod: "POST", body: JSON.stringify({ formName: payload.form_name, fields }) });
};
