import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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
import {
  MENU_ITEMS,
  MENU_CATEGORIES,
  LOCATIONS,
  formatPrice,
  isLocationOpen,
  type MenuItem,
} from "@/lib/data";

// ═══════════════════════════════════════════════════════════
// ANIMA v4.0 — Claude-Powered Soul of Simmer Down
// Trained on 100% of business: menu, locations, ingredients,
// prices, hours, specials, dietary info, promos.
// ═══════════════════════════════════════════════════════════

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Build the complete business knowledge base for Claude
function buildSystemPrompt(language: "es" | "en"): string {
  // ── LOCATIONS ──────────────────────────────────────────────
  const locationBlocks = LOCATIONS.map((loc) => {
    const open = isLocationOpen(loc);
    return `
### ${loc.name} (${loc.shortName})
- Dirección: ${loc.address}, ${loc.city}
- Teléfono: ${loc.phone}
- WhatsApp: ${loc.whatsapp}
- Horario entre semana: ${loc.hours.weekday}
- Horario fin de semana: ${loc.hours.weekend}${loc.hours.sunday ? `\n- Domingo: ${loc.hours.sunday}` : ""}
- Ahora mismo: ${open ? "ABIERTO" : "CERRADO"}
- Características: ${loc.features.join(", ")}`;
  }).join("\n");

  // ── MENU ───────────────────────────────────────────────────
  const menuByCategory: Record<string, string[]> = {};

  for (const item of MENU_ITEMS) {
    if (!item.isAvailable) continue;
    const cat = MENU_CATEGORIES.find((c) => c.id === item.categoryId);
    const catName = cat ? cat.nameEs : item.categoryId;

    if (!menuByCategory[catName]) menuByCategory[catName] = [];

    let line = `- **${item.nameEs}** (${item.name})`;

    // Prices
    if (item.sizes && item.sizes.length > 0) {
      const prices = item.sizes
        .map((s) => `${s.nameEs}: ${formatPrice(item.basePrice + s.priceModifier)}`)
        .join(" | ");
      line += ` — ${prices}`;
    } else {
      line += ` — ${formatPrice(item.basePrice)}`;
    }

    // Description
    line += `\n  ${item.descriptionEs || item.description || ""}`;

    // Dietary flags
    const flags: string[] = [];
    if (item.isVegetarian) flags.push("🌱 Vegetariano");
    if (item.isSpicy) flags.push("🌶️ Picante");
    if (item.isGlutenFree) flags.push("Sin Gluten");
    if (item.isFeatured) flags.push("⭐ Destacado");
    if (item.isNew) flags.push("🆕 Nuevo");
    if (flags.length > 0) line += `\n  ${flags.join(" · ")}`;

    menuByCategory[catName].push(line);
  }

  const menuBlocks = Object.entries(menuByCategory)
    .map(([cat, items]) => `\n## ${cat.toUpperCase()}\n${items.join("\n\n")}`)
    .join("\n");

  // ── PIZZA MODIFIERS ────────────────────────────────────────
  const modifierBlock = `
## MODIFICADORES DE PIZZA (Extras opcionales)
- Queso Extra: +$1.50
- Pepperoni: +$1.50
- Champiñones: +$1.00
- Tocino: +$1.50
- Jalapeños: +$0.75
- Aceitunas: +$0.75
- Camarones: +$2.50
- Salsa BBQ: +$0.50
- Salsa de Ajo: +$0.50
- Salsa Picante: +$0.50
- Borde Relleno: +$2.00
- Base Sin Gluten: +$3.00

## TAMAÑOS DE PIZZA
- Personal (8"): Precio base (regulares desde $5.75, especialidad desde $6.25)
- Grande (16"): Regulares $14.99, Especialidad $17.99`;

  // ── PROMOS ─────────────────────────────────────────────────
  const promoBlock = `
## PROMOCIONES ACTUALES
- 🍺 2x1 Cervezas Artesanales: Viernes y Sábado 5-7pm
- 🍕 Combo Familiar: 2 pizzas grandes + 1L refresco por $29.99 (Sáb-Dom)
- 🥂 Happy Hour: 20% descuento en bebidas 3-5pm (Lun-Vie)
- 💰 IVA: 13% incluido en todos los precios`;

  // ── ABOUT THE BUSINESS ─────────────────────────────────────
  const aboutBlock = `
## SOBRE SIMMER DOWN
- Fundada en 2014 en Santa Ana, El Salvador
- 14 años de experiencia
- 5 ubicaciones en El Salvador
- +8,000 reseñas con calificación 4.9 estrellas
- Especialidad: Pizza artesanal de horno de leña
- También: Pastas, cortes, mariscos, ensaladas
- Programa de lealtad: SimmerLovers (puntos por cada compra)
- Pedidos por WhatsApp: +503 7576-4655
- Reservaciones disponibles en todas las ubicaciones
- Delivery disponible en Santa Ana y San Benito
- Mascotas bienvenidas en Simmer Garden (La Majada)
- Música en vivo los fines de semana en ubicaciones selectas
- Eventos privados: cumpleaños, corporativos, cenas privadas`;

  const systemPrompt = `Eres ANIMA — El Alma de Simmer Down. Eres la asistente virtual inteligente del restaurante Simmer Down en El Salvador.

## TU PERSONALIDAD
- Cálida, amigable y conocedora de TODO el menú
- Orgullosa de la comida y la historia de Simmer Down
- Hablas ${language === "es" ? "español salvadoreño de forma natural y amigable" : "English fluently but with Latin warmth"}
- Usas emojis con moderación (🍕 🔥 ⭐ 😋)
- NUNCA inventas información — solo compartes lo que sabes del menú real
- Si no sabes algo, dices honestamente que no tienes esa info
- Respuestas CORTAS y directas (máximo 3-4 líneas) a menos que listen el menú
- Siempre sugieres items específicos con precios reales
- Si mencionan algo que no está en el menú, dices que no lo tenemos y sugieres alternativas

## CONOCIMIENTO COMPLETO DEL NEGOCIO

${aboutBlock}

## UBICACIONES (5 Restaurantes)
${locationBlocks}

## MENÚ COMPLETO (${MENU_ITEMS.filter((i) => i.isAvailable).length} items)
${menuBlocks}

${modifierBlock}

${promoBlock}

## REGLAS DE RESPUESTA
1. Siempre menciona PRECIOS REALES del menú — nunca inventes precios
2. Si piden recomendación, sugiere 2-3 items con precio
3. Si preguntan por ingredientes, usa las descripciones del menú
4. Si preguntan por ubicación/horarios, da la información EXACTA
5. Si piden algo que NO está en el menú, dilo honestamente
6. Items exclusivos de ubicación: menciona dónde están disponibles
7. Mariscos frescos son especialidad del Lago de Coatepeque y Surf City
8. Simmer Garden (La Majada) abre solo Viernes-Domingo
9. Surf City está cerrado Lunes y Martes
10. Para pedidos, dirige al WhatsApp: +503 7576-4655
11. Responde en ${language === "es" ? "español" : "inglés"}
12. NUNCA inventes items, precios, o información que no está arriba`;

  return systemPrompt;
}

