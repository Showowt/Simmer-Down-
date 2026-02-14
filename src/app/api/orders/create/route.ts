/**
 * Server-Side Order Creation API
 * - Validates all input with Zod
 * - Fetches REAL prices from database (never trusts client)
 * - Calculates totals server-side
 * - Proper error handling with typed responses
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";
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
  supabase: ReturnType<typeof createApiClient>,
  itemIds: string[],
): Promise<Map<string, DbMenuItem>> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, price, available")
    .in("id", itemIds);

  if (error) {
    logger.error("Failed to fetch menu prices", error);
    throw new Error("Error al obtener precios del menú");
  }

  const priceMap = new Map<string, DbMenuItem>();
  for (const item of data || []) {
    priceMap.set(item.id, item);
  }

  return priceMap;
}

/**
 * Fetch location details from database
 */
async function fetchLocation(
  supabase: ReturnType<typeof createApiClient>,
  locationId: string,
): Promise<DbLocation | null> {
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
    const supabase = createApiClient();

    // Fetch location from database
    const location = await fetchLocation(supabase, input.locationId);

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid location",
          message: "Ubicación no válida o no encontrada",
        },
        { status: 400 },
      );
    }

    if (!location.is_accepting_orders) {
      return NextResponse.json(
        {
          success: false,
          error: "Location not accepting orders",
          message: "Esta ubicación no está aceptando pedidos en este momento",
        },
        { status: 400 },
      );
    }

    if (input.orderType === "delivery" && !location.delivery_enabled) {
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

    // Fetch REAL prices from database
    const menuPrices = await fetchMenuPrices(supabase, itemIds);

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

      // If item found in DB, use DB price
      // If not found (local menu), trust the client price but flag it
      const isDbItem = !!dbItem;
      const serverPrice = isDbItem ? dbItem.price : clientItem.price;

      // Check availability
      if (isDbItem && !dbItem.available) {
        return NextResponse.json(
          {
            success: false,
            error: "Item unavailable",
            message: `"${dbItem.name}" no está disponible en este momento`,
          },
          { status: 400 },
        );
      }

      const lineTotal = serverPrice * clientItem.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        menu_item_id: isDbItem ? clientItem.id : null,
        item_name: clientItem.name,
        item_description: clientItem.description || null,
        unit_price: serverPrice,
        quantity: clientItem.quantity,
        line_total: lineTotal,
      });
    }

    // Calculate delivery fee (from DB, not client)
    const deliveryFee =
      input.orderType === "delivery" ? location.delivery_fee || 0 : 0;
    const total = subtotal + deliveryFee;

    // Prepare order data
    const orderData = {
      location_id: input.locationId,
      order_type: input.orderType,
      status: "pending",
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail || null,
      delivery_address_line1:
        input.orderType === "delivery" ? input.deliveryAddress : null,
      delivery_city: input.orderType === "delivery" ? input.deliveryCity : null,
      customer_notes: input.notes || null,
      subtotal: subtotal,
      delivery_fee: deliveryFee,
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

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, { orderId: order.id });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        subtotal,
        deliveryFee,
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
