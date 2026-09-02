const DESIGN_STUDIO_PUBLIC = true;
const CUSTOMS_PREFORM_PUBLIC = false;

const products = [
  {
    slug: "estate-cushion-halo-diamond-ring",
    urlSlug: "estate-cushion-halo-diamond-ring",
    name: "Cushion Halo Estate Ring",
    category: "rings",
    materials: "Cushion-cut diamond with a layered diamond halo",
    price: 60000,
    currency: "cad",
    maxQuantity: 1,
    priceLabel: "$60,000 CAD",
    shortDescription: "A distinctive estate ring with a warm-toned cushion-cut diamond centre and layered diamond halo, offered through private appointment in Toronto.",
    description:
      "A distinctive estate ring with a warm-toned cushion-cut diamond centre and layered diamond halo. The piece is offered through private appointment, where condition, measurements, documentation, and current availability can be discussed before purchase.",
    specs: [
      ["Category", "Estate diamond ring"],
      ["Centre", "Cushion-cut diamond"],
      ["Setting", "Layered diamond halo"],
      ["Price", "$60,000 CAD"],
      ["Viewing", "Private appointment in Toronto"]
    ],
    care: "Care recommendations will be confirmed after the setting and current condition have been reviewed.",
    shipping: "Viewing, final availability, payment, and delivery details are confirmed directly before purchase.",
    heroImage: "/assets/images/estate-luxuries/estate-cushion-halo-ring-source.png",
    gallery: [
      "/assets/images/estate-luxuries/estate-cushion-halo-ring-source.png"
    ],
    estate: true
  },
  {
    slug: "15-carat-graduated-diamond-tennis-necklace",
    urlSlug: "15-carat-graduated-diamond-tennis-necklace",
    name: "15 Carat Graduated Diamond Tennis Necklace",
    category: "necklaces",
    materials: "15 carats total of natural diamonds in a graduated setting",
    price: 35000,
    currency: "cad",
    maxQuantity: 1,
    priceLabel: "$35,000 CAD",
    shortDescription: "An estate graduated tennis necklace featuring 15 carats total of natural diamonds, offered through private appointment in Toronto.",
    description:
      "An estate graduated tennis necklace featuring 15 carats total of natural diamonds. Larger diamonds create a defined centre line and taper gradually toward the sides for a balanced, classic silhouette.",
    specs: [
      ["Category", "Estate diamond necklace"],
      ["Diamonds", "15 carats total, natural"],
      ["Design", "Graduated tennis necklace"],
      ["Price", "$35,000 CAD"],
      ["Viewing", "Private appointment in Toronto"]
    ],
    care: "Store the necklace flat and separate from other pieces. Setting and cleaning guidance will be confirmed during the appointment.",
    shipping: "Viewing, final availability, payment, and delivery details are confirmed directly before purchase.",
    heroImage: "/assets/images/optimized/graduated-tennis-necklace-editorial-1600.jpg",
    gallery: [
      "/assets/images/optimized/graduated-tennis-necklace-editorial-1600.jpg",
      "/assets/images/optimized/graduated-tennis-necklace-detail-1600.jpg",
      "/assets/images/optimized/graduated-tennis-necklace-worn-1600.jpg"
    ],
    estate: true
  },
  {
    slug: "rise-ring",
    urlSlug: "the-rise-ring",
    name: "The Rise Ring — 1 ct Lab-Grown Diamond",
    category: "rings",
    materials: "14K gold with a certified 1.00 ct oval lab-grown diamond",
    price: 2200,
    currency: "cad",
    priceLabel: "$2,200 CAD",
    shortDescription: "A bold pinky ring with a certified 1.00 ct oval lab-grown diamond set into a sculptural 14K gold profile — a reminder to rise, shine, and take up space.",
    description:
      "A bold reminder to rise, shine, and take up space. The Rise Ring pairs a certified 1.00 ct oval lab-grown diamond with a smooth, sculptural 14K gold setting designed for pinky-ring presence.",
    specs: [
      ["Stone", "Certified 1.00 ct oval lab-grown diamond"],
      ["Design", "Sculptural bezel-set pinky ring"],
      ["Metal", "14K gold"],
      ["Other Stones", "Natural diamond and coloured gemstone options by request"],
      ["Price", "$2,200 CAD for the featured lab-grown diamond design"]
    ],
    care: "Store separately and clean gently with a soft jewellery cloth to protect the polished gold and stone setting.",
    shipping: "Made to order; ring size, gold colour, production timing, and insured delivery are confirmed after checkout.",
    heroImage: "/assets/images/products/rise-ring/rise-ring-worn.jpeg",
    gallery: [
      "/assets/images/products/rise-ring/rise-ring-worn.jpeg",
      "/assets/images/products/rise-ring/rise-ring-polished.jpeg",
      "/assets/images/products/rise-ring/rise-ring-satin.jpeg",
      "/assets/images/products/rise-ring/rise-ring-styled.jpeg"
    ],
    featured: true
  },
  {
    slug: "signature-monogram-ring",
    urlSlug: "signature-monogram-ring",
    name: "The Signature Monogram Ring",
    category: "rings",
    materials: "Solid 9K yellow gold with custom monogram engraving",
    price: 900,
    currency: "cad",
    priceLabel: "$900 CAD",
    shortDescription: "A polished solid-gold pinky ring personalized with your own monogram — a timeless signature made wearable.",
    description:
      "A polished solid-gold pinky ring personalized with your own monogram — a timeless signature made wearable. Each ring is made to order in solid 9K yellow gold.",
    specs: [
      ["Metal", "Solid 9K yellow gold"],
      ["Personalization", "Custom monogram engraving"],
      ["Made to Order", "Provide the desired initials during secure checkout"],
      ["Price", "$900 CAD"]
    ],
    care: "Store separately and polish gently with a soft jewellery cloth to preserve the gold finish and engraving.",
    shipping: "Made to order; initials, ring size, production timing, and insured delivery are confirmed with the order.",
    heroImage: "/assets/images/products/signature-monogram-ring/signature-monogram-ring-product-angled.jpeg",
    gallery: [
      "/assets/images/products/signature-monogram-ring/signature-monogram-ring-product-angled.jpeg",
      "/assets/images/products/signature-monogram-ring/signature-monogram-ring-product-front.jpeg",
      "/assets/images/products/signature-monogram-ring/signature-monogram-ring-worn-neutral.jpeg",
      "/assets/images/products/signature-monogram-ring/signature-monogram-ring-stacked-closeup.jpeg",
      "/assets/images/products/signature-monogram-ring/signature-monogram-ring-stacked-hand.jpeg"
    ]
  },
  {
    slug: "half-eternity-pinky-band",
    urlSlug: "half-eternity-band-for-your-pinky",
    name: "Half Eternity Band for Your Pinky",
    category: "rings",
    materials: "Lab-grown diamonds in a polished half-eternity setting",
    price: 900,
    currency: "cad",
    priceLabel: "$900 CAD",
    shortDescription: "A refined half-eternity band set with lab-grown diamonds and proportioned for effortless pinky-ring styling.",
    description:
      "A fine line of lab-grown diamonds brings light to the pinky in an easy half-eternity profile. Wear it alone for a clean sparkle or stack it alongside your signature rings.",
    specs: [
      ["Diamonds", "Lab-grown diamonds"],
      ["Design", "Half-eternity pinky band"],
      ["Style", "Wear alone or stack with other rings"],
      ["Price", "$900 CAD"]
    ],
    care: "Store separately and clean gently with a soft jewellery cloth to protect the diamond setting and polished finish.",
    shipping: "Made to order; ring size, production timing, and insured delivery are confirmed after checkout.",
    heroImage: "/assets/images/products/half-eternity-pinky-band/half-eternity-pinky-band-product.jpeg",
    gallery: [
      "/assets/images/products/half-eternity-pinky-band/half-eternity-pinky-band-product.jpeg",
      "/assets/images/products/half-eternity-pinky-band/half-eternity-pinky-band-worn.jpeg"
    ]
  },
  {
    slug: "pear-halo-ring",
    urlSlug: "rare-blue-diamond-ring",
    name: "Rare Blue Diamond Ring",
    category: "rings",
    materials: "18K white gold with 1.00 ct pear-shaped blue diamond",
    priceLabel: "Please inquire for pricing",
    shortDescription: "A rare and elegant blue diamond ring featuring a 1.00 ct pear-shaped blue diamond set in a double halo design with 18K white gold. Available in natural or lab-grown blue diamond options. Please inquire for pricing.",
    description:
      "A rare and elegant blue diamond ring featuring a 1.00 ct pear-shaped blue diamond set in a double halo design with 18K white gold. Available in natural or lab-grown blue diamond options. Please inquire for pricing.",
    specs: [
      ["Stone", "1.00 ct pear-shaped blue diamond"],
      ["Design", "Double halo ring"],
      ["Metal", "18K white gold"],
      ["Available Options", "Natural blue diamond or lab-grown blue diamond"],
      ["Pricing", "Please inquire for pricing"]
    ],
    care: "Professional care guidance is provided with the final stone and setting selection.",
    shipping: "Made to order; timeline and delivery details are confirmed during inquiry.",
    heroImage: "/assets/images/products/rare-blue-diamond-ring-1.jpeg",
    gallery: [
      "/assets/images/products/rare-blue-diamond-ring-1.jpeg",
      "/assets/images/products/rare-blue-diamond-ring-2.jpeg",
      "/assets/images/products/rare-blue-diamond-ring-3.jpeg"
    ],
    featured: true
  },
  {
    slug: "diamond-tennis-necklace",
    urlSlug: "diamond-tennis-necklace",
    name: "The She’s Unstoppable Tennis Necklace",
    category: "necklaces",
    materials: "10.00 ct total carat weight diamonds in 14K white or yellow gold",
    price: 11000,
    currency: "cad",
    priceLabel: "Starting at $11,000",
    shortDescription: "A timeless and empowering tennis necklace featuring 10.00 ct total carat weight diamonds, designed to symbolize confidence, strength, and elegance. Available in 14K white gold or yellow gold, with natural or lab-grown diamond options. Lab diamond option starts at $11,000.",
    description:
      "A timeless and empowering tennis necklace featuring 10.00 ct total carat weight diamonds, designed to symbolize confidence, strength, and elegance. Available in 14K white gold or yellow gold, with natural or lab-grown diamond options. Lab diamond option starts at $11,000.",
    specs: [
      ["Stone", "10.00 ct total carat weight diamonds"],
      ["Design", "Classic tennis necklace"],
      ["Metal", "14K white gold or 14K yellow gold"],
      ["Available Options", "Natural diamonds or lab-grown diamonds"],
      ["Pricing", "Lab diamond option starting at $11,000. Please inquire for natural diamond pricing."]
    ],
    care: "Store flat, avoid fragrance contact, and clean gently to protect the diamond setting.",
    shipping: "Made to order with timing confirmed after diamond and metal selection.",
    heroImage: "/assets/images/optimized/diamond-tennis-necklace-1600.jpg",
    gallery: [
      "/assets/images/optimized/diamond-tennis-necklace-1600.jpg",
      "/assets/images/drive/img-2897.jpg",
      "/assets/images/drive/img-9576.jpg",
      "/assets/images/drive/img-1784.jpg"
    ],
    featured: true
  },
  {
    slug: "diamond-bracelet-stack",
    urlSlug: "diamond-tennis-bracelet",
    name: "The Quiet Power Tennis Bracelet",
    category: "bracelets",
    materials: "1.50 ct total carat weight lab-grown diamonds in 14K gold",
    price: 2500,
    currency: "cad",
    priceLabel: "Starting at $2,500",
    shortDescription: "A refined and elegant tennis bracelet featuring 1.50 ct total carat weight lab-grown diamonds in VS clarity and F–G colour. Set in 14K gold, this piece is designed to represent quiet confidence, strength, and effortless beauty. Lab diamond option starts at $2,500.",
    description:
      "A refined and elegant tennis bracelet featuring 1.50 ct total carat weight lab-grown diamonds in VS clarity and F–G colour. Set in 14K gold, this piece is designed to represent quiet confidence, strength, and effortless beauty. Lab diamond option starts at $2,500.",
    specs: [
      ["Stone", "1.50 ct total carat weight lab-grown diamonds"],
      ["Diamond Quality", "VS clarity, F–G colour"],
      ["Design", "Classic tennis bracelet"],
      ["Metal", "14K gold"],
      ["Available Options", "Lab-grown diamonds; natural diamonds available by request"],
      ["Pricing", "Lab diamond option starting at $2,500"]
    ],
    care: "Store flat and separate from harder pieces to protect the tennis setting.",
    shipping: "Made to order with timing confirmed during inquiry.",
    heroImage: "/assets/images/products/quiet-power-tennis-bracelet-1.jpeg",
    gallery: [
      "/assets/images/products/quiet-power-tennis-bracelet-1.jpeg",
      "/assets/images/products/quiet-power-tennis-bracelet-2.jpeg",
      "/assets/images/products/quiet-power-tennis-bracelet-3.jpeg",
      "/assets/images/products/quiet-power-tennis-bracelet-4.jpeg"
    ],
    featured: true
  },
  {
    slug: "vintage-halo-stud-earrings",
    urlSlug: "yellow-diamond-oval-stud-earrings",
    name: "Yellow Diamond Oval Stud Earrings",
    category: "earrings",
    materials: "14K gold with oval-shaped yellow diamond centre stones",
    priceLabel: "Please inquire for pricing",
    shortDescription: "Yellow diamond oval stud earrings featuring a 1.00 ct oval-shaped yellow diamond centre stone in a double halo setting, with yellow diamonds around the centre and an outer white diamond halo. Available in 14K gold with natural or lab-grown diamond options. Please inquire for pricing.",
    description:
      "Yellow diamond oval stud earrings featuring a 1.00 ct oval-shaped yellow diamond centre stone in a double halo setting, with yellow diamonds around the centre and an outer white diamond halo. Available in 14K gold with natural or lab-grown diamond options. Please inquire for pricing.",
    specs: [
      ["Stone", "1.00 ct oval-shaped yellow diamond centre stone"],
      ["Design", "Double halo stud earrings with a yellow diamond halo surrounding the centre stone and an outer white diamond halo"],
      ["Metal", "14K gold"],
      ["Available Options", "Natural diamonds or lab-grown diamonds"],
      ["Pricing", "Please inquire for pricing"]
    ],
    care: "Store separately and clean gently around the double halo setting.",
    shipping: "Made to order; timeline and delivery details are confirmed during inquiry.",
    heroImage: "/assets/images/optimized/yellow-diamond-earrings-1600.jpg",
    gallery: [
      "/assets/images/optimized/yellow-diamond-earrings-1600.jpg",
      "/assets/images/drive/img-4403.jpg",
      "/assets/images/drive/img-1784.jpg",
      "/assets/images/drive/img-2897.jpg"
    ]
  },
  {
    slug: "gold-bezel-hand-chain",
    urlSlug: "diamond-hand-chain-bracelet",
    name: "14K Gold Diamond Hand Chain Bracelet",
    category: "bracelets",
    materials: "14K yellow gold with three tiny natural bezel-set diamonds",
    price: 750,
    currency: "usd",
    priceLabel: "Starting at $750 USD",
    shortDescription: "A delicate 14K yellow gold diamond hand chain bracelet featuring three tiny natural diamonds, each approximately 0.10–0.20 ct. This elegant piece connects beautifully from the wrist toward the hand, creating a soft, feminine, and eye-catching handpiece.",
    description:
      "A delicate 14K yellow gold diamond hand chain bracelet featuring three tiny natural diamonds, each approximately 0.10–0.20 ct. This elegant piece connects beautifully from the wrist toward the hand, creating a soft, feminine, and eye-catching handpiece.",
    specs: [
      ["Stone", "Three natural diamonds, approximately 0.10–0.20 ct each"],
      ["Design", "Delicate hand chain bracelet connecting from the wrist toward the hand, featuring three tiny bezel-set diamonds"],
      ["Metal", "14K yellow gold"],
      ["Available Options", "Natural diamonds"],
      ["Pricing", "Starting at $750 USD"]
    ],
    care: "Store flat, avoid moisture, and fasten before placing in its pouch.",
    shipping: "Made to order with delivery details confirmed during inquiry.",
    heroImage: "/assets/images/products/diamond-hand-chain-1.jpeg",
    gallery: [
      "/assets/images/products/diamond-hand-chain-1.jpeg",
      "/assets/images/drive/hand-chain-2.png",
      "/assets/images/drive/hand-chain-3.png",
      "/assets/images/drive/hand-chain-1.png"
    ]
  },
  {
    slug: "cushion-diamond-ring",
    urlSlug: "cushion-cut-diamond-ring",
    name: "1 Carat Cushion Cut Diamond Ring",
    category: "rings",
    materials: "14K yellow or white gold with 1.00 ct cushion cut lab-grown diamond",
    price: 2500,
    currency: "cad",
    priceLabel: "Starting at $2,500",
    shortDescription: "A classic 1.00 ct cushion cut diamond ring featuring a four-prong setting and pavé diamonds set halfway down the band for added sparkle. Available in 14K yellow gold or 14K white gold with a lab-grown diamond centre stone.",
    description:
      "A classic 1.00 ct cushion cut diamond ring featuring a four-prong setting and pavé diamonds set halfway down the band for added sparkle. Available in 14K yellow gold or 14K white gold with a lab-grown diamond centre stone.",
    specs: [
      ["Stone", "1.00 ct cushion cut lab-grown diamond"],
      ["Design", "Four-prong setting with pavé diamonds set halfway down the band"],
      ["Metal", "14K yellow gold or 14K white gold"],
      ["Available Options", "Lab-grown diamond"],
      ["Pricing", "Starting at $2,500"]
    ],
    care: "Store separately and clean with a soft jewellery cloth after wear.",
    shipping: "Made to order with timing confirmed during inquiry.",
    heroImage: "/assets/images/products/cushion-diamond-ring-1.jpeg",
    gallery: [
      "/assets/images/products/cushion-diamond-ring-1.jpeg",
      "/assets/images/products/cushion-diamond-ring-2.jpeg",
      "/assets/images/products/cushion-diamond-ring-3.jpeg"
    ]
  }
];

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0
});

function productPriceLabel(product) {
  if (product.priceLabel) {
    return product.priceLabel;
  }

  return Number.isFinite(Number(product.price))
    ? `Starting at ${money.format(product.price)}`
    : "Please inquire for pricing";
}

function productUrl(product) {
  return `/products/${product.urlSlug || product.slug}/`;
}

function productPieceType(product) {
  return {
    rings: "Ring",
    necklaces: "Necklace",
    bracelets: "Bracelet",
    earrings: "Earrings"
  }[product.category] || "Other";
}

function productSpecValue(product, label) {
  return product.specs.find(([name]) => name === label)?.[1] || "";
}

