/**
 * GET  /api/orders/[orderId] — Public order lookup (non-sensitive fields only)
 * PUT  /api/orders/[orderId] — Update order (customer: cancel only | staff: any status)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const VALID_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
  "refunded",
] as const;

type ValidOrderStatus = (typeof VALID_ORDER_STATUSES)[number];

// ═══════════════════════════════════════════════════════════════
// Auth Helpers
// ═══════════════════════════════════════════════════════════════

interface AuthResult {
  userId: string | null;
  isStaff: boolean;
}

async function getAuth(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { userId: null, isStaff: false };

    const { data: staff } = await supabase
      .from("staff")
      .select("id, role, is_active")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    return {
      userId: user.id,
      isStaff: !!staff && staff.is_active === true,
    };
  } catch {
    return { userId: null, isStaff: false };
  }
}

// ═══════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════

const updateOrderSchema = z
  .object({
    status: z
      .enum(VALID_ORDER_STATUSES, {
        error: `Estado inválido. Valores permitidos: ${VALID_ORDER_STATUSES.join(", ")}`,
      })
      .optional(),
    notes: z
      .string()
      .max(500, "Las notas no pueden exceder 500 caracteres")
      .optional(),
  })
  .refine((data) => data.status !== undefined || data.notes !== undefined, {
    message: "Debes enviar al menos un campo para actualizar (status o notes).",
  });

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

// ═══════════════════════════════════════════════════════════════
// GET — Public order lookup
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const startTime = Date.now();
  const { orderId } = await context.params;
  const endpoint = `/api/orders/${orderId}`;

  // Rate limit public endpoint
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`order_get:${clientIp}`, {
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (!rl.success) return rateLimitResponse(rl) as NextResponse;

  logger.api.request(endpoint, "GET", { ip: clientIp });

  // Validate orderId format
  const uuidResult = z.string().uuid("ID de pedido inválido").safeParse(orderId);
  if (!uuidResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: "ID inválido",
        message: "El ID del pedido no es válido.",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    // Fetch order (non-sensitive fields only)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, order_type, subtotal, delivery_fee, total_amount, created_at",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: "Pedido no encontrado",
          message: "No se encontró un pedido con ese ID.",
        },
        { status: 404 },
      );
    }

    // Fetch order items
    const { data: items } = await supabase
      .from("order_items")
      .select("id, item_name, item_description, unit_price, quantity, line_total")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    // Fetch payment status (non-sensitive — no auth codes)
    const { data: payment } = await supabase
      .from("payments")
      .select("status")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Map DB payment status to public-facing status
    let paymentStatus: "paid" | "pending" | "failed" = "pending";
    if (payment?.status === "completed") {
      paymentStatus = "paid";
    } else if (
      payment?.status === "failed" ||
      payment?.status === "cancelled"
    ) {
      paymentStatus = "failed";
    }

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, { orderId });

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        order_type: order.order_type,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total_amount: order.total_amount,
        created_at: order.created_at,
        items: items ?? [],
        payment_status: paymentStatus,
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

// ═══════════════════════════════════════════════════════════════
// PUT — Update order
// ═══════════════════════════════════════════════════════════════

export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const startTime = Date.now();
  const { orderId } = await context.params;
  const endpoint = `/api/orders/${orderId}`;

  logger.api.request(endpoint, "PUT");

  // Validate orderId format
  const uuidResult = z.string().uuid("ID de pedido inválido").safeParse(orderId);
  if (!uuidResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: "ID inválido",
        message: "El ID del pedido no es válido.",
      },
      { status: 400 },
    );
  }

  // Auth check — must be logged in
  const auth = await getAuth();
  if (!auth.userId) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        message: "Debes iniciar sesión para realizar esta acción.",
      },
      { status: 401 },
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "JSON inválido",
        message: "El cuerpo de la solicitud debe ser JSON válido.",
      },
      { status: 400 },
    );
  }

  // Validate input
  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      {
        success: false,
        error: "Datos inválidos",
        message: firstError?.message ?? "Revisa los datos enviados.",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    // Fetch existing order to check ownership & current status
    const { data: existingOrder, error: fetchError } = await supabase
      .from("orders")
      .select("id, customer_id, status, order_number")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError || !existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "Pedido no encontrado",
          message: "No se encontró un pedido con ese ID.",
        },
        { status: 404 },
      );
    }

    // Permission logic
    const isOwner = existingOrder.customer_id === auth.userId;
    const isStaff = auth.isStaff;

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "No tienes permisos para modificar este pedido.",
        },
        { status: 403 },
      );
    }

    // Customer restrictions: can only cancel a pending order
    if (!isStaff && parsed.data.status) {
      if (parsed.data.status !== "cancelled") {
        return NextResponse.json(
          {
            success: false,
            error: "Acción no permitida",
            message: "Solo puedes cancelar tu pedido.",
          },
          { status: 403 },
        );
      }
      if (existingOrder.status !== "pending") {
        return NextResponse.json(
          {
            success: false,
            error: "Acción no permitida",
            message:
              "Solo puedes cancelar pedidos que están pendientes. Tu pedido ya está en proceso.",
          },
          { status: 400 },
        );
      }
    }

    // Build update payload
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.status) {
      updateData.status = parsed.data.status;

      // Set timestamp fields based on status
      if (parsed.data.status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString();
      } else if (parsed.data.status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else if (parsed.data.status === "confirmed") {
        updateData.confirmed_at = new Date().toISOString();
      } else if (parsed.data.status === "ready") {
        updateData.ready_at = new Date().toISOString();
      }
    }

    if (parsed.data.notes !== undefined) {
      // Staff writes to internal_notes; customer writes to customer_notes
      if (isStaff) {
        updateData.internal_notes = parsed.data.notes;
      } else {
        updateData.customer_notes = parsed.data.notes;
      }
    }

    // Perform update
    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select(
        "id, order_number, status, order_type, customer_name, subtotal, delivery_fee, total_amount, customer_notes, internal_notes, created_at, updated_at",
      )
      .single();

    if (updateError) {
      logger.error("Failed to update order", updateError, { orderId });
      return NextResponse.json(
        {
          success: false,
          error: "Error al actualizar",
          message: "No se pudo actualizar el pedido. Intenta de nuevo.",
        },
        { status: 500 },
      );
    }

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, {
      orderId,
      newStatus: parsed.data.status,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Pedido actualizado exitosamente.",
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
