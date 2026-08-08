/**
 * GET /api/admin/dashboard
 *
 * Staff-authenticated command center metrics. All "day" boundaries run in
 * America/El_Salvador (UTC-6, no DST): SV day D spans [D 06:00Z, D+1 06:00Z).
 * Revenue counts orders that were accepted (confirmed → completed); pending
 * is surfaced separately and cancelled/refunded never count.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/service";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const SV_OFFSET_MS = 6 * 60 * 60 * 1000;
const REVENUE_STATUSES = new Set([
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
]);

interface OrderRow {
  id: string;
  status: string | null;
  total_amount: number | null;
  discount_amount: number | null;
  location_id: string | null;
  order_type: string | null;
  created_at: string;
  event_id: string | null;
  ticket_quantity: number | null;
}

async function requireStaff(): Promise<{ id: string } | null> {
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
      .select("id, is_active")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    return staff ? { id: staff.id } : null;
  } catch {
    return null;
  }
}

/** Start of the SV day that contains `d`, as a UTC Date. */
function svDayStart(d: Date): Date {
  const shifted = new Date(d.getTime() - SV_OFFSET_MS);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ) + SV_OFFSET_MS,
  );
}

/** SV-local date string (YYYY-MM-DD) and hour for a UTC timestamp. */
function svParts(iso: string): { day: string; hour: number } {
  const shifted = new Date(new Date(iso).getTime() - SV_OFFSET_MS);
  return {
    day: shifted.toISOString().slice(0, 10),
    hour: shifted.getUTCHours(),
  };
}