function productInquiryHref(product) {
  if (product.estate) {
    const interest = encodeURIComponent(product.name);
    return `/contact.html?interest=${interest}#contact-form`;
  }

  const params = new URLSearchParams({
    piece: productPieceType(product),
    inquire: product.slug
  });

  return `customs.html?${params.toString()}#request-form`;
}

function isPurchasable(product) {
  return Number.isFinite(Number(product?.price)) && Boolean(product?.currency);
}

function checkoutPriceLabel(product, quantity = 1) {
  const formatter = new Intl.NumberFormat(product.currency === "usd" ? "en-US" : "en-CA", {
    style: "currency",
    currency: product.currency.toUpperCase(),
    maximumFractionDigits: 0
  });
  return `${formatter.format(Number(product.price) * quantity)} ${product.currency.toUpperCase()}`;
}

function readCart() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored
      .map((item) => {
        const product = products.find((candidate) => candidate.slug === item?.slug);
        if (!isPurchasable(product)) return null;
        const max = product.maxQuantity || 5;
        return { slug: product.slug, quantity: Math.min(max, Math.max(1, Number.parseInt(item.quantity, 10) || 1)) };
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function writeCart(cart) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    // Checkout still works for Buy now when browser storage is unavailable.
  }
  document.dispatchEvent(new CustomEvent("tj:cart-changed"));
}

function cartDetails() {
  return readCart()
    .map((item) => ({
      ...item,
      product: products.find((product) => product.slug === item.slug)
    }))
    .filter((item) => item.product);
}

function addProductToCart(product, quantity = 1) {
  if (!isPurchasable(product)) return false;
  const cart = readCart();
  const existingProducts = cart
    .map((item) => products.find((candidate) => candidate.slug === item.slug))
    .filter(Boolean);

  if (existingProducts.some((item) => item.currency !== product.currency)) {
    window.tjToast?.(`Please check out your ${existingProducts[0].currency.toUpperCase()} items before adding a ${product.currency.toUpperCase()} item.`, { tone: "error", duration: 4200 });
    return false;
  }

  const existing = cart.find((item) => item.slug === product.slug);
  const max = product.maxQuantity || 5;
  if (existing) {
    existing.quantity = Math.min(max, existing.quantity + quantity);
  } else {
    cart.push({ slug: product.slug, quantity: Math.min(max, Math.max(1, quantity)) });
  }
  writeCart(cart);
  window.tjToast?.(`${product.name} added to your bag.`);
  return true;
}

async function startStripeCheckout(items, trigger) {
  if (!items.length) return;
  const originalText = trigger?.textContent;
  if (trigger) {
    trigger.disabled = true;
    trigger.textContent = "Opening secure checkout…";
  }

  try {
    const response = await fetch("/.netlify/functions/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map(({ slug, quantity }) => ({ slug, quantity })) })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.url) {
      throw new Error(result.message || "Checkout could not be started.");
    }
    const checkoutUrl = new URL(result.url);
    if (checkoutUrl.protocol !== "https:" || !checkoutUrl.hostname.endsWith("stripe.com")) {
      throw new Error("The checkout address was not valid.");
    }
    window.location.assign(checkoutUrl.href);
  } catch (error) {
    window.tjToast?.(error.message || "Checkout could not be started. Please try again.", { tone: "error", duration: 5000 });
    if (trigger) {
      trigger.disabled = false;
      trigger.textContent = originalText;
    }
  }
}

const FAVORITES_KEY = "tj-favorite-products";
const RECENTLY_VIEWED_KEY = "tj-recently-viewed-products";
const COMPARE_PRODUCTS_KEY = "tj-compare-products";
const CUSTOM_FORM_DRAFT_KEY = "tj-custom-request-draft";
const SHOP_VIEW_KEY = "tj-shop-view";
const CART_KEY = "tj-checkout-cart-v1";

const shopState = {
  filter: "all",
  sort: "recommended",
  view: "grid"
};

const gemstoneGuides = {
  "Clear Diamond": {
    image: "assets/images/gemstones/clear-diamond.jpg",
    focus: "52% 50%",
    palette: "colourless",
    copy: "Best for maximum brilliance, classic engagement pieces, and designs where sparkle is the main event.",
    suits: ["Engagement", "Daily wear", "Heirloom"],
    bestCuts: ["Round", "Oval", "Princess", "Emerald", "Cushion"],
    bestMetals: ["Platinum", "White Gold", "Yellow Gold"],
    careNotes: "Ultrasonic-safe in most settings. Wipe with warm soapy water; avoid harsh chlorine.",
    sourcing: "Natural and lab-grown both available. Lab stones cut your spend by ~30–50% at the same look.",
    meters: { hardness: 100, brilliance: 100, durability: 100, saturation: 8 },
    mohs: 10,
    specs: [["Look", "Bright white fire"], ["Best with", "Platinum or white gold"], ["Mood", "Timeless"], ["Wear", "Daily to formal"]]
  },
  "Blush Sapphire": {
    image: "assets/images/gemstones/blush-sapphire.jpg",
    focus: "49% 48%",
    palette: "warm",
    copy: "Best for romantic custom pieces, soft colour stories, and warm metals that make the stone feel personal.",
    suits: ["Romantic gift", "Occasion wear", "Soft palettes"],
    bestCuts: ["Oval", "Cushion", "Pear", "Round"],
    bestMetals: ["Rose Gold", "Yellow Gold", "White Gold"],
    careNotes: "Very durable. Safe for daily wear; rinse and polish with a soft cloth.",
    sourcing: "Sapphires are abundant — natural Sri Lankan / Madagascan stones offer the cleanest blush tones.",
    meters: { hardness: 90, brilliance: 78, durability: 95, saturation: 55 },
    mohs: 9,
    specs: [["Look", "Soft rose tone"], ["Best with", "Rose gold"], ["Mood", "Romantic"], ["Wear", "Gift or occasion"]]
  },
  "Blue Sapphire": {
    image: "assets/images/gemstones/blue-sapphire.jpg",
    focus: "52% 49%",
    palette: "cool",
    copy: "Best for polished contrast, statement rings, and designs that need colour while still feeling refined.",
    suits: ["Statement", "Daily wear", "Royal palettes"],
    bestCuts: ["Oval", "Cushion", "Round", "Emerald"],
    bestMetals: ["White Gold", "Platinum", "Yellow Gold"],
    careNotes: "Extremely tough. Safe in ultrasonic; clean with mild soap and a soft brush.",
    sourcing: "Ceylon and Australian sources are widely available; Kashmir / Burmese stones are rare and premium.",
    meters: { hardness: 90, brilliance: 80, durability: 95, saturation: 88 },
    mohs: 9,
    specs: [["Look", "Deep blue"], ["Best with", "White gold"], ["Mood", "Classic colour"], ["Wear", "Daily or event"]]
  },
  "Emerald Green": {
    image: "assets/images/gemstones/emerald-green.jpg",
    focus: "48% 48%",
    palette: "warm",
    copy: "Best for vintage-inspired designs, yellow gold settings, and rich custom pieces with a strong point of view.",
    suits: ["Heirloom", "Vintage", "Strong colour"],
    bestCuts: ["Emerald", "Cushion", "Oval", "Pear"],
    bestMetals: ["Yellow Gold", "Rose Gold", "Platinum"],
    careNotes: "Softer and inclusion-rich — avoid ultrasonic. Wipe with a damp cloth; remove before sport.",
    sourcing: "Colombian stones lead the colour conversation; Zambian emeralds offer cooler, bluer greens.",
    meters: { hardness: 60, brilliance: 65, durability: 55, saturation: 92 },
    mohs: 7.5,
    specs: [["Look", "Deep green"], ["Best with", "Yellow gold"], ["Mood", "Heirloom"], ["Wear", "Statement"]]
  }
};

const budgetProfiles = {
  "500 to 1000": {
    title: "Simple custom direction",
    copy: "Best for a clean silhouette, lighter detail, and a focused stone or metal choice.",
    progress: "24%",
    specs: [["Scope", "Simple"], ["Detail", "Minimal"], ["Stone", "Modest scale"], ["Timeline", "Shorter review"]]
  },
  "1000 to 5000": {
    title: "Detailed custom direction",
    copy: "A balanced range for custom proportions, accent stones, and a more personal finish.",
    progress: "48%",
    specs: [["Scope", "Detailed"], ["Detail", "Accent options"], ["Stone", "Flexible"], ["Timeline", "Standard review"]]
  },
  "5000 to 10000": {
    title: "Premium custom direction",
    copy: "A strong range for elevated stones, richer settings, and more design refinement.",
    progress: "72%",
    specs: [["Scope", "Premium"], ["Detail", "High"], ["Stone", "Larger options"], ["Timeline", "Design review"]]
  },
  "10000 plus": {
    title: "Statement custom direction",
    copy: "Best for substantial stones, complex settings, private sourcing, or luxury redesign conversations.",
    progress: "100%",
    specs: [["Scope", "Statement"], ["Detail", "Concierge"], ["Stone", "Sourcing possible"], ["Timeline", "Private review"]]
  }
};

function readStoredList(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");

    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function writeStoredList(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage is progressive enhancement only.
  }
}

function getFavoriteSlugs() {
  return new Set(readStoredList(FAVORITES_KEY));
}

function setFavoriteSlugs(favorites) {
  writeStoredList(FAVORITES_KEY, Array.from(favorites));
}

function isProductFavorite(slug) {
  return getFavoriteSlugs().has(slug);
}

function toggleProductFavorite(slug) {
  const favorites = getFavoriteSlugs();
  const isSaved = favorites.has(slug);

  if (isSaved) {
    favorites.delete(slug);
  } else {
    favorites.add(slug);
  }

  setFavoriteSlugs(favorites);

  return !isSaved;
}

function syncFavoriteButtons() {
  const favorites = getFavoriteSlugs();

  document.querySelectorAll("[data-favorite-toggle]").forEach((button) => {
    const slug = button.dataset.favoriteToggle;
    const isSaved = favorites.has(slug);
    const product = products.find((item) => item.slug === slug);
    const label = product ? `${isSaved ? "Remove" : "Save"} ${product.name}` : "Save piece";

    button.classList.toggle("is-active", isSaved);
    button.setAttribute("aria-pressed", String(isSaved));
    button.setAttribute("aria-label", label);
    button.querySelector("[data-favorite-label]")?.replaceChildren(document.createTextNode(isSaved ? "Saved" : "Save"));
  });
}

function setupFavoriteButtons(scope = document) {
  const buttons = [];

  if (scope.matches && scope.matches("[data-favorite-toggle]")) {
    buttons.push(scope);
  }

  if (scope.querySelectorAll) {
    buttons.push(...scope.querySelectorAll("[data-favorite-toggle]"));
  }

  buttons.forEach((button) => {
    if (button.dataset.favoriteReady === "true") {
      return;
    }

    button.dataset.favoriteReady = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const slug = button.dataset.favoriteToggle;
      const nowSaved = toggleProductFavorite(slug);
      syncFavoriteButtons();
      renderFavoritesShelf();
      document.dispatchEvent(new CustomEvent("tj:favorites-changed", { detail: { slug, saved: nowSaved } }));
      if (window.tjToast) {
        const product = products.find((item) => item.slug === slug);
        const name = product ? product.name : "Piece";
        window.tjToast(nowSaved ? `Saved ${name} to your pieces` : `Removed ${name} from saved`);
      }
    });
  });

  syncFavoriteButtons();
}

function renderFavoritesShelf() {
  const productGrid = document.querySelector("[data-shop-products]");

  if (!productGrid || !productGrid.parentNode) {
    return;
  }

  let shelf = document.querySelector("[data-favorites-shelf]");

  if (!shelf) {
    shelf = document.createElement("div");
    shelf.className = "favorites-shelf";
    shelf.dataset.favoritesShelf = "";
    productGrid.parentNode.insertBefore(shelf, productGrid);
  }

  const favorites = getFavoriteSlugs();
  const favoriteProducts = products.filter((product) => favorites.has(product.slug));

  if (!favoriteProducts.length) {
    shelf.hidden = true;
    shelf.replaceChildren();
    return;
  }

  shelf.hidden = false;
  shelf.innerHTML = `
    <div class="favorites-shelf__header">
      <span class="eyebrow">Saved Pieces</span>
      <strong>${favoriteProducts.length} ${favoriteProducts.length === 1 ? "piece" : "pieces"}</strong>
    </div>
    <div class="favorites-shelf__track">
      ${favoriteProducts.map((product) => `
        <a class="favorite-chip" href="${productUrl(product)}">
          <img src="${product.heroImage}" alt="${product.name}" loading="lazy">
          <span>${product.name}</span>
          <small>${productPriceLabel(product)}</small>
        </a>
      `).join("")}
    </div>
  `;
}

function rememberRecentlyViewed(slug) {
  const recent = readStoredList(RECENTLY_VIEWED_KEY).filter((item) => item !== slug);

  recent.unshift(slug);
  writeStoredList(RECENTLY_VIEWED_KEY, recent.slice(0, 8));
}

function renderRecentlyViewedShelf(anchorSelector, excludeSlug = "") {
  const anchor = document.querySelector(anchorSelector);

  if (!anchor || !anchor.parentNode) {
    return;
  }

  const context = anchor.hasAttribute("data-shop-products") ? "shop" : "product";
  let shelf = document.querySelector(`[data-recently-viewed-shelf="${context}"]`);

  if (!shelf) {
    shelf = document.createElement("div");
    shelf.className = "favorites-shelf recently-viewed-shelf";
    shelf.dataset.recentlyViewedShelf = context;
    anchor.parentNode.insertBefore(shelf, anchor);
  }

  const recentProducts = readStoredList(RECENTLY_VIEWED_KEY)
    .filter((slug) => slug !== excludeSlug)
    .map((slug) => products.find((product) => product.slug === slug))
    .filter(Boolean)
    .slice(0, 4);

  if (!recentProducts.length) {
    shelf.hidden = true;
    shelf.replaceChildren();
    return;
  }

  shelf.hidden = false;
  shelf.innerHTML = `
    <div class="favorites-shelf__header">
      <span class="eyebrow">Recently Viewed</span>
      <strong>${recentProducts.length} ${recentProducts.length === 1 ? "piece" : "pieces"}</strong>
    </div>
    <div class="favorites-shelf__track">
      ${recentProducts.map((product) => `
        <a class="favorite-chip" href="${productUrl(product)}">
          <img src="${product.heroImage}" alt="${product.name}" loading="lazy">
          <span>${product.name}</span>
          <small>${productPriceLabel(product)}</small>
        </a>
      `).join("")}
    </div>
  `;
}

function getCompareSlugs() {
  return readStoredList(COMPARE_PRODUCTS_KEY);
}

function setCompareSlugs(slugs) {
  writeStoredList(COMPARE_PRODUCTS_KEY, slugs.slice(0, 3));
}

function isProductCompared(slug) {
  return getCompareSlugs().includes(slug);
}

function toggleProductCompare(slug) {
  const compared = getCompareSlugs();
  const exists = compared.includes(slug);

  if (exists) {
    setCompareSlugs(compared.filter((item) => item !== slug));
    return false;
  }

  setCompareSlugs([slug, ...compared].slice(0, 3));
  return true;
}

function syncCompareButtons() {
  const compared = getCompareSlugs();

  document.querySelectorAll("[data-compare-toggle]").forEach((button) => {
    const isCompared = compared.includes(button.dataset.compareToggle);

    button.classList.toggle("is-active", isCompared);
    button.setAttribute("aria-pressed", String(isCompared));
    button.querySelector("[data-compare-label]")?.replaceChildren(document.createTextNode(isCompared ? "Comparing" : "Compare"));
  });
}

function renderCompareBar() {
  let bar = document.querySelector("[data-compare-bar]");

  if (!bar) {
    bar = document.createElement("aside");
    bar.className = "compare-bar";
    bar.dataset.compareBar = "";
    bar.setAttribute("aria-live", "polite");
    document.body.appendChild(bar);
  }

  const comparedProducts = getCompareSlugs()
    .map((slug) => products.find((product) => product.slug === slug))
    .filter(Boolean);

  if (!comparedProducts.length) {
    bar.hidden = true;
    bar.replaceChildren();
    return;
  }

  bar.hidden = false;
  bar.innerHTML = `
    <div class="compare-bar__items">
      ${comparedProducts.map((product) => `
        <span>
          <img src="${product.heroImage}" alt="${product.name}" loading="lazy">
          <strong>${product.name}</strong>
        </span>
      `).join("")}
    </div>
    <div class="compare-bar__actions">
      <button class="button" type="button" data-open-compare>Compare</button>
      <button class="button-secondary" type="button" data-clear-compare>Clear</button>
    </div>
  `;

  bar.querySelector("[data-open-compare]")?.addEventListener("click", renderCompareModal);
  bar.querySelector("[data-clear-compare]")?.addEventListener("click", () => {
    setCompareSlugs([]);
    syncCompareButtons();
    renderCompareBar();
  });
}

function renderCompareModal() {
  let modal = document.querySelector("[data-compare-modal]");

  if (!modal) {
    modal = document.createElement("div");
    modal.className = "compare-modal";
    modal.dataset.compareModal = "";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Product comparison");
    document.body.appendChild(modal);
  }

  const comparedProducts = getCompareSlugs()
    .map((slug) => products.find((product) => product.slug === slug))
    .filter(Boolean);

  if (!comparedProducts.length) {
    return;
  }

  const rows = [
    ["Price", (product) => productPriceLabel(product)],
    ["Category", (product) => product.category],
    ["Materials", (product) => product.materials],
    ["Timeline", (product) => product.specs.find(([label]) => label === "Timeline")?.[1] || "Available by request"],
    ["Best for", (product) => product.shortDescription]
  ];

  modal.innerHTML = `
    <div class="compare-modal__scrim" data-close-compare></div>
    <div class="compare-modal__panel">
      <div class="compare-modal__header">
        <div>
          <span class="eyebrow">Compare Pieces</span>
          <h2>Review details side by side</h2>
        </div>
        <button class="icon-button" type="button" data-close-compare aria-label="Close comparison">X</button>
      </div>
      <div class="compare-table">
        <div class="compare-table__row compare-table__row--media" style="--compare-count:${comparedProducts.length}">
          <span></span>
          ${comparedProducts.map((product) => `
            <a href="${productUrl(product)}">
              <img src="${product.heroImage}" alt="${product.name}" loading="lazy">
              <strong>${product.name}</strong>
            </a>
          `).join("")}
        </div>
        ${rows.map(([label, getter]) => `
          <div class="compare-table__row" style="--compare-count:${comparedProducts.length}">
            <span>${label}</span>
            ${comparedProducts.map((product) => `<p>${getter(product)}</p>`).join("")}
          </div>
        `).join("")}
      </div>
    </div>
  `;

  modal.classList.add("is-open");
  document.body.classList.add("modal-open");
  modal.querySelectorAll("[data-close-compare]").forEach((button) => {
    button.addEventListener("click", () => {
      modal.classList.remove("is-open");
      document.body.classList.remove("modal-open");
    });
  });
}

