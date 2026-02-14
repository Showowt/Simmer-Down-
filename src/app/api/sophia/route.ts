// SOPHIA v2.1 - Universal Simmer Down/Garden AI Assistant
// Supports ALL locations: Santa Ana, San Benito, La Majada (Garden), Lago de Coatepeque
// Now with rate limiting and input validation

import { NextRequest, NextResponse } from "next/server";
import {
  MENU,
  LOCATIONS,
  CATEGORIES,
  LocationId,
  MenuItem,
  getMenuByLocation,
  getMenuByCategory,
  getBestSellers,
  searchMenu,
  getVegetarianItems,
  getSeafoodItems,
  getItemPrice,
  formatPrice,
  getKidsMenu,
  getLocationExclusives,
  getMenuStats,
} from "@/data/simmer-menu";
import {
  sophiaMessageSchema,
  formatZodErrors,
  validationErrorResponse,
} from "@/lib/validation";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import logger from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// SOPHIA PERSONALITY
// ═══════════════════════════════════════════════════════════════

const GREETINGS = {
  "santa-ana":
    "🔥 ¡Hola! Bienvenido a Simmer Down Santa Ana. Soy Sophia, ¿en qué puedo ayudarte?",
  "san-benito":
    "🔥 ¡Hola! Bienvenido a Simmer Down San Benito. Soy Sophia, ¿qué se te antoja hoy?",
  "la-majada":
    "🌿 ¡Bienvenido al jardín! Soy Sophia de Simmer Garden La Majada. ¡Escapa de la ciudad!",
  "lago-coatepeque":
    "🌊 ¡Hola! Bienvenido a Simmer Down Lago de Coatepeque. Soy Sophia, ¿listo para probar nuestros mariscos frescos?",
  default:
    "🔥 ¡Hola! Soy Sophia, tu guía en Simmer Down. Tenemos 4 ubicaciones increíbles. ¿En cuál te encuentras?",
};

// Semantic food understanding
const FOOD_SEMANTICS: Record<
  string,
  { categories: string[]; keywords: string[]; response: string }