// Format menu items for frontend response
function formatSuggestedItems(items: MenuItem[]): Array<{
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}> {
  return items.map((item) => ({
    id: item.id,
    name: item.nameEs || item.name,
    description: item.descriptionEs || item.description || "",
    price: item.basePrice,
    category: item.categoryId,
  }));
}

// Find items matching keywords from Claude's response
function extractSuggestedItems(
  responseText: string,
  limit = 3,
): MenuItem[] {
  const results: MenuItem[] = [];
  const lower = responseText.toLowerCase();

  for (const item of MENU_ITEMS) {
    if (!item.isAvailable) continue;
    const nameEs = item.nameEs.toLowerCase();
    const name = item.name.toLowerCase();

    if (lower.includes(nameEs) || lower.includes(name)) {
      results.push(item);
      if (results.length >= limit) break;
    }
  }

  return results;
}

// Quick responses that don't need Claude API
function getQuickResponse(
  message: string,
  language: "es" | "en",
): string | null {
  const lower = message.toLowerCase().trim();

  // Simple farewells
  if (/^(gracias|adios|bye|chao|thanks|thank you|nos vemos)$/i.test(lower)) {
    return language === "es"
      ? "¡Gracias por visitarnos! 🍕 ¡Buen provecho!"
      : "Thanks for visiting! 🍕 Enjoy your meal!";
  }

  return null;
}

