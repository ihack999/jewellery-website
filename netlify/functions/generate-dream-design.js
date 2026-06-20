const NEGATIVE_PROMPT = [
  "blurry",
  "fake plastic",
  "warped stones",
  "extra prongs",
  "distorted hands",
  "text",
  "watermark",
  "low quality",
  "illustration",
  "cartoon",
  "cgi-looking"
].join(", ");

function cleanValue(value, fallback = "") {
  return String(value || fallback)
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function buildPrompt(input) {
  const pieceType = cleanValue(input.pieceType, "ring");
  const metal = cleanValue(input.metal, "18K white gold");
  const stone = cleanValue(input.stone, "white diamond");
  const style = cleanValue(input.style, "timeless and elegant");
  const budget = cleanValue(input.budget, "custom budget direction");
  const notes = cleanValue(input.notes);

  return [
    "Photorealistic luxury jewellery product render of a custom piece.",
    `Subject: ${style} ${pieceType} crafted in ${metal} with ${stone}.`,
    `Budget direction: ${budget}.`,
    notes ? `Client notes: ${notes}.` : "",
    "Real-world jewellery proportions, accurate gemstone setting, secure prongs, polished metal, macro detail, high-end studio lighting, crisp reflections, clean editorial background, premium catalogue photography.",
    "The jewellery must look physically possible, finely made, elegant, and realistic, with no cartoon or CGI appearance."
  ].filter(Boolean).join(" ");
}

function firstValue(...values) {
  return values.find((value) => typeof value === "string" && value.trim());
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

async function imageUrlToBase64(url) {
  if (!/^https?:\/\//iu.test(url)) {
    return null;
  }

  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") || "image/png";

  return {
    imageBase64: Buffer.from(arrayBuffer).toString("base64"),
    mimeType
  };
}

async function normalizeProviderImage(data) {
  const candidates = [
    data,
    data?.image,
    Array.isArray(data?.data) ? data.data[0] : data?.data,
    Array.isArray(data?.images) ? data.images[0] : data?.images,
    Array.isArray(data?.output) ? data.output[0] : data?.output
  ].filter(Boolean);

  for (const candidate of candidates) {
    const directBase64 = typeof candidate === "string" && !/^https?:\/\//iu.test(candidate)
      ? candidate
      : firstValue(candidate.imageBase64, candidate.base64, candidate.b64_json);

    if (directBase64) {
      return normalizeBase64(directBase64);
    }

    const url = typeof candidate === "string"
      ? candidate
      : firstValue(candidate.url, candidate.imageUrl, candidate.src);

    if (url) {
      const converted = await imageUrlToBase64(url);

      if (converted) {
        return converted;
      }

      return { imageUrl: url };
    }
  }

  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
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

  const prompt = buildPrompt(payload);
  const apiUrl = process.env.DREAM_IMAGE_API_URL;
  const apiKey = process.env.DREAM_IMAGE_API_KEY;
  const model = process.env.DREAM_IMAGE_API_MODEL;

  if (!apiUrl || !apiKey) {
    return {
      statusCode: 503,
      body: JSON.stringify({
        error: "not_configured",
        message: "The image generator is not connected yet.",
        prompt,
        negativePrompt: NEGATIVE_PROMPT
      })
    };
  }

  try {
    const providerResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt,
        input: prompt,
        negative_prompt: NEGATIVE_PROMPT,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });

    const providerText = await providerResponse.text();

    if (!providerResponse.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "provider_error",
          message: "The image generator could not complete this request.",
          details: providerText.slice(0, 600),
          prompt,
          negativePrompt: NEGATIVE_PROMPT
        })
      };
    }

    const providerData = providerText ? JSON.parse(providerText) : {};
    const image = await normalizeProviderImage(providerData);

    if (!image) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "missing_image",
          message: "The image generator responded without an image.",
          prompt,
          negativePrompt: NEGATIVE_PROMPT
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...image,
        prompt,
        negativePrompt: NEGATIVE_PROMPT
      })
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: "generation_failed",
        message: "The image generator could not be reached.",
        prompt,
        negativePrompt: NEGATIVE_PROMPT
      })
    };
  }
};
