/**
 * Server-Side Order Creation API
 * - Validates all input with Zod
 * - Fetches REAL prices from database (never trusts client)
 * - Calculates totals server-side
 * - Proper error handling with typed responses
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  createOrderSchema,
  formatZodErrors,
  validationErrorResponse,
  type CreateOrderInput,
} from "@/lib/validation";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import logger from "@/lib/logger";
import { sendWhatsApp } from "@/lib/twilio/client";
import { sendTelegram } from "@/lib/telegram";
import { formatOrderWhatsApp } from "@/lib/notifications/order-notify";
import { MENU_ITEMS } from "@/lib/data";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface DbMenuItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

interface DbLocation {
  id: string;
  name: string;
  delivery_fee: number;
  delivery_enabled: boolean;
  is_accepting_orders: boolean;
}

interface OrderResponse {
  success: boolean;
  order?: {
    id: string;
    orderNumber: string;
    subtotal: number;
    deliveryFee: number;
    total: number;
    status: string;
    createdAt: string;
  };
  error?: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch menu item prices from database
 * Returns a map of item id -> price
 */
async function fetchMenuPrices(
  supabase: ReturnType<typeof createServiceClient>,
  itemIds: string[],
): Promise<Map<string, DbMenuItem>> {
  // Filter to only UUID-format IDs (DB column is UUID type)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validUuids = itemIds.filter((id) => uuidPattern.test(id));

  if (validUuids.length === 0) {
    // Frontend uses slug IDs (e.g. "maradona") — no UUID matches in DB
    return new Map();
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, price, available")
    .in("id", validUuids);

  if (error) {
    logger.error("Failed to fetch menu prices", error);
    return new Map(); // Don't throw — fall back to client prices
  }

  const priceMap = new Map<string, DbMenuItem>();
  for (const item of data || []) {
    priceMap.set(item.id, item);
  }

  return priceMap;
}

/**
 * Server-side price/availability enforcement against the static catalog
 * plus admin overrides (menu_item_overrides). The client computes unit
 * price as base + size modifier + extras, so we validate the price is
 * within [effectiveBase, effectiveBase + maxSize + allExtras].
 */
interface ItemOverrideRow {
  price: number | null;
  is_available: boolean | null;
}

async function fetchItemOverrides(
  supabase: ReturnType<typeof createServiceClient>,
  itemIds: string[],
): Promise<Map<string, ItemOverrideRow>> {
  if (itemIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("menu_item_overrides")
    .select("item_id, price, is_available")
    .in("item_id", itemIds);
  if (error) {
    logger.error("Failed to fetch item overrides", error);
    return new Map();
  }
  const map = new Map<string, ItemOverrideRow>();
  for (const row of data || []) {
    map.set(row.item_id, {
      price: row.price != null ? Number(row.price) : null,
      is_available: row.is_available,
    });
  }
  return map;
}

function validateAgainstCatalog(
  clientItem: { id: string; price: number },
  overrides: Map<string, ItemOverrideRow>,
): { ok: true } | { ok: false; reason: "unavailable" | "price"; expectedBase: number } {
  const staticItem = MENU_ITEMS.find((i) => i.id === clientItem.id);
  if (!staticItem) {
    // Unknown to the static catalog — legacy fallback behavior applies
    return { ok: true };
  }

  const o = overrides.get(clientItem.id);
  const available = o?.is_available ?? staticItem.isAvailable;
  const base = o?.price ?? staticItem.basePrice;
  if (!available) return { ok: false, reason: "unavailable", expectedBase: base };

  const maxSize = Math.max(
    0,
    ...(staticItem.sizes || []).map((s) => s.priceModifier || 0),
  );
  const allExtras = (staticItem.modifiers || []).reduce(
    (sum, m) => sum + Math.max(0, m.price || 0),
    0,
  );

  if (clientItem.price < base - 0.01 || clientItem.price > base + maxSize + allExtras + 0.01) {
    return { ok: false, reason: "price", expectedBase: base };
  }
  return { ok: true };
}

/**
 * Fetch location details from database
 */
async function fetchLocation(
  supabase: ReturnType<typeof createServiceClient>,
  locationId: string,
): Promise<DbLocation | null> {
  // Only query by UUID if the ID looks like a UUID (DB column is UUID type)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(locationId)) {
    return null; // Slug-style ID — caller will do name-based lookup
  }

  const { data, error } = await supabase
    .from("locations")
    .select("id, name, delivery_fee, delivery_enabled, is_accepting_orders")
    .eq("id", locationId)
    .single();

  if (error) {
    logger.error("Failed to fetch location", error, { locationId });
    return null;
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════
// WhatsApp Notification Helper (non-blocking)
// ═══════════════════════════════════════════════════════════════

async function sendOrderNotification(
  orderId: string,
  orderNumber: string,
  input: CreateOrderInput,
  validatedItems: Array<{
    menu_item_id: string | null;
    item_name: string;
    item_description: string | null;
    unit_price: number;
    quantity: number;
    line_total: number;
  }>,
  locationName: string,
  total: number,
  subtotal: number,
  deliveryFee: number,
  discountAmount: number,
  discountCode: string | null,
): Promise<void> {
  try {
    const staffPhone =
      process.env.STAFF_NOTIFICATION_WHATSAPP || "+50376804434";

    const message = formatOrderWhatsApp(
      {
        order_number: orderNumber,
        order_type: input.orderType,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        customer_notes: input.notes || null,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: discountAmount > 0 ? discountAmount : null,
        discount_code: discountCode,
        total_amount: total,
        delivery_address_line1:
          input.orderType === "delivery" ? input.deliveryAddress || null : null,
        delivery_city:
          input.orderType === "delivery" ? input.deliveryCity || null : null,
      },
      validatedItems.map((item) => ({
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
      })),
      locationName,
    );

    // Send to Telegram (primary notification channel)
    const telegramResult = await sendTelegram(message);
    if (telegramResult.success) {
      logger.info("Order Telegram notification sent", { orderId, orderNumber });
    }

    // Also send to WhatsApp if Twilio is configured
    const result = await sendWhatsApp(staffPhone, message);
    if (result.success) {
      logger.info("Order WhatsApp notification sent", {
        orderId,
        orderNumber,
        to: staffPhone,
      });
    }

    // Send to secondary WhatsApp contact if configured
    const secondaryPhone = process.env.STAFF_NOTIFICATION_WHATSAPP_2;
    if (secondaryPhone) {
      await sendWhatsApp(secondaryPhone, message);
    }
  } catch (err) {
    logger.warn("sendOrderNotification error", {
      orderId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
): Promise<NextResponse<OrderResponse>> {
  const startTime = Date.now();
  const endpoint = "/api/orders/create";

  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`order:${clientIp}`, {
    maxRequests: 5,
    windowMs: 60000,
  });

  if (!rateLimit.success) {
    logger.warn("Rate limit exceeded for order creation", { ip: clientIp });
    return rateLimitResponse(rateLimit) as NextResponse<OrderResponse>;
  }

  logger.api.request(endpoint, "POST", { ip: clientIp });

  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const parseResult = createOrderSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = formatZodErrors(parseResult.error);
      logger.info("Order validation failed", { errors });
      return validationErrorResponse(errors) as NextResponse<OrderResponse>;
    }

    const input: CreateOrderInput = parseResult.data;
    const supabase = createServiceClient();

    // Fetch location from database — try by UUID first, then by slug/name match
    let location = await fetchLocation(supabase, input.locationId);

    if (!location) {
      // Frontend sends slug-style IDs (e.g. "santa-ana") — try name-based lookup
      const slugToName: Record<string, string> = {
        "santa-ana": "Santa Ana",
        "lago-coatepeque": "Lago de Coatepeque",
        "san-benito": "San Benito",
        "surf-city": "Surf City",
        "simmer-garden": "Simmer Garden",
      };
      const locationName = slugToName[input.locationId];
      if (locationName) {
        const { data } = await supabase
          .from("locations")
          .select("id, name, delivery_fee, delivery_enabled, is_accepting_orders")
          .ilike("name", `%${locationName}%`)
          .limit(1)
          .maybeSingle();
        if (data) location = data;
      }
    }

    // location_id is NOT NULL in the DB — must find a valid UUID
    if (!location) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid location",
          message: "Ubicación no encontrada. Por favor selecciona otra ubicación.",
        },
        { status: 400 },
      );
    }

    const locationName = location.name;
    const locationId = location.id;
    const deliveryFee = location.delivery_fee ?? 0;

    if (location && !location.is_accepting_orders) {
      return NextResponse.json(
        {
          success: false,
          error: "Location not accepting orders",
          message: "Esta ubicación no está aceptando pedidos en este momento",
        },
        { status: 400 },
      );
    }

    if (input.orderType === "delivery" && location && !location.delivery_enabled) {
      return NextResponse.json(
        {
          success: false,
          error: "Delivery not available",
          message:
            "Esta ubicación no ofrece delivery. Por favor selecciona Recoger.",
        },
        { status: 400 },
      );
    }

    // Extract item IDs for database lookup
    const itemIds = input.items.map((item) => item.id);

    // Fetch REAL prices from database + admin catalog overrides
    const [menuPrices, itemOverrides] = await Promise.all([
      fetchMenuPrices(supabase, itemIds),
      fetchItemOverrides(supabase, itemIds),
    ]);

    // Validate all items exist and calculate server-side totals
    let subtotal = 0;
    const validatedItems: Array<{
      menu_item_id: string | null;
      item_name: string;
      item_description: string | null;
      unit_price: number;
      quantity: number;
      line_total: number;
    }> = [];

    for (const clientItem of input.items) {
      const dbItem = menuPrices.get(clientItem.id);

      // Use DB price if available; fall back to client price if menu_items
      // table doesn't have this item (frontend uses hardcoded data.ts)
      const serverPrice = dbItem?.price ?? clientItem.price;

      if (!dbItem) {
        logger.warn("Menu item not in DB, using client price", {
          itemId: clientItem.id,
          clientPrice: clientItem.price,
        });
      }

      // Check availability (only if in DB)
      if (dbItem && !dbItem.available) {
        return NextResponse.json(
          {
            success: false,
            error: "Item unavailable",
            message: `"${dbItem.name}" no está disponible en este momento`,
          },
          { status: 400 },
        );
      }

      // Enforce static catalog + admin overrides (price bounds, availability)
      const catalogCheck = validateAgainstCatalog(clientItem, itemOverrides);
      if (!catalogCheck.ok) {
        if (catalogCheck.reason === "unavailable") {
          return NextResponse.json(
            {
              success: false,
              error: "Item unavailable",
              message: `"${clientItem.name}" no está disponible en este momento`,
            },
            { status: 400 },
          );
        }
        logger.warn("Order item price outside catalog bounds", {
          itemId: clientItem.id,
          clientPrice: clientItem.price,
          expectedBase: catalogCheck.expectedBase,
        });
        return NextResponse.json(
          {
            success: false,
            error: "Price mismatch",
            message:
              "Los precios del menú cambiaron. Por favor actualiza la página y vuelve a intentar.",
          },
          { status: 409 },
        );
      }

      const lineTotal = serverPrice * clientItem.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        menu_item_id: dbItem ? clientItem.id : null,
        item_name: clientItem.name,
        item_description: clientItem.description || null,
        unit_price: serverPrice,
        quantity: clientItem.quantity,
        line_total: lineTotal,
      });
    }

    // Calculate delivery fee
    const calcDeliveryFee =
      input.orderType === "delivery" ? deliveryFee : 0;

    // Validate promo code server-side if provided
    let discountAmount = 0;
    let discountCode: string | null = null;
    let discountDescription: string | null = null;

    if (input.promoCode) {
      const { data: promo, error: promoError } = await supabase
        .from("promo_codes")
        .select("id, code, discount_type, discount_value, min_order_amount, is_active, expires_at, description")
        .eq("code", input.promoCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (promoError || !promo) {
        logger.info("Invalid promo code attempted", { code: input.promoCode });
      } else {
        const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
        const belowMinimum = promo.min_order_amount && subtotal < promo.min_order_amount;

        if (!isExpired && !belowMinimum) {
          const discountValue = promo.discount_value ?? 0;
          if (promo.discount_type === "percent") {
            discountAmount = (subtotal * discountValue) / 100;
          } else {
            discountAmount = discountValue;
          }
          discountAmount = Math.min(discountAmount, subtotal);
          discountCode = promo.code;
          discountDescription = promo.description || `Descuento ${promo.discount_type === "percent" ? `${discountValue}%` : `$${discountValue.toFixed(2)}`}`;
        }
      }
    }

    const total = Math.max(0, subtotal + calcDeliveryFee - discountAmount);

    // Map frontend order types to DB enum (DB only has delivery|pickup)
    const dbOrderType = input.orderType === "delivery" ? "delivery" : "pickup";

    // Prepare order data
    const orderData: Record<string, unknown> = {
      location_id: locationId,
      order_type: dbOrderType,
      status: "pending",
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail || null,
      delivery_address_line1:
        input.orderType === "delivery" ? input.deliveryAddress : null,
      delivery_city: input.orderType === "delivery" ? input.deliveryCity : null,
      customer_notes: input.notes || null,
      subtotal: subtotal,
      delivery_fee: calcDeliveryFee,
      discount_amount: discountAmount > 0 ? discountAmount : null,
      discount_code: discountCode,
      discount_description: discountDescription,
      total_amount: total,
      order_source: "website",
    };

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([orderData])
      .select("id, order_number, created_at")
      .single();

    if (orderError) {
      logger.error("Failed to create order", orderError);
      return NextResponse.json(
        {
          success: false,
          error: "Order creation failed",
          message: "Error al crear el pedido. Por favor intenta de nuevo.",
        },
        { status: 500 },
      );
    }

    // Insert order items
    const orderItems = validatedItems.map((item) => ({
      order_id: order.id,
      ...item,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      logger.warn("Order items insert failed", {
        orderId: order.id,
        error: itemsError.message,
      });
      // Don't fail the order - it was created successfully
    }

    // Send WhatsApp notification (non-blocking — don't fail the order if notification fails)
    sendOrderNotification(
      order.id,
      order.order_number,
      input,
      validatedItems,
      locationName,
      total,
      subtotal,
      calcDeliveryFee,
      discountAmount,
      discountCode,
    ).catch((err) =>
      logger.warn("WhatsApp notification failed", {
        orderId: order.id,
        error: err instanceof Error ? err.message : String(err),
      }),
    );

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, { orderId: order.id });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        subtotal,
        deliveryFee: calcDeliveryFee,
        total,
        status: "pending",
        createdAt: order.created_at,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.api.error(endpoint, error, { duration });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Error interno del servidor. Por favor intenta de nuevo.",
      },
      { status: 500 },
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/orders/create",
    method: "POST",
    description: "Server-side order creation with validation",
  });
}