function setupCompareButtons(scope = document) {
  const buttons = [];

  if (scope.matches && scope.matches("[data-compare-toggle]")) {
    buttons.push(scope);
  }

  if (scope.querySelectorAll) {
    buttons.push(...scope.querySelectorAll("[data-compare-toggle]"));
  }

  buttons.forEach((button) => {
    if (button.dataset.compareReady === "true") {
      return;
    }

    button.dataset.compareReady = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleProductCompare(button.dataset.compareToggle);
      syncCompareButtons();
      renderCompareBar();
    });
  });

  syncCompareButtons();
  renderCompareBar();
}

function keepFocusInDialog(event, panel) {
  if (event.key !== "Tab" || !panel) {
    return;
  }

  const focusable = Array.from(
    panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
  ).filter((element) => !element.hidden && element.getClientRects().length);

  if (!focusable.length) {
    event.preventDefault();
    panel.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

let closeActiveQuickView = null;

function openProductQuickView(product, trigger) {
  if (!product) {
    return;
  }

  closeActiveQuickView?.(false);

  let modal = document.querySelector("[data-quick-view-modal]");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "quick-view-modal";
    modal.dataset.quickViewModal = "";
    document.body.appendChild(modal);
  }

  modal.hidden = false;
  modal.removeAttribute("aria-hidden");
  const gallery = [...new Set([product.heroImage, ...(product.gallery || [])])].filter(Boolean);
  const headingId = `quick-view-${product.slug}`;
  const isSaved = isProductFavorite(product.slug);
  const isCompared = isProductCompared(product.slug);
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", headingId);
  modal.innerHTML = `
    <div class="quick-view-modal__scrim" data-quick-view-close></div>
    <div class="quick-view-modal__panel" tabindex="-1">
      <button class="quick-view-modal__close icon-button" type="button" data-quick-view-close aria-label="Close quick view">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="quick-view-modal__media">
        <div class="quick-view-modal__stage">
          <img src="${gallery[0]}" alt="${escapeHtml(product.name)}" data-quick-view-image>
        </div>
        ${gallery.length > 1 ? `
          <div class="quick-view-modal__thumbs" aria-label="Choose a product view">
            ${gallery.map((image, index) => `
              <button class="quick-view-modal__thumb${index === 0 ? " is-active" : ""}" type="button" data-quick-view-image-choice="${image}" aria-label="Show view ${index + 1}" aria-pressed="${index === 0}">
                <img src="${image}" alt="" loading="lazy">
              </button>
            `).join("")}
          </div>
        ` : ""}
      </div>
      <div class="quick-view-modal__content">
        <span class="eyebrow">${escapeHtml(product.category)}</span>
        <h2 id="${headingId}">${escapeHtml(product.name)}</h2>
        <strong class="quick-view-modal__price">${escapeHtml(productPriceLabel(product))}</strong>
        <p class="quick-view-modal__materials">${escapeHtml(product.materials)}</p>
        <p>${escapeHtml(product.shortDescription)}</p>
        <dl class="quick-view-modal__facts">
          ${(product.specs || []).slice(0, 4).map(([label, value]) => `
            <div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>
          `).join("")}
        </dl>
        <div class="quick-view-modal__actions">
          ${isPurchasable(product) ? `<button class="button" type="button" data-quick-add="${product.slug}">Add to bag</button>` : ""}
          <a class="${isPurchasable(product) ? "button-secondary" : "button"}" href="${productUrl(product)}">View full details</a>
          <a class="button-secondary" href="${productInquiryHref(product)}">Ask about this piece</a>
        </div>
        <div class="quick-view-modal__utility">
          <button class="button-secondary" type="button" data-favorite-toggle="${product.slug}" aria-pressed="${isSaved}">
            <span data-favorite-label>${isSaved ? "Saved" : "Save"}</span>
          </button>
          <button class="button-secondary" type="button" data-compare-toggle="${product.slug}" aria-pressed="${isCompared}">
            <span data-compare-label>${isCompared ? "Comparing" : "Compare"}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const panel = modal.querySelector(".quick-view-modal__panel");
  const mainImage = modal.querySelector("[data-quick-view-image]");
  const previousFocus = trigger || document.activeElement;

  modal.querySelector("[data-quick-add]")?.addEventListener("click", (event) => {
    if (addProductToCart(product)) {
      event.currentTarget.textContent = "Added to bag";
    }
  });

  modal.querySelectorAll("[data-quick-view-image-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!mainImage) return;
      mainImage.src = button.dataset.quickViewImageChoice;
      modal.querySelectorAll("[data-quick-view-image-choice]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
    });
  });

  const close = (restoreFocus = true) => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", onKeydown);
    closeActiveQuickView = null;
    window.setTimeout(() => {
      if (!modal.classList.contains("is-open")) modal.hidden = true;
    }, 220);
    if (restoreFocus && previousFocus?.focus) {
      previousFocus.focus();
    }
  };

  const onKeydown = (event) => {
    if (event.key === "Escape") {
      close();
      return;
    }
    keepFocusInDialog(event, panel);
  };

  modal.querySelectorAll("[data-quick-view-close]").forEach((button) => {
    button.addEventListener("click", () => close());
  });
  setupFavoriteButtons(modal);
  setupCompareButtons(modal);
  document.addEventListener("keydown", onKeydown);
  document.body.classList.add("modal-open");
  modal.classList.add("is-open");
  panel?.focus();
  closeActiveQuickView = close;
}

function setupProductQuickViewButtons(scope = document) {
  const buttons = [];
  if (scope.matches?.("[data-quick-view-trigger]")) {
    buttons.push(scope);
  }
  if (scope.querySelectorAll) {
    buttons.push(...scope.querySelectorAll("[data-quick-view-trigger]"));
  }

  buttons.forEach((button) => {
    if (button.dataset.quickViewReady === "true") return;
    button.dataset.quickViewReady = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const product = products.find((item) => item.slug === button.dataset.quickViewTrigger);
      openProductQuickView(product, button);
    });
  });
}

function productCardMarkup(product) {
  const isSaved = isProductFavorite(product.slug);
  const isCompared = isProductCompared(product.slug);
  const galleryImages = [...new Set([product.heroImage, ...(product.gallery || [])])].filter(Boolean).slice(0, 5);
  const cardGallery = galleryImages.length > 1 ? `
    <div class="product-card__gallery" aria-label="${product.name} image choices">
      ${galleryImages.map((image, index) => `
        <button class="product-card__thumb ${index === 0 ? "is-active" : ""}" type="button" data-card-image="${image}" aria-label="Show ${product.name} image ${index + 1}">
          <img src="${image}" alt="" loading="lazy">
        </button>
      `).join("")}
    </div>
  ` : "";

  return `
    <article class="product-card" data-product-card="${product.slug}" data-reveal>
      <button class="favorite-button ${isSaved ? "is-active" : ""}" type="button" data-favorite-toggle="${product.slug}" aria-label="${isSaved ? "Remove" : "Save"} ${product.name}" aria-pressed="${isSaved}">
        <span data-favorite-label>${isSaved ? "Saved" : "Save"}</span>
      </button>
      <button class="compare-button ${isCompared ? "is-active" : ""}" type="button" data-compare-toggle="${product.slug}" aria-label="Compare ${product.name}" aria-pressed="${isCompared}">
        <span data-compare-label>${isCompared ? "Comparing" : "Compare"}</span>
      </button>
      <button class="quick-view-button" type="button" data-quick-view-trigger="${product.slug}" aria-label="Quick view ${product.name}" title="Quick view">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2.5 12S6 6.5 12 6.5S21.5 12 21.5 12S18 17.5 12 17.5S2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="12" cy="12" r="2.4" stroke="currentColor" stroke-width="1.6"/>
        </svg>
      </button>
      <a class="product-card__link" href="${productUrl(product)}">
        <div class="product-card__media">
          <img src="${product.heroImage}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-card__body">
          <h3>${product.name}</h3>
          <p class="product-card__materials">${product.materials}</p>
          <span class="product-card__price">${productPriceLabel(product)}</span>
        </div>
      </a>
      ${cardGallery}
      ${isPurchasable(product) ? `
        <button class="product-card__checkout" type="button" data-card-add="${product.slug}">
          Add to bag · ${escapeHtml(checkoutPriceLabel(product))}
        </button>
      ` : ""}
    </article>
  `;
}

function setupProductCardImageChoosers(scope = document) {
  const buttons = [];

  if (scope.matches && scope.matches("[data-card-image]")) {
    buttons.push(scope);
  }

  if (scope.querySelectorAll) {
    buttons.push(...scope.querySelectorAll("[data-card-image]"));
  }

  buttons.forEach((button) => {
    if (button.dataset.cardImageReady === "true") {
      return;
    }

    button.dataset.cardImageReady = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const card = button.closest("[data-product-card]");
      const image = card?.querySelector(".product-card__media img");

      if (!card || !image || !button.dataset.cardImage) {
        return;
      }

      image.src = button.dataset.cardImage;
      card.querySelectorAll("[data-card-image]").forEach((thumb) => {
        thumb.classList.toggle("is-active", thumb === button);
      });
    });
  });
}

function setupProductCardCheckout(scope = document) {
  scope.querySelectorAll?.("[data-card-add]").forEach((button) => {
    if (button.dataset.cardAddReady === "true") return;
    button.dataset.cardAddReady = "true";
    button.addEventListener("click", () => {
      const product = products.find((item) => item.slug === button.dataset.cardAdd);
      if (addProductToCart(product)) {
        const original = button.textContent;
        button.textContent = "Added to bag";
        window.setTimeout(() => { button.textContent = original; }, 1800);
      }
    });
  });
}

function renderProductCollection(container, items) {
  if (!container) {
    return;
  }

  container.innerHTML = items.map(productCardMarkup).join("");
  applyRevealDelays(container);
  setupDepthCards(container);
  setupFavoriteButtons(container);
  setupCompareButtons(container);
  setupProductCardImageChoosers(container);
  setupProductCardCheckout(container);
  setupProductQuickViewButtons(container);
  renderFavoritesShelf();
}

function setupHeader() {
  const body = document.body;
  const menuButton = document.querySelector("[data-menu-toggle]");
  const navLinks = document.querySelectorAll(".primary-nav a");
  const header = document.querySelector(".site-header");

  if (menuButton) {
    menuButton.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      body.classList.toggle("nav-open");
    });
  }

  navLinks.forEach((link) => {
    if (link.dataset.page === body.dataset.page) {
      link.classList.add("is-active");
    }

    link.addEventListener("click", () => {
      body.classList.remove("nav-open");
      if (menuButton) {
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  });

  const onScroll = () => {
    if (!header) {
      return;
    }

    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function renderFeaturedProducts() {
  const container = document.querySelector("[data-featured-products]");
  const featured = products.filter((product) => product.featured).slice(0, 3);
  renderProductCollection(container, featured);
}

function readShopViewPreference() {
  try {
    return window.localStorage.getItem(SHOP_VIEW_KEY) === "list" ? "list" : "grid";
  } catch (error) {
    return "grid";
  }
}

function sortShopProducts(items, sort) {
  const sorted = [...items];
  if (sort === "name") {
    return sorted.sort((first, second) => first.name.localeCompare(second.name));
  }
  if (sort === "price-low" || sort === "price-high") {
    return sorted.sort((first, second) => {
      const firstPrice = Number.isFinite(Number(first.price)) ? Number(first.price) : null;
      const secondPrice = Number.isFinite(Number(second.price)) ? Number(second.price) : null;
      if (firstPrice === null) return secondPrice === null ? 0 : 1;
      if (secondPrice === null) return -1;
      return sort === "price-low" ? firstPrice - secondPrice : secondPrice - firstPrice;
    });
  }
  return sorted;
}

function setupShopDiscoveryControls() {
  const container = document.querySelector("[data-shop-products]");
  if (!container || document.querySelector("[data-shop-toolbar]")) {
    return;
  }

  shopState.view = readShopViewPreference();
  const collectionEyebrow = container.parentElement?.querySelector(".collection-heading .eyebrow");
  if (collectionEyebrow) {
    collectionEyebrow.textContent = `${products.length} curated designs`;
  }
  const toolbar = document.createElement("div");
  toolbar.className = "shop-toolbar";
  toolbar.dataset.shopToolbar = "";
  toolbar.innerHTML = `
    <p class="shop-toolbar__count" data-shop-result-count aria-live="polite"></p>
    <div class="shop-toolbar__controls">
      <label class="shop-toolbar__sort">
        <span>Sort</span>
        <select data-shop-sort aria-label="Sort pieces">
          <option value="recommended">Recommended</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
          <option value="name">Name: A to Z</option>
        </select>
      </label>
      <div class="shop-view-toggle" role="group" aria-label="Collection layout">
        <button type="button" data-shop-view="grid" aria-label="Grid view" title="Grid view">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.6"/>
            <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.6"/>
            <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.6"/>
            <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.6"/>
          </svg>
        </button>
        <button type="button" data-shop-view="list" aria-label="List view" title="List view">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6H20M9 12H20M9 18H20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            <circle cx="5" cy="6" r="1" fill="currentColor"/>
            <circle cx="5" cy="12" r="1" fill="currentColor"/>
            <circle cx="5" cy="18" r="1" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  container.parentNode.insertBefore(toolbar, container);

  toolbar.querySelector("[data-shop-sort]")?.addEventListener("change", (event) => {
    shopState.sort = event.target.value;
    renderShopProducts();
  });
  toolbar.querySelectorAll("[data-shop-view]").forEach((button) => {
    button.addEventListener("click", () => {
      shopState.view = button.dataset.shopView === "list" ? "list" : "grid";
      try {
        window.localStorage.setItem(SHOP_VIEW_KEY, shopState.view);
      } catch (error) {
        // Layout preference is progressive enhancement only.
      }
      renderShopProducts();
    });
  });
}

function renderShopProducts(filter = shopState.filter) {
  const container = document.querySelector("[data-shop-products]");
  if (!container) {
    return;
  }

  shopState.filter = filter;
  const filteredItems = filter === "all"
    ? products
    : products.filter((product) => product.category === filter);
  const items = sortShopProducts(filteredItems, shopState.sort);

  container.classList.toggle("product-grid--list", shopState.view === "list");
  renderProductCollection(container, items);
  document.querySelector("[data-shop-result-count]")?.replaceChildren(
    document.createTextNode(`${items.length} ${items.length === 1 ? "piece" : "pieces"}`)
  );
  document.querySelectorAll("[data-shop-view]").forEach((button) => {
    const active = button.dataset.shopView === shopState.view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderRecentlyViewedShelf("[data-shop-products]");
  revealVisible();
}

function setupShopFilters() {
  const chips = document.querySelectorAll("[data-filter]");
  if (!chips.length) {
    return;
  }

  setupShopDiscoveryControls();

  chips.forEach((chip) => {
    chip.addEventListener("click", (event) => {
      event.preventDefault();
      chips.forEach((item) => item.classList.remove("is-active"));
      chip.classList.add("is-active");
      renderShopProducts(chip.dataset.filter || "all");
    });
  });

  renderShopProducts("all");
}

let closeActiveLightbox = null;

function openProductLightbox(product, startIndex = 0, trigger = null) {
  const gallery = [...new Set(product.gallery || [product.heroImage])].filter(Boolean);
  if (!gallery.length) return;

  closeActiveLightbox?.(false);
  let activeIndex = Math.max(0, Math.min(startIndex, gallery.length - 1));
  let modal = document.querySelector("[data-product-lightbox]");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "product-lightbox";
    modal.dataset.productLightbox = "";
    document.body.appendChild(modal);
  }

  modal.hidden = false;
  modal.removeAttribute("aria-hidden");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", `${product.name} image gallery`);
  modal.innerHTML = `
    <div class="product-lightbox__scrim" data-lightbox-close></div>
    <div class="product-lightbox__panel" tabindex="-1">
      <div class="product-lightbox__header">
        <div>
          <span class="eyebrow">Image gallery</span>
          <strong>${escapeHtml(product.name)}</strong>
        </div>
        <button class="icon-button" type="button" data-lightbox-close aria-label="Close image gallery">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="product-lightbox__stage" data-lightbox-stage>
        <img src="${gallery[activeIndex]}" alt="${escapeHtml(product.name)} view ${activeIndex + 1}" data-lightbox-image>
        ${gallery.length > 1 ? `
          <button class="product-lightbox__nav product-lightbox__nav--prev" type="button" data-lightbox-prev aria-label="Previous image">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5L8 12L15 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="product-lightbox__nav product-lightbox__nav--next" type="button" data-lightbox-next aria-label="Next image">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        ` : ""}
        <span class="product-lightbox__counter" data-lightbox-counter aria-live="polite"></span>
      </div>
      ${gallery.length > 1 ? `
        <div class="product-lightbox__thumbs" aria-label="Gallery views">
          ${gallery.map((image, index) => `
            <button type="button" data-lightbox-thumb="${index}" aria-label="Show image ${index + 1}" aria-current="${index === activeIndex ? "true" : "false"}">
              <img src="${image}" alt="" loading="lazy">
            </button>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;

  const panel = modal.querySelector(".product-lightbox__panel");
  const image = modal.querySelector("[data-lightbox-image]");
  const counter = modal.querySelector("[data-lightbox-counter]");
  const previousFocus = trigger || document.activeElement;

  const showImage = (nextIndex) => {
    activeIndex = (nextIndex + gallery.length) % gallery.length;
    if (image) {
      image.src = gallery[activeIndex];
      image.alt = `${product.name} view ${activeIndex + 1}`;
    }
    if (counter) counter.textContent = `${activeIndex + 1} / ${gallery.length}`;
    modal.querySelectorAll("[data-lightbox-thumb]").forEach((button) => {
      const active = Number(button.dataset.lightboxThumb) === activeIndex;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", String(active));
      if (active) button.scrollIntoView({ block: "nearest", inline: "center" });
    });
  };

  const close = (restoreFocus = true) => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", onKeydown);
    closeActiveLightbox = null;
    window.setTimeout(() => {
      if (!modal.classList.contains("is-open")) modal.hidden = true;
    }, 220);
    if (restoreFocus && previousFocus?.focus) previousFocus.focus();
  };

  const onKeydown = (event) => {
    if (event.key === "Escape") {
      close();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      showImage(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showImage(activeIndex + 1);
    } else {
      keepFocusInDialog(event, panel);
    }
  };

  modal.querySelectorAll("[data-lightbox-close]").forEach((button) => button.addEventListener("click", () => close()));
  modal.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => showImage(activeIndex - 1));
  modal.querySelector("[data-lightbox-next]")?.addEventListener("click", () => showImage(activeIndex + 1));
  modal.querySelectorAll("[data-lightbox-thumb]").forEach((button) => {
    button.addEventListener("click", () => showImage(Number(button.dataset.lightboxThumb)));
  });

  let pointerStartX = null;
  const stage = modal.querySelector("[data-lightbox-stage]");
  stage?.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
  });
  stage?.addEventListener("pointerup", (event) => {
    if (pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(distance) > 48) showImage(activeIndex + (distance < 0 ? 1 : -1));
  });

  document.addEventListener("keydown", onKeydown);
  document.body.classList.add("modal-open");
  showImage(activeIndex);
  modal.classList.add("is-open");
  panel?.focus();
  closeActiveLightbox = close;
}

async function shareProduct(product) {
  const shareData = {
    title: product.name,
    text: product.shortDescription,
    url: new URL(productUrl(product), window.location.origin).href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      recordSiteEvent("product_share", { product_name: product.name, method: "native" });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(shareData.url);
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = shareData.url;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  }
  window.tjToast?.("Product link copied");
  recordSiteEvent("product_share", { product_name: product.name, method: "copy" });
}

function renderProductPage() {
  const page = document.querySelector("[data-product-page]");
  if (!page) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const pathSlug = window.location.pathname.split("/").filter(Boolean).at(-1) || "";
  const slug = page.dataset.productSlug || params.get("slug") || pathSlug;
  const product = products.find((item) => item.slug === slug || item.urlSlug === slug);

  if (!product) {
    return;
  }

  if (window.location.pathname.endsWith("/product.html")) {
    window.location.replace(productUrl(product));
    return;
  }

  rememberRecentlyViewed(product.slug);

  const setText = (selector, value, scope = document) => {
    scope.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  setText("[data-product-name]", product.name);
  setText("[data-product-category]", product.category.charAt(0).toUpperCase() + product.category.slice(1), page);
  setText("[data-product-price]", productPriceLabel(product), page);
  setText("[data-product-materials]", product.materials, page);
  setText("[data-product-description]", product.description, page);
  setText("[data-product-long-description]", product.description);
  setText("[data-product-shipping]", product.shipping, page);
  setText("[data-product-care]", product.care, page);

  const mainImage = page.querySelector("[data-product-main-image]");
  const thumbnailGrid = page.querySelector("[data-product-thumbnails]");
  const detailList = document.querySelector("[data-product-specs]");
  const related = document.querySelector("[data-related-products]");
  const inquiryLink = page.querySelector("[data-product-inquiry]");

  if (inquiryLink) {
    inquiryLink.href = productInquiryHref(product);
  }

  const updateMainImage = (src, animate = false) => {
    if (!mainImage) {
      return;
    }

    if (!animate) {
      mainImage.src = src;
      mainImage.alt = product.name;
      return;
    }

    mainImage.classList.add("is-swapping");

    window.setTimeout(() => {
      mainImage.src = src;
      mainImage.alt = product.name;
      mainImage.classList.remove("is-swapping");
    }, 140);
  };

  let activeGalleryIndex = 0;
  updateMainImage(product.gallery[0]);

  if (thumbnailGrid) {
    thumbnailGrid.innerHTML = product.gallery
      .map(
        (image, index) => `
          <button class="thumbnail-button ${index === 0 ? "is-active" : ""}" type="button" data-gallery-thumb>
            <img src="${image}" alt="${product.name} view ${index + 1}" loading="lazy">
          </button>
        `
      )
      .join("");

    thumbnailGrid.querySelectorAll("[data-gallery-thumb]").forEach((button, index) => {
      button.addEventListener("click", () => {
        activeGalleryIndex = index;
        thumbnailGrid.querySelectorAll("[data-gallery-thumb]").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        updateMainImage(product.gallery[index], true);
      });
    });
  }

  if (mainImage) {
    mainImage.classList.add("is-zoomable");
    mainImage.tabIndex = 0;
    mainImage.setAttribute("role", "button");
    mainImage.setAttribute("aria-label", `Open ${product.name} image gallery`);
    const galleryMain = mainImage.closest(".gallery-main");
    let zoomButton = galleryMain?.querySelector("[data-gallery-zoom]");
    if (galleryMain && !zoomButton) {
      zoomButton = document.createElement("button");
      zoomButton.className = "gallery-zoom-button";
      zoomButton.type = "button";
      zoomButton.dataset.galleryZoom = "";
      zoomButton.setAttribute("aria-label", "Open full-screen image gallery");
      zoomButton.title = "View full screen";
      zoomButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 4H4V9M15 4H20V9M9 20H4V15M15 20H20V15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      galleryMain.appendChild(zoomButton);
    }
    const openLightbox = () => openProductLightbox(product, activeGalleryIndex, zoomButton || mainImage);
    mainImage.addEventListener("click", openLightbox);
    mainImage.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox();
      }
    });
    zoomButton?.addEventListener("click", openLightbox);
  }

  if (detailList) {
    detailList.innerHTML = product.specs
      .map(
        ([label, value]) => `
          <li>
            <strong>${label}</strong>
            <span>${value}</span>
          </li>
        `
      )
      .join("");
  }

  renderProductCollection(
    related,
    products.filter((item) => item.slug !== product.slug).slice(0, 3)
  );
  renderRecentlyViewedShelf("[data-related-products]", product.slug);

  const actionGroup = page.querySelector(".product-action-group");

  if (actionGroup && isPurchasable(product) && !actionGroup.querySelector("[data-buy-now]")) {
    const inquiry = actionGroup.querySelector("[data-product-inquiry]");
    inquiry?.classList.replace("button", "button-secondary");

    const buyButton = document.createElement("button");
    buyButton.className = "button";
    buyButton.type = "button";
    buyButton.dataset.buyNow = product.slug;
    buyButton.textContent = `Buy now · ${checkoutPriceLabel(product)}`;
    buyButton.addEventListener("click", () => startStripeCheckout([{ slug: product.slug, quantity: 1 }], buyButton));
    actionGroup.insertBefore(buyButton, actionGroup.firstChild);

    const addButton = document.createElement("button");
    addButton.className = "button-secondary";
    addButton.type = "button";
    addButton.dataset.addToCart = product.slug;
    addButton.textContent = "Add to bag";
    addButton.addEventListener("click", () => {
      if (addProductToCart(product)) {
        addButton.textContent = "Added to bag";
        window.setTimeout(() => { addButton.textContent = "Add to bag"; }, 1800);
      }
    });
    actionGroup.insertBefore(addButton, buyButton.nextSibling);
  }

  if (actionGroup && !actionGroup.querySelector("[data-product-page-favorite]")) {
    const favoriteButton = document.createElement("button");
    favoriteButton.className = "button-secondary product-save-button";
    favoriteButton.type = "button";
    favoriteButton.dataset.favoriteToggle = product.slug;
    favoriteButton.dataset.productPageFavorite = "true";
    favoriteButton.innerHTML = '<span data-favorite-label>Save</span>';
    actionGroup.appendChild(favoriteButton);
    setupFavoriteButtons(actionGroup);
  }

  if (actionGroup && !actionGroup.querySelector("[data-product-page-compare]")) {
    const compareButton = document.createElement("button");
    compareButton.className = "button-secondary product-compare-button";
    compareButton.type = "button";
    compareButton.dataset.compareToggle = product.slug;
    compareButton.dataset.productPageCompare = "true";
    compareButton.innerHTML = '<span data-compare-label>Compare</span>';
    actionGroup.appendChild(compareButton);
    setupCompareButtons(actionGroup);
  }

  if (actionGroup && !actionGroup.querySelector("[data-product-share]")) {
    const shareButton = document.createElement("button");
    shareButton.className = "button-secondary product-share-button";
    shareButton.type = "button";
    shareButton.dataset.productShare = "";
    shareButton.setAttribute("aria-label", `Share ${product.name}`);
    shareButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.6"/>
        <circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.6"/>
        <circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.6"/>
        <path d="M8.2 10.8L15.8 6.2M8.2 13.2L15.8 17.8" stroke="currentColor" stroke-width="1.6"/>
      </svg>
      <span>Share</span>
    `;
    shareButton.addEventListener("click", () => shareProduct(product));
    actionGroup.appendChild(shareButton);
  }
}

function setupFaq() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const trigger = item.querySelector(".faq-question");
    if (!trigger) {
      return;
    }

    trigger.addEventListener("click", () => {
      item.classList.toggle("is-open");
    });
  });
}

