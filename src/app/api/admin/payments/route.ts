/**
 * GET /api/admin/payments
 *
 * Staff-only. Returns paginated payment records joined with order details.
 * Supports filtering by status, date range, and payment method.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";

// ═══════════════════════════════════════════════════════════════
// Auth Helper
// ═══════════════════════════════════════════════════════════════

async function requireStaff(): Promise<boolean> {
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
    if (!user) return false;

    const { data: staff } = await supabase
      .from("staff")
      .select("id, role, is_active")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    return !!staff && staff.is_active === true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Query Param Validation
// ═══════════════════════════════════════════════════════════════

const querySchema = z.object({
  status: z
    .enum([
      "pending",
      "processing",
      "completed",
      "failed",
      "refunded",
      "partially_refunded",
      "cancelled",
    ])
    .optional(),
  date_from: z.string().date("date_from debe ser formato YYYY-MM-DD").optional(),
  date_to: z.string().date("date_to debe ser formato YYYY-MM-DD").optional(),
  payment_method: z
    .enum([
      "card",
      "cash",
      "transfer",
      "other",
      "powertranz",
      "uber_eats",
      "doordash",
      "pedidos_ya",
      "hugo",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface PaymentRow {
  id: string;
  order_id: string;
  amount: number;
  currency: string | null;
  payment_method: string;
  status: string;
  card_last_four: string | null;
  card_brand: string | null;
  authorization_code: string | null;
  paid_at: string | null;
  failed_at: string | null;
  created_at: string;
  orders: {
    order_number: string;
    customer_name: string;
  } | null;
}

interface PaymentResponse {
  success: boolean;
  data?: {
    payments: Array<{
      id: string;
      order_id: string;
      order_number: string;
      customer_name: string;
      amount: number;
      currency: string | null;
      payment_method: string;
      status: string;
      card_last_four: string | null;
      card_brand: string | null;
      authorization_code: string | null;
      paid_at: string | null;
      failed_at: string | null;
      created_at: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
): Promise<NextResponse<PaymentResponse>> {
  const startTime = Date.now();
  const endpoint = "/api/admin/payments";

  logger.api.request(endpoint, "GET");

  // Auth check
  if (!(await requireStaff())) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        message: "No tienes permisos para acceder a este recurso.",
      },
      { status: 401 },
    );
  }

  try {
    // Parse & validate query params
    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      rawParams[key] = value;
    }

    const parsed = querySchema.safeParse(rawParams);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: "Parámetros inválidos",
          message: firstError?.message ?? "Revisa los parámetros de búsqueda.",
        },
        { status: 400 },
      );
    }

    const { status, date_from, date_to, payment_method, page, limit } =
      parsed.data;

    const supabase = createServiceClient();

    // Build count query
    let countQuery = supabase
      .from("payments")
      .select("id", { count: "exact", head: true });

    if (status) countQuery = countQuery.eq("status", status);
    if (payment_method)
      countQuery = countQuery.eq("payment_method", payment_method);
    if (date_from)
      countQuery = countQuery.gte("created_at", `${date_from}T00:00:00Z`);
    if (date_to)
      countQuery = countQuery.lte("created_at", `${date_to}T23:59:59Z`);

    const { count, error: countError } = await countQuery;

    if (countError) {
      logger.error("Failed to count payments", countError);
      return NextResponse.json(
        {
          success: false,
          error: "Error al contar pagos",
          message: "Error interno del servidor.",
        },
        { status: 500 },
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Build data query
    let dataQuery = supabase
      .from("payments")
      .select(
        `id, order_id, amount, currency, payment_method, status,
         card_last_four, card_brand, authorization_code,
         paid_at, failed_at, created_at,
         orders!inner(order_number, customer_name)`,
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) dataQuery = dataQuery.eq("status", status);
    if (payment_method)
      dataQuery = dataQuery.eq("payment_method", payment_method);
    if (date_from)
      dataQuery = dataQuery.gte("created_at", `${date_from}T00:00:00Z`);
    if (date_to)
      dataQuery = dataQuery.lte("created_at", `${date_to}T23:59:59Z`);

    const { data: payments, error: dataError } = await dataQuery;

    if (dataError) {
      logger.error("Failed to fetch payments", dataError);
      return NextResponse.json(
        {
          success: false,
          error: "Error al obtener pagos",
          message: "Error interno del servidor.",
        },
        { status: 500 },
      );
    }

    // Shape response — flatten joined order fields
    const shaped = ((payments as unknown as PaymentRow[]) ?? []).map((p) => ({
      id: p.id,
      order_id: p.order_id,
      order_number: p.orders?.order_number ?? "",
      customer_name: p.orders?.customer_name ?? "",
      amount: p.amount,
      currency: p.currency,
      payment_method: p.payment_method,
      status: p.status,
      card_last_four: p.card_last_four,
      card_brand: p.card_brand,
      authorization_code: p.authorization_code,
      paid_at: p.paid_at,
      failed_at: p.failed_at,
      created_at: p.created_at,
    }));

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, {
      total,
      page,
      returned: shaped.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        payments: shaped,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
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
