const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

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
    `Avoid: ${NEGATIVE_PROMPT}.`
  ].join("\n");
}

function createImageTool() {
  const tool = {
    type: "image_generation",
    quality: process.env.OPENAI_IMAGE_QUALITY || "high",
    size: process.env.OPENAI_IMAGE_SIZE || "1024x1024"
  };
  const model = process.env.OPENAI_IMAGE_TOOL_MODEL || process.env.DREAM_IMAGE_TOOL_MODEL;

  if (model) {
    tool.model = model;
  }

  return tool;
}

async function startBackgroundImageWithOpenAI(apiKey, templatePrompt, brief) {
  const model = process.env.OPENAI_RESPONSE_IMAGE_MODEL || process.env.OPENAI_PROMPT_MODEL || process.env.DREAM_PROMPT_MODEL || "gpt-5.5";
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      background: true,
      store: true,
      input: [
        {
          role: "developer",
          content: [
            "You are a luxury fine-jewellery image director for Toronto Jewels Curation.",
            "You must generate exactly one photorealistic jewellery image using the image_generation tool.",
            "Do not return a text-only prompt instead of the image.",
            "Preserve all customer specifications exactly when provided and prioritize realistic jewellery construction."
          ].join(" ")
        },
        {
          role: "user",
          content: [
            "Generate the final high-quality jewellery image from this brief.",
            "Use the brief below as the image direction, not as an instruction to return text.",
            "",
            templatePrompt,
            "",
            `Structured customer choices JSON: ${JSON.stringify(brief)}`
          ].join("\n")
        }
      ],
      tools: [createImageTool()],
      tool_choice: { type: "image_generation" }
    })
  });
  const text = await response.text();

  if (!response.ok) {
    return {
      ok: false,
      details: text.slice(0, 900) || "OpenAI background image request failed"
    };
  }

  const data = text ? JSON.parse(text) : {};

  if (!data.id) {
    return {
      ok: false,
      details: "OpenAI accepted the request but did not return a response id."
    };
  }

  return {
    ok: true,
    responseId: data.id,
    status: data.status || "queued"
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

  try {
    const imageJob = await startBackgroundImageWithOpenAI(apiKey, templatePrompt, brief);

    if (!imageJob.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "provider_error",
          message: "The high-quality image generator could not start.",
          details: imageJob.details,
          prompt: templatePrompt,
          templatePrompt,
          promptCreatedBy: "openai-background-responses",
          negativePrompt: NEGATIVE_PROMPT
        })
      };
    }

    return {
      statusCode: 202,
      body: JSON.stringify({
        status: imageJob.status,
        responseId: imageJob.responseId,
        pollUrl: `/.netlify/functions/generate-dream-design-status?id=${encodeURIComponent(imageJob.responseId)}`,
        message: "Your high-quality design is rendering.",
        prompt: templatePrompt,
        templatePrompt,
        promptCreatedBy: "openai-background-responses",
        negativePrompt: NEGATIVE_PROMPT
      })
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: "generation_failed",
        message: "The high-quality image generator could not be reached.",
        details: error?.message || "Unknown error",
        prompt: templatePrompt,
        templatePrompt,
        promptCreatedBy: "openai-background-responses",
        negativePrompt: NEGATIVE_PROMPT
      })
    };
  }
};