function syncSelectedPiece(form) {
  const selectedItem = form.dataset.selectedItem || "";

  form.querySelectorAll("[data-selected-piece]").forEach((field) => {
    if ("value" in field) {
      field.value = selectedItem;
    } else {
      field.textContent = selectedItem;
    }
  });

  form.querySelectorAll("[data-selected-piece-label]").forEach((field) => {
    field.textContent = selectedItem || "your selected piece";
  });
}

function getGeneratedDesignFile(form) {
  const file = form?.__tjGeneratedDesignFile;

  if (!file || typeof file.name !== "string" || typeof file.size !== "number") {
    return null;
  }

  return file;
}

function filesMatch(firstFile, secondFile) {
  return Boolean(
    firstFile &&
      secondFile &&
      firstFile.name === secondFile.name &&
      firstFile.size === secondFile.size &&
      firstFile.type === secondFile.type &&
      firstFile.lastModified === secondFile.lastModified
  );
}

function clearGeneratedDesignUpload(form, picker, input) {
  if (!getGeneratedDesignFile(form)) {
    return;
  }

  delete form.__tjGeneratedDesignFile;
  delete input.dataset.generatedDesignFile;
  picker.classList.remove("has-generated-design");

  const preview = picker.querySelector("[data-design-preview]");

  if (preview) {
    const previewUrl = preview.dataset.previewUrl;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    delete preview.dataset.previewUrl;
    preview.hidden = true;
    preview.replaceChildren();
  }
}

function setupFilePickers() {
  document.querySelectorAll("[data-file-picker]").forEach((picker) => {
    const input = picker.querySelector("[data-file-input]");
    const fileName = picker.querySelector("[data-file-name]");

    if (!input || !fileName) {
      return;
    }

    const updateFileName = () => {
      const file = (input.files && input.files[0]) || getGeneratedDesignFile(input.form);
      fileName.textContent = file ? file.name : "No file selected yet";
    };

    input.addEventListener("change", (event) => {
      const selectedFile = input.files && input.files[0];
      const generatedFile = getGeneratedDesignFile(input.form);

      if (event.isTrusted && generatedFile && !filesMatch(selectedFile, generatedFile)) {
        clearGeneratedDesignUpload(input.form, picker, input);
      }

      updateFileName();
    });

    input.form?.addEventListener("reset", () => {
      window.setTimeout(() => {
        clearGeneratedDesignUpload(input.form, picker, input);
        updateFileName();
      }, 0);
    });

    updateFileName();
  });
}

function setupPieceTypePrefill() {
  const params = new URLSearchParams(window.location.search);
  const rawPiece = params.get("piece") || params.get("piece-type");
  const select = document.querySelector("#piece-type");

  if (!rawPiece || !select) {
    return;
  }

  const pieceMap = {
    ring: "Ring",
    rings: "Ring",
    necklace: "Necklace",
    necklaces: "Necklace",
    bracelet: "Bracelet",
    bracelets: "Bracelet",
    earring: "Earrings",
    earrings: "Earrings",
    other: "Other"
  };
  const normalizedPiece = rawPiece.trim().toLowerCase().replace(/[^a-z]/g, "");
  const selectedPiece = pieceMap[normalizedPiece];

  if (!selectedPiece) {
    return;
  }

  select.value = selectedPiece;
  select.dispatchEvent(new Event("change", { bubbles: true }));

  const field = select.closest(".form-field");
  if (field) {
    field.classList.add("is-prefilled");
  }
}

function formatGuideLabel(value) {
  return (value || "")
    .replace(/[-_]+/gu, " ")
    .replace(/\b\w/gu, (letter) => letter.toUpperCase());
}

function guideBudgetFormValue(value) {
  return {
    simple: "500 to 1000",
    detailed: "1000 to 5000",
    premium: "5000 to 10000",
    statement: "10000 plus"
  }[value] || "1000 to 5000";
}

function syncDesignStudioPublicEntries() {
  document.querySelectorAll("[data-design-studio-entry], [data-gemstone-apply]").forEach((entry) => {
    entry.hidden = !DESIGN_STUDIO_PUBLIC;
  });
}

function syncCustomsPreformSections() {
  document.querySelectorAll("[data-customs-preform]").forEach((section) => {
    section.hidden = !CUSTOMS_PREFORM_PUBLIC;
  });
}

let designerModulePromise;
let arModulePromise;

function loadDesignerModule() {
  if (!designerModulePromise) {
    designerModulePromise = import("/assets/js/designer.js");
  }

  return designerModulePromise;
}

function loadArModule() {
  if (!arModulePromise) {
    arModulePromise = import("/assets/js/ar-tryon.js");
  }

  return arModulePromise;
}

function setupLazyFeatureModules() {
  document.addEventListener("click", async (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const designerTrigger = target?.closest("[data-design-studio-entry]");
    const arTrigger = target?.closest("[data-ar-tryon]");

    if (designerTrigger && !designerModulePromise) {
      event.preventDefault();
      event.stopImmediatePropagation();
      await loadDesignerModule();
      designerTrigger.click();
      return;
    }

    if (arTrigger && !arModulePromise) {
      event.preventDefault();
      event.stopImmediatePropagation();
      await loadArModule();
      arTrigger.click();
    }
  }, true);

  if (window.location.hash === "#design-studio") {
    loadDesignerModule();
  }
}

function setupViewportVideos() {
  const videos = [...document.querySelectorAll("video[muted][loop]")];

  if (!videos.length) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    videos.forEach((video) => video.pause());
    return;
  }

  if (!("IntersectionObserver" in window)) {
    videos.slice(0, 1).forEach((video) => video.play().catch(() => {}));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;

      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { rootMargin: "240px 0px", threshold: 0.01 });

  videos.forEach((video) => observer.observe(video));
}

function createGuideContext(answers) {
  return {
    occasion: answers.occasion || "engagement",
    wear: answers.wear || "daily",
    budget: answers.budget || "simple",
    occasionLabel: formatGuideLabel(answers.occasion || "engagement"),
    wearLabel: formatGuideLabel(answers.wear || "daily"),
    budgetLabel: formatGuideLabel(answers.budget || "simple"),
    budgetFormValue: guideBudgetFormValue(answers.budget)
  };
}

function createCustomDesignHref(state, context = {}) {
  const params = new URLSearchParams();

  Object.entries(state).forEach(([key, value]) => {
    params.set(key, typeof value === "boolean" ? (value ? "1" : "0") : value);
  });

  if (context.occasion) {
    params.set("guide-occasion", context.occasion);
  }

  if (context.wear) {
    params.set("guide-wear", context.wear);
  }

  if (context.budget) {
    params.set("guide-budget", context.budget);
    params.set("form-budget", context.budgetFormValue || guideBudgetFormValue(context.budget));
  }

  const targetHash = DESIGN_STUDIO_PUBLIC ? "design-studio" : "request-form";
  return `customs.html?${params.toString()}#${targetHash}`;
}

function recommendCustomDirection(answers) {
  const context = createGuideContext(answers);
  const budgetMap = {
    simple: { size: "0.9", weight: "0.9", halo: false, accent: false, scope: "clean and focused", priceLow: 600, priceHigh: 1100, complexity: 28, weeks: "3–4" },
    detailed: { size: "1.2", weight: "1", halo: true, accent: true, scope: "detailed but balanced", priceLow: 1200, priceHigh: 4800, complexity: 52, weeks: "4–6" },
    premium: { size: "1.5", weight: "1.12", halo: true, accent: true, scope: "premium and refined", priceLow: 5200, priceHigh: 9800, complexity: 74, weeks: "5–7" },
    statement: { size: "1.9", weight: "1.28", halo: true, accent: true, scope: "bold and high-impact", priceLow: 10500, priceHigh: 22000, complexity: 92, weeks: "6–9" }
  };
  const tierMap = {
    refined: { sizeMul: 0.78, weightMul: 0.92, halo: false, accent: false, finish: "Soft Satin", complexityDelta: -18, priceMul: 0.72, label: "Refined", note: "Pared back: smaller centre, clean profile, lower spend." },
    signature: { sizeMul: 1.0, weightMul: 1.0, halo: null, accent: null, finish: null, complexityDelta: 0, priceMul: 1.0, label: "Signature", note: "On-brief: balanced proportions matched to your answers." },
    statement: { sizeMul: 1.28, weightMul: 1.12, halo: true, accent: true, finish: "High Polish", complexityDelta: 16, priceMul: 1.45, label: "Statement", note: "Maxed up: larger stone, framed detail, bolder presence." }
  };
  const budget = budgetMap[answers.budget] || budgetMap.simple;
  const tier = tierMap[answers.tier] || tierMap.signature;
  const base = {
    piece: answers.piece || "Ring",
    metal: answers.metal || "White Gold",
    setting: budget.halo ? "Prong" : "Bezel",
    finish: tier.finish || (answers.budget === "simple" ? "Soft Satin" : "High Polish"),
    shape: "Oval",
    stone: "Clear Diamond",
    size: (Number(budget.size) * tier.sizeMul).toFixed(2),
    weight: (Number(budget.weight) * tier.weightMul).toFixed(2),
    halo: tier.halo !== null ? tier.halo : budget.halo,
    accent: tier.accent !== null ? tier.accent : budget.accent,
    lighting: answers.wear === "statement" ? "Flash" : "Showroom",
    engraving: ""
  };

  // Mood overrides — adjust shape, setting, finish for the chosen vibe.
  const mood = answers.mood || "modern";
  if (mood === "vintage") {
    base.setting = "Bezel";
    base.finish = tier.label === "Statement" ? "Milgrain Edge" : "Soft Satin";
    base.shape = "Cushion";
  } else if (mood === "romantic") {
    base.shape = "Oval";
    base.finish = tier.label === "Refined" ? "Soft Satin" : "High Polish";
    base.stone = answers.metal === "Rose Gold" ? "Blush Sapphire" : base.stone;
  } else if (mood === "bold") {
    base.shape = "Pear";
    base.finish = "High Polish";
    base.lighting = "Flash";
  }

  // Piece-only mood/occasion tweaks (only when user did NOT explicitly pick a piece).
  if (!answers.piece) {
    if (answers.occasion === "gift") {
      base.piece = answers.wear === "daily" || answers.wear === "delicate" ? "Necklace" : "Bracelet";
      base.shape = "Round";
      base.setting = "Bezel";
      base.stone = answers.metal === "Rose Gold" ? "Blush Sapphire" : "Clear Diamond";
    }
    if (answers.occasion === "event" || answers.wear === "statement") {
      base.piece = answers.occasion === "event" ? "Earrings" : "Ring";
      base.shape = "Pear";
      base.stone = answers.metal === "Yellow Gold" ? "Emerald Green" : "Blue Sapphire";
      base.finish = "High Polish";
      base.lighting = "Flash";
    }
    if (answers.occasion === "personal") {
      base.piece = answers.wear === "daily" ? "Bracelet" : "Necklace";
      base.shape = answers.wear === "delicate" ? "Round" : "Cushion";
      base.setting = "Bezel";
    }
  }

  const title = `${base.shape} ${base.stone} ${base.piece}`;
  const copy = `${budget.scope.charAt(0).toUpperCase()}${budget.scope.slice(1)} direction in ${base.metal.toLowerCase()}, tuned for ${answers.wear} wear.`;
  const priceLow = Math.round(budget.priceLow * tier.priceMul);
  const priceHigh = Math.round(budget.priceHigh * tier.priceMul);
  const complexity = Math.max(10, Math.min(100, budget.complexity + tier.complexityDelta));
  const priceRange = `${money.format(priceLow)} – ${money.format(priceHigh)}`;

  return {
    state: base,
    context,
    title,
    copy,
    tier: tier.label,
    tierNote: tier.note,
    priceLow,
    priceHigh,
    priceRange,
    complexity,
    timeline: `${budget.weeks} weeks`,
    specs: [
      ["Piece", base.piece],
      ["Stone", `${base.size} ct feel ${base.shape} ${base.stone}`],
      ["Metal", base.metal],
      ["Detail", `${base.setting}, ${base.halo ? "framed" : "clean"}, ${base.accent ? "accent stones" : "minimal profile"}`],
      ["Range", priceRange],
      ["Timeline", `${budget.weeks} weeks`]
    ]
  };
}

