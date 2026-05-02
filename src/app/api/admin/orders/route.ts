/**
 * GET /api/admin/orders
 *
 * Staff-authenticated endpoint. Returns paginated, filterable orders
 * for the admin dashboard. Supports filtering by status, date range,
 * location, and text search (name/phone/order_number).
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
// Types
// ═══════════════════════════════════════════════════════════════

interface AdminOrder {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  order_type: string;
  status: string | null;
  subtotal: number;
  delivery_fee: number | null;
  total_amount: number;
  location_id: string;
  created_at: string | null;
  payment_status: string | null;
  payment_method: string | null;
}

interface AdminOrdersResponse {
  success: boolean;
  orders?: AdminOrder[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════

const querySchema = z.object({
  status: z
    .enum([
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "out_for_delivery",
      "completed",
      "cancelled",
      "refunded",
    ])
    .optional(),
  date_from: z.string().datetime({ offset: true }).optional().or(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
      .optional(),
  ),
  date_to: z.string().datetime({ offset: true }).optional().or(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
      .optional(),
  ),
  location_id: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ═══════════════════════════════════════════════════════════════
// Auth helper — requires active staff member
// ═══════════════════════════════════════════════════════════════

async function requireStaff(): Promise<{
  id: string;
  role: string | null;
} | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: staff } = await supabase
      .from("staff")
      .select("id, role, is_active")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    return staff ? { id: staff.id, role: staff.role } : null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
): Promise<NextResponse<AdminOrdersResponse>> {
  const startTime = Date.now();
  const endpoint = "/api/admin/orders";

  // Rate limiting — 60 requests per minute per IP (admin polling)
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`admin_orders:${clientIp}`, {
    maxRequests: 60,
    windowMs: 60_000,
  });
  if (!rl.success) {
    logger.warn("Rate limit exceeded for admin orders", { ip: clientIp });
    return rateLimitResponse(rl) as NextResponse<AdminOrdersResponse>;
  }

  logger.api.request(endpoint, "GET", { ip: clientIp });

  try {
    // ── Staff auth ───────────────────────────────────────────
    const staff = await requireStaff();
    if (!staff) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Acceso restringido a personal autorizado.",
        },
        { status: 401 },
      );
    }

    // ── Parse query params ───────────────────────────────────
    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string | undefined> = {};
    for (const key of [
      "status",
      "date_from",
      "date_to",
      "location_id",
      "search",
      "page",
      "limit",
    ]) {
      const val = searchParams.get(key);
      if (val !== null) rawParams[key] = val;
    }

    const parsed = querySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          message: "Parámetros de consulta inválidos.",
        },
        { status: 400 },
      );
    }

    const { status, date_from, date_to, location_id, search, page, limit } =
      parsed.data;

    const supabase = createServiceClient();

    // ── Build query ──────────────────────────────────────────
    let query = supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        order_type,
        status,
        subtotal,
        delivery_fee,
        total_amount,
        location_id,
        created_at,
        payments (status, payment_method)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    // Filters
    if (status) {
      query = query.eq("status", status);
    }

    if (date_from) {
      // If just a date (YYYY-MM-DD), treat as start of day
      const fromValue = date_from.includes("T")
        ? date_from
        : `${date_from}T00:00:00.000Z`;
      query = query.gte("created_at", fromValue);
    }

    if (date_to) {
      // If just a date (YYYY-MM-DD), treat as end of day
      const toValue = date_to.includes("T")
        ? date_to
        : `${date_to}T23:59:59.999Z`;
      query = query.lte("created_at", toValue);
    }

    if (location_id) {
      query = query.eq("location_id", location_id);
    }

    if (search) {
      // Search across name, phone, and order_number
      query = query.or(
        `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,order_number.ilike.%${search}%`,
      );
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: orders, count, error: ordersErr } = await query;

    if (ordersErr) {
      logger.error("Failed to fetch admin orders", ordersErr, {
        staffId: staff.id,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Query failed",
          message: "Error al obtener los pedidos.",
        },
        { status: 500 },
      );
    }

    // ── Map to response shape ────────────────────────────────
    const adminOrders: AdminOrder[] = (orders ?? []).map((order) => {
      const paymentRows = Array.isArray(order.payments)
        ? order.payments
        : order.payments
          ? [order.payments]
          : [];

      const latestPayment = paymentRows[0] as
        | { status: string | null; payment_method: string | null }
        | undefined;

      return {
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        order_type: order.order_type,
        status: order.status,
        subtotal: Number(order.subtotal ?? 0),
        delivery_fee: order.delivery_fee ? Number(order.delivery_fee) : null,
        total_amount: Number(order.total_amount ?? 0),
        location_id: order.location_id,
        created_at: order.created_at,
        payment_status: latestPayment?.status ?? null,
        payment_method: latestPayment?.payment_method ?? null,
      };
    });

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, {
      staffId: staff.id,
      total: count,
      page,
    });

    return NextResponse.json({
      success: true,
      orders: adminOrders,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.api.error(endpoint, error, { duration });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message:
          "Error interno del servidor. Por favor intenta de nuevo.",
      },
      { status: 500 },
    );
  }
}