> = {
  sweet: {
    categories: ["postres"],
    keywords: ["chocolate", "brownie", "cheesecake", "panna"],
    response: "🍰 ¡Nuestros postres son increíbles!",
  },
  dulce: {
    categories: ["postres"],
    keywords: ["chocolate", "brownie", "cheesecake", "panna"],
    response: "🍰 ¡Postres para endulzar tu día!",
  },
  meat: {
    categories: ["platos-fuertes", "entradas"],
    keywords: ["lomito", "terramar", "medallón", "carne", "coulotte"],
    response: "🥩 ¡Nuestras carnes son excepcionales!",
  },
  carne: {
    categories: ["platos-fuertes", "entradas"],
    keywords: ["lomito", "terramar", "medallón", "coulotte", "filet"],
    response: "🥩 ¡El Medallón de Lomito es nuestro #1!",
  },
  steak: {
    categories: ["platos-fuertes"],
    keywords: ["lomito", "terramar", "medallón", "filet"],
    response: "🥩 ¡Prueba nuestro Medallón de Lomito!",
  },
  seafood: {
    categories: ["mariscos", "platos-fuertes", "pastas", "entradas"],
    keywords: [
      "camarón",
      "gambas",
      "calamar",
      "pescatore",
      "marisco",
      "ceviche",
      "aguachile",
    ],
    response: "🦐 ¡Mariscos frescos del mar!",
  },
  mariscos: {
    categories: ["mariscos", "platos-fuertes", "pastas", "entradas"],
    keywords: [
      "camarón",
      "gambas",
      "calamar",
      "pescatore",
      "ceviche",
      "aguachile",
      "mariscada",
    ],
    response: "🦐 ¡Lo mejor del mar para ti!",
  },
  fish: {
    categories: ["mariscos", "platos-fuertes"],
    keywords: ["pescado", "ceviche", "tigre"],
    response: "🐟 ¡Pescado fresco del día!",
  },
  pescado: {
    categories: ["mariscos", "platos-fuertes"],
    keywords: ["pescado", "ceviche", "tigre", "parrilla"],
    response: "🐟 ¡Nuestro pescado a la parrilla es espectacular!",
  },
  pizza: {
    categories: ["pizzas", "pizzas-especiales"],
    keywords: [
      "margherita",
      "hawaiana",
      "pepperoni",
      "quattro",
      "prosciutto",
      "maradona",
    ],
    response: "🍕 ¡Nuestras pizzas son legendarias!",
  },
  pasta: {
    categories: ["pastas"],
    keywords: ["fettuccine", "lasagna", "penne", "bolognesa", "alfredo"],
    response: "🍝 ¡Pastas artesanales!",
  },
  vegetarian: {
    categories: ["ensaladas", "pizzas"],
    keywords: ["vegetariana", "champiñones", "verduras", "ensalada"],
    response: "🥗 ¡Opciones vegetarianas frescas!",
  },
  vegetariano: {
    categories: ["ensaladas", "pizzas"],
    keywords: ["vegetariana", "fungi", "margherita"],
    response: "🥗 ¡Deliciosas opciones sin carne!",
  },
  healthy: {
    categories: ["ensaladas"],
    keywords: ["ensalada", "fresca", "gambas", "impecable"],
    response: "🥗 ¡Ensaladas frescas y saludables!",
  },
  saludable: {
    categories: ["ensaladas"],
    keywords: ["ensalada", "criolla", "impecable"],
    response: "🥗 ¡Frescura del jardín!",
  },
  coffee: {
    categories: ["bebidas-calientes"],
    keywords: ["cappuccino", "latte", "espresso", "americano", "affogato"],
    response: "☕ ¡Café de altura!",
  },
  café: {
    categories: ["bebidas-calientes"],
    keywords: ["cappuccino", "latte", "espresso", "americano", "mocaccino"],
    response: "☕ ¡Nuestro café es excepcional!",
  },
  beer: {
    categories: ["cervezas"],
    keywords: ["corona", "heineken", "pilsener", "michelada", "puente"],
    response: "🍺 ¡Cervezas locales e importadas!",
  },
  cerveza: {
    categories: ["cervezas"],
    keywords: ["corona", "heineken", "pilsener", "michelada", "puente quemado"],
    response: "🍺 ¡Prueba la Puente Quemado - cerveza artesanal local!",
  },
  drink: {
    categories: ["bebidas-frias", "bebidas-calientes", "cervezas"],
    keywords: ["frozen", "limonada", "refresco"],
    response: "🍹 ¿Algo refrescante?",
  },
  bebida: {
    categories: ["bebidas-frias", "bebidas-calientes", "cervezas"],
    keywords: ["frozen", "limonada", "refresco"],
    response: "🍹 ¡Bebidas para todos los gustos!",
  },
  kids: {
    categories: ["menu-infantil"],
    keywords: ["chunks", "cangreburger", "niños"],
    response: "👶 ¡Menú especial para los pequeños!",
  },
  niños: {
    categories: ["menu-infantil"],
    keywords: ["chunks", "cangreburger", "infantil"],
    response: "👶 ¡Para los más pequeños de la familia!",
  },
  spicy: {
    categories: ["entradas", "pizzas-especiales", "pizzas"],
    keywords: ["jalapeña", "molcajete", "brazuca", "aguachile"],
    response: "🌶️ ¡Sabor con personalidad!",
  },
  picante: {
    categories: ["entradas", "pizzas-especiales"],
    keywords: ["jalapeña", "molcajete", "brazuca", "aguachile"],
    response: "🌶️ ¡Para los que les gusta el fuego!",
  },
  burger: {
    categories: ["platos-fuertes"],
    keywords: ["hamburguesa", "casanova", "burger"],
    response: "🍔 ¡La Hamburguesa Casanova es increíble!",
  },
  hamburguesa: {
    categories: ["platos-fuertes"],
    keywords: ["casanova", "doble", "bacon"],
    response: "🍔 ¡Doble carne, doble sabor!",
  },
  ceviche: {
    categories: ["entradas", "mariscos"],
    keywords: ["ceviche", "tigre", "tropical", "aguachile"],
    response: "🦐 ¡Ceviches frescos - especialidad del lago!",
  },
  starter: {
    categories: ["entradas"],
    keywords: ["fundido", "cheese", "patatas", "molcajete"],
    response: "🍽️ ¡Entradas para abrir el apetito!",
  },
  entrada: {
    categories: ["entradas"],
    keywords: ["fundido", "cheese", "patatas", "molcajete"],
    response: "🍽️ ¡Perfectas para compartir!",
  },
  share: {
    categories: ["entradas", "pizzas"],
    keywords: ["fundido", "pizza", "molcajete"],
    response: "👥 ¡Ideal para compartir!",
  },
  compartir: {
    categories: ["entradas", "pizzas"],
    keywords: ["fundido", "pizza", "molcajete"],
    response: "👥 ¡Para disfrutar en grupo!",
  },
  premium: {
    categories: ["platos-fuertes", "pizzas-especiales", "mariscos"],
    keywords: ["terramar", "medallón", "pescatore", "mariscada"],
    response: "⭐ ¡Experiencia gourmet!",
  },
  lake: {
    categories: ["mariscos", "entradas"],
    keywords: ["ceviche", "aguachile", "mariscada", "pescado"],
    response: "🌊 ¡Especialidades del lago!",
  },
  lago: {
    categories: ["mariscos", "entradas"],
    keywords: ["ceviche", "aguachile", "mariscada", "pescado"],
    response: "🌊 ¡Mariscos frescos de Coatepeque!",
  },
};

