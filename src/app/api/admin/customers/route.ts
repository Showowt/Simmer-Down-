/**
 * GET /api/admin/customers — SimmerLovers loyalty members for the admin.
 *
 * Auth: logged-in admin (profiles.role='admin'), same gate as other admin
 * routes. Read via the service client: the customers table RLS is self-only
 * (customer_select_self), so listing all members needs service role.
 * Read-only — points/tiers are awarded by the loyalty engine, never edited here.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; res: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      res: NextResponse.json(
        { data: null, error: "unauthorized", message: "No autenticado" },
        { status: 401 },
      ),
    };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return {
      ok: false,
      res: NextResponse.json(
        { data: null, error: "forbidden", message: "Requiere rol admin" },
        { status: 403 },
      ),
    };
  }
  return { ok: true };
}

export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const service = createServiceClient();
    const { data, error } = await service
      .from("customers")
      .select(
        "id, first_name, last_name, email, phone, loyalty_tier, loyalty_points_balance, lifetime_points_earned, total_orders, total_spent, last_order_at, created_at",
      )
      .order("lifetime_points_earned", { ascending: false })
      .limit(1000);

    if (error) {
      logger.error("[AdminCustomers] list failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al cargar miembros" },
        { status: 500 },
      );
    }

    const members = data ?? [];
    const summary = {
      total: members.length,
      pointsOutstanding: members.reduce(
        (s, m) => s + (Number(m.loyalty_points_balance) || 0),
        0,
      ),
    };

    return NextResponse.json({ data: { members, summary }, error: null, message: null });
  } catch (err) {
    logger.error("[AdminCustomers] GET error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}
