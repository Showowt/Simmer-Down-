import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";
import {
  animaMessageSchema,
  formatZodErrors,
  validationErrorResponse,
} from "@/lib/validation";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import logger from "@/lib/logger";

// ANIMA v3.1 - The Soul of Simmer Down
// Advanced restaurant intelligence with order tracking, combos, and personalization
// Now with rate limiting and input validation

interface AnimaContext {
  customerName?: string;
  customerPhone?: string;
  loyaltyTier?: string;
  loyaltyPoints?: number;
  visitCount?: number;
  favoriteItems?: string[];
  dietaryPreferences?: string[];
  cartItems?: { name: string; quantity: number; price: number }[];
  currentTime: string;
  dayOfWeek: string;
  language?: "es" | "en";
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

interface Order {
  id: string;
  order_number?: string;
  status: string;
  total: number;
  created_at: string;
  items_json?: { name: string; quantity: number }[];
}

// Combo suggestions - items that pair well together
const comboPairings: Record<string, string[]> = {
  pizzas: ["bebidas", "postres", "entradas"],
  pastas: ["ensaladas", "bebidas", "postres"],
  "platos-fuertes": ["bebidas", "ensaladas", "postres"],
  entradas: ["pizzas", "bebidas"],
  ensaladas: ["pizzas", "pastas", "bebidas"],
};

// Promos - rotate these
const currentPromos = [
  {
    name: "2x1 Cervezas",
    description: "De 5-7pm en cervezas artesanales",
    days: ["Friday", "Saturday"],
  },
  {
    name: "Combo Familiar",
    description: "2 pizzas grandes + 1L refresco por $29.99",
    days: ["Saturday", "Sunday"],
  },
  {
    name: "Happy Hour",
    description: "20% off en bebidas de 3-5pm",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  },
];

// Get menu items from database
async function getMenuItems(): Promise<MenuItem[]> {
  const supabase = createApiClient();
  const { data } = await supabase
    .from("menu_items")
    .select("id, name, description, price, category, available")
    .eq("available", true)
    .order("category");

  return data || [];
}

// Get customer orders by phone
async function getCustomerOrders(phone: string): Promise<Order[]> {
  const supabase = createApiClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at, items_json")
    .eq("customer_phone", phone)
    .order("created_at", { ascending: false })
    .limit(5);

  return data || [];
}

// Fuzzy match item name with semantic understanding
function findMenuItem(menu: MenuItem[], query: string): MenuItem | null {
  const lower = query.toLowerCase();

  // Exact match first
  let match = menu.find((m) => m.name.toLowerCase() === lower);
  if (match) return match;

  // Contains match
  match = menu.find((m) => m.name.toLowerCase().includes(lower));
  if (match) return match;

  // Word match
  const words = lower.split(" ").filter((w) => w.length > 2);
  for (const word of words) {
    match = menu.find((m) => m.name.toLowerCase().includes(word));
    if (match) return match;
  }

  // Semantic match using food terms
  for (const [term, mapping] of Object.entries(foodTerms)) {
    if (lower.includes(term)) {
      // Search by keywords
      for (const keyword of mapping.keywords) {
        match = menu.find(
          (m) =>
            m.name.toLowerCase().includes(keyword) ||
            m.description.toLowerCase().includes(keyword),
        );
        if (match) return match;
      }
      // Search by category
      if (mapping.category) {
        match = menu.find((m) => m.category === mapping.category);
        if (match) return match;
      }
    }
  }

  // Description match as last resort
  for (const word of words) {
    match = menu.find((m) => m.description.toLowerCase().includes(word));
    if (match) return match;
  }

  return null;
}

// Find items by category
function getItemsByCategory(
  menu: MenuItem[],
  category: string,
  limit = 5,
): MenuItem[] {
  const lower = category.toLowerCase();
  return menu
    .filter((m) => m.category.toLowerCase().includes(lower))
    .slice(0, limit);
}

// Get dietary filtered items
function getDietaryItems(menu: MenuItem[], dietary: string): MenuItem[] {
  const lower = dietary.toLowerCase();

  if (lower.includes("vegetarian") || lower.includes("vegetariano")) {
    return menu.filter(
      (m) =>
        m.category === "ensaladas" ||
        m.name.toLowerCase().includes("vegetarian") ||
        m.name.toLowerCase().includes("fungie") ||
        m.description.toLowerCase().includes("vegetariano") ||
        m.description.toLowerCase().includes("sin carne"),
    );
  }

  if (lower.includes("vegan") || lower.includes("vegano")) {
    return menu.filter(
      (m) =>
        m.description.toLowerCase().includes("vegano") ||
        (m.category === "ensaladas" &&
          !m.description.toLowerCase().includes("queso")),
    );
  }

  if (lower.includes("gluten") || lower.includes("celiaco")) {
    return menu.filter(
      (m) =>
        m.category === "ensaladas" ||
        m.category === "platos-fuertes" ||
        m.description.toLowerCase().includes("sin gluten"),
    );
  }

  return [];
}

// Detect language from message
function detectLanguage(message: string): "es" | "en" {
  const englishWords = [
    "want",
    "would",
    "like",
    "please",
    "what",
    "where",
    "how",
    "menu",
    "order",
    "have",
    "the",
    "and",
    "for",
  ];
  const spanishWords = [
    "quiero",
    "quisiera",
    "favor",
    "qué",
    "dónde",
    "cómo",
    "menú",
    "pedido",
    "tengo",
    "el",
    "la",
    "para",
  ];

  const lower = message.toLowerCase();
  const enCount = englishWords.filter((w) => lower.includes(w)).length;
  const esCount = spanishWords.filter((w) => lower.includes(w)).length;

  return esCount >= enCount ? "es" : "en";
}

// Food term mappings for semantic understanding
const foodTerms: Record<string, { category?: string; keywords: string[] }> = {
  sweet: {
    category: "postres",
    keywords: ["chocolate", "cheesecake", "brownie", "tiramisu"],
  },
  dulce: {
    category: "postres",
    keywords: ["chocolate", "cheesecake", "brownie", "tiramisu"],
  },
  dessert: {
    category: "postres",
    keywords: ["chocolate", "cheesecake", "brownie", "tiramisu"],
  },
  postre: {
    category: "postres",
    keywords: ["chocolate", "cheesecake", "brownie", "tiramisu"],
  },
  steak: {
    category: "platos-fuertes",
    keywords: ["lomito", "terramar", "medallon", "carne"],
  },
  carne: {
    category: "platos-fuertes",
    keywords: ["lomito", "terramar", "medallon", "res"],
  },
  meat: {
    category: "platos-fuertes",
    keywords: ["lomito", "terramar", "medallon", "res"],
  },
  beef: {
    category: "platos-fuertes",
    keywords: ["lomito", "terramar", "medallon", "res"],
  },
  seafood: {
    category: "platos-fuertes",
    keywords: ["pescado", "camaron", "mariskada", "ceviche"],
  },
  mariscos: {
    category: "platos-fuertes",
    keywords: ["pescado", "camaron", "mariskada", "ceviche"],
  },
  fish: { category: "platos-fuertes", keywords: ["pescado", "ceviche"] },
  shrimp: {
    category: "entradas",
    keywords: ["camaron", "gambas", "aguachile"],
  },
  chicken: {
    category: "platos-fuertes",
    keywords: ["pollo", "pechuga", "chunks"],
  },
  pollo: {
    category: "platos-fuertes",
    keywords: ["pechuga", "chunks", "pollo"],
  },
  salad: {
    category: "ensaladas",
    keywords: ["ensalada", "gambas", "criolla", "impecable"],
  },
  drink: {
    category: "bebidas",
    keywords: ["frozen", "limonada", "cafe", "te"],
  },
  bebida: {
    category: "bebidas",
    keywords: ["frozen", "limonada", "cafe", "te"],
  },
  beer: {
    category: "cervezas",
    keywords: ["cerveza", "pilsener", "corona", "michelada"],
  },
  cerveza: {
    category: "cervezas",
    keywords: ["pilsener", "corona", "modelo", "michelada"],
  },
  appetizer: {
    category: "entradas",
    keywords: ["entrada", "ceviche", "patatas", "cheese"],
  },
  starter: {
    category: "entradas",
    keywords: ["entrada", "ceviche", "patatas", "cheese"],
  },
  hungry: { category: "pizzas", keywords: ["pizza", "hamburguesa", "platos"] },
  hambre: { category: "pizzas", keywords: ["pizza", "hamburguesa", "platos"] },
};

// Detect intent from message with more nuance
function detectIntent(message: string): {
  intent: string;
  entities: Record<string, string>;
} {
  const lower = message.toLowerCase();
  const entities: Record<string, string> = {};

  // Track order
  if (
    /mi.*pedido|mi.*orden|track|estado|where.*order|dónde.*está/i.test(lower)
  ) {
    return { intent: "track_order", entities };
  }

  // "The usual" / repeat order
  if (/lo.*siempre|de.*siempre|usual|same.*last|repeat|repetir/i.test(lower)) {
    return { intent: "repeat_order", entities };
  }

  // Cart operations
  if (/carrito|cart|ver.*pedido|mi.*orden|what.*order/i.test(lower)) {
    return { intent: "view_cart", entities };
  }

  // Mood-based / craving detection (check before categories)
  if (/mood|antoja|craving|feeling|ganas de|in the mood/i.test(lower)) {
    // Check for food terms
    for (const [term, mapping] of Object.entries(foodTerms)) {
      if (lower.includes(term)) {
        entities.category = mapping.category || "pizzas";
        entities.mood = term;
        return { intent: "browse_category", entities };
      }
    }
    // Default to recommendations if mood detected but no specific food
    return { intent: "recommendation", entities };
  }

  // Check for food terms that map to categories
  for (const [term, mapping] of Object.entries(foodTerms)) {
    if (lower.includes(term) && mapping.category) {
      entities.category = mapping.category;
      entities.foodTerm = term;
      return { intent: "browse_category", entities };
    }
  }

  // Specific category request
  const categories = [
    "pizzas",
    "entradas",
    "ensaladas",
    "pastas",
    "platos-fuertes",
    "bebidas",
    "postres",
    "cervezas",
  ];
  for (const cat of categories) {
    if (lower.includes(cat.replace("-", " ")) || lower.includes(cat)) {
      entities.category = cat;
      return { intent: "browse_category", entities };
    }
  }

  // Combo/deal request
  if (/combo|promo|oferta|deal|special|descuento|2x1/i.test(lower)) {
    return { intent: "promos", entities };
  }

  // Dietary
  if (
    /vegetarian|vegan|sin.*carne|sin.*gluten|celiaco|healthy|saludable/i.test(
      lower,
    )
  ) {
    if (/vegetarian|vegetariano/i.test(lower)) entities.dietary = "vegetarian";
    if (/vegan|vegano/i.test(lower)) entities.dietary = "vegan";
    if (/gluten|celiaco/i.test(lower)) entities.dietary = "gluten-free";
    return { intent: "dietary", entities };
  }

  // Menu/view menu
  if (/menu|carta|ver.*menu|que.*tienen|what.*have/i.test(lower)) {
    return { intent: "view_menu", entities };
  }

  // Recommendations - expanded patterns
  if (
    /recomienda|suger|que.*pido|no.*se.*que|recommend|suggest|best|mejor|what.*good|que.*bueno|popular|favorito|favorite/i.test(
      lower,
    )
  ) {
    return { intent: "recommendation", entities };
  }

  // Price inquiry
  if (/precio|cuanto.*cuesta|cost|how.*much|\$|dolares/i.test(lower)) {
    return { intent: "price_inquiry", entities };
  }

  // Order/add to cart
  if (
    /quiero|dame|pedir|order|want|agregar|add|give.*me|i.?ll have|para mi/i.test(
      lower,
    )
  ) {
    return { intent: "order", entities };
  }

  // Location/hours
  if (
    /ubicacion|donde|direccion|location|hora|horario|hours|address|open/i.test(
      lower,
    )
  ) {
    return { intent: "location_hours", entities };
  }

  // Events
  if (/evento|musica|fiesta|event|music|live|party|reserv/i.test(lower)) {
    return { intent: "events", entities };
  }

  // Farewell
  if (/gracias|adios|bye|chao|thanks|thank/i.test(lower)) {
    return { intent: "farewell", entities };
  }

  // Greeting
  if (/^(hola|hi|hey|buenos|buenas|hello|good)/i.test(lower)) {
    return { intent: "greeting", entities };
  }

  // Help
  if (/ayuda|help|como.*funciona|how.*work/i.test(lower)) {
    return { intent: "help", entities };
  }

  return { intent: "general", entities };
}

// Get smart combo suggestion
function getComboSuggestion(
  menu: MenuItem[],
  cartCategories: string[],
): MenuItem | null {
  if (cartCategories.length === 0) return null;

  const lastCategory = cartCategories[cartCategories.length - 1];
  const pairings = comboPairings[lastCategory] || [];

  for (const pairCategory of pairings) {
    if (!cartCategories.includes(pairCategory)) {
      const items = getItemsByCategory(menu, pairCategory, 3);
      if (items.length > 0) {
        return items[Math.floor(Math.random() * items.length)];
      }
    }
  }

  return null;
}

// Get active promos for today
function getActivePromos(dayOfWeek: string): typeof currentPromos {
  return currentPromos.filter((p) => p.days.includes(dayOfWeek));
}

// Format price
const formatPrice = (p: number) => `$${p.toFixed(2)}`;

// Generate intelligent response
async function generateResponse(
  message: string,
  menu: MenuItem[],
  context: AnimaContext,
  intentData: { intent: string; entities: Record<string, string> },
): Promise<{
  response: string;
  suggestedItems?: MenuItem[];
  actions?: string[];
  orderStatus?: Order;
}> {
  const { intent, entities } = intentData;
  const hour = new Date().getHours();
  const isEvening = hour >= 17 && hour <= 21;
  const isLunch = hour >= 11 && hour <= 14;
  const isWeekend = ["Saturday", "Sunday"].includes(context.dayOfWeek);
  const lang = context.language || detectLanguage(message);

  // Text helpers based on language
  const t = {
    es: {
      greeting: context.customerName
        ? `¡Hola ${context.customerName}!`
        : "¡Hola!",
      welcome: "Bienvenido a Simmer Down",
      howHelp: "¿En qué te puedo ayudar?",
      addToCart: "¿Lo agrego al pedido?",
      anythingElse: "¿Algo más?",
      recommend: "Te recomiendo",
      categories: "Tenemos",
      price: "está a",
      thanks: "¡Gracias!",
      enjoy: "¡Que lo disfrutes!",
    },
    en: {
      greeting: context.customerName ? `Hi ${context.customerName}!` : "Hi!",
      welcome: "Welcome to Simmer Down",
      howHelp: "How can I help you?",
      addToCart: "Add it to your order?",
      anythingElse: "Anything else?",
      recommend: "I recommend",
      categories: "We have",
      price: "is",
      thanks: "Thanks!",
      enjoy: "Enjoy!",
    },
  }[lang];

  switch (intent) {
    case "greeting": {
      let response = `${t.greeting} `;

      if (context.visitCount && context.visitCount > 5) {
        response +=
          lang === "es"
            ? `¡Qué gusto verte de nuevo! Ya eres parte de la familia Simmer Down. `
            : `Great to see you again! You're part of the Simmer Down family. `;
      } else {
        response += `${t.welcome}. `;
      }

      if (
        context.loyaltyTier === "gold" ||
        context.loyaltyTier === "platinum"
      ) {
        response +=
          lang === "es"
            ? `Como miembro ${context.loyaltyTier}, tienes beneficios exclusivos. `
            : `As a ${context.loyaltyTier} member, you have exclusive benefits. `;
      }

      const promos = getActivePromos(context.dayOfWeek);
      if (promos.length > 0) {
        response +=
          lang === "es"
            ? `\n\n🔥 Hoy: ${promos[0].name} - ${promos[0].description}`
            : `\n\n🔥 Today: ${promos[0].name} - ${promos[0].description}`;
      }

      return {
        response,
        actions: ["menu", "recommendations", "promos", "locations"],
      };
    }

    case "track_order": {
      if (!context.customerPhone) {
        return {
          response:
            lang === "es"
              ? "Para rastrear tu pedido, necesito tu número de teléfono. ¿Me lo compartes?"
              : "To track your order, I need your phone number. Can you share it?",
          actions: ["enter_phone"],
        };
      }

      const orders = await getCustomerOrders(context.customerPhone);

      if (orders.length === 0) {
        return {
          response:
            lang === "es"
              ? "No encontré pedidos recientes con ese número. ¿Quieres hacer uno nuevo?"
              : "I couldn't find recent orders with that number. Would you like to place a new one?",
          actions: ["menu", "recommendations"],
        };
      }

      const latest = orders[0];
      const statusMap: Record<string, { es: string; en: string }> = {
        pending: { es: "📝 Recibido", en: "📝 Received" },
        in_progress: { es: "👨‍🍳 Preparando", en: "👨‍🍳 Preparing" },
        ready: { es: "✅ Listo para recoger", en: "✅ Ready for pickup" },
        delivered: { es: "🎉 Entregado", en: "🎉 Delivered" },
        cancelled: { es: "❌ Cancelado", en: "❌ Cancelled" },
      };

      const status = statusMap[latest.status] || {
        es: latest.status,
        en: latest.status,
      };

      return {
        response:
          lang === "es"
            ? `Tu pedido ${latest.order_number || "#" + latest.id.slice(0, 6)}: ${status.es}\nTotal: ${formatPrice(latest.total)}`
            : `Your order ${latest.order_number || "#" + latest.id.slice(0, 6)}: ${status.en}\nTotal: ${formatPrice(latest.total)}`,
        orderStatus: latest,
        actions: ["menu", "locations"],
      };
    }

    case "repeat_order": {
      if (!context.customerPhone) {
        return {
          response:
            lang === "es"
              ? "Para repetir tu pedido anterior, necesito identificarte. ¿Me das tu número de teléfono?"
              : "To repeat your last order, I need to identify you. What's your phone number?",
          actions: ["enter_phone"],
        };
      }

      const orders = await getCustomerOrders(context.customerPhone);

      if (orders.length === 0 || !orders[0].items_json) {
        return {
          response:
            lang === "es"
              ? "No encontré pedidos anteriores. ¿Te ayudo a crear uno nuevo?"
              : "I couldn't find previous orders. Want me to help you create a new one?",
          actions: ["menu", "recommendations"],
        };
      }

      const lastItems = orders[0].items_json;
      const itemNames = lastItems
        .map((i) => `${i.quantity}x ${i.name}`)
        .join(", ");

      return {
        response:
          lang === "es"
            ? `Tu último pedido fue: ${itemNames}. ¿Lo pido igual?`
            : `Your last order was: ${itemNames}. Same order?`,
        actions: ["confirm_repeat", "modify", "new_order"],
      };
    }

    case "view_cart": {
      if (!context.cartItems || context.cartItems.length === 0) {
        return {
          response:
            lang === "es"
              ? "Tu carrito está vacío. ¿Te ayudo a elegir algo delicioso?"
              : "Your cart is empty. Let me help you pick something delicious!",
          actions: ["menu", "recommendations"],
        };
      }

      const total = context.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );
      const items = context.cartItems
        .map((i) => `${i.quantity}x ${i.name}`)
        .join("\n");

      // Smart combo suggestion
      const cartCategories = context.cartItems
        .map((i) => {
          const menuItem = menu.find((m) => m.name === i.name);
          return menuItem?.category || "";
        })
        .filter(Boolean);

      const comboSuggestion = getComboSuggestion(menu, cartCategories);
      let response =
        lang === "es"
          ? `Tu pedido:\n${items}\n\nTotal: ${formatPrice(total)}`
          : `Your order:\n${items}\n\nTotal: ${formatPrice(total)}`;

      if (comboSuggestion) {
        response +=
          lang === "es"
            ? `\n\n💡 ¿Agregamos ${comboSuggestion.name} por ${formatPrice(comboSuggestion.price)}?`
            : `\n\n💡 Add ${comboSuggestion.name} for ${formatPrice(comboSuggestion.price)}?`;
      }

      return {
        response,
        suggestedItems: comboSuggestion ? [comboSuggestion] : undefined,
        actions: ["checkout", "add_more", "clear_cart"],
      };
    }

    case "browse_category": {
      const category = entities.category || "pizzas";
      const items = getItemsByCategory(menu, category, 5);

      if (items.length === 0) {
        return {
          response:
            lang === "es"
              ? `No encontré items en esa categoría. ¿Te muestro otra cosa?`
              : `I couldn't find items in that category. Show you something else?`,
          actions: ["menu", "recommendations"],
        };
      }

      const itemList = items
        .map((i) => `• ${i.name} - ${formatPrice(i.price)}`)
        .join("\n");

      return {
        response:
          lang === "es"
            ? `${category.toUpperCase()}:\n${itemList}\n\n¿Cuál te interesa?`
            : `${category.toUpperCase()}:\n${itemList}\n\nWhich one interests you?`,
        suggestedItems: items.slice(0, 3),
        actions: ["order", "other_categories"],
      };
    }

    case "promos": {
      const promos = getActivePromos(context.dayOfWeek);

      if (promos.length === 0) {
        return {
          response:
            lang === "es"
              ? "Hoy no hay promociones especiales, pero siempre tenemos precios increíbles. ¿Te muestro el menú?"
              : "No special promos today, but we always have great prices. Show you the menu?",
          actions: ["menu", "recommendations"],
        };
      }

      const promoList = promos
        .map((p) => `🔥 ${p.name}: ${p.description}`)
        .join("\n");

      return {
        response:
          lang === "es"
            ? `¡Promociones de hoy!\n${promoList}\n\n¿Te interesa alguna?`
            : `Today's deals!\n${promoList}\n\nInterested in any?`,
        actions: ["menu", "recommendations"],
      };
    }

    case "dietary": {
      const dietaryType = entities.dietary || "vegetarian";
      const items = getDietaryItems(menu, dietaryType);

      if (items.length === 0) {
        return {
          response:
            lang === "es"
              ? "Déjame buscar opciones para ti. Nuestras ensaladas son excelentes opciones saludables."
              : "Let me find options for you. Our salads are great healthy choices.",
          suggestedItems: getItemsByCategory(menu, "ensaladas", 3),
          actions: ["ensaladas", "menu"],
        };
      }

      const itemList = items
        .slice(0, 4)
        .map((i) => `• ${i.name} - ${formatPrice(i.price)}`)
        .join("\n");

      return {
        response:
          lang === "es"
            ? `Opciones ${dietaryType === "vegetarian" ? "vegetarianas" : dietaryType === "vegan" ? "veganas" : "sin gluten"}:\n${itemList}\n\n¿Cuál te gustaría?`
            : `${dietaryType.charAt(0).toUpperCase() + dietaryType.slice(1)} options:\n${itemList}\n\nWhich would you like?`,
        suggestedItems: items.slice(0, 3),
        actions: ["order", "more_options"],
      };
    }

    case "recommendation": {
      // Smart recommendations based on context
      let recommended: MenuItem[] = [];
      let response = "";

      // Check customer favorites first
      if (context.favoriteItems && context.favoriteItems.length > 0) {
        const fav = context.favoriteItems[0];
        const favItem = findMenuItem(menu, fav);
        if (favItem) {
          response =
            lang === "es"
              ? `¿Tu favorito ${favItem.name}? 😏 O prueba algo nuevo:\n`
              : `Your favorite ${favItem.name}? 😏 Or try something new:\n`;
        }
      }

      // Time-based recommendations
      if (isLunch) {
        recommended = [
          ...getItemsByCategory(menu, "ensaladas", 1),
          ...getItemsByCategory(menu, "pizzas", 2),
        ];
        response +=
          lang === "es"
            ? "Para el almuerzo te recomiendo:\n"
            : "For lunch I recommend:\n";
      } else if (isEvening) {
        recommended = [
          ...getItemsByCategory(menu, "pizzas", 2),
          ...getItemsByCategory(menu, "platos-fuertes", 1),
        ];
        response +=
          lang === "es"
            ? "Para la cena, perfectos:\n"
            : "For dinner, perfect choices:\n";
      } else {
        recommended = getItemsByCategory(menu, "pizzas", 3);
        response += lang === "es" ? "Mis favoritos:\n" : "My favorites:\n";
      }

      response += recommended
        .map((i) => `• ${i.name} - ${formatPrice(i.price)}`)
        .join("\n");

      return {
        response,
        suggestedItems: recommended,
        actions: ["order", "other_options", "menu"],
      };
    }

    case "price_inquiry": {
      const item = findMenuItem(menu, message);

      if (item) {
        return {
          response:
            lang === "es"
              ? `${item.name} ${t.price} ${formatPrice(item.price)}. ${item.description.slice(0, 60)}... ${t.addToCart}`
              : `${item.name} ${t.price} ${formatPrice(item.price)}. ${item.description.slice(0, 60)}... ${t.addToCart}`,
          suggestedItems: [item],
          actions: ["add_to_cart", "more_info"],
        };
      }

      return {
        response:
          lang === "es"
            ? "¿De qué platillo te gustaría saber el precio?"
            : "Which dish would you like to know the price of?",
        actions: ["menu", "recommendations"],
      };
    }

    case "order": {
      const item = findMenuItem(menu, message);

      if (item) {
        // Get a pairing suggestion
        const pairingCategory = comboPairings[item.category]?.[0];
        const pairing = pairingCategory
          ? getItemsByCategory(menu, pairingCategory, 1)[0]
          : null;

        let response =
          lang === "es"
            ? `¡${item.name}! Excelente elección. ${formatPrice(item.price)}. ¿Lo agrego?`
            : `${item.name}! Excellent choice. ${formatPrice(item.price)}. Add it?`;

        if (pairing) {
          response +=
            lang === "es"
              ? `\n\n💡 Va perfecto con ${pairing.name} (${formatPrice(pairing.price)})`
              : `\n\n💡 Goes great with ${pairing.name} (${formatPrice(pairing.price)})`;
        }

        return {
          response,
          suggestedItems: pairing ? [item, pairing] : [item],
          actions: ["add_to_cart", "view_menu"],
        };
      }

      return {
        response:
          lang === "es"
            ? "¿Qué te gustaría ordenar? Te puedo recomendar algo."
            : "What would you like to order? I can recommend something.",
        actions: ["recommendations", "menu"],
      };
    }

    case "location_hours": {
      return {
        response:
          lang === "es"
            ? `📍 Ubicaciones:\n• Santa Ana (Casa Matriz)\n• Lago de Coatepeque - ¡Vista al lago!\n• Metrocentro\n• Multiplaza\n• La Gran Vía\n\n⏰ Horario: 11am - 10pm\n\n¿A cuál te gustaría ir?`
            : `📍 Locations:\n• Santa Ana (Main)\n• Lago de Coatepeque - Lake view!\n• Metrocentro\n• Multiplaza\n• La Gran Vía\n\n⏰ Hours: 11am - 10pm\n\nWhich one would you like to visit?`,
        actions: ["santa_ana", "coatepeque", "directions"],
      };
    }

    case "events": {
      const response =
        lang === "es"
          ? isWeekend
            ? `🎵 ¡Este fin de semana!\n• Música en vivo en Coatepeque (8pm)\n• 2x1 cervezas artesanales (5-7pm)\n\n¿Te reservo mesa?`
            : `🎵 Eventos próximos:\n• Viernes: Jazz night en Santa Ana\n• Sábado: Música en vivo en Coatepeque\n\n¿Te gustaría reservar?`
          : isWeekend
            ? `🎵 This weekend!\n• Live music at Coatepeque (8pm)\n• 2x1 craft beers (5-7pm)\n\nShall I reserve a table?`
            : `🎵 Upcoming events:\n• Friday: Jazz night at Santa Ana\n• Saturday: Live music at Coatepeque\n\nWould you like to reserve?`;

      return { response, actions: ["reserve", "locations", "menu"] };
    }

    case "farewell": {
      const response =
        lang === "es"
          ? [
              "¡Gracias! Que disfrutes tu comida 🍕",
              "¡Hasta pronto! Aquí te esperamos.",
              "¡Buen provecho! Fue un gusto atenderte.",
            ]
          : [
              "Thanks! Enjoy your meal 🍕",
              "See you soon! We'll be here.",
              "Enjoy! It was great helping you.",
            ];

      return {
        response: response[Math.floor(Math.random() * response.length)],
      };
    }

    case "help": {
      return {
        response:
          lang === "es"
            ? `Soy ANIMA, tu asistente de Simmer Down. Puedo:\n• Mostrarte el menú\n• Recomendarte platillos\n• Tomar tu pedido\n• Rastrear tu orden\n• Darte info de ubicaciones y eventos\n\n¿Qué necesitas?`
            : `I'm ANIMA, your Simmer Down assistant. I can:\n• Show you the menu\n• Recommend dishes\n• Take your order\n• Track your order\n• Give location & event info\n\nWhat do you need?`,
        actions: ["menu", "recommendations", "track_order", "locations"],
      };
    }

    default: {
      // Try to find a menu item in the message
      const item = findMenuItem(menu, message);
      if (item) {
        return {
          response:
            lang === "es"
              ? `¿Te interesa ${item.name}? Está a ${formatPrice(item.price)}. ${item.description.slice(0, 50)}...`
              : `Interested in ${item.name}? It's ${formatPrice(item.price)}. ${item.description.slice(0, 50)}...`,
          suggestedItems: [item],
          actions: ["add_to_cart", "more_info", "menu"],
        };
      }

      return {
        response:
          lang === "es"
            ? "¿En qué te puedo ayudar? Puedo mostrarte el menú, recomendarte algo, o rastrear tu pedido."
            : "How can I help? I can show you the menu, recommend something, or track your order.",
        actions: ["menu", "recommendations", "track_order"],
      };
    }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/anima";

  // Rate limiting: 10 requests per minute per IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`anima:${clientIp}`, {
    maxRequests: 10,
    windowMs: 60000,
  });

  if (!rateLimit.success) {
    logger.warn("Rate limit exceeded for Anima", { ip: clientIp });
    return rateLimitResponse(rateLimit);
  }

  logger.api.request(endpoint, "POST", { ip: clientIp });

  try {
    const body = await request.json();

    // Validate input with Zod
    const parseResult = animaMessageSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = formatZodErrors(parseResult.error);
      logger.info("Anima validation failed", { errors });
      return validationErrorResponse(errors);
    }

    const { message, context } = parseResult.data;

    // Get menu from database
    const menu = await getMenuItems();

    // Detect intent with entities
    const intentData = detectIntent(message);

    // Generate intelligent response
    const result = await generateResponse(message, menu, context, intentData);

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, { intent: intentData.intent });

    return NextResponse.json({
      success: true,
      response: result.response,
      suggestedItems: result.suggestedItems,
      actions: result.actions,
      orderStatus: result.orderStatus,
      intent: intentData.intent,
      entities: intentData.entities,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.api.error(endpoint, error, { duration });

    return NextResponse.json(
      {
        success: false,
        response:
          "Disculpa, tuve un pequeño problema. ¿Puedes intentar de nuevo?",
        error: "Internal error",
      },
      { status: 500 },
    );
  }
}

// Health check with capabilities
export async function GET() {
  return NextResponse.json({
    status: "ANIMA is awake",
    version: "3.1.0",
    personality: "The Soul of Simmer Down",
    features: ["rate-limiting", "zod-validation", "structured-logging"],
    capabilities: [
      "menu_browsing",
      "smart_recommendations",
      "order_tracking",
      "repeat_orders",
      "dietary_filtering",
      "combo_suggestions",
      "promos_awareness",
      "multilingual_es_en",
      "location_hours",
      "event_info",
    ],
  });
}