// Intent patterns
const INTENT_PATTERNS = {
  greeting: /^(hola|hi|hello|hey|buenas|buenos|saludos|qué tal|que tal)/i,
  menu: /\b(menú|menu|carta|ver todo|todo el menú|que tienen|qué tienen)\b/i,
  recommend:
    /\b(recomienda|recomendación|sugieres|sugerencia|qué me recomiendas|que me recomiendas|popular|favorito|mejor|best)\b/i,
  category:
    /\b(entradas?|ensaladas?|pastas?|pizzas?|platos? fuertes?|postres?|bebidas?|cafés?|cervezas?|infantil|niños|mariscos?)\b/i,
  price: /\b(precio|cuesta|cuánto|cuanto|vale|costo)\b/i,
  vegetarian:
    /\b(vegetariano|vegetariana|vegano|vegana|sin carne|verduras|vegetal)\b/i,
  seafood:
    /\b(mariscos?|pescado|camarón|camarones|ceviche|aguachile|mariscada)\b/i,
  delivery:
    /\b(delivery|domicilio|envío|envio|llevar|pedir|ordenar|whatsapp)\b/i,
  hours: /\b(horario|hora|abierto|cerrado|cuando abren|cuando cierran)\b/i,
  location:
    /\b(ubicación|ubicacion|donde|dirección|direccion|sucursal|sucursales|santa ana|san benito|majada|lago|coatepeque)\b/i,
  bestseller:
    /\b(popular|más pedido|mas pedido|best seller|bestseller|favorito|estrella|top|#1)\b/i,
  thanks: /\b(gracias|thanks|thank you|muchas gracias)\b/i,
  bye: /\b(adiós|adios|bye|chao|hasta luego|nos vemos)\b/i,
  help: /\b(ayuda|help|no entiendo|como funciona|cómo funciona)\b/i,
  specific_item: /\b(quiero|dame|pedir|ordenar|agregar|añadir)\b/i,
};

// ═══════════════════════════════════════════════════════════════
// INTENT DETECTION
// ═══════════════════════════════════════════════════════════════

function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (INTENT_PATTERNS.greeting.test(lowerMessage)) return "greeting";
  if (INTENT_PATTERNS.thanks.test(lowerMessage)) return "thanks";
  if (INTENT_PATTERNS.bye.test(lowerMessage)) return "bye";
  if (INTENT_PATTERNS.help.test(lowerMessage)) return "help";
  if (INTENT_PATTERNS.delivery.test(lowerMessage)) return "delivery";
  if (INTENT_PATTERNS.hours.test(lowerMessage)) return "hours";
  if (INTENT_PATTERNS.location.test(lowerMessage)) return "location";
  if (INTENT_PATTERNS.bestseller.test(lowerMessage)) return "bestseller";
  if (INTENT_PATTERNS.vegetarian.test(lowerMessage)) return "vegetarian";
  if (INTENT_PATTERNS.seafood.test(lowerMessage)) return "seafood";
  if (INTENT_PATTERNS.recommend.test(lowerMessage)) return "recommend";
  if (INTENT_PATTERNS.menu.test(lowerMessage)) return "menu";
  if (INTENT_PATTERNS.price.test(lowerMessage)) return "price";
  if (INTENT_PATTERNS.category.test(lowerMessage)) return "category";

  // Check semantic food terms
  for (const term of Object.keys(FOOD_SEMANTICS)) {
    if (lowerMessage.includes(term)) return "semantic_food";
  }

  if (INTENT_PATTERNS.specific_item.test(lowerMessage)) return "specific_item";

  return "general";
}

