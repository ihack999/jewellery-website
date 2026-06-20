const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const NEGATIVE_PROMPT = [
  "blurry image",
  "low resolution",
  "fake plastic metal",
  "cartoon",
  "illustration",
  "cheap CGI appearance",
  "AI render look",
  "warped stone",
  "crooked gem placement",
  "unrealistic jewellery construction",
  "distorted band",
  "melted metal",
  "floating stones",
  "missing prongs",
  "extra prongs",
  "oversized blob prongs",
  "fake glassy gemstone",
  "candy-like stone",
  "resin-looking stone",
  "plastic stone",
  "cloudy gem",
  "sleepy stone",
  "dull sparkle",
  "weak diamond fire",
  "repeated kaleidoscope facet pattern",
  "mushy pave",
  "noisy diamond band",
  "flat grey metal",
  "chalky highlights",
  "dull lighting",
  "flat lighting",
  "washed-out pastel lighting",
  "muddy colour",
  "low contrast",
  "generic catalogue styling",
  "deformed hand",
  "extra fingers",
  "text",
  "logo",
  "watermark",
  "price tag",
  "initials",
  "letters",
  "numbers",
  "busy background"
].join(", ");

const DEVELOPER_INSTRUCTION = [
  "You are a luxury high-jewellery image director for Toronto Jewels Curation.",
  "Generate exactly one photorealistic jewellery image using the image generation tool.",
  "Do not return text, captions, explanations, mockups, sketches, or multiple options.",
  "The final output must look like a real finished fine-jewellery piece photographed by a professional luxury jewellery photographer.",
  "",
  "Prioritize:",
  "- real jewellery construction",
  "- accurate gemstone optics",
  "- vivid brilliance",
  "- sharp diamond fire",
  "- polished precious metal reflections",
  "- fine prong and setting details",
  "- high-end editorial lighting",
  "- believable luxury craftsmanship",
  "",
  "Avoid generic AI jewellery, plastic-looking stones, dull lighting, flat catalogue styling, cartoonish proportions, and fake CGI rendering."
].join("\n");

