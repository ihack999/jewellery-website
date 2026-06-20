const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

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

function normalizeBase64(value) {
  if (!value) {
    return null;
  }

  const dataUrl = value.match(/^data:([^;]+);base64,(.+)$/u);

  if (dataUrl) {
    return {
      imageBase64: dataUrl[2],
      mimeType: dataUrl[1]
    };
  }

  return {
    imageBase64: value,
    mimeType: "image/png"
  };
}

function extractResponseText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data?.output)) {
    return "";
  }

  return data.output
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((content) => content.text || content.output_text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractImage(data) {
  const outputs = Array.isArray(data?.output) ? data.output : [];

  for (const output of outputs) {
    if (output?.type === "image_generation_call" && output.result) {
      return normalizeBase64(output.result);
    }

    if (output?.type === "image_generation_call" && Array.isArray(output.results)) {
      const firstResult = output.results.find(Boolean);

      if (firstResult) {
        return normalizeBase64(firstResult.b64_json || firstResult.result || firstResult);
      }
    }
  }

  return null;
}

function extractImageCallStatus(data) {
  const outputs = Array.isArray(data?.output) ? data.output : [];
  const imageCall = outputs.find((output) => output?.type === "image_generation_call");
  return imageCall?.status || data?.status || "in_progress";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const responseId = event.queryStringParameters?.id;

  if (!responseId || !/^resp_[A-Za-z0-9_-]+$/u.test(responseId)) {
    return json(400, {
      error: "invalid_response_id",
      message: "A valid OpenAI response id is required."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.DREAM_IMAGE_API_KEY;

  if (!apiKey) {
    return json(503, {
      error: "not_configured",
      message: "The image generator needs OPENAI_API_KEY set in Netlify environment variables."
    });
  }

  try {
    const response = await fetch(`${OPENAI_RESPONSES_URL}/${encodeURIComponent(responseId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    const text = await response.text();

    if (!response.ok) {
      return json(502, {
        error: "provider_error",
        message: "The high-quality image status could not be checked.",
        details: text.slice(0, 900)
      });
    }

    const data = text ? JSON.parse(text) : {};
    const image = extractImage(data);

    if (image) {
      return json(200, {
        status: "completed",
        ...image
      });
    }

    if (data.status === "queued" || data.status === "in_progress") {
      return json(200, {
        status: data.status,
        imageCallStatus: extractImageCallStatus(data),
        message: "Your high-quality image is still rendering."
      });
    }

    return json(502, {
      error: "image_not_returned",
      status: data.status || "unknown",
      imageCallStatus: extractImageCallStatus(data),
      message: "OpenAI finished the request but did not return an image.",
      details: extractResponseText(data).slice(0, 900)
    });
  } catch (error) {
    return json(502, {
      error: "status_check_failed",
      message: "The high-quality image status could not be reached.",
      details: error?.message || "Unknown error"
    });
  }
};
