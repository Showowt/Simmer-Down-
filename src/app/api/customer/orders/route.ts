/**
 * GET /api/customer/orders
 *
 * Authenticated endpoint. Returns the last 20 orders for the current
 * customer, matched by email or phone from their customer profile.
 * Includes basic payment status via a joined payments query.
 */

import { NextRequest, NextResponse } from "next/server";
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

interface OrderSummary {
  id: string;
  order_number: string;
  status: string | null;
  total_amount: number;
  created_at: string | null;
  items_count: number;
  payment_status: string | null;
}

interface CustomerOrdersResponse {
  success: boolean;
  orders?: OrderSummary[];
  error?: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════
// Auth helper
// ═══════════════════════════════════════════════════════════════

async function getAuthUser(): Promise<{ id: string } | null> {
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
    return user ? { id: user.id } : null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
): Promise<NextResponse<CustomerOrdersResponse>> {
  const startTime = Date.now();
  const endpoint = "/api/customer/orders";

  // Rate limiting — 30 requests per minute per IP
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`customer_orders:${clientIp}`, {
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (!rl.success) {
    logger.warn("Rate limit exceeded for customer orders", { ip: clientIp });
    return rateLimitResponse(rl) as NextResponse<CustomerOrdersResponse>;
  }

  logger.api.request(endpoint, "GET", { ip: clientIp });

  try {
    // ── Auth ──────────────────────────────────────────────────
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Debes iniciar sesión para ver tus pedidos.",
        },
        { status: 401 },
      );
    }

    const supabase = createServiceClient();

    // ── Look up customer ─────────────────────────────────────
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("id, email, phone")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (custErr || !customer) {
      logger.error("Customer lookup failed", custErr, {
        authUserId: user.id,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found",
          message: "No se encontró tu perfil de cliente.",
        },
        { status: 404 },
      );
    }

    // ── Build OR filter for email/phone matching ─────────────
    // Orders may have been placed before the customer created an account,
    // so we match on email OR phone rather than customer_id alone.
    const orFilters: string[] = [];
    if (customer.email) {
      orFilters.push(`customer_email.eq.${customer.email}`);
    }
    if (customer.phone) {
      orFilters.push(`customer_phone.eq.${customer.phone}`);
    }
    // Also match by customer_id if it was linked during order creation
    orFilters.push(`customer_id.eq.${customer.id}`);

    if (orFilters.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
      });
    }

    // ── Fetch orders with items count and payment info ───────
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        total_amount,
        created_at,
        order_items (id),
        payments (status)
      `,
      )
      .or(orFilters.join(","))
      .order("created_at", { ascending: false })
      .limit(20);

    if (ordersErr) {
      logger.error("Failed to fetch customer orders", ordersErr, {
        customerId: customer.id,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Query failed",
          message:
            "Error al obtener tus pedidos. Por favor intenta de nuevo.",
        },
        { status: 500 },
      );
    }

    // ── Map to response shape ────────────────────────────────
    const orderSummaries: OrderSummary[] = (orders ?? []).map((order) => {
      // order_items comes as array of { id } — count the length
      const items = Array.isArray(order.order_items)
        ? order.order_items
        : [];

      // payments comes as array — take the latest status
      const paymentRows = Array.isArray(order.payments)
        ? order.payments
        : order.payments
          ? [order.payments]
          : [];

      const latestPaymentStatus =
        paymentRows.length > 0
          ? (paymentRows[0] as { status: string | null }).status
          : null;

      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_amount: Number(order.total_amount ?? 0),
        created_at: order.created_at,
        items_count: items.length,
        payment_status: latestPaymentStatus,
      };
    });

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, {
      customerId: customer.id,
      orderCount: orderSummaries.length,
    });

    return NextResponse.json({
      success: true,
      orders: orderSummaries,
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