function cleanValue(value, fallback = "", limit = 900) {
  return String(value || fallback)
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function needsPremiumMetalInterpretation(value) {
  const text = cleanValue(value).toLowerCase();

  if (!text) {
    return false;
  }

  const vagueLuxuryRequest = /\b(best|expensive|fancy|high end|high-end|luxury|luxurious|most|premium|rich|top)\b/u.test(text);
  const metalReference = /\b(emtal|metal|metl|metel|gold|platinum|white gold|yellow gold|rose gold|mixed metal)\b/u.test(text);

  return /most expensive emtal/u.test(text) || (vagueLuxuryRequest && metalReference);
}

function createBrief(input) {
  const metal = cleanValue(input.metal, "18K white gold");
  const customSpec = cleanValue(input.customSpec || input.notes, "", 1400);
  const premiumMetalInterpretation = needsPremiumMetalInterpretation(metal) || needsPremiumMetalInterpretation(customSpec);

  return {
    pieceType: cleanValue(input.pieceType, "ring"),
    metal,
    stone: cleanValue(input.stone, "white diamond"),
    style: cleanValue(input.style, "timeless and elegant"),
    budget: cleanValue(input.budget, "custom budget direction"),
    customSpec,
    metalInterpretation: premiumMetalInterpretation
      ? "The metal input was vague or typo-heavy. Silently interpret it as premium precious metal, such as platinum or 18K gold, chosen for the most luxurious visual result."
      : "Use the requested metal direction as written unless it is vague or typo-heavy; if it is vague, silently choose a premium precious metal for the most luxurious visual result."
  };
}

function buildPromptTemplate(brief) {
  return [
    "Generate one final high-quality photorealistic luxury jewellery image from this client brief.",
    "",
    "This image is for Toronto Jewels Curation, a custom fine-jewellery brand. The result must look like a real luxury jewellery photograph taken for a high-end editorial campaign or maison-level jewellery catalogue. It must not look like an AI render, concept sketch, cartoon, illustration, cheap CGI object, or fantasy prop.",
    "",
    "CLIENT DESIGN INPUT:",
    `Piece type: ${brief.pieceType}`,
    `Metal: ${brief.metal}`,
    `Metal interpretation: ${brief.metalInterpretation}`,
    `Primary stone or gemstone direction: ${brief.stone}`,
    `Style / vibe: ${brief.style}`,
    `Budget direction: ${brief.budget}`,
    `Customer specification to prioritize: ${brief.customSpec || "No extra custom specification was provided."}`,
    "",
    "INTERPRETATION RULES:",
    "Use the client's custom specification as the most important design direction. Use the piece type, metal, stone, style, and budget fields as supporting structure. If the client gives vague words such as \"expensive,\" \"luxury,\" \"bold,\" or \"minimal,\" translate them into visible jewellery qualities: better craftsmanship, cleaner construction, stronger stones, refined proportions, richer finishing, and more sophisticated lighting. If the metal field contains vague or typo-heavy text such as \"most expensive emtal,\" silently interpret it as premium precious metal, such as platinum or 18K gold, chosen for the most luxurious visual result. Do not display any price, budget, words, logo, watermark, initials, or text in the image.",
    "",
    "OVERALL LUXURY DIRECTION:",
    "Create a piece that feels elegant, personal, made-to-order, elevated, feminine but not childish, and suitable for a serious custom jewellery inquiry. The design should feel like fine jewellery, not costume jewellery. It should have believable proportions, wearable scale, secure construction, and refined craftsmanship.",
    "",
    "PIECE-SPECIFIC REQUIREMENTS:",
    "If the piece type is ring, show a realistic luxury ring with a secure centre setting, fine polished claw prongs or bezel, a believable basket or gallery, clean side profile logic, and a refined shank. The centre stone must be seated naturally in the setting, not floating or pasted on top.",
    "If the piece type is necklace, show a realistic luxury necklace or pendant with correct chain articulation, clasp logic if visible, proper bale or connector construction, wearable pendant scale, and believable stone setting. Avoid flat necklace shapes that look stamped or decorative only.",
    "If the piece type is bracelet, show believable bracelet curvature, correct link or tennis-setting structure, precise stone alignment, flexible construction, and a realistic clasp or hidden closure logic.",
    "If the piece type is earrings, show either a matched pair or one strong hero earring with realistic posts, backs, hinges, huggie structure, drop construction, or ear-wearable engineering.",
    "If the piece type is anklet, show a delicate but luxury fine-jewellery anklet with believable chain links, refined clasp logic, secure gemstone settings, and elegant wearable proportions.",
    "",
    "GEMSTONE REALISM REQUIREMENTS:",
    "Gemstones must look vivid, crisp, transparent, and alive. They must have realistic gemstone optics, clean table reflections, sharp crown facets, believable pavilion light return, visible internal fire, strong scintillation, and rich natural colour. Diamonds and gemstones must not look like glass, candy, plastic, resin, acrylic, toy crystals, or repeated kaleidoscope patterns.",
    "For diamonds, show bright white fire, sharp facet junctions, natural brilliance, crisp flashes, and believable depth.",
    "For coloured stones, show saturated but natural colour, transparent depth, realistic refraction, and clean sparkle.",
    "If the stone field says no stone, create a metal-focused fine-jewellery design with sculptural luxury metalwork, polished curves, engraving, texture, or architectural detail instead of gemstones.",
    "",
    "METAL REALISM REQUIREMENTS:",
    "The metal must look like precious fine jewellery metal, not flat grey plastic or dull CGI. Use mirror-polished reflections, bright edge highlights, dark reflection lines, soft bevels, smooth curves, dimensional shine, and realistic metal thickness.",
    "For 18K white gold, use a bright luxury white-metal finish with soft warmth and polished reflections.",
    "For platinum, use a refined cool white-metal look with substantial weight, crisp highlights, and deep mirror reflection lines.",
    "For mixed metal, combine metals intentionally, such as platinum with 18K yellow gold or rose gold accents, with clear visual separation and refined craftsmanship.",
    "",
    "SETTING AND CRAFTSMANSHIP REQUIREMENTS:",
    "All stones must appear individually set and physically held. Prongs must be fine, secure, polished, and connected to the setting. Avoid oversized blob-like prongs, floating prongs, melted metal, missing prongs, extra prongs, or prongs sitting unnaturally on top of stones.",
    "Pave stones must be individually visible and precisely set, with clean bead or micro-prong details, consistent spacing, and realistic sparkle. Avoid mushy pave, noisy glitter texture, or diamond bands that blur into one rough strip.",
    "",
    "DESIGN QUALITY REQUIREMENTS:",
    "The jewellery should feel manufacturable by a fine-jewellery atelier. It should have balanced symmetry, careful stone placement, clean geometry, realistic setting depth, and professional finishing. Make the design visually impressive but still believable as a real custom fine-jewellery piece.",
    "",
    "PHOTOGRAPHY AND LIGHTING REQUIREMENTS:",
    "Use dramatic high-jewellery editorial lighting rather than flat e-commerce catalogue lighting. The piece should feel radiant, sharp, dimensional, and visually expensive.",
    "Lighting must include crisp specular highlights, controlled high contrast, bright diamond fire, sharp diamond fire, vivid gemstone colour, dark mirror reflection lines in the metal, clean separation from the background, precise sparkle highlights, strong clarity in small stones and setting details, and clear bright lighting that makes the image easy to see all the details.",
    "Avoid overly soft pastel lighting, dull beige lighting, washed-out shadows, muddy reflections, weak sparkle, and low-contrast rendering.",
    "",
    "CAMERA AND COMPOSITION:",
    "Use professional macro luxury product photography. The jewellery should be large enough to inspect, sharply focused on the main stone or main design feature, and composed elegantly with premium negative space. Use a natural product-photography angle that shows the design, construction, and stone setting clearly.",
    "The image should look sharp, luminous, dimensional, and editorial. It should feel suitable for a luxury website hero image, product preview, or custom-design inquiry.",
    "",
    "BACKGROUND:",
    "Use a refined luxury studio background that helps the jewellery stand out. Prefer cool ivory, soft light grey, pale stone, or a subtle editorial gradient with enough contrast to separate the jewellery from the surface. Avoid dull beige, muddy champagne, busy props, distracting textures, harsh patterns, or backgrounds that make the jewellery blend in.",
    "",
    "FINAL IMAGE QUALITY:",
    "The final image must feel like a premium fine-jewellery photograph with high clarity, realistic materials, sharp details, vivid brilliance, and strong luxury presence. It should not feel flat, dull, artificial, generic, or cheaply rendered.",
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
          content: DEVELOPER_INSTRUCTION
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
