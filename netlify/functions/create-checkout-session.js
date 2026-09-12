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
  if (event.httpMethod !== "POST") return json(405, { message: "Method not allowed." });

  // All orders require written confirmation. Do not trust a client-supplied
  // approval flag; a server-verified confirmed-order payment flow is pending.
  return json(409, {
    code: "ORDER_CONFIRMATION_REQUIRED",
    message: "Written order confirmation is required before payment. Please contact us with your selected pieces; your bag has been preserved.",
    inquiryUrl: "/customs.html#request-form"
  });

};
