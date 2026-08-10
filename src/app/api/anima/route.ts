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
import { createApiClient } from "@/lib/supabase/api";
import { isSpecialLive } from "@/lib/specials";
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

// Trimmed defensively — Vercel env values have shipped with trailing
// newlines before (see BLK-006). Empty key = Anima disabled, launcher hidden.
const ANTHROPIC_KEY = (process.env.ANTHROPIC_API_KEY ?? "").trim();
const ANIMA_ENABLED = ANTHROPIC_KEY.length > 0;

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_KEY,
});

/**
 * Live promos from the client-managed specials table — never hardcoded, so
 * Anima only ever mentions promotions that are actually running right now.
 */
async function buildPromoBlock(): Promise<string> {
  const ivaLine = "- 💰 IVA: 13% incluido en todos los precios";
  try {
    const supabase = createApiClient();
    const { data } = await supabase
      .from("specials")
      .select("title, description, active, start_date, end_date, days_of_week")
      .eq("active", true);
    const live = (data ?? []).filter((s) => isSpecialLive(s));
    if (live.length === 0) {
      return `\n## PROMOCIONES ACTUALES\n- No hay promociones activas hoy — revisa la sección de especiales del sitio\n${ivaLine}`;
    }
    const lines = live.map((s) =>
      `- 🔥 ${s.title}${s.description ? `: ${s.description}` : ""} (activa HOY)`,
    );
    return `\n## PROMOCIONES ACTUALES (verificadas hoy)\n${lines.join("\n")}\n${ivaLine}`;
  } catch {
    return `\n## PROMOCIONES ACTUALES\n- Consulta la sección de especiales en el sitio\n${ivaLine}`;
  }
}

/** Cover/pre-sale price encoded in event tags (cover-15 → "$15", preventa-10 → "Preventa $10"). */
function eventCoverFromTags(tags?: string[] | null): string | null {
  if (!tags) return null;
  for (const tag of tags) {
    if (tag.startsWith("cover-")) return `Cover $${tag.slice(6)}`;
    if (tag.startsWith("preventa-")) return `Preventa $${tag.slice(9)}`;
  }
  return null;
}

/**
 * Live published events from the client-managed events table — so Anima can
 * actually answer "¿qué eventos/música en vivo hay?" instead of guessing.
 * Simmer Down San Benito is the flagship live-concert venue (programa Simmer Manía).
 */
async function buildEventsBlock(): Promise<string> {
  try {
    const supabase = createApiClient();
    // Venue name map (events reference locations by UUID; custom_venue is a free-text fallback).
    const [{ data: events }, { data: locs }] = await Promise.all([
      supabase
        .from("events")
        .select("title, title_es, description_es, description, custom_venue, location_id, starts_at, recurrence, is_featured, tags")
        .eq("is_published", true)
        .order("starts_at", { ascending: true }),
      supabase.from("locations").select("id, name"),
    ]);

    const venueById = new Map<string, string>((locs ?? []).map((l) => [l.id as string, l.name as string]));
    const now = Date.now();
    const upcoming = (events ?? [])
      .filter((e) => {
        if (e.recurrence) return true;
        const t = new Date(e.starts_at).getTime();
        return !Number.isNaN(t) && t >= now - 12 * 3600 * 1000; // include today
      })
      .slice(0, 12);

    if (upcoming.length === 0) {
      return `\n## EVENTOS Y MÚSICA EN VIVO\n- Simmer Down San Benito es la sede principal de conciertos y eventos en vivo (programa Simmer Manía).\n- No hay eventos próximos publicados ahora mismo — revisa la sección de Eventos del sitio (simmerdownsv.com/events).`;
    }

    const lines = upcoming.map((e) => {
      const name = e.title_es || e.title;
      const venue = e.custom_venue || (e.location_id ? venueById.get(e.location_id) : null) || "Simmer Down";
      const when = e.recurrence === "monthly"
        ? "cada mes"
        : new Date(e.starts_at).toLocaleDateString("es-SV", { day: "numeric", month: "long" });
      const cover = eventCoverFromTags(e.tags);
      return `- 🎤 ${name} — ${venue}${when ? `, ${when}` : ""}${cover ? ` (${cover})` : ""}`;
    });

    return `\n## EVENTOS Y MÚSICA EN VIVO (verificados hoy)\nSimmer Down San Benito es la sede principal de conciertos y eventos en vivo (programa Simmer Manía). Estos son los próximos eventos publicados:\n${lines.join("\n")}\nPara la lista completa y boletos: simmerdownsv.com/events`;
  } catch {
    return `\n## EVENTOS Y MÚSICA EN VIVO\n- Simmer Down San Benito es la sede principal de conciertos y eventos en vivo (programa Simmer Manía). Consulta simmerdownsv.com/events para la programación.`;
  }
}