function detectLocation(message: string): LocationId | null {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("santa ana") || lowerMessage.includes("santana"))
    return "santa-ana";
  if (lowerMessage.includes("san benito") || lowerMessage.includes("benito"))
    return "san-benito";
  if (
    lowerMessage.includes("majada") ||
    lowerMessage.includes("garden") ||
    lowerMessage.includes("jardín") ||
    lowerMessage.includes("jardin")
  )
    return "la-majada";
  if (
    lowerMessage.includes("lago") ||
    lowerMessage.includes("coatepeque") ||
    lowerMessage.includes("lake")
  )
    return "lago-coatepeque";

  return null;
}

function extractSemanticTerms(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  return Object.keys(FOOD_SEMANTICS).filter((term) =>
    lowerMessage.includes(term),
  );
}

function extractCategory(message: string): string | null {
  const lowerMessage = message.toLowerCase();

  const categoryMap: Record<string, string> = {
    "pizzas especiales": "pizzas-especiales",
    "pizza especial": "pizzas-especiales",
    "bebidas calientes": "bebidas-calientes",
    "bebida caliente": "bebidas-calientes",
    "platos fuertes": "platos-fuertes",
    "plato fuerte": "platos-fuertes",
    "menu infantil": "menu-infantil",
    "menú infantil": "menu-infantil",
    "bebidas frias": "bebidas-frias",
    "bebidas frías": "bebidas-frias",
    especiales: "pizzas-especiales",
    entradas: "entradas",
    entrada: "entradas",
    ensaladas: "ensaladas",
    ensalada: "ensaladas",
    pastas: "pastas",
    pasta: "pastas",
    pizzas: "pizzas",
    pizza: "pizzas",
    postres: "postres",
    postre: "postres",
    dulce: "postres",
    bebidas: "bebidas-frias",
    bebida: "bebidas-frias",
    cervezas: "cervezas",
    cerveza: "cervezas",
    carnes: "platos-fuertes",
    carne: "platos-fuertes",
    infantil: "menu-infantil",
    niños: "menu-infantil",
    niño: "menu-infantil",
    café: "bebidas-calientes",
    cafe: "bebidas-calientes",
    coffee: "bebidas-calientes",
    mariscos: "mariscos",
    marisco: "mariscos",
    seafood: "mariscos",
  };

  const sortedEntries = Object.entries(categoryMap).sort(
    (a, b) => b[0].length - a[0].length,
  );

  for (const [keyword, category] of sortedEntries) {
    if (lowerMessage.includes(keyword)) {
      return category;
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE FORMATTING
// ═══════════════════════════════════════════════════════════════

function formatMenuItem(item: MenuItem, locationId?: LocationId): object {
  const price = getItemPrice(item, locationId);
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: price,
    pricePersonal: item.pricePersonal,
    formattedPrice: formatPrice(item, locationId),
    category: item.category,
    categoryDisplay:
      CATEGORIES[item.category as keyof typeof CATEGORIES] || item.category,
    tags: item.tags || [],
    bestSeller: item.bestSeller || false,
    locations: item.locations.map((loc) => LOCATIONS[loc].name),
  };
}

function findItemsBySemantics(
  terms: string[],
  locationId?: LocationId,
): MenuItem[] {
  const items: MenuItem[] = [];
  const seenIds = new Set<string>();

  for (const term of terms) {
    const semantic = FOOD_SEMANTICS[term];
    if (!semantic) continue;

    for (const category of semantic.categories) {
      const categoryItems = getMenuByCategory(category, locationId);
      for (const item of categoryItems) {
        if (!seenIds.has(item.id)) {
          const hasKeyword = semantic.keywords.some(
            (kw) =>
              item.name.toLowerCase().includes(kw) ||
              item.description.toLowerCase().includes(kw),
          );
          if (hasKeyword) {
            items.unshift(item);
          } else {
            items.push(item);
          }
          seenIds.add(item.id);
        }
      }
    }
  }

  return items.slice(0, 6);
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE GENERATORS
// ═══════════════════════════════════════════════════════════════

function generateGreeting(locationId?: LocationId): {
  message: string;
  suggestedItems: object[];
} {
  const greeting = locationId ? GREETINGS[locationId] : GREETINGS["default"];
  const bestSellers = getBestSellers(locationId).slice(0, 3);

  return {
    message: `${greeting}\n\n⭐ **Nuestros favoritos:**`,
    suggestedItems: bestSellers.map((item) => formatMenuItem(item, locationId)),
  };
}

function generateRecommendation(locationId?: LocationId): {
  message: string;
  suggestedItems: object[];
} {
  const bestSellers = getBestSellers(locationId);
  const shuffled = bestSellers.sort(() => Math.random() - 0.5).slice(0, 4);

  let message = "🔥 **Mis recomendaciones especiales:**";
  if (locationId === "lago-coatepeque") {
    message =
      "🌊 **Recomendaciones del lago:**\n\n¡No te pierdas nuestros mariscos frescos!";
  } else if (locationId === "la-majada") {
    message =
      "🌿 **Recomendaciones del jardín:**\n\n¡Escapa de la ciudad con estos favoritos!";
  }

  return {
    message,
    suggestedItems: shuffled.map((item) => formatMenuItem(item, locationId)),
  };
}

function generateCategoryResponse(
  category: string,
  locationId?: LocationId,
): { message: string; suggestedItems: object[] } {
  const items = getMenuByCategory(category, locationId);
  const categoryName =
    CATEGORIES[category as keyof typeof CATEGORIES] || category;

  if (items.length === 0) {
    return {
      message: `No encontré items en esa categoría${locationId ? " para esta ubicación" : ""}. ¿Puedo ayudarte con algo más?`,
      suggestedItems: [],
    };
  }

  let message = `🍽️ **${categoryName}**\n\n¡Excelente elección!`;

  if (category === "pizzas") {
    message = `🍕 **${categoryName}**\n\nPersonal: $5.75 | Large: $14.99`;
  } else if (category === "pizzas-especiales") {
    message = `🍕 **${categoryName}**\n\nPersonal: $6.25 | Large: $17.99\n\n¡Ingredientes premium!`;
  } else if (category === "mariscos") {
    message = `🦐 **${categoryName}**\n\n¡Frescura del mar${locationId === "lago-coatepeque" ? " de Coatepeque" : ""}!`;
  }

  return {
    message,
    suggestedItems: items
      .slice(0, 6)
      .map((item) => formatMenuItem(item, locationId)),
  };
}

function generateSemanticResponse(
  terms: string[],
  locationId?: LocationId,
): { message: string; suggestedItems: object[] } {
  const items = findItemsBySemantics(terms, locationId);
  const firstTerm = terms[0];
  const semantic = FOOD_SEMANTICS[firstTerm];

  if (items.length === 0) {
    return {
      message: `Hmm, no encontré exactamente eso${locationId ? " en esta ubicación" : ""}. ¿Puedo sugerirte algo similar?`,
      suggestedItems: getBestSellers(locationId)
        .slice(0, 3)
        .map((item) => formatMenuItem(item, locationId)),
    };
  }

  return {
    message: `${semantic?.response || "¡Tenemos opciones perfectas para ti!"}`,
    suggestedItems: items.map((item) => formatMenuItem(item, locationId)),
  };
}

function generateLocationResponse(detectedLocation: LocationId | null): {
  message: string;
  suggestedItems: object[];
} {
  if (detectedLocation) {
    const location = LOCATIONS[detectedLocation];
    const exclusives = getLocationExclusives(detectedLocation);
    const stats = getMenuStats(detectedLocation);

    let message = `📍 **${location.name}**\n\n${location.tagline}\n\n`;
    message += `📱 WhatsApp: ${location.whatsapp}\n`;
    message += `🍽️ ${stats.total} items disponibles`;

    if (exclusives.length > 0) {
      message += `\n\n⭐ **Exclusivos de esta ubicación:**`;
      return {
        message,
        suggestedItems: exclusives
          .slice(0, 4)
          .map((item) => formatMenuItem(item, detectedLocation)),
      };
    }

    return {
      message,
      suggestedItems: getBestSellers(detectedLocation)
        .slice(0, 3)
        .map((item) => formatMenuItem(item, detectedLocation)),
    };
  }

  // Show all locations
  const locationList = Object.values(LOCATIONS)
    .map((loc) => {
      const icon = loc.brand === "simmer-garden" ? "🌿" : "🔥";
      return `${icon} **${loc.name}**\n   ${loc.tagline} | 📱 ${loc.whatsapp}`;
    })
    .join("\n\n");

  return {
    message: `📍 **Nuestras Ubicaciones:**\n\n${locationList}\n\n¿En cuál te encuentras?`,
    suggestedItems: [],
  };
}

function generateDeliveryResponse(locationId?: LocationId): {
  message: string;
  suggestedItems: object[];
} {
  if (locationId) {
    const location = LOCATIONS[locationId];
    return {
      message: `🛵 **¡Delivery disponible!**\n\n📍 ${location.name}\n📱 WhatsApp: **${location.whatsapp}**\n\n¿Te ayudo a elegir algo para ordenar?`,
      suggestedItems: getBestSellers(locationId)
        .slice(0, 3)
        .map((item) => formatMenuItem(item, locationId)),
    };
  }

  const deliveryInfo = Object.values(LOCATIONS)
    .map((loc) => `• ${loc.name}: 📱 ${loc.whatsapp}`)
    .join("\n");

  return {
    message: `🛵 **Delivery disponible en todas nuestras ubicaciones:**\n\n${deliveryInfo}\n\n¿Desde cuál ubicación deseas ordenar?`,
    suggestedItems: [],
  };
}

function generateSeafoodResponse(locationId?: LocationId): {
  message: string;
  suggestedItems: object[];
} {
  const items = getSeafoodItems(locationId);

  let message = "🦐 **Mariscos Frescos**\n\n¡Lo mejor del mar!";

  if (locationId === "lago-coatepeque") {
    message =
      "🌊 **Mariscos del Lago**\n\n¡Especialidad de Coatepeque! Ceviches, aguachile, y mariscada los fines de semana.";
  }

  return {
    message,
    suggestedItems: items
      .slice(0, 6)
      .map((item) => formatMenuItem(item, locationId)),
  };
}

function generateVegetarianResponse(locationId?: LocationId): {
  message: string;
  suggestedItems: object[];
} {
  const items = getVegetarianItems(locationId);

  return {
    message: "🥗 **Opciones Vegetarianas**\n\n¡Frescura y sabor sin carne!",
    suggestedItems: items
      .slice(0, 6)
      .map((item) => formatMenuItem(item, locationId)),
  };
}

function generateMenuOverview(locationId?: LocationId): {
  message: string;
  suggestedItems: object[];
} {
  const stats = getMenuStats(locationId);
  const locationName = locationId ? LOCATIONS[locationId].name : "Simmer Down";

  const categories = Object.entries(CATEGORIES)
    .map(([key, name]) => {
      const count = getMenuByCategory(key, locationId).length;
      if (count === 0) return null;
      return `• ${name} (${count})`;
    })
    .filter(Boolean)
    .join("\n");

  return {
    message: `🍽️ **Menú ${locationName}**\n\n${categories}\n\n📊 ${stats.total} items | ${stats.bestSellers} best sellers\n\n¿Qué categoría te interesa?`,
    suggestedItems: getBestSellers(locationId)
      .slice(0, 3)
      .map((item) => formatMenuItem(item, locationId)),
  };
}

function generateBestSellerResponse(locationId?: LocationId): {
  message: string;
  suggestedItems: object[];
} {
  const bestSellers = getBestSellers(locationId);

  return {
    message: "⭐ **Best Sellers**\n\n¡Los favoritos de nuestros clientes!",
    suggestedItems: bestSellers
      .slice(0, 6)
      .map((item) => formatMenuItem(item, locationId)),
  };
}

function generateSearchResponse(
  query: string,
  locationId?: LocationId,
): { message: string; suggestedItems: object[] } {
  const items = searchMenu(query, locationId).slice(0, 6);

  if (items.length === 0) {
    return {
      message: `No encontré "${query}" en el menú. ¿Puedo sugerirte algo similar?`,
      suggestedItems: getBestSellers(locationId)
        .slice(0, 3)
        .map((item) => formatMenuItem(item, locationId)),
    };
  }

  return {
    message: "🔍 Encontré esto para ti:",
    suggestedItems: items.map((item) => formatMenuItem(item, locationId)),
  };
}

function generateThanksResponse(): {
  message: string;
  suggestedItems: object[];
} {
  const responses = [
    "¡Con mucho gusto! 🔥 ¿Hay algo más en lo que pueda ayudarte?",
    "¡Es un placer! ¿Te gustaría ver algo más del menú?",
    "¡Para servirte! Aquí estoy si necesitas algo más.",
  ];
  return {
    message: responses[Math.floor(Math.random() * responses.length)],
    suggestedItems: [],
  };
}

function generateByeResponse(): { message: string; suggestedItems: object[] } {
  return {
    message:
      "¡Hasta pronto! 🔥 Que disfrutes tu comida. ¡Te esperamos en Simmer Down!",
    suggestedItems: [],
  };
}

function generateHelpResponse(): { message: string; suggestedItems: object[] } {
  return {
    message: `🔥 **¿Cómo puedo ayudarte?**\n\nPuedes preguntarme:\n• "¿Qué me recomiendas?"\n• "Quiero ver las pizzas"\n• "¿Tienen opciones vegetarianas?"\n• "Mariscos del lago"\n• "¿Cómo pido delivery?"\n• "Ubicaciones"\n• O simplemente dime qué se te antoja 😊`,
    suggestedItems: getBestSellers()
      .slice(0, 2)
      .map((item) => formatMenuItem(item)),
  };
}

function generateGeneralResponse(
  message: string,
  locationId?: LocationId,
): { message: string; suggestedItems: object[] } {
  const searchResults = searchMenu(message, locationId);

  if (searchResults.length > 0) {
    return {
      message: "🔍 Encontré algo que podría gustarte:",
      suggestedItems: searchResults
        .slice(0, 6)
        .map((item) => formatMenuItem(item, locationId)),
    };
  }

  return {
    message:
      "No estoy segura de entender. 🤔 ¿Puedo recomendarte algo de nuestro menú?",
    suggestedItems: getBestSellers(locationId)
      .slice(0, 3)
      .map((item) => formatMenuItem(item, locationId)),
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN API HANDLER
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/sophia";

  // Rate limiting: 10 requests per minute per IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`sophia:${clientIp}`, {
    maxRequests: 10,
    windowMs: 60000,
  });

  if (!rateLimit.success) {
    logger.warn("Rate limit exceeded for Sophia", { ip: clientIp });
    return rateLimitResponse(rateLimit);
  }

  logger.api.request(endpoint, "POST", { ip: clientIp });

  try {
    const body = await request.json();

    // Validate input with Zod
    const parseResult = sophiaMessageSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = formatZodErrors(parseResult.error);
      logger.info("Sophia validation failed", { errors });
      return validationErrorResponse(errors);
    }

    const { message, locationId: providedLocationId } = parseResult.data;

    // Detect location from message or use provided
    const detectedLocation = detectLocation(message);
    const locationId: LocationId | undefined =
      providedLocationId || detectedLocation || undefined;

    const intent = detectIntent(message);
    let response: { message: string; suggestedItems: object[] };

    switch (intent) {
      case "greeting":
        response = generateGreeting(locationId);
        break;

      case "recommend":
        response = generateRecommendation(locationId);
        break;

      case "category":
        const category = extractCategory(message);
        if (category) {
          response = generateCategoryResponse(category, locationId);
        } else {
          response = generateMenuOverview(locationId);
        }
        break;

      case "semantic_food":
        const terms = extractSemanticTerms(message);
        response = generateSemanticResponse(terms, locationId);
        break;

      case "seafood":
        response = generateSeafoodResponse(locationId);
        break;

      case "delivery":
        response = generateDeliveryResponse(locationId);
        break;

      case "vegetarian":
        response = generateVegetarianResponse(locationId);
        break;

      case "bestseller":
        response = generateBestSellerResponse(locationId);
        break;

      case "menu":
        response = generateMenuOverview(locationId);
        break;

      case "location":
        response = generateLocationResponse(detectedLocation);
        break;

      case "thanks":
        response = generateThanksResponse();
        break;

      case "bye":
        response = generateByeResponse();
        break;

      case "help":
        response = generateHelpResponse();
        break;

      case "specific_item":
      case "price":
        response = generateSearchResponse(message, locationId);
        break;

      default:
        response = generateGeneralResponse(message, locationId);
    }

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, { intent });

    return NextResponse.json({
      success: true,
      intent,
      locationId,
      ...response,
      locations: Object.values(LOCATIONS).map((loc) => ({
        id: loc.id,
        name: loc.name,
        brand: loc.brand,
        whatsapp: loc.whatsapp,
      })),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.api.error(endpoint, error, { duration });

    return NextResponse.json(
      {
        success: false,
        error: "Sophia is experiencing issues",
        message:
          "Lo siento, estoy teniendo problemas técnicos. Por favor intenta de nuevo. 🔥",
      },
      { status: 500 },
    );
  }
}

// Health check
export async function GET() {
  const stats = getMenuStats();
  return NextResponse.json({
    status: "ok",
    name: "Sophia",
    version: "2.1.0",
    features: ["rate-limiting", "zod-validation", "structured-logging"],
    locations: Object.keys(LOCATIONS).length,
    menuItems: stats.total,
    categories: stats.categories,
    bestSellers: stats.bestSellers,
  });
}