function recommendCustomDirections(answers) {
  return ["refined", "signature", "statement"].map((tier) => recommendCustomDirection({ ...answers, tier }));
}

function applyGuideRecommendationToForm(recommendation) {
  const form = document.querySelector("[data-custom-form]");

  if (!form || !recommendation) {
    return;
  }

  const { state, context } = recommendation;
  const setValue = (selector, value) => {
    const field = form.querySelector(selector);

    if (!field) {
      return;
    }

    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    field.closest(".form-field")?.classList.add("is-prefilled");
  };
  const selectedBudget = form.querySelector(`input[name="budget"][value="${context.budgetFormValue}"]`);
  const description = form.querySelector("#description");
  const guideSummary = [
    `${recommendation.title}`,
    `Occasion: ${context.occasionLabel}`,
    `Wear: ${context.wearLabel}`,
    `Budget direction: ${context.budgetLabel}`,
    `Metal: ${state.metal}`,
    `Stone: ${state.size} ct feel ${state.shape} ${state.stone}`,
    `Detail: ${state.setting}, ${state.halo ? "diamond frame" : "clean center"}, ${state.accent ? "accent stones" : "minimal profile"}`
  ].join("\n");

  setValue("#piece-type", state.piece);
  setValue("#metal-preference", `${state.metal}, ${state.finish}`);
  setValue("#stone-preference", `${state.size} ct feel ${state.stone}, ${state.shape}`);
  setValue("#finish-preference", `${state.setting} setting, ${state.halo ? "diamond frame" : "unframed center stone"}, ${state.accent ? "accent stones" : "clean profile"}`);
  setValue("#dimensions", `${state.piece} designer scale: ${state.size} ct feel, ${context.wearLabel.toLowerCase()} wear`);
  setValue("#occasion", `${context.occasionLabel} / ${context.wearLabel} wear`);

  if (selectedBudget) {
    selectedBudget.checked = true;
    selectedBudget.dispatchEvent(new Event("change", { bubbles: true }));
    selectedBudget.closest(".form-field")?.classList.add("is-prefilled");
  }

  if (description) {
    const existing = description.value.replace(/\n*\[Guided Direction\][\s\S]*?(?=\n\n\[|$)/u, "").trim();
    description.value = `${existing ? `${existing}\n\n` : ""}[Guided Direction]\n${guideSummary}`;
    description.dispatchEvent(new Event("input", { bubbles: true }));
    description.closest(".form-field")?.classList.add("is-prefilled");
  }
}

function productInquiryFromParams() {
  const params = new URLSearchParams(window.location.search);
  const key = params.get("inquire") || params.get("product");

  if (!key) {
    return null;
  }

  const normalized = key.trim().toLowerCase();
  return products.find((product) => (
    product.slug === normalized ||
    product.name.toLowerCase() === normalized
  )) || null;
}

function budgetValueForProduct(product) {
  const price = Number(product.price);

  if (!Number.isFinite(price)) {
    return "";
  }

  if (price >= 10000) return "10000 plus";
  if (price >= 5000) return "5000 to 10000";
  if (price >= 1000) return "1000 to 5000";
  return "500 to 1000";
}

function applyProductInquiryToForm(product) {
  const form = document.querySelector("[data-custom-form]");

  if (!form || !product) {
    return;
  }

  const setValue = (selector, value) => {
    const field = form.querySelector(selector);

    if (!field || !value) {
      return;
    }

    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    field.closest(".form-field")?.classList.add("is-prefilled");
  };

  const specs = [
    ["Product", product.name],
    ["Short Description", product.shortDescription],
    ["Stone", productSpecValue(product, "Stone")],
    ["Diamond Quality", productSpecValue(product, "Diamond Quality")],
    ["Design", productSpecValue(product, "Design")],
    ["Metal", productSpecValue(product, "Metal")],
    ["Available Options", productSpecValue(product, "Available Options")],
    ["Pricing", productSpecValue(product, "Pricing") || productPriceLabel(product)]
  ].filter(([, value]) => value);

  const inquirySummary = specs.map(([label, value]) => `${label}: ${value}`).join("\n");
  const description = form.querySelector("#description");
  const designSummary = form.querySelector("[data-design-summary-field]");
  const selectedBudget = form.querySelector(`input[name="budget"][value="${budgetValueForProduct(product)}"]`);

  setValue("#piece-type", productPieceType(product));
  setValue("#metal-preference", productSpecValue(product, "Metal"));
  setValue("#stone-preference", productSpecValue(product, "Stone"));
  setValue("#finish-preference", productSpecValue(product, "Design"));
  setValue("#dimensions", productSpecValue(product, "Available Options"));

  if (selectedBudget) {
    selectedBudget.checked = true;
    selectedBudget.dispatchEvent(new Event("change", { bubbles: true }));
    selectedBudget.closest(".form-field")?.classList.add("is-prefilled");
  }

  if (designSummary) {
    designSummary.value = inquirySummary;
  }

  if (description) {
    const existing = description.value.replace(/\n*\[Piece Inquiry\][\s\S]*?(?=\n\n\[|$)/u, "").trim();
    description.value = `${existing ? `${existing}\n\n` : ""}[Piece Inquiry]\n${inquirySummary}`;
    description.dispatchEvent(new Event("input", { bubbles: true }));
    description.closest(".form-field")?.classList.add("is-prefilled");
  }
}

function recommendationFromGuideParams() {
  const params = new URLSearchParams(window.location.search);

  if (!params.has("guide-occasion") && !params.has("guide-wear") && !params.has("guide-budget")) {
    return null;
  }

  return recommendCustomDirection({
    occasion: params.get("guide-occasion") || "engagement",
    wear: params.get("guide-wear") || "daily",
    budget: params.get("guide-budget") || "simple",
    metal: params.get("metal") || "White Gold"
  });
}

function setupCustomGuide() {
  const guide = document.querySelector("[data-custom-guide]");

  if (!guide) {
    return;
  }

  const form = guide.querySelector(".custom-guide__form");
  const cardsHost = guide.querySelector("[data-guide-directions]");
  const summary = guide.querySelector("[data-guide-summary]");

  if (!form || !cardsHost) {
    return;
  }

  const selected = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || "";

  const renderCard = (rec, isFeatured) => {
    const article = document.createElement("article");
    article.className = `guide-direction guide-direction--${rec.tier.toLowerCase()}${isFeatured ? " guide-direction--featured" : ""}`;
    article.dataset.guideTier = rec.tier;

    const header = document.createElement("header");
    header.className = "guide-direction__header";
    header.innerHTML = `
      <span class="guide-direction__tag">${rec.tier}</span>
      <h3>${rec.title}</h3>
    `;

    const note = document.createElement("p");
    note.className = "guide-direction__note";
    note.textContent = rec.tierNote;

    const price = document.createElement("div");
    price.className = "guide-direction__price";
    price.innerHTML = `<small>From</small><strong>${rec.priceRange}</strong>`;

    const meter = document.createElement("div");
    meter.className = "guide-meter";
    meter.innerHTML = `
      <div class="guide-meter__row"><span>Complexity</span><span class="guide-meter__bar"><i style="width:${rec.complexity}%"></i></span></div>
      <div class="guide-meter__row"><span>Timeline</span><strong>${rec.timeline}</strong></div>
    `;

    const dl = document.createElement("dl");
    dl.className = "guide-direction__specs";
    rec.specs.slice(0, 4).forEach(([label, value]) => {
      const wrap = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      wrap.append(dt, dd);
      dl.appendChild(wrap);
    });

    const actions = document.createElement("div");
    actions.className = "guide-direction__actions";
    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = DESIGN_STUDIO_PUBLIC ? "button-secondary" : "button";
    apply.textContent = "Use for Request";
    apply.addEventListener("click", () => {
      applyGuideRecommendationToForm(rec);
      document.querySelector("#request-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    if (DESIGN_STUDIO_PUBLIC) {
      const open = document.createElement("a");
      open.className = "button";
      open.href = createCustomDesignHref(rec.state, rec.context);
      open.textContent = "Open in Studio";
      actions.append(open);
    }
    actions.append(apply);

    article.append(header, note, price, meter, dl, actions);
    return article;
  };

  const update = () => {
    const answers = {
      occasion: selected("guide-occasion"),
      wear: selected("guide-wear"),
      budget: selected("guide-budget"),
      metal: selected("guide-metal"),
      piece: selected("guide-piece"),
      mood: selected("guide-mood")
    };
    const directions = recommendCustomDirections(answers);

    cardsHost.replaceChildren(...directions.map((rec) => renderCard(rec, rec.tier === "Signature")));

    if (summary) {
      const ctx = directions[0].context;
      summary.textContent = `${answers.piece || "Piece"} • ${ctx.occasionLabel} • ${ctx.wearLabel} wear • ${ctx.budgetLabel} budget • ${formatGuideLabel(answers.mood || "Modern")} mood`;
    }
  };

  form.addEventListener("change", update);
  update();
}

function setupContextualCustomFields() {
  const select = document.querySelector("#piece-type");
  const panels = document.querySelectorAll("[data-context-panel]");
  const dimensionsLabel = document.querySelector('label[for="dimensions"]');
  const dimensions = document.querySelector("#dimensions");
  const labels = {
    Ring: "Ring Size or Dimensions",
    Necklace: "Necklace Length or Pendant Scale",
    Bracelet: "Bracelet Length or Wrist Size",
    Earrings: "Earring Size or Drop Length",
    Other: "Dimensions or Custom Notes"
  };
  const placeholders = {
    Ring: "Size 7, band width, centre stone scale",
    Necklace: "16 inch chain, pendant scale, neckline",
    Bracelet: "7 inch bracelet, wrist size, clasp preference",
    Earrings: "Stud size, drop length, backing preference",
    Other: "Approximate dimensions, placement, or use"
  };

  if (!select || !panels.length) {
    return;
  }

  const update = () => {
    const selectedPiece = select.value || "Ring";

    panels.forEach((panel) => {
      const isActive = panel.dataset.contextPanel === selectedPiece;
      panel.hidden = !isActive;
      panel.querySelectorAll("input, select, textarea").forEach((field) => {
        field.disabled = !isActive;
      });
    });

    if (dimensionsLabel) {
      dimensionsLabel.textContent = labels[selectedPiece] || labels.Other;
    }

    if (dimensions) {
      dimensions.placeholder = placeholders[selectedPiece] || placeholders.Other;
    }
  };

  select.addEventListener("change", update);
  update();
}

function setupFaqSearch() {
  const search = document.querySelector("[data-faq-search]");
  const items = document.querySelectorAll(".faq-item");

  if (!search || !items.length) {
    return;
  }

  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();

    items.forEach((item) => {
      const matches = item.textContent.toLowerCase().includes(query);
      item.hidden = Boolean(query && !matches);
    });
  });
}

function setupBudgetEstimator() {
  const estimator = document.querySelector("[data-budget-estimator]");
  const form = document.querySelector("[data-custom-form]");

  if (!estimator || !form) {
    return;
  }

  const title = estimator.querySelector("[data-budget-title]");
  const copy = estimator.querySelector("[data-budget-copy]");
  const meter = estimator.querySelector("[data-budget-meter]");
  const specs = estimator.querySelector("[data-budget-specs]");

  const update = () => {
    const selectedBudget = form.querySelector('input[name="budget"]:checked')?.value || "1000 to 5000";
    const profile = budgetProfiles[selectedBudget] || budgetProfiles["1000 to 5000"];
    const piece = form.querySelector("#piece-type")?.value || "Custom piece";
    const metal = form.querySelector("#metal-preference")?.value || "metal to confirm";
    const stone = form.querySelector("#stone-preference")?.value || "stone direction to confirm";

    if (title) {
      title.textContent = profile.title;
    }

    if (copy) {
      copy.textContent = profile.copy;
    }

    if (meter) {
      meter.style.width = profile.progress;
    }

    if (specs) {
      specs.replaceChildren();
      [
        ["Piece", piece],
        ["Metal", metal],
        ["Stone", stone],
        ...profile.specs
      ].forEach(([label, value]) => {
        const wrapper = document.createElement("div");
        const term = document.createElement("dt");
        const detail = document.createElement("dd");

        term.textContent = label;
        detail.textContent = value;
        wrapper.append(term, detail);
        specs.appendChild(wrapper);
      });
    }
  };

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}

function setupGemstoneGuide() {
  const guide = document.querySelector("[data-gemstone-guide]");

  if (!guide) {
    return;
  }

  const cards = Array.from(guide.querySelectorAll("[data-gemstone]"));
  const title = guide.querySelector("[data-gemstone-title]");
  const copy = guide.querySelector("[data-gemstone-copy]");
  const specs = guide.querySelector("[data-gemstone-specs]");
  const visual = guide.querySelector("[data-gemstone-visual]");
  const apply = guide.querySelector("[data-gemstone-apply]");
  const metersHost = guide.querySelector("[data-gemstone-meters]");
  const cutsHost = guide.querySelector("[data-gemstone-cuts]");
  const careHost = guide.querySelector("[data-gemstone-care]");
  const sourcingHost = guide.querySelector("[data-gemstone-sourcing]");
  const suitsHost = guide.querySelector("[data-gemstone-suits]");
  const filterButtons = Array.from(guide.querySelectorAll("[data-gemstone-filter]"));
  const compareToggle = guide.querySelector("[data-gemstone-compare-toggle]");
  const compareDrawer = guide.querySelector("[data-gemstone-compare]");
  const compareClose = guide.querySelector("[data-gemstone-compare-close]");

  let compareMode = false;
  const compareSet = new Set();

  const meterLabels = {
    hardness: "Hardness",
    brilliance: "Brilliance",
    durability: "Durability",
    saturation: "Colour"
  };

  const renderMeters = (host, data) => {
    if (!host) return;
    host.replaceChildren();
    Object.entries(data.meters || {}).forEach(([key, value]) => {
      const row = document.createElement("div");
      row.className = "gem-meter__row";
      row.innerHTML = `<span>${meterLabels[key] || key}</span><span class="gem-meter__bar"><i style="width:${value}%"></i></span><em>${value}</em>`;
      host.appendChild(row);
    });
  };

  const renderChips = (host, items, opts = {}) => {
    if (!host) return;
    host.replaceChildren();
    (items || []).forEach((item) => {
      const chip = document.createElement(opts.href ? "a" : "span");
      chip.className = "gem-chip";
      chip.textContent = item;
      if (opts.href) chip.href = opts.href(item);
      host.appendChild(chip);
    });
  };

  const update = (name) => {
    const guideData = gemstoneGuides[name] || gemstoneGuides["Clear Diamond"];

    cards.forEach((card) => card.classList.toggle("is-active", card.dataset.gemstone === name));

    if (title) title.textContent = name;
    if (copy) copy.textContent = guideData.copy;
    if (careHost) careHost.textContent = guideData.careNotes || "";
    if (sourcingHost) sourcingHost.textContent = guideData.sourcing || "";

    if (visual) {
      visual.dataset.gemstoneVisual = name.toLowerCase().replace(/\s+/g, "-");
      visual.style.setProperty("--gemstone-image", `url("${guideData.image}")`);
      visual.style.setProperty("--gemstone-focus", guideData.focus || "50% 50%");
    }

    renderMeters(metersHost, guideData);
    renderChips(suitsHost, guideData.suits);
    renderChips(cutsHost, guideData.bestCuts, DESIGN_STUDIO_PUBLIC ? {
      href: (shape) => `customs.html?stone=${encodeURIComponent(name)}&shape=${encodeURIComponent(shape)}#design-studio`
    } : {});

    if (apply) {
      apply.hidden = !DESIGN_STUDIO_PUBLIC;
      if (DESIGN_STUDIO_PUBLIC) {
        const params = new URLSearchParams({ stone: name, shape: (guideData.bestCuts && guideData.bestCuts[0]) || "Oval" });
        apply.href = `customs.html?${params.toString()}#design-studio`;
      }
    }

    if (specs) {
      specs.replaceChildren();
      [["Mohs hardness", `${guideData.mohs} / 10`], ...guideData.specs].forEach(([label, value]) => {
        const wrap = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = label;
        dd.textContent = value;
        wrap.append(dt, dd);
        specs.appendChild(wrap);
      });
    }
  };

  const applyFilter = (palette) => {
    cards.forEach((card) => {
      const data = gemstoneGuides[card.dataset.gemstone];
      const matches = palette === "all" || !data || data.palette === palette;
      card.hidden = !matches;
    });
    filterButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.gemstoneFilter === palette));
  };

  const renderCompareDrawer = () => {
    if (!compareDrawer) return;
    const list = compareDrawer.querySelector("[data-compare-list]");
    if (!list) return;
    list.replaceChildren();
    Array.from(compareSet).forEach((name) => {
      const data = gemstoneGuides[name];
      if (!data) return;
      const col = document.createElement("article");
      col.className = "gem-compare__col";
      col.innerHTML = `
        <header style="background-image:url('${data.image}')"><strong>${name}</strong></header>
        <dl>
          <div><dt>Mohs</dt><dd>${data.mohs} / 10</dd></div>
          <div><dt>Hardness</dt><dd><span class="gem-meter__bar"><i style="width:${data.meters.hardness}%"></i></span></dd></div>
          <div><dt>Brilliance</dt><dd><span class="gem-meter__bar"><i style="width:${data.meters.brilliance}%"></i></span></dd></div>
          <div><dt>Durability</dt><dd><span class="gem-meter__bar"><i style="width:${data.meters.durability}%"></i></span></dd></div>
          <div><dt>Colour</dt><dd><span class="gem-meter__bar"><i style="width:${data.meters.saturation}%"></i></span></dd></div>
          <div><dt>Best with</dt><dd>${(data.bestMetals || []).join(", ")}</dd></div>
          <div><dt>Care</dt><dd>${data.careNotes || ""}</dd></div>
        </dl>
      `;
      list.appendChild(col);
    });
    compareDrawer.hidden = compareSet.size === 0;
    compareDrawer.classList.toggle("is-open", compareSet.size > 0);
  };

  const setCompareMode = (on) => {
    compareMode = !!on;
    guide.classList.toggle("is-comparing", compareMode);
    if (compareToggle) {
      compareToggle.setAttribute("aria-pressed", String(compareMode));
      compareToggle.textContent = compareMode ? "Done Comparing" : "Compare Stones";
    }
    if (!compareMode) {
      compareSet.clear();
      cards.forEach((card) => card.classList.remove("is-comparing"));
      if (compareDrawer) {
        compareDrawer.hidden = true;
        compareDrawer.classList.remove("is-open");
      }
    } else {
      renderCompareDrawer();
    }
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const name = card.dataset.gemstone;
      if (compareMode) {
        if (compareSet.has(name)) {
          compareSet.delete(name);
          card.classList.remove("is-comparing");
        } else {
          if (compareSet.size >= 2) {
            const first = compareSet.values().next().value;
            compareSet.delete(first);
            cards.find((c) => c.dataset.gemstone === first)?.classList.remove("is-comparing");
          }
          compareSet.add(name);
          card.classList.add("is-comparing");
        }
        renderCompareDrawer();
      } else {
        update(name);
      }
    });
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.gemstoneFilter));
  });

  compareToggle?.addEventListener("click", () => setCompareMode(!compareMode));
  compareClose?.addEventListener("click", () => setCompareMode(false));

  applyFilter("all");
  update(cards[0]?.dataset.gemstone || "Clear Diamond");
}