// Build the complete business knowledge base for Claude
function buildSystemPrompt(language: "es" | "en", promoBlock: string, eventsBlock: string): string {
  // ── LOCATIONS ──────────────────────────────────────────────
  const locationBlocks = LOCATIONS.map((loc) => {
    const open = isLocationOpen(loc);
    // Per-day hours straight from data.ts (single source of truth). "Cerrado" days
    // are shown explicitly so Anima never has to guess which days a location opens.
    const h = loc.hours;
    return `
### ${loc.name} (${loc.shortName})
- Dirección: ${loc.address}, ${loc.city}
- Teléfono: ${loc.phone}
- WhatsApp: ${loc.whatsapp}
- Horario por día:
  - Lunes: ${h.monday ?? h.weekday}
  - Martes: ${h.tuesday ?? h.weekday}
  - Miércoles: ${h.wednesday ?? h.weekday}
  - Jueves: ${h.thursday ?? h.weekday}
  - Viernes: ${h.friday ?? h.weekend}
  - Sábado: ${h.saturday ?? h.weekend}
  - Domingo: ${h.sunday ?? h.weekend}
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


  // ── ABOUT THE BUSINESS ─────────────────────────────────────
  const aboutBlock = `
## SOBRE SIMMER DOWN
- Fundada en 2014 en Santa Ana, El Salvador
- 12 años de experiencia
- 5 ubicaciones en El Salvador
- +8,000 reseñas con calificación 4.9 estrellas
- Especialidad: Pizza artesanal
- También: Pastas, cortes, mariscos, ensaladas
- Programa de lealtad: SimmerLovers (puntos por cada compra)
- Pedidos por WhatsApp: +503 7680-4434
- Reservaciones disponibles en todas las ubicaciones
- Delivery disponible en las 5 ubicaciones — tarifa plana $1.00, también pedidos con tarjeta en el sitio web
- Mascotas bienvenidas en Simmer Garden (La Majada)
- Conciertos y música en vivo: Simmer Down San Benito es la SEDE PRINCIPAL de conciertos y eventos en vivo (programa "Simmer Manía"). También hay música en vivo los fines de semana en Simmer Garden. Los eventos concretos aparecen en la sección "EVENTOS Y MÚSICA EN VIVO" más abajo
- Eventos privados: cumpleaños, corporativos, cenas privadas (disponibles en varias ubicaciones)`;

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
${eventsBlock}

## REGLAS DE RESPUESTA
1. Siempre menciona PRECIOS REALES del menú — nunca inventes precios
2. Si piden recomendación, sugiere 2-3 items con precio
3. Si preguntan por ingredientes, usa las descripciones del menú
4. Si preguntan por horarios o qué días abre/cierra una ubicación, usa EXCLUSIVAMENTE el "Horario por día" (Lunes…Domingo) listado arriba. "Cerrado" significa cerrado ese día. NUNCA asumas ni inventes días de apertura o cierre.
5. Si piden algo que NO está en el menú, dilo honestamente
6. Items exclusivos de ubicación: menciona dónde están disponibles
7. Mariscos frescos son especialidad del Lago de Coatepeque y Surf City
8. Si preguntan por eventos, conciertos o música en vivo, usa la sección "EVENTOS Y MÚSICA EN VIVO". Simmer Down San Benito es la SEDE PRINCIPAL de conciertos (programa Simmer Manía) — NUNCA digas que San Benito no tiene música en vivo. Menciona eventos concretos con su fecha si están listados
9. Para pedidos, dirige al WhatsApp: +503 7680-4434
10. Responde en ${language === "es" ? "español" : "inglés"}
11. NUNCA inventes items, precios, o información que no está arriba`;

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

    const { message, context, history } = parseResult.data;
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

    // Not configured: answer with the graceful WhatsApp fallback instead of
    // burning a doomed API call (the launcher hides itself via GET /api/anima).
    if (!ANIMA_ENABLED) {
      return NextResponse.json(
        {
          success: false,
          response:
            language === "en"
              ? "I'm taking a quick break! You can order via WhatsApp at +503 7680-4434 or browse our menu. 🍕"
              : "¡Estoy tomando un descanso! Puedes hacer tu pedido por WhatsApp al +503 7680-4434 o explorar nuestra carta. 🍕",
          suggestedItems: [],
          actions: ["menu", "recommendations"],
          error: "not_configured",
        },
        { status: 503 },
      );
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
    const [promoBlock, eventsBlock] = await Promise.all([
      buildPromoBlock(),
      buildEventsBlock(),
    ]);
    const systemPrompt = buildSystemPrompt(language, promoBlock, eventsBlock);

    // claude-sonnet-5 defaults to adaptive thinking, which would consume the
    // small chat budget — disabled keeps replies fast and within max_tokens.
    const claudeResponse = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 600,
      thinking: { type: "disabled" },
      system: systemPrompt,
      messages: [
        // Prior turns (must start with a user turn for the API)
        ...(history ?? []).slice(
          (history ?? []).findIndex((m) => m.role === "user") === -1
            ? (history ?? []).length
            : (history ?? []).findIndex((m) => m.role === "user"),
        ),
        { role: "user" as const, content: fullMessage },
      ],
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
          "Disculpa, tuve un pequeño problema. ¿Puedes intentar de nuevo? También puedes hacer tu pedido por WhatsApp al +503 7680-4434.",
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
    status: ANIMA_ENABLED ? "ANIMA v4.0 is awake" : "ANIMA is sleeping (no API key)",
    enabled: ANIMA_ENABLED,
    version: "4.0.0",
    personality: "The Soul of Simmer Down",
    engine: "Claude Sonnet (claude-sonnet-5)",
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