// Detect language from message or context
function detectLanguage(
  message: string,
  contextLang?: "es" | "en" | null,
): "es" | "en" {
  if (contextLang) return contextLang;

  const englishWords = [
    "want", "would", "like", "please", "what", "where", "how",
    "order", "have", "the", "and", "for", "can", "show", "me",
  ];
  const spanishWords = [
    "quiero", "quisiera", "favor", "qué", "dónde", "cómo",
    "pedido", "tengo", "el", "la", "para", "hola", "dame",
  ];

  const lower = message.toLowerCase();
  const enCount = englishWords.filter((w) => lower.includes(w)).length;
  const esCount = spanishWords.filter((w) => lower.includes(w)).length;

  return esCount >= enCount ? "es" : "en";
}

// Main POST handler
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
    const language = detectLanguage(message, context.language);

    // Check for quick responses first (no API call needed)
    const quickResponse = getQuickResponse(message, language);
    if (quickResponse) {
      return NextResponse.json({
        success: true,
        response: quickResponse,
        suggestedItems: [],
        actions: ["menu", "recommendations"],
        intent: "farewell",
        entities: {},
        timestamp: new Date().toISOString(),
      });
    }

    // Build context message for Claude
    let userContext = "";
    if (context.customerName) {
      userContext += `Cliente: ${context.customerName}. `;
    }
    if (context.cartItems && context.cartItems.length > 0) {
      const cartSummary = context.cartItems
        .map((i) => `${i.quantity}x ${i.name}`)
        .join(", ");
      userContext += `Carrito actual: ${cartSummary}. `;
    }
    if (context.loyaltyTier) {
      userContext += `Miembro SimmerLovers tier: ${context.loyaltyTier}. `;
    }
    if (context.currentTime) {
      userContext += `Hora actual: ${context.currentTime}. `;
    }
    if (context.dayOfWeek) {
      userContext += `Día: ${context.dayOfWeek}. `;
    }

    const fullMessage = userContext
      ? `[Contexto: ${userContext}]\n\nMensaje del cliente: ${message}`
      : message;

    // Call Claude API
    const systemPrompt = buildSystemPrompt(language);

    const claudeResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: fullMessage }],
    });

    const responseText =
      claudeResponse.content[0].type === "text"
        ? claudeResponse.content[0].text
        : "";

    // Extract suggested items from the response
    const suggestedItems = extractSuggestedItems(responseText);

    // Detect actions from context
    const actions: string[] = ["menu", "recommendations"];
    const lower = message.toLowerCase();
    if (/ubicacion|donde|location|hours|hora/i.test(lower)) {
      actions.push("locations");
    }
    if (/reserv/i.test(lower)) {
      actions.push("reserve");
    }

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, {
      intent: "claude_ai",
      tokens: claudeResponse.usage?.output_tokens,
    });

    return NextResponse.json({
      success: true,
      response: responseText,
      suggestedItems: formatSuggestedItems(suggestedItems),
      actions,
      intent: "claude_ai",
      entities: {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.api.error(endpoint, error, { duration });

    // Fallback response if Claude API fails
    return NextResponse.json(
      {
        success: false,
        response:
          "Disculpa, tuve un pequeño problema. ¿Puedes intentar de nuevo? También puedes hacer tu pedido por WhatsApp al +503 7576-4655.",
        suggestedItems: [],
        actions: ["menu", "recommendations"],
        error: "Internal error",
      },
      { status: 500 },
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ANIMA v4.0 is awake",
    version: "4.0.0",
    personality: "The Soul of Simmer Down",
    engine: "Claude Sonnet (claude-sonnet-4-20250514)",
    features: [
      "claude-ai-powered",
      "full-menu-knowledge",
      "5-location-awareness",
      "dietary-filtering",
      "bilingual-es-en",
      "rate-limiting",
      "zod-validation",
    ],
    menuItems: MENU_ITEMS.filter((i) => i.isAvailable).length,
    locations: LOCATIONS.length,
  });
}