export async function GET() {
  const staff = await requireStaff();
  if (!staff) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const supabase = createServiceClient();
    const now = new Date();
    const todayStart = svDayStart(now);
    const rangeStart = new Date(todayStart.getTime() - 13 * 24 * 3600 * 1000);
    const todayKey = svParts(now.toISOString()).day;
    const yesterdayKey = svParts(
      new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    ).day;
    const lastWeekKey = svParts(
      new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString(),
    ).day;

    const [ordersRes, locationsRes, customersRes] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, status, total_amount, discount_amount, location_id, order_type, created_at, event_id, ticket_quantity",
        )
        .gte("created_at", rangeStart.toISOString())
        .order("created_at", { ascending: false }),
      supabase.from("locations").select("id, name"),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true }),
    ]);

    const orders = (ordersRes.data ?? []) as OrderRow[];
    const locationName = new Map(
      (locationsRes.data ?? []).map((l) => [l.id, l.name as string]),
    );

    // ── Daily aggregation ────────────────────────────────────
    const byDay = new Map<
      string,
      { revenue: number; orders: number; discount: number; promoOrders: number }
    >();
    const hourlyToday = Array.from({ length: 24 }, () => ({
      orders: 0,
      revenue: 0,
    }));
    const byLocationToday = new Map<
      string,
      { orders: number; revenue: number }
    >();
    let pendingNow = 0;

    const tickets = { today: { revenue: 0, count: 0 }, week: { revenue: 0, count: 0 } };
    for (const o of orders) {
      const { day, hour } = svParts(o.created_at);
      if (o.status === "pending") pendingNow += day === todayKey ? 1 : 0;
      if (!o.status || !REVENUE_STATUSES.has(o.status)) continue;

      const total = Number(o.total_amount ?? 0);

      // Ticket orders are a separate revenue stream — count them apart, and
      // never let them inflate food revenue / by-location / hourly.
      if (o.event_id) {
        const qty = Number(o.ticket_quantity ?? 1);
        tickets.week.revenue += total;
        tickets.week.count += qty;
        if (day === todayKey) {
          tickets.today.revenue += total;
          tickets.today.count += qty;
        }
        continue;
      }

      const discount = Number(o.discount_amount ?? 0);
      const agg = byDay.get(day) ?? {
        revenue: 0,
        orders: 0,
        discount: 0,
        promoOrders: 0,
      };
      agg.revenue += total;
      agg.orders += 1;
      agg.discount += discount;
      if (discount > 0) agg.promoOrders += 1;
      byDay.set(day, agg);

      if (day === todayKey) {
        hourlyToday[hour].orders += 1;
        hourlyToday[hour].revenue += total;
        const key = o.location_id ?? "unknown";
        const loc = byLocationToday.get(key) ?? { orders: 0, revenue: 0 };
        loc.orders += 1;
        loc.revenue += total;
        byLocationToday.set(key, loc);
      }
    }

    const empty = { revenue: 0, orders: 0, discount: 0, promoOrders: 0 };
    const today = byDay.get(todayKey) ?? empty;
    const yesterday = byDay.get(yesterdayKey) ?? empty;
    const sameDayLastWeek = byDay.get(lastWeekKey) ?? empty;

    // Last 7 SV days (oldest → today) for the revenue chart
    const week: Array<{ day: string; revenue: number; orders: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const key = svParts(
        new Date(now.getTime() - i * 24 * 3600 * 1000).toISOString(),
      ).day;
      const d = byDay.get(key) ?? empty;
      week.push({ day: key, revenue: d.revenue, orders: d.orders });
    }
    const week7 = week.reduce(
      (s, d) => ({ revenue: s.revenue + d.revenue, orders: s.orders + d.orders }),
      { revenue: 0, orders: 0 },
    );

    // ── Top items (last 7 SV days, accepted orders only) ─────
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 3600 * 1000);
    const acceptedWeekIds = orders
      .filter(
        (o) =>
          o.status &&
          REVENUE_STATUSES.has(o.status) &&
          new Date(o.created_at) >= weekStart,
      )
      .map((o) => o.id);

    let topItems: Array<{ name: string; qty: number; revenue: number }> = [];
    if (acceptedWeekIds.length > 0) {
      const { data: items } = await supabase
        .from("order_items")
        .select("order_id, item_name, quantity, line_total")
        .in("order_id", acceptedWeekIds);
      const byItem = new Map<string, { qty: number; revenue: number }>();
      for (const it of items ?? []) {
        const agg = byItem.get(it.item_name) ?? { qty: 0, revenue: 0 };
        agg.qty += Number(it.quantity ?? 0);
        agg.revenue += Number(it.line_total ?? 0);
        byItem.set(it.item_name, agg);
      }
      topItems = [...byItem.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 8);
    }

    // ── Loyalty (SimmerLovers) ───────────────────────────────
    const { data: earnedTx } = await supabase
      .from("loyalty_transactions")
      .select("points, created_at")
      .eq("transaction_type", "earned")
      .gte("created_at", weekStart.toISOString());
    let pointsToday = 0;
    let points7d = 0;
    for (const tx of earnedTx ?? []) {
      const pts = Number(tx.points ?? 0);
      points7d += pts;
      if (svParts(tx.created_at).day === todayKey) pointsToday += pts;
    }

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      today: {
        revenue: today.revenue,
        orders: today.orders,
        avgTicket: today.orders > 0 ? today.revenue / today.orders : 0,
        pending: pendingNow,
        promoOrders: today.promoOrders,
        promoDiscount: today.discount,
      },
      deltas: {
        revenueVsYesterday: yesterday.revenue,
        revenueVsLastWeek: sameDayLastWeek.revenue,
        ordersVsLastWeek: sameDayLastWeek.orders,
      },
      week,
      week7: {
        ...week7,
        avgTicket: week7.orders > 0 ? week7.revenue / week7.orders : 0,
      },
      hourlyToday,
      byLocation: [...byLocationToday.entries()]
        .map(([id, v]) => ({
          id,
          name: locationName.get(id) ?? "—",
          ...v,
        }))
        .sort((a, b) => b.revenue - a.revenue),
      topItems,
      loyalty: {
        members: customersRes.count ?? 0,
        pointsToday,
        points7d,
      },
      tickets,
    });
  } catch (error) {
    logger.api.error("/api/admin/dashboard", error, {});
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