function setupPrivateInquiry() {
  const toggle = document.querySelector("[data-private-inquiry-toggle]");
  const fields = document.querySelector("[data-private-inquiry-fields]");

  if (!toggle || !fields) {
    return;
  }

  const update = () => {
    fields.hidden = !toggle.checked;
    fields.querySelectorAll("input, select, textarea").forEach((field) => {
      field.disabled = !toggle.checked;
    });
  };

  toggle.addEventListener("change", update);
  update();
}

function setupAppointmentModal() {
  const modal = document.querySelector("[data-appointment-modal]");
  if (!modal) {
    return;
  }

  const form = modal.querySelector("[data-appointment-form]");
  const triggers = document.querySelectorAll("[data-appointment-trigger]");

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  const openModal = (selectedItem) => {
    if (form) {
      form.dataset.selectedItem = selectedItem;
      syncSelectedPiece(form);
      const status = form.querySelector("[data-form-status]");
      if (status) {
        status.textContent = "";
      }
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openModal(trigger.dataset.appointmentTrigger || "Selected piece");
    });
  });

  modal.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}

function shouldAutosaveField(field) {
  if (!field.name || field.type === "file" || field.type === "hidden") {
    return false;
  }

  return !["bot-field"].includes(field.name);
}

function readCustomFormDraft() {
  try {
    const value = window.localStorage.getItem(CUSTOM_FORM_DRAFT_KEY);

    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function writeCustomFormDraft(form) {
  try {
    const draft = {};

    form.querySelectorAll("input, select, textarea").forEach((field) => {
      if (!shouldAutosaveField(field)) {
        return;
      }

      if (field.type === "radio") {
        if (field.checked) {
          draft[field.name] = field.value;
        } else if (!(field.name in draft)) {
          draft[field.name] = "";
        }
        return;
      }

      if (field.type === "checkbox") {
        draft[field.name] = field.checked;
        return;
      }

      draft[field.name] = field.value;
    });

    window.localStorage.setItem(CUSTOM_FORM_DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    // Storage can be blocked in private browsing; the form still works normally.
  }
}

function clearCustomFormDraft() {
  try {
    window.localStorage.removeItem(CUSTOM_FORM_DRAFT_KEY);
  } catch (error) {
    // Nothing to clear if storage is unavailable.
  }
}

function restoreCustomFormDraft(form) {
  const draft = readCustomFormDraft();

  if (!draft || typeof draft !== "object") {
    return;
  }

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    if (!shouldAutosaveField(field) || !(field.name in draft)) {
      return;
    }

    const value = draft[field.name];

    if (field.type === "radio") {
      field.checked = field.value === value;
    } else if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value;
    }
  });

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    if (shouldAutosaveField(field) && field.name in draft) {
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

function setupCustomForm() {
  document.querySelectorAll("[data-custom-form]").forEach((form) => {
    const status = form.querySelector("[data-form-status]") || form.parentElement?.querySelector("[data-form-status]");
    const submitButton = form.querySelector('button[type="submit"]');
    const defaultSubmitLabel = submitButton ? submitButton.textContent : "Submit";

    restoreCustomFormDraft(form);
    applyGuideRecommendationToForm(recommendationFromGuideParams());
    applyProductInquiryToForm(productInquiryFromParams());
    form.addEventListener("input", () => writeCustomFormDraft(form));
    form.addEventListener("change", () => writeCustomFormDraft(form));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const generatedDesignFile = getGeneratedDesignFile(form);

      if (generatedDesignFile) {
        formData.set("inspiration-upload", generatedDesignFile, generatedDesignFile.name);
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      if (status) {
        status.textContent = "Submitting your request...";
      }

      try {
        const response = await fetch("/", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          throw new Error("Form submission failed");
        }

        form.reset();
        clearCustomFormDraft();
        form.querySelectorAll("input, select, textarea").forEach((field) => {
          field.dispatchEvent(new Event("change", { bubbles: true }));
        });

        if (form.hasAttribute("data-appointment-form")) {
          syncSelectedPiece(form);
        }

        if (status) {
          status.textContent = form.hasAttribute("data-appointment-form")
            ? "Appointment request received. We'll follow up to confirm the next step."
            : "Submission received. We'll review it and follow up soon.";
        }
      } catch (error) {
        if (status) {
          status.textContent = "Submission failed. Please try again in a moment or email us directly.";
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = defaultSubmitLabel;
        }
      }
    });
  });
}

const dreamRenderMessages = [
  "Creating the prompt",
  "Reading your specification",
  "Shaping the band",
  "Setting the stone",
  "Balancing the prongs",
  "Lighting the studio",
  "Rendering the final image"
];

function getNamedFormValue(form, name) {
  const field = form?.elements?.[name];

  if (!field || !("value" in field)) {
    return "";
  }

  return field.value.trim();
}

async function postNetlifyFormData(formData) {
  const response = await fetch("/", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Netlify form submission failed");
  }
}

function dreamLeadSheetPayload(form) {
  return {
    name: getNamedFormValue(form, "dream-name"),
    email: getNamedFormValue(form, "dream-email"),
    phone: getNamedFormValue(form, "dream-phone"),
    page: "Dream Design"
  };
}

async function postDreamLeadToSheet(form) {
  const response = await fetch("/.netlify/functions/send-dream-lead-sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dreamLeadSheetPayload(form))
  });

  if (!response.ok) {
    throw new Error("Google Sheets lead submission failed");
  }
}

function dreamContactSignature(form) {
  return JSON.stringify({
    name: getNamedFormValue(form, "dream-name"),
    email: getNamedFormValue(form, "dream-email"),
    phone: getNamedFormValue(form, "dream-phone")
  });
}

function dreamDesignPayload(form) {
  return {
    pieceType: getNamedFormValue(form, "dream-piece-type"),
    metal: getNamedFormValue(form, "dream-metal"),
    stone: getNamedFormValue(form, "dream-stone"),
    style: getNamedFormValue(form, "dream-style"),
    customSpec: getNamedFormValue(form, "dream-custom-spec")
  };
}

function dataUrlFromBase64(base64, mimeType = "image/png") {
  if (/^data:/u.test(base64)) {
    return base64;
  }

  return `data:${mimeType};base64,${base64}`;
}

function dataUrlToFile(dataUrl, fileName) {
  const [header, body] = dataUrl.split(",");
  const mimeType = header.match(/^data:([^;]+);base64$/u)?.[1] || "image/png";
  const binary = window.atob(body);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mimeType });
}

async function dreamImageFileFromResponse(result) {
  const fileName = `dream-design-${Date.now()}.png`;

  if (result.imageBase64) {
    const dataUrl = dataUrlFromBase64(result.imageBase64, result.mimeType || "image/png");
    return {
      file: dataUrlToFile(dataUrl, fileName),
      src: dataUrl
    };
  }

  if (result.imageUrl) {
    const response = await fetch(result.imageUrl);

    if (!response.ok) {
      throw new Error("Generated image could not be downloaded");
    }

    const blob = await response.blob();
    return {
      file: new File([blob], fileName, { type: blob.type || "image/png" }),
      src: URL.createObjectURL(blob)
    };
  }

  throw new Error("The generator did not return an image");
}

function appendDreamFormValues(formData, leadForm, designForm, result, imageFile) {
  const values = {
    "dream-name": getNamedFormValue(leadForm, "dream-name"),
    "dream-email": getNamedFormValue(leadForm, "dream-email"),
    "dream-phone": getNamedFormValue(leadForm, "dream-phone"),
    "dream-piece-type": getNamedFormValue(designForm, "dream-piece-type"),
    "dream-metal": getNamedFormValue(designForm, "dream-metal"),
    "dream-stone": getNamedFormValue(designForm, "dream-stone"),
    "dream-style": getNamedFormValue(designForm, "dream-style"),
    "dream-custom-spec": getNamedFormValue(designForm, "dream-custom-spec"),
    "dream-prompt": result.prompt || "",
    "dream-negative-prompt": result.negativePrompt || ""
  };

  Object.entries(values).forEach(([name, value]) => {
    formData.set(name, value);
  });

  formData.set("generated-image", imageFile, imageFile.name);
}

function setDreamBusyState(root, busy) {
  root.classList.toggle("is-generating", busy);
  root.querySelectorAll("[data-dream-lead-submit], [data-dream-generate-submit], [data-dream-retry]").forEach((button) => {
    button.disabled = busy;
  });
}

function startDreamRenderLoop(root) {
  const status = root.querySelector("[data-dream-render-status]");
  let index = 0;

  if (status) {
    status.textContent = dreamRenderMessages[index];
  }

  return window.setInterval(() => {
    index = (index + 1) % dreamRenderMessages.length;

    if (status) {
      status.textContent = dreamRenderMessages[index];
    }
  }, 1300);
}

function setupDreamGenerator() {
  const root = document.querySelector("[data-dream-generator]");

  if (!root) {
    return;
  }

  const leadForm = root.querySelector("[data-dream-lead-form]");
  const designForm = root.querySelector("[data-dream-design-form]");
  const resultForm = document.querySelector("[data-dream-result-form]");
  const designFieldset = root.querySelector("[data-dream-design-fieldset]");
  const leadButton = root.querySelector("[data-dream-lead-submit]");
  const generateButton = root.querySelector("[data-dream-generate-submit]");
  const retryButton = root.querySelector("[data-dream-retry]");
  const leadStatus = root.querySelector("[data-dream-lead-status]");
  const designStatus = root.querySelector("[data-dream-design-status]");
  const renderStatus = root.querySelector("[data-dream-render-status]");
  const resultTitle = root.querySelector("[data-dream-result-title]");
  const resultCopy = root.querySelector("[data-dream-result-copy]");
  const resultImage = root.querySelector("[data-dream-result-image]");

  if (!leadForm || !designForm || !resultForm || !designFieldset) {
    return;
  }

  let contactSaved = false;
  let savedSignature = "";
  let renderLoop = null;

  const lockDesign = (message = "") => {
    contactSaved = false;
    savedSignature = "";
    designFieldset.disabled = true;
    root.classList.remove("is-contact-saved");

    if (designStatus) {
      designStatus.textContent = message;
    }

    if (leadButton) {
      leadButton.textContent = "Save Contact";
    }
  };

  const unlockDesign = () => {
    contactSaved = true;
    savedSignature = dreamContactSignature(leadForm);
    designFieldset.disabled = false;
    root.classList.add("is-contact-saved");

    if (leadStatus) {
      leadStatus.textContent = "Contact saved. Choose your dream design details.";
    }

    if (designStatus) {
      designStatus.textContent = "Ready to generate and send your concept.";
    }

    if (renderStatus) {
      renderStatus.textContent = "Ready to render";
    }

    if (leadButton) {
      leadButton.textContent = "Contact Saved";
    }
  };

  leadForm.addEventListener("input", () => {
    if (contactSaved && dreamContactSignature(leadForm) !== savedSignature) {
      lockDesign("Save your updated contact details to continue.");
    }
  });

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!leadForm.reportValidity()) {
      return;
    }

    if (leadButton) {
      leadButton.disabled = true;
      leadButton.textContent = "Saving...";
    }

    if (leadStatus) {
      leadStatus.textContent = "Saving your contact details...";
    }

    try {
      await postNetlifyFormData(new FormData(leadForm));
      postDreamLeadToSheet(leadForm).catch(() => {});
      unlockDesign();
    } catch (error) {
      if (leadStatus) {
        leadStatus.textContent = "Contact could not be saved. Please try again.";
      }
    } finally {
      if (leadButton) {
        leadButton.disabled = false;
      }
    }
  });

  designForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactSaved) {
      leadForm.requestSubmit();
      return;
    }

    if (!designForm.reportValidity()) {
      return;
    }

    setDreamBusyState(root, true);
    if (retryButton) {
      retryButton.hidden = true;
    }

    if (generateButton) {
      generateButton.textContent = "Generating...";
    }

    if (designStatus) {
      designStatus.textContent = "Generating your design image...";
    }

    if (resultTitle) {
      resultTitle.textContent = "Rendering your concept";
    }

    if (resultCopy) {
      resultCopy.textContent = "The render chamber is shaping the prompt into a jewellery image.";
    }

    renderLoop = startDreamRenderLoop(root);

    try {
      const generationResponse = await fetch("/.netlify/functions/generate-dream-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dreamDesignPayload(designForm))
      });
      const generationResult = await generationResponse.json().catch(() => ({}));

      if (!generationResponse.ok) {
        throw new Error(generationResult.message || "The image could not be generated yet.");
      }

      const imageResult = await dreamImageFileFromResponse(generationResult);

      if (resultImage) {
        resultImage.src = imageResult.src;
        resultImage.alt = "Generated custom jewellery design";
      }

      const resultFormData = new FormData(resultForm);
      appendDreamFormValues(resultFormData, leadForm, designForm, generationResult, imageResult.file);
      await postNetlifyFormData(resultFormData);

      if (renderStatus) {
        renderStatus.textContent = "Design sent";
      }

      if (designStatus) {
        designStatus.textContent = "Design generated and sent. We will follow up soon.";
      }

      if (resultTitle) {
        resultTitle.textContent = "Your dream design is sent";
      }

      if (resultCopy) {
        resultCopy.textContent = "The generated image, prompt, and your details were sent with your request.";
      }
    } catch (error) {
      if (retryButton) {
        retryButton.hidden = false;
      }

      if (renderStatus) {
        renderStatus.textContent = "Generator needs attention";
      }

      if (designStatus) {
        designStatus.textContent = error.message || "Generation failed. Please try again.";
      }

      if (resultTitle) {
        resultTitle.textContent = "The image did not generate";
      }

      if (resultCopy) {
        resultCopy.textContent = "Your contact details are still saved. Try again once the generator is connected.";
      }
    } finally {
      if (renderLoop) {
        window.clearInterval(renderLoop);
        renderLoop = null;
      }

      setDreamBusyState(root, false);

      if (generateButton) {
        generateButton.textContent = "Generate + Send Design";
      }
    }
  });

  retryButton?.addEventListener("click", () => {
    designForm.requestSubmit();
  });

  lockDesign();
}

