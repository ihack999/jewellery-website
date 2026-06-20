const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";

const NEGATIVE_PROMPT = [
  "blurry image",
  "low resolution",
  "fake plastic metal",
  "cartoon",
  "illustration",
  "cgi-looking render",
  "warped stone",
  "crooked gem",
  "extra prongs",
  "missing prongs",
  "distorted band",
  "unrealistic jewellery construction",
  "messy setting",
  "deformed hand",
  "extra fingers",
  "text",
  "logo",
  "watermark",
  "price tag",
  "busy background",
  "overexposed highlights",
  "muddy reflections"
].join(", ");

function cleanValue(value, fallback = "", limit = 900) {
  return String(value || fallback)
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function createBrief(input) {
  return {
    pieceType: cleanValue(input.pieceType, "ring"),
    metal: cleanValue(input.metal, "18K white gold"),
    stone: cleanValue(input.stone, "white diamond"),
    style: cleanValue(input.style, "timeless and elegant"),
    budget: cleanValue(input.budget, "custom budget direction"),
    customSpec: cleanValue(input.customSpec || input.notes, "", 1400)
  };
}

function buildPromptTemplate(brief) {
  const customDirection = brief.customSpec
    ? `CUSTOMER SPECIFICATION TO PRIORITIZE: ${brief.customSpec}. Treat this as the most important design direction while still using the structured choices for material, stone, and styling context.`
    : "CUSTOMER SPECIFICATION TO PRIORITIZE: No extra custom specification was provided, so create a refined, realistic design from the structured choices only.";

  return [
    "Create one photorealistic, high-end luxury jewellery image for Toronto Jewels Curation.",
    "The final image must look like a real finished fine-jewellery piece photographed for a premium editorial catalogue, not a sketch, cartoon, concept-art illustration, plastic CGI object, or fantasy prop.",
    "",
    "CLIENT DESIGN INPUT:",
    `Piece type: ${brief.pieceType}.`,
    `Metal: ${brief.metal}.`,
    `Primary stone or gemstone direction: ${brief.stone}.`,
    `Style and emotional tone: ${brief.style}.`,
    `Budget direction: ${brief.budget}. Use this only to guide complexity and scale; do not show price text.`,
    customDirection,
    "",
    "DESIGN REQUIREMENTS:",
    "Use real-world jewellery proportions with a wearable scale, balanced stone size, believable metal thickness, secure construction, and accurate setting details.",
    "If the piece is a ring, show a refined band with realistic shank thickness, a centered stone, clean basket or gallery structure, secure prongs or bezel, and any accent stones placed symmetrically.",
    "If the piece is a necklace, show a realistic chain or pendant with correct bale, clasp logic, stone setting, and wearable pendant scale.",
    "If the piece is a bracelet, show believable links or tennis setting structure, precise stone alignment, clasp logic, and natural wrist-friendly curvature.",
    "If the piece is earrings, show a matched pair or single hero earring with realistic post, backing, hinge, huggie, or drop construction as appropriate.",
    "Metal should have luxury-grade polished reflections, soft bevels, realistic highlights, and subtle micro-surface detail without looking scratched or cheap.",
    "Gemstones should have crisp facets, believable depth, natural sparkle, clean refraction, and colour consistent with the requested stone.",
    "The piece should feel elegant, personal, made-to-order, feminine but not childish, and suitable for a client inquiry.",
    "",
    "PHOTOGRAPHY AND RENDERING DIRECTIONS:",
    "Use macro product photography with a 90mm luxury-jewellery lens feel, shallow depth of field, crisp focus on the centre stone and setting, and controlled falloff.",
    "Lighting should feel like a high-end jewellery studio: large softbox reflections, small precision sparkle highlights, gentle rim light, and clean shadow under the piece.",
    "Background should be clean editorial luxury: warm white, pale stone, soft grey, or subtle champagne surface with no clutter, no props that distract, and no text.",
    "Composition should be centered and premium, with enough negative space for an atelier website preview while keeping the jewellery large and inspectable.",
    "The image should be ultra realistic, 4K detail, natural contrast, high dynamic range, tasteful colour grading, and no visible AI artifacts.",
    "",
    "STRICT AVOIDANCES:",
    `Avoid: ${NEGATIVE_PROMPT}.`,
    "",
    "Return only the final image prompt text. Do not add explanation, markdown, title, quotes, captions, or notes."
  ].join("\n");
}

function extractResponseText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data?.output)) {
    const text = data.output
      .flatMap((item) => Array.isArray(item.content) ? item.content : [])
      .map((content) => content.text || content.output_text || "")
      .filter(Boolean)
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  return "";
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

function normalizeOpenAIImage(data) {
  const image = Array.isArray(data?.data) ? data.data[0] : null;
  const base64 = image?.b64_json || data?.imageBase64 || data?.base64;
  const normalized = normalizeBase64(base64);

  if (normalized) {
    return normalized;
  }

  if (image?.url) {
    return { imageUrl: image.url };
  }

  return null;
}

async function createPromptWithOpenAI(apiKey, templatePrompt, brief) {
  const model = process.env.OPENAI_PROMPT_MODEL || process.env.DREAM_PROMPT_MODEL || "gpt-4.1-mini";
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "developer",
          content: "You are a luxury fine-jewellery prompt director. Expand simple customer jewellery preferences into one very detailed, photorealistic image-generation prompt. Preserve all customer specifications exactly when provided. Return only the image prompt."
        },
        {
          role: "user",
          content: [
            "Use this template as the source of truth and make the final prompt even more precise, luxurious, physically realistic, and suitable for high-end jewellery image generation.",
            "",
            templatePrompt,
            "",
            `Structured customer choices JSON: ${JSON.stringify(brief)}`
          ].join("\n")
        }
      ],
      max_output_tokens: 1200
    })
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text.slice(0, 500) || "Prompt creator failed");
  }

  const data = text ? JSON.parse(text) : {};
  const generatedPrompt = extractResponseText(data);

  if (!generatedPrompt) {
    throw new Error("Prompt creator returned no prompt");
  }

  return generatedPrompt;
}