function setYear() {
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

let observer;

function applyRevealDelays(scope = document) {
  const groupSelector = ".product-grid, .custom-type-grid, .process-grid, .studio-grid, .value-strip, .custom-entry__steps, .luxury-grid";
  const revealGroups = [];

  if (scope.matches && scope.matches(groupSelector)) {
    revealGroups.push(scope);
  }

  if (scope.querySelectorAll) {
    revealGroups.push(...scope.querySelectorAll(groupSelector));
  }

  revealGroups.forEach((group) => {
    group.querySelectorAll("[data-reveal], article, a").forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 70}ms`);
    });
  });

  if (scope === document) {
    document.querySelectorAll("main > section").forEach((section, sectionIndex) => {
      section.querySelectorAll(":scope > .container > [data-reveal], :scope > .content-width > [data-reveal]").forEach((item, index) => {
        item.style.setProperty("--reveal-delay", `${Math.min(index + sectionIndex % 2, 4) * 60}ms`);
      });
    });
  }
}

function revealVisible() {
  const targets = document.querySelectorAll("[data-reveal]");

  if (!("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15
      }
    );
  }

  targets.forEach((target) => {
    if (!target.classList.contains("is-visible")) {
      observer.observe(target);
    }
  });
}

function setupScrollProgress() {
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  let frame = null;

  const update = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progressValue = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    document.documentElement.style.setProperty("--scroll-progress", progressValue.toFixed(4));
    frame = null;
  };

  const requestUpdate = () => {
    if (frame !== null) {
      return;
    }

    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function setupHeroMotion() {
  const hero = document.querySelector(".hero");
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!hero || mediaQuery.matches) {
    return;
  }

  let frame = null;

  const update = () => {
    const progress = Math.min(Math.max(window.scrollY / Math.max(hero.offsetHeight, 1), 0), 1);
    hero.style.setProperty("--hero-shift", String(Math.round(progress * -34)));
    frame = null;
  };

  const requestUpdate = () => {
    if (frame !== null) {
      return;
    }

    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function setupDepthCards(scope = document) {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (mediaQuery.matches) {
    return;
  }

  const selector = [
    ".product-card",
    ".custom-type-card",
    ".luxury-card",
    ".process-card",
    ".custom-entry__media",
    ".custom-entry__content",
    ".editorial-panel",
    ".gallery-main",
    ".custom-request-panel",
    ".cta-panel",
    ".info-panel"
  ].join(", ");
  const cards = [];

  if (scope.matches && scope.matches(selector)) {
    cards.push(scope);
  }

  if (scope.querySelectorAll) {
    cards.push(...scope.querySelectorAll(selector));
  }

  cards.forEach((card) => {
    if (card.dataset.depthReady === "true") {
      return;
    }

    card.dataset.depthReady = "true";
    card.classList.add("depth-card");

    if (!card.querySelector(":scope > .depth-glare")) {
      const glare = document.createElement("span");
      glare.className = "depth-glare";
      glare.setAttribute("aria-hidden", "true");
      card.appendChild(glare);
    }

    const resetDepth = () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--glare-opacity", "0");
    };

    card.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") {
        return;
      }

      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * 7;
      const tiltY = (x - 0.5) * 8;

      card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
      card.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
      card.style.setProperty("--glare-opacity", "0.42");
    });

    card.addEventListener("pointerleave", resetDepth);
    card.addEventListener("blur", resetDepth, true);
  });
}

function setupMagneticActions(scope = document) {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (mediaQuery.matches) {
    return;
  }

  const selector = ".button, .button-secondary, .header-cta";
  const actions = [];

  if (scope.matches && scope.matches(selector)) {
    actions.push(scope);
  }

  if (scope.querySelectorAll) {
    actions.push(...scope.querySelectorAll(selector));
  }

  actions.forEach((action) => {
    if (action.dataset.magneticReady === "true") {
      return;
    }

    action.dataset.magneticReady = "true";

    const resetMagnet = () => {
      action.style.setProperty("--magnet-x", "0px");
      action.style.setProperty("--magnet-y", "0px");
    };

    action.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") {
        return;
      }

      const rect = action.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 6;
      action.style.setProperty("--magnet-x", `${x.toFixed(2)}px`);
      action.style.setProperty("--magnet-y", `${y.toFixed(2)}px`);
    });

    action.addEventListener("pointerleave", resetMagnet);
    action.addEventListener("blur", resetMagnet);
  });
}

function setupSkipLink() {
  const main = document.querySelector("main");
  if (!main) {
    return;
  }
  if (!main.id) {
    main.id = "main-content";
  }
  if (document.querySelector(".skip-link")) {
    return;
  }
  const link = document.createElement("a");
  link.className = "skip-link";
  link.href = `#${main.id}`;
  link.textContent = "Skip to content";
  document.body.insertBefore(link, document.body.firstChild);
}

function setupToasts() {
  if (window.tjToast) {
    return;
  }
  const stack = document.createElement("div");
  stack.className = "toast-stack";
  stack.setAttribute("role", "status");
  stack.setAttribute("aria-live", "polite");
  document.body.appendChild(stack);

  window.tjToast = (message, options = {}) => {
    if (!message) {
      return;
    }
    const toast = document.createElement("div");
    toast.className = "toast" + (options.tone ? ` toast--${options.tone}` : "");
    toast.textContent = message;
    stack.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("is-visible"));

    const duration = options.duration ?? 2600;
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
      window.setTimeout(() => toast.remove(), 400);
    }, duration);
  };
}

function setupBackToTop() {
  if (document.querySelector("[data-back-to-top]")) {
    return;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top";
  button.setAttribute("aria-label", "Back to top");
  button.dataset.backToTop = "";
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5L12 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M5 12L12 5L19 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  document.body.appendChild(button);

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });

  let frame = null;
  const update = () => {
    button.classList.toggle("is-visible", window.scrollY > 600);
    frame = null;
  };
  const onScroll = () => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(update);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  update();
}

function setupCartIcon() {
  const headerActions = document.querySelector(".header-actions");
  let buttons = [...document.querySelectorAll('.icon-button[aria-label="View cart"]')];
  if (!buttons.length && headerActions) {
    const button = document.createElement("button");
    button.className = "icon-button";
    button.type = "button";
    button.setAttribute("aria-label", "View cart");
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7H20L18.2 18H5.8L4 7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M9 7V5.8C9 4.25 10.34 3 12 3C13.66 3 15 4.25 15 5.8V7" stroke="currentColor" stroke-width="1.6"/>
      </svg>`;
    const menuButton = headerActions.querySelector("[data-menu-toggle]");
    headerActions.insertBefore(button, menuButton || null);
    buttons = [button];
  }

  if (!buttons.length) return;

  let previousFocus = null;
  const closeCart = () => {
    const modal = document.querySelector("[data-cart-modal]");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    window.setTimeout(() => { modal.hidden = true; }, 180);
    previousFocus?.focus?.();
  };

  const renderCart = () => {
    const modal = document.querySelector("[data-cart-modal]");
    if (!modal) return;
    const items = cartDetails();
    const content = modal.querySelector("[data-cart-content]");
    const footer = modal.querySelector("[data-cart-footer]");

    if (!items.length) {
      content.innerHTML = '<div class="cart-empty"><p>Your bag is empty.</p><a class="button" href="/shop.html">Explore the collection</a></div>';
      footer.hidden = true;
      return;
    }

    content.innerHTML = items.map(({ product, quantity }) => `
      <article class="cart-line" data-cart-line="${product.slug}">
        <img src="${product.heroImage}" alt="">
        <div class="cart-line__details">
          <a href="${productUrl(product)}">${escapeHtml(product.name)}</a>
          <span>${escapeHtml(checkoutPriceLabel(product, quantity))}</span>
          <div class="cart-line__controls">
            <label>Quantity
              <select data-cart-quantity="${product.slug}" aria-label="Quantity for ${escapeHtml(product.name)}">
                ${Array.from({ length: product.maxQuantity || 5 }, (_, index) => index + 1)
                  .map((value) => `<option value="${value}"${value === quantity ? " selected" : ""}>${value}</option>`)
                  .join("")}
              </select>
            </label>
            <button type="button" data-cart-remove="${product.slug}">Remove</button>
          </div>
        </div>
      </article>
    `).join("");

    const currency = items[0].product.currency;
    const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    footer.hidden = false;
    footer.querySelector("[data-cart-total]").textContent = checkoutPriceLabel({ price: total, currency });

    content.querySelectorAll("[data-cart-quantity]").forEach((select) => {
      select.addEventListener("change", () => {
        const cart = readCart();
        const item = cart.find((entry) => entry.slug === select.dataset.cartQuantity);
        if (item) item.quantity = Number.parseInt(select.value, 10) || 1;
        writeCart(cart);
      });
    });
    content.querySelectorAll("[data-cart-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        writeCart(readCart().filter((item) => item.slug !== button.dataset.cartRemove));
      });
    });
  };

  const openCart = (trigger) => {
    previousFocus = trigger;
    let modal = document.querySelector("[data-cart-modal]");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "cart-modal";
      modal.dataset.cartModal = "";
      modal.hidden = true;
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "cart-title");
      modal.innerHTML = `
        <button class="cart-modal__scrim" type="button" data-cart-close aria-label="Close shopping bag"></button>
        <section class="cart-modal__panel">
          <header class="cart-modal__header"><div><span class="eyebrow">Secure checkout</span><h2 id="cart-title">Your bag</h2></div><button class="icon-button" type="button" data-cart-close aria-label="Close shopping bag">×</button></header>
          <div class="cart-modal__content" data-cart-content></div>
          <footer class="cart-modal__footer" data-cart-footer>
            <div><span>Subtotal</span><strong data-cart-total></strong></div>
            <p>Shipping address is collected securely by Stripe. Taxes or delivery arrangements, where applicable, are confirmed with your order.</p>
            <button class="button" type="button" data-cart-checkout>Continue to secure checkout</button>
            <span class="cart-modal__secure">Payments securely processed by Stripe</span>
          </footer>
        </section>`;
      document.body.appendChild(modal);
      modal.querySelectorAll("[data-cart-close]").forEach((button) => button.addEventListener("click", closeCart));
      modal.querySelector("[data-cart-checkout]").addEventListener("click", (event) => startStripeCheckout(readCart(), event.currentTarget));
      modal.addEventListener("keydown", (event) => { if (event.key === "Escape") closeCart(); });
    }
    renderCart();
    modal.hidden = false;
    modal.removeAttribute("aria-hidden");
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    modal.querySelector("[data-cart-close]")?.focus();
  };

  buttons.forEach((button) => {
    if (button.dataset.cartReady === "true") return;
    button.dataset.cartReady = "true";
    button.setAttribute("aria-label", "View shopping bag");
    button.classList.add("cart-icon");

    const badge = document.createElement("span");
    badge.className = "cart-badge";
    badge.setAttribute("aria-hidden", "true");
    button.appendChild(badge);

    button.addEventListener("click", () => openCart(button));
  });

  const syncBadges = () => {
    const count = readCart().reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll(".cart-badge").forEach((badge) => {
      badge.textContent = count > 0 ? String(count) : "";
      badge.classList.toggle("is-visible", count > 0);
    });
  };
  syncBadges();

  window.addEventListener("storage", (event) => {
    if (event.key === CART_KEY) {
      syncBadges();
      renderCart();
    }
  });
  document.addEventListener("tj:cart-changed", () => {
    syncBadges();
    renderCart();
  });
}

async function setupCheckoutResult() {
  const resultPanel = document.querySelector("[data-checkout-result]");
  const params = new URLSearchParams(window.location.search);

  if (!resultPanel) {
    if (params.get("checkout") === "cancelled") {
      window.tjToast?.("Checkout was cancelled. Your pieces are still in your bag.", { duration: 4200 });
    }
    return;
  }

  const sessionId = params.get("session_id");
  const title = resultPanel.querySelector("[data-checkout-title]");
  const message = resultPanel.querySelector("[data-checkout-message]");
  const summary = resultPanel.querySelector("[data-checkout-summary]");
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/u.test(sessionId)) {
    title.textContent = "We could not verify this checkout";
    message.textContent = "The payment confirmation link is incomplete. Please check your Stripe receipt or contact us for help.";
    return;
  }

  try {
    const response = await fetch(`/.netlify/functions/checkout-session?id=${encodeURIComponent(sessionId)}`, {
      headers: { Accept: "application/json" }
    });
    const session = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(session.message || "The checkout could not be verified.");

    const paid = session.paymentStatus === "paid" || session.paymentStatus === "no_payment_required";
    if (paid) {
      title.textContent = "Thank you — your payment is confirmed";
      message.textContent = `Your order${session.email ? ` for ${session.email}` : ""} is recorded securely. We’ll contact you to confirm delivery and any piece-specific details.`;
      summary.innerHTML = `<span>Order total</span><strong>${escapeHtml(session.amountLabel)}</strong><span>Confirmation</span><strong>${escapeHtml(session.id)}</strong>`;
      summary.hidden = false;
      writeCart([]);
      recordSiteEvent("checkout_payment_confirmed", { currency: session.currency, amount: session.amountTotal });
    } else {
      title.textContent = "Your payment is processing";
      message.textContent = "Stripe has your order, but payment is not marked paid yet. Keep your receipt and refresh this page in a moment.";
    }
  } catch (error) {
    title.textContent = "We could not verify this checkout yet";
    message.textContent = `${error.message} If Stripe issued a receipt, your payment record is safe; contact us and include the confirmation from that receipt.`;
  }
}

function setupSearchModal() {
  const triggers = document.querySelectorAll('.icon-button[aria-label="Search catalogue"]');
  if (!triggers.length) {
    return;
  }

  let modal = null;
  let input = null;
  let resultList = null;
  let activeIndex = -1;
  let lastFocus = null;

  const buildModal = () => {
    modal = document.createElement("div");
    modal.className = "search-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Search catalogue");
    modal.hidden = true;
    modal.innerHTML = `
      <div class="search-modal__overlay" data-search-close></div>
      <div class="search-modal__panel">
        <div class="search-modal__bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.6"/>
            <path d="M16 16L21 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <input type="search" class="search-modal__input" placeholder="Search pieces, materials, stones…" autocomplete="off" aria-label="Search">
          <kbd class="search-modal__hint">Esc</kbd>
        </div>
        <ul class="search-modal__results" role="listbox"></ul>
        <div class="search-modal__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>/</kbd> focus</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    input = modal.querySelector(".search-modal__input");
    resultList = modal.querySelector(".search-modal__results");

    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-search-close]")) {
        closeModal();
      }
    });

    input.addEventListener("input", () => render(input.value));
    input.addEventListener("keydown", onKeydown);
    render("");
  };

  const render = (query) => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? products.filter((p) =>
          [p.name, p.category, p.materials, p.shortDescription]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(q))
        ).slice(0, 8)
      : products.filter((p) => p.featured).slice(0, 6);

    activeIndex = matches.length ? 0 : -1;

    if (!matches.length) {
      resultList.innerHTML = `<li class="search-modal__empty">No pieces match “${escapeHtml(query)}”. Try a category like rings or necklaces.</li>`;
      return;
    }

    resultList.innerHTML = matches.map((p, i) => `
      <li role="option" class="search-result${i === 0 ? " is-active" : ""}" data-slug="${p.slug}">
        <a href="${productUrl(p)}">
          <img src="${p.heroImage}" alt="" loading="lazy">
          <span class="search-result__body">
            <strong>${highlight(p.name, q)}</strong>
            <small>${p.category} · ${productPriceLabel(p)}</small>
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12H19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M13 6L19 12L13 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </li>
    `).join("");

    resultList.querySelectorAll(".search-result").forEach((el, i) => {
      el.addEventListener("mouseenter", () => setActive(i));
    });
  };

  const setActive = (index) => {
    const items = resultList.querySelectorAll(".search-result");
    if (!items.length) return;
    activeIndex = (index + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle("is-active", i === activeIndex));
    items[activeIndex].scrollIntoView({ block: "nearest" });
  };

  const onKeydown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === "Enter") {
      const items = resultList.querySelectorAll(".search-result");
      if (items[activeIndex]) {
        const link = items[activeIndex].querySelector("a");
        if (link) {
          window.location.href = link.href;
        }
      }
    } else if (event.key === "Escape") {
      closeModal();
    }
  };

  const openModal = () => {
    if (!modal) buildModal();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("search-open");
    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      input.value = "";
      render("");
      input.focus();
    });
  };

  const closeModal = () => {
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("search-open");
    window.setTimeout(() => {
      modal.hidden = true;
      if (lastFocus && lastFocus.focus) {
        lastFocus.focus();
      }
    }, 200);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", openModal);
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target && target.matches && target.matches('input, textarea, select, [contenteditable="true"]');
    const mod = event.ctrlKey || event.metaKey;

    if (mod && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openModal();
      return;
    }
    if (event.key === "/" && !typing && !mod) {
      event.preventDefault();
      openModal();
    }
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function highlight(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const safeQuery = escapeHtml(query);
  const idx = safe.toLowerCase().indexOf(safeQuery.toLowerCase());
  if (idx < 0) return safe;
  return `${safe.slice(0, idx)}<mark>${safe.slice(idx, idx + safeQuery.length)}</mark>${safe.slice(idx + safeQuery.length)}`;
}

function setupCustomsSectionRail() {
  if (document.body.dataset.page !== "customs") return;
  const main = document.querySelector("main");
  if (!main) return;

  const sections = Array.from(main.querySelectorAll("section[id]"))
    .filter((section) => !section.hidden && (DESIGN_STUDIO_PUBLIC || section.id !== "design-studio"));
  const items = sections
    .map((section) => {
      const heading = section.querySelector("h1, h2");
      if (!heading) return null;
      return {
        id: section.id,
        section,
        label: heading.textContent.trim()
      };
    })
    .filter(Boolean);

  if (items.length < 2) return;

  const railLabels = {
    "custom-guide": "Direction",
    "design-studio": "Design Studio",
    "gemstone-guide": "Stone Guide",
    "request-form": "Request",
    "process": "Process",
    "faq": "FAQ"
  };

  const rail = document.createElement("nav");
  rail.className = "customs-rail";
  rail.setAttribute("aria-label", "Customs page sections");
  rail.innerHTML = `
    <ol class="customs-rail__list">
      ${items.map((item, i) => `
        <li class="customs-rail__item" data-target="${item.id}">
          <a href="#${item.id}">
            <span class="customs-rail__dot" aria-hidden="true"></span>
            <span class="customs-rail__num">${String(i + 1).padStart(2, "0")}</span>
            <span class="customs-rail__label">${railLabels[item.id] || item.label}</span>
          </a>
        </li>
      `).join("")}
    </ol>
  `;
  document.body.appendChild(rail);

  const railItems = rail.querySelectorAll(".customs-rail__item");

  const setActive = (id) => {
    railItems.forEach((el) => {
      el.classList.toggle("is-active", el.dataset.target === id);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) {
        setActive(visible[0].target.id);
      }
    },
    { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.2, 0.6, 1] }
  );

  items.forEach((item) => observer.observe(item.section));

  // Show after small scroll
  const reveal = () => {
    rail.classList.toggle("is-visible", window.scrollY > 200);
  };
  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}

function setupCustomFormProgress() {
  const form = document.querySelector("[data-custom-form]");
  if (!form) return;

  // Track required fields + a few high-signal optional ones
  const trackedSelectors = [
    "[required]",
    'select[name="piece-type"]',
    'input[name="budget"]',
    'textarea[name="description"]'
  ];
  const fields = new Set();
  trackedSelectors.forEach((sel) => {
    form.querySelectorAll(sel).forEach((f) => fields.add(f));
  });

  if (!fields.size) return;

  // Group radio buttons by name
  const fieldList = [];
  const seenRadioNames = new Set();
  fields.forEach((field) => {
    if (field.type === "radio") {
      if (seenRadioNames.has(field.name)) return;
      seenRadioNames.add(field.name);
      fieldList.push({
        type: "radio",
        name: field.name,
        nodes: form.querySelectorAll(`input[type="radio"][name="${field.name}"]`),
        required: field.required
      });
    } else {
      fieldList.push({
        type: field.type,
        node: field,
        required: field.required
      });
    }
  });

  // Inject progress UI as the first visible child of the form so it spans both grid columns
  const wrap = document.createElement("div");
  wrap.className = "form-progress form-field--wide";
  wrap.innerHTML = `
    <div class="form-progress__row">
      <div class="form-progress__meta">
        <strong data-form-progress-pct title="Jump to first missing field">0%</strong>
        <span data-form-progress-label>Start by filling the request details</span>
      </div>
      <span class="form-progress__draft" data-form-draft-indicator hidden>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12.5L10 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span data-form-draft-text>Draft saved</span>
      </span>
    </div>
    <div class="form-progress__track" aria-hidden="true">
      <span class="form-progress__bar" data-form-progress-bar></span>
    </div>
  `;
  // Insert just before the first non-hidden form field so it spans both grid columns
  const firstVisible = Array.from(form.children).find((el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === "input" && (el.type === "hidden" || el.classList.contains("sr-only"))) return false;
    if (el.classList && el.classList.contains("sr-only")) return false;
    return true;
  });
  if (firstVisible) {
    form.insertBefore(wrap, firstVisible);
  } else {
    form.appendChild(wrap);
  }

  const pctEl = wrap.querySelector("[data-form-progress-pct]");
  const labelEl = wrap.querySelector("[data-form-progress-label]");
  const barEl = wrap.querySelector("[data-form-progress-bar]");

  const isFieldFilled = (entry) => {
    if (entry.type === "radio") {
      return Array.from(entry.nodes).some((n) => n.checked);
    }
    if (entry.type === "checkbox") {
      return entry.node.checked;
    }
    return !!(entry.node.value && entry.node.value.trim());
  };

  const totalRequired = fieldList.filter((e) => e.required).length;

  const update = () => {
    const filled = fieldList.filter(isFieldFilled).length;
    const total = fieldList.length;
    const pct = total ? Math.round((filled / total) * 100) : 0;
    pctEl.textContent = `${pct}%`;
    barEl.style.width = `${pct}%`;
    wrap.classList.toggle("is-complete", pct >= 100);

    const requiredFilled = fieldList.filter((e) => e.required && isFieldFilled(e)).length;
    const requiredLeft = totalRequired - requiredFilled;

    if (pct === 0) {
      labelEl.textContent = "Start by filling the request details";
    } else if (requiredLeft > 0) {
      labelEl.textContent = `${requiredLeft} required field${requiredLeft === 1 ? "" : "s"} remaining`;
    } else if (pct < 100) {
      labelEl.textContent = "Required fields done · a few extras to polish your brief";
    } else {
      labelEl.textContent = "All set — ready to submit";
    }
  };

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();

  // Draft saved indicator — hook into the same input/change autosave flow
  const draftIndicator = wrap.querySelector("[data-form-draft-indicator]");
  const draftText = wrap.querySelector("[data-form-draft-text]");
  let saveTimer = null;
  let lastSaved = 0;

  const formatSince = (ts) => {
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 5) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
    const h = Math.floor(m / 60);
    return `${h} hr${h === 1 ? "" : "s"} ago`;
  };

  const flashDraftSaved = () => {
    lastSaved = Date.now();
    draftIndicator.hidden = false;
    draftIndicator.classList.add("is-pulsing");
    draftText.textContent = "Draft saved";
    window.setTimeout(() => draftIndicator.classList.remove("is-pulsing"), 800);
  };

  const onChange = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flashDraftSaved, 350);
  };

  form.addEventListener("input", onChange);
  form.addEventListener("change", onChange);

  // Refresh "Xs ago" label periodically
  window.setInterval(() => {
    if (lastSaved && !draftIndicator.hidden) {
      draftText.textContent = `Draft saved · ${formatSince(lastSaved)}`;
    }
  }, 15000);

  // If a draft already exists on load, show indicator
  try {
    if (window.localStorage.getItem(CUSTOM_FORM_DRAFT_KEY)) {
      draftIndicator.hidden = false;
      draftText.textContent = "Draft restored";
      lastSaved = Date.now() - 60000;
    }
  } catch (e) { /* noop */ }

  // Smooth focus on first required empty field when clicking percentage label
  pctEl.addEventListener("click", () => {
    const missing = fieldList.find((e) => e.required && !isFieldFilled(e));
    if (!missing) return;
    const node = missing.type === "radio" ? missing.nodes[0] : missing.node;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); }
    }, 380);
  });

  // Make the "01 Inspiration / 02 Details / 03 Timeline" cards clickable jumps
  const miniMap = {
    "01": form.querySelector('input[name="inspiration-link"]') || form.querySelector('input[name="inspiration-upload"]'),
    "02": form.querySelector('select[name="metal-preference"]') || form.querySelector('select[name="piece-type"]'),
    "03": form.querySelector('input[name="budget"]') || form.querySelector('input[name="needed-by"]')
  };
  document.querySelectorAll(".request-mini-list article").forEach((article) => {
    const num = article.querySelector("span")?.textContent?.trim();
    const target = miniMap[num];
    if (!target) return;
    article.classList.add("is-interactive");
    article.setAttribute("role", "button");
    article.setAttribute("tabindex", "0");
    const jump = () => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
        const field = target.closest(".form-field") || target.parentElement;
        if (field) {
          field.classList.add("is-highlighted");
          window.setTimeout(() => field.classList.remove("is-highlighted"), 1600);
        }
      }, 420);
    };
    article.addEventListener("click", jump);
    article.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        jump();
      }
    });
  });

  // "Clear draft" button — only shown when a saved draft is restored
  try {
    if (window.localStorage.getItem(CUSTOM_FORM_DRAFT_KEY)) {
      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "form-progress__clear";
      clearBtn.textContent = "Clear draft";
      clearBtn.setAttribute("aria-label", "Clear saved draft and reset the form");
      wrap.querySelector(".form-progress__row").appendChild(clearBtn);
      clearBtn.addEventListener("click", () => {
        if (!window.confirm("Clear the saved draft and reset the form?")) return;
        clearCustomFormDraft();
        form.reset();
        form.querySelectorAll("input, select, textarea").forEach((f) => {
          f.dispatchEvent(new Event("input", { bubbles: true }));
          f.dispatchEvent(new Event("change", { bubbles: true }));
        });
        clearBtn.remove();
        draftIndicator.hidden = true;
        if (window.tjToast) window.tjToast("Draft cleared", { tone: "warn" });
      });
    }
  } catch (e) { /* noop */ }
}

function recordSiteEvent(eventName, details = {}) {
  const payload = {
    event: eventName,
    page_path: window.location.pathname,
    ...details
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  document.dispatchEvent(new CustomEvent("tj:analytics", { detail: payload }));
}

function setupConversionTracking() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("a, button");
    if (!target) return;

    const explicitEvent = target.dataset.track;
    const href = target.getAttribute("href") || "";
    let eventName = explicitEvent;

    if (!eventName && href.startsWith("mailto:")) eventName = "email_click";
    if (!eventName && href.startsWith("tel:")) eventName = "phone_click";
    if (!eventName && target.matches("[data-product-inquiry]")) eventName = "product_inquiry_click";
    if (!eventName && target.matches("[data-appointment-trigger]")) eventName = "appointment_start";
    if (!eventName) return;

    recordSiteEvent(eventName, {
      link_url: href || undefined,
      link_text: target.textContent.trim().replace(/\s+/g, " ").slice(0, 100) || undefined
    });
  });

  document.querySelectorAll("form").forEach((form) => {
    if (form.hidden) return;
    form.addEventListener("submit", () => {
      recordSiteEvent("form_submit", {
        form_name: form.getAttribute("name") || form.id || "site_form"
      });
    });
  });
}

function setupContactInterestPrefill() {
  const message = document.querySelector("#contact-message");
  if (!message || message.value.trim()) return;

  const interest = new URLSearchParams(window.location.search).get("interest");
  if (interest) {
    message.value = `I'm interested in ${interest}. Please share the available details and next appointment options.`;
  }
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function submitSimpleNetlifyForm(form) {
  const formData = new FormData(form);
  return fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formData).toString()
  });
}

function setupBookingCalendars() {
  document.querySelectorAll("[data-booking-form]").forEach((form) => {
    const dateInput = form.querySelector("[data-booking-date]");
    const timeInput = form.querySelector("[data-booking-time]");
    const slots = form.querySelector("[data-booking-slots]");
    const timeHelp = form.querySelector("[data-booking-time-help]");
    const eveningToggle = form.querySelector("[data-evening-request]");
    const eveningDetails = form.querySelector("[data-evening-details]");
    const eveningInput = eveningDetails?.querySelector("input");
    const status = form.querySelector("[data-booking-status]");
    const submitButton = form.querySelector('button[type="submit"]');

    if (!dateInput || !timeInput || !slots) return;

    dateInput.min = localDateValue();

    const selectTime = (button) => {
      slots.querySelectorAll("button").forEach((item) => {
        item.classList.remove("is-selected");
        item.setAttribute("aria-pressed", "false");
      });
      button.classList.add("is-selected");
      button.setAttribute("aria-pressed", "true");
      timeInput.value = button.dataset.time || "";
      if (status) status.textContent = "";
    };

    const renderTimes = () => {
      timeInput.value = "";
      slots.innerHTML = "";

      if (!dateInput.value) {
        if (timeHelp) timeHelp.textContent = "Select a date to see the appointment hours.";
        return;
      }

      const selectedDate = new Date(`${dateInput.value}T12:00:00`);
      const weekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
      const availableTimes = weekend
        ? ["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"]
        : ["11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"];

      if (timeHelp) {
        timeHelp.textContent = weekend
          ? "Weekend appointments are available from 12:00 PM to 3:00 PM."
          : "Weekday appointments are available from 11:00 AM to 3:00 PM.";
      }

      availableTimes.forEach((time) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "booking-time";
        button.dataset.time = time;
        button.setAttribute("aria-pressed", "false");
        button.textContent = time;
        button.addEventListener("click", () => selectTime(button));
        slots.appendChild(button);
      });
    };

    const syncEveningRequest = () => {
      const requestingEvening = Boolean(eveningToggle?.checked);
      if (eveningDetails) eveningDetails.hidden = !requestingEvening;
      if (eveningInput) eveningInput.required = requestingEvening;
      slots.querySelectorAll("button").forEach((button) => {
        button.disabled = requestingEvening;
      });
      timeInput.value = requestingEvening ? "Evening appointment requested" : "";
      if (!requestingEvening) renderTimes();
      if (timeHelp) {
        timeHelp.textContent = requestingEvening
          ? "Tell us your preferred evening time below and we will reply with options."
          : timeHelp.textContent;
      }
    };

    dateInput.addEventListener("change", () => {
      renderTimes();
      if (eveningToggle?.checked) syncEveningRequest();
    });
    eveningToggle?.addEventListener("change", syncEveningRequest);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!eveningToggle?.checked && !timeInput.value) {
        if (status) status.textContent = "Please select an available time, or request an evening appointment.";
        slots.querySelector("button")?.focus();
        return;
      }

      const originalLabel = submitButton?.textContent || "Request This Appointment";
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending request…";
      }
      if (status) status.textContent = "Sending your appointment request…";

      try {
        const response = await submitSimpleNetlifyForm(form);
        if (!response.ok) throw new Error("Appointment request failed");
        const appointmentDate = dateInput.value;
        form.reset();
        renderTimes();
        syncEveningRequest();
        if (status) status.textContent = "Your request has been received. We’ll contact you to confirm the appointment.";
        window.tjToast?.("Appointment request received");
        recordSiteEvent("appointment_request_success", { appointment_date: appointmentDate });
      } catch (error) {
        if (status) status.textContent = "We couldn’t send the request. Please try again or WhatsApp 416-451-8578.";
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
      }
    });
  });
}

function setupVipWelcome() {
  if (document.querySelector("[data-vip-drawer]")) return;

  const wrapper = document.createElement("div");
  wrapper.className = "vip-welcome";
  wrapper.dataset.vipDrawer = "";
  wrapper.innerHTML = `
    <button class="vip-welcome__scrim" type="button" aria-label="Close welcome offer" data-vip-close></button>
    <aside class="vip-welcome__drawer" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="vip-welcome-title" tabindex="-1">
      <button class="vip-welcome__close" type="button" aria-label="Close welcome offer" data-vip-close>×</button>
      <span class="eyebrow">A private welcome</span>
      <div class="accent-rule"></div>
      <p class="vip-welcome__offer">5% <span>off</span></p>
      <h2 id="vip-welcome-title">Your first Toronto Jewels purchase</h2>
      <p>Join our private atelier list for your 5% first-purchase welcome offer, bespoke preview invitations, and early access to selected estate luxuries.</p>
      <form name="vip-welcome" method="POST" action="/" data-netlify="true" data-vip-form>
        <input type="hidden" name="form-name" value="vip-welcome">
        <input type="hidden" name="offer" value="5% first-purchase welcome offer">
        <div class="form-field"><label for="vip-email">Email Address</label><input id="vip-email" name="email-address" type="email" autocomplete="email" required></div>
        <div class="form-field"><label for="vip-phone">Phone Number</label><input id="vip-phone" name="phone-number" type="tel" autocomplete="tel" required></div>
        <button class="button" type="submit">Unlock My 5% Welcome Offer</button>
        <p class="status-note" data-vip-status aria-live="polite"></p>
        <small>By submitting, you agree to receive atelier updates by email or phone. You may unsubscribe at any time. View our <a href="/privacy.html">Privacy Policy</a>.</small>
      </form>
      <div class="vip-welcome__success" data-vip-success hidden>
        <span class="eyebrow">Welcome to the atelier</span>
        <h3>Your 5% welcome privilege is reserved.</h3>
        <p>Use code <strong>WELCOME5</strong> when beginning your first order. We have also sent your details to the atelier.</p>
        <button class="button" type="button" data-vip-close>Continue Exploring</button>
      </div>
    </aside>
    <button class="vip-welcome__tab" type="button" data-vip-open>5% Welcome</button>
  `;
  document.body.appendChild(wrapper);

  const drawer = wrapper.querySelector(".vip-welcome__drawer");
  const form = wrapper.querySelector("[data-vip-form]");
  const status = wrapper.querySelector("[data-vip-status]");
  const success = wrapper.querySelector("[data-vip-success]");

  const remember = () => {
    try { window.localStorage.setItem("tj-vip-welcome-seen-v1", "true"); } catch (error) { /* storage is optional */ }
  };
  const open = () => {
    wrapper.classList.add("is-open");
    drawer?.setAttribute("aria-hidden", "false");
    document.body.classList.add("vip-open");
    window.setTimeout(() => drawer?.focus(), 80);
    recordSiteEvent("vip_offer_view");
  };
  const close = () => {
    wrapper.classList.remove("is-open");
    drawer?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("vip-open");
    remember();
  };

  wrapper.querySelectorAll("[data-vip-close]").forEach((button) => button.addEventListener("click", close));
  wrapper.querySelector("[data-vip-open]")?.addEventListener("click", open);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && wrapper.classList.contains("is-open")) close();
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = "Reserving…";
    }
    if (status) status.textContent = "Reserving your welcome offer…";
    try {
      const response = await submitSimpleNetlifyForm(form);
      if (!response.ok) throw new Error("VIP form failed");
      form.hidden = true;
      if (success) success.hidden = false;
      remember();
      recordSiteEvent("vip_offer_signup_success");
    } catch (error) {
      if (status) status.textContent = "We couldn’t reserve the offer. Please try again in a moment.";
      if (button) {
        button.disabled = false;
        button.textContent = "Unlock My 5% Welcome Offer";
      }
    }
  });

  let hasSeen = false;
  try { hasSeen = window.localStorage.getItem("tj-vip-welcome-seen-v1") === "true"; } catch (error) { /* storage is optional */ }
  if (!hasSeen) window.setTimeout(open, 900);
}

function setupTrustAssurances() {
  const footer = document.querySelector(".footer");
  const contactColumn = [...document.querySelectorAll(".footer-column")].find(
    (column) => column.querySelector("h3")?.textContent.trim().toLowerCase() === "contact"
  );
  const contactList = contactColumn?.querySelector("ul");
  if (contactList && !contactList.querySelector('a[href*="wa.me/14164518578"]')) {
    const item = document.createElement("li");
    item.innerHTML = '<a href="https://wa.me/14164518578?text=Hello%20Toronto%20Jewels%20Curation%2C%20I%27d%20like%20to%20ask%20about%20a%20private%20consultation." target="_blank" rel="noreferrer" data-track="whatsapp_footer_click">WhatsApp 416-451-8578</a>';
    contactList.appendChild(item);
  }

  if (footer && !document.querySelector("[data-footer-assurances]")) {
    const strip = document.createElement("section");
    strip.className = "footer-assurances";
    strip.dataset.footerAssurances = "";
    strip.setAttribute("aria-label", "Purchase assurances");
    strip.innerHTML = `
      <div class="container footer-assurances__grid">
        <article><span>01</span><div><strong>GIA / IGI</strong><p>Certification available for all diamonds.</p></div></article>
        <article><span>02</span><div><strong>Appraisal Certificate</strong><p>Documentation prepared for your completed piece.</p></div></article>
        <article><span>03</span><div><strong>Complimentary Resizing</strong><p>First ring resize included where the design permits.</p></div></article>
        <article><span>04</span><div><strong>Lifetime Warranty</strong><p>Craftsmanship warranty with written order coverage.</p></div></article>
      </div>
    `;
    footer.parentNode.insertBefore(strip, footer);
  }

  const productPage = document.querySelector("[data-product-page]");
  if (productPage && !document.querySelector("[data-product-assurances]")) {
    const section = document.createElement("section");
    section.className = "section section--soft product-assurances";
    section.dataset.productAssurances = "";
    section.innerHTML = `
      <div class="container product-assurances__layout">
        <div class="product-assurances__intro">
          <span class="eyebrow">Purchase with confidence</span>
          <div class="accent-rule"></div>
          <h2>Documentation, fit, and lasting care</h2>
          <p>Every important detail is reviewed with you before your order is confirmed.</p>
        </div>
        <div class="assurance-accordion">
          <details open><summary>GIA or IGI diamond certification <span>+</span></summary><p>All diamonds are available with a GIA or IGI certificate, as applicable to the selected stone. We will match the documentation to your diamond and review it with you.</p></details>
          <details><summary>Authenticity and appraisal certificate <span>+</span></summary><p>Diamond details, materials, and available authenticity documentation are confirmed before purchase. Appraisal documentation is prepared for the completed jewellery order.</p></details>
          <details><summary>Complimentary ring resizing <span>+</span></summary><p>Your first ring resize is complimentary where the construction and setting permit resizing. We will confirm the available sizing range for the specific design.</p></details>
          <details><summary>Lifetime craftsmanship warranty <span>+</span></summary><p>Your piece includes a lifetime craftsmanship warranty for manufacturing workmanship. Written coverage and care details are supplied with your completed order.</p></details>
        </div>
      </div>
    `;
    const detailsSection = productPage.nextElementSibling;
    (detailsSection || productPage).insertAdjacentElement("afterend", section);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupSkipLink();
  syncCustomsPreformSections();
  syncDesignStudioPublicEntries();
  setupLazyFeatureModules();
  setupViewportVideos();
  setupToasts();
  setupCheckoutResult();
  setupScrollProgress();
  setupHeader();
  setupSearchModal();
  setupBackToTop();
  setupCartIcon();
  renderFeaturedProducts();
  setupShopFilters();
  renderProductPage();
  setupFaq();
  setupFilePickers();
  setupPieceTypePrefill();
  setupContextualCustomFields();
  setupCustomGuide();
  setupFaqSearch();
  setupBudgetEstimator();
  setupGemstoneGuide();
  setupPrivateInquiry();
  setupAppointmentModal();
  setupCustomForm();
  setupDreamGenerator();
  setupCustomsSectionRail();
  setupCustomFormProgress();
  setupContactInterestPrefill();
  setupBookingCalendars();
  setupTrustAssurances();
  setupVipWelcome();
  setupConversionTracking();
  setYear();
  setupHeroMotion();
  setupDepthCards();
  setupMagneticActions();
  applyRevealDelays();
  revealVisible();
});