async function generateImageWithOpenAI(apiKey, prompt) {
  const model = process.env.OPENAI_IMAGE_MODEL || process.env.DREAM_IMAGE_API_MODEL || "gpt-image-1";
  const size = process.env.OPENAI_IMAGE_SIZE || "1024x1024";
  const quality = process.env.OPENAI_IMAGE_QUALITY || "high";
  const response = await fetch(OPENAI_IMAGES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      output_format: "png"
    })
  });

  const text = await response.text();

  if (!response.ok) {
    return {
      ok: false,
      details: text.slice(0, 700)
    };
  }

  const data = text ? JSON.parse(text) : {};
  const image = normalizeOpenAIImage(data);

  return {
    ok: Boolean(image),
    image,
    details: image ? "" : "OpenAI responded without an image."
  };
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

  const brief = createBrief(payload);
  const templatePrompt = buildPromptTemplate(brief);
  const apiKey = process.env.OPENAI_API_KEY || process.env.DREAM_IMAGE_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 503,
      body: JSON.stringify({
        error: "not_configured",
        message: "The image generator needs OPENAI_API_KEY set in Netlify environment variables.",
        prompt: templatePrompt,
        templatePrompt,
        negativePrompt: NEGATIVE_PROMPT
      })
    };
  }

  let finalPrompt = templatePrompt;
  let promptCreatedBy = "template";

  try {
    finalPrompt = await createPromptWithOpenAI(apiKey, templatePrompt, brief);
    promptCreatedBy = "openai-responses";
  } catch (error) {
    finalPrompt = templatePrompt;
  }

  try {
    const imageResult = await generateImageWithOpenAI(apiKey, finalPrompt);

    if (!imageResult.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "provider_error",
          message: "The image generator could not complete this request.",
          details: imageResult.details,
          prompt: finalPrompt,
          templatePrompt,
          promptCreatedBy,
          negativePrompt: NEGATIVE_PROMPT
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...imageResult.image,
        prompt: finalPrompt,
        templatePrompt,
        promptCreatedBy,
        negativePrompt: NEGATIVE_PROMPT
      })
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: "generation_failed",
        message: "The image generator could not be reached.",
        prompt: finalPrompt,
        templatePrompt,
        promptCreatedBy,
        negativePrompt: NEGATIVE_PROMPT
      })
    };
  }
};
