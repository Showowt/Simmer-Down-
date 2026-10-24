/**
 * GET /api/admin/segments?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Owner-facing segmented commerce report (client request, Oct 2026): slice all
 * revenue by CHANNEL and by LOCATION over a date range.
 *
 *   Channels: pickup · delivery · dine_in · takeout  (food, from orders.order_type)
 *             tickets  (orders w/ event_id — orders field = ticket count)
 *             rooms    (room_bookings — orders field = booking count; value is
 *                       collected at check-in, so it's a reservation estimate)
 *
 * SV day boundaries (America/El_Salvador, UTC-6, no DST): a purchase made on
 * SV day D is counted in D. Dates are inclusive. Everything is keyed on the
 * purchase/booking timestamp (created_at) because the client asked about
 * "compras" (sales), not stay dates.
 *
 * Auth matches the dashboard (active staff). location_id is a uuid on orders
 * but a text slug on room_bookings — both are normalised to the 5 canonical
 * venues via the slug-alias registry below (the DB `locations` slug for
 * Coatepeque is `coatepeque` while the rooms system uses `lago-coatepeque`).
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/service";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const SV_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Accepted (money-bearing) order statuses — same rule as the dashboard.
const REVENUE_STATUSES = new Set([
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
]);

// A room booking only stops counting once it is cancelled; pending/confirmed
// are real reservation demand (payment happens at check-in).
const ROOM_DEAD_STATUSES = new Set(["cancelled", "canceled"]);

type FoodChannel = "pickup" | "delivery" | "dine_in" | "takeout" | "otro";
type Channel = FoodChannel | "tickets" | "rooms";

const FOOD_CHANNELS: FoodChannel[] = ["pickup", "delivery", "dine_in", "takeout", "otro"];
const ALL_CHANNELS: Channel[] = [...FOOD_CHANNELS, "tickets", "rooms"];

// The 5 venues, with every location-id spelling that maps to them. Orders carry
// a uuid (resolved to a name via the locations table); rooms carry a text slug.
const VENUES: { key: string; name: string; slugs: string[] }[] = [
  { key: "santa-ana", name: "Santa Ana", slugs: ["santa-ana"] },
  { key: "san-benito", name: "San Benito", slugs: ["san-benito"] },
  { key: "coatepeque", name: "Lago de Coatepeque", slugs: ["coatepeque", "lago-coatepeque"] },
  { key: "simmer-garden", name: "Simmer Garden", slugs: ["juayua", "simmer-garden", "la-majada"] },
  { key: "surf-city", name: "Surf City", slugs: ["surf-city"] },
];
const VENUE_BY_SLUG = new Map<string, (typeof VENUES)[number]>();
const VENUE_BY_NAME = new Map<string, (typeof VENUES)[number]>();
for (const v of VENUES) {
  VENUE_BY_NAME.set(v.name.toLowerCase(), v);
  for (const s of v.slugs) VENUE_BY_SLUG.set(s, v);
}

interface Cell {
  orders: number;
  revenue: number;
}
const zeroCell = (): Cell => ({ orders: 0, revenue: 0 });

interface OrderRow {
  status: string | null;
  total_amount: number | null;
  location_id: string | null;
  order_type: string | null;
  event_id: string | null;
  ticket_quantity: number | null;
  room_booking_id: string | null;
  created_at: string;
}

interface RoomRow {
  status: string | null;
  total_amount: number | null;
  location_id: string | null;
  nights: number | null;
  created_at: string;
}

async function requireStaff(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: staff } = await supabase
      .from("staff")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    return Boolean(staff);
  } catch {
    return false;
  }
}

/** Start of the SV day that contains `d`, as a UTC Date. */
function svDayStart(d: Date): Date {
  const shifted = new Date(d.getTime() - SV_OFFSET_MS);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) +
      SV_OFFSET_MS,
  );
}

/** SV-local YYYY-MM-DD for a UTC timestamp/Date. */
function svDayKey(d: Date): string {
  return new Date(d.getTime() - SV_OFFSET_MS).toISOString().slice(0, 10);
}

/** Parse ?from/?to (YYYY-MM-DD). Falls back to a trailing 30-day window. */
function resolveRange(url: URL): { from: string; to: string; startUtc: Date; endUtc: Date } {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  const now = new Date();
  const todayKey = svDayKey(now);
  const rawTo = url.searchParams.get("to");
  const rawFrom = url.searchParams.get("from");

  const toKey = rawTo && re.test(rawTo) ? rawTo : todayKey;
  const defaultFromUtc = svDayStart(new Date(now.getTime() - 29 * DAY_MS));
  const fromKey = rawFrom && re.test(rawFrom) ? rawFrom : svDayKey(defaultFromUtc);

  // Guard against an inverted range (from after to).
  const [lo, hi] = fromKey <= toKey ? [fromKey, toKey] : [toKey, fromKey];

  const startUtc = svDayStart(new Date(`${lo}T12:00:00Z`));
  const endUtc = new Date(svDayStart(new Date(`${hi}T12:00:00Z`)).getTime() + DAY_MS);
  return { from: lo, to: hi, startUtc, endUtc };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await requireStaff())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { from, to, startUtc, endUtc } = resolveRange(new URL(request.url));
    const supabase = createServiceClient();

    const [ordersRes, roomsRes, locationsRes] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "status, total_amount, location_id, order_type, event_id, ticket_quantity, room_booking_id, created_at",
        )
        .gte("created_at", startUtc.toISOString())
        .lt("created_at", endUtc.toISOString()),
      supabase
        .from("room_bookings")
        .select("status, total_amount, location_id, nights, created_at")
        .gte("created_at", startUtc.toISOString())
        .lt("created_at", endUtc.toISOString()),
      supabase.from("locations").select("id, name"),
    ]);

    const orders = (ordersRes.data ?? []) as OrderRow[];
    const rooms = (roomsRes.data ?? []) as RoomRow[];

    // uuid → canonical venue (via the locations table's display name)
    const uuidToVenue = new Map<string, (typeof VENUES)[number]>();
    for (const l of locationsRes.data ?? []) {
      const v = VENUE_BY_NAME.get(String(l.name).toLowerCase());
      if (v) uuidToVenue.set(l.id as string, v);
    }

    // Accumulators: per-channel totals + per-venue matrix.
    const channels: Record<Channel, Cell> = Object.fromEntries(
      ALL_CHANNELS.map((c) => [c, zeroCell()]),
    ) as Record<Channel, Cell>;

    const matrix = new Map<string, Record<Channel, Cell>>();
    const ensureRow = (key: string) => {
      let row = matrix.get(key);
      if (!row) {
        row = Object.fromEntries(ALL_CHANNELS.map((c) => [c, zeroCell()])) as Record<Channel, Cell>;
        matrix.set(key, row);
      }
      return row;
    };

    const add = (venueKey: string | null, channel: Channel, revenue: number, count = 1) => {
      channels[channel].orders += count;
      channels[channel].revenue += revenue;
      if (venueKey) {
        const cell = ensureRow(venueKey)[channel];
        cell.orders += count;
        cell.revenue += revenue;
      }
    };

    // ── Orders → food channels + tickets ─────────────────────
    for (const o of orders) {
      if (!o.status || !REVENUE_STATUSES.has(o.status)) continue;
      // A room payment that flows through orders is counted via room_bookings,
      // never here, so stays are never double-counted.
      if (o.room_booking_id) continue;

      const total = Number(o.total_amount ?? 0);
      const venue = o.location_id ? uuidToVenue.get(o.location_id) ?? null : null;
      const venueKey = venue?.key ?? null;

      if (o.event_id) {
        const qty = Number(o.ticket_quantity ?? 1) || 1;
        add(venueKey, "tickets", total, qty);
        continue;
      }

      const type = (o.order_type ?? "").toLowerCase();
      const channel: FoodChannel = (FOOD_CHANNELS as string[]).includes(type)
        ? (type as FoodChannel)
        : "otro";
      add(venueKey, channel, total, 1);
    }

    // ── Room bookings → rooms channel ────────────────────────
    for (const r of rooms) {
      if (r.status && ROOM_DEAD_STATUSES.has(r.status.toLowerCase())) continue;
      const total = Number(r.total_amount ?? 0);
      const venue = r.location_id ? VENUE_BY_SLUG.get(r.location_id) ?? null : null;
      add(venue?.key ?? null, "rooms", total, 1);
    }

    // ── Shape the response ───────────────────────────────────
    const byLocation = VENUES.map((v) => {
      const row = matrix.get(v.key);
      const cells = Object.fromEntries(
        ALL_CHANNELS.map((c) => [c, row?.[c] ?? zeroCell()]),
      ) as Record<Channel, Cell>;
      const total = ALL_CHANNELS.reduce(
        (acc, c) => ({ orders: acc.orders + cells[c].orders, revenue: acc.revenue + cells[c].revenue }),
        zeroCell(),
      );
      return { key: v.key, name: v.name, channels: cells, total };
    });

    const totals = ALL_CHANNELS.reduce(
      (acc, c) => ({ orders: acc.orders + channels[c].orders, revenue: acc.revenue + channels[c].revenue }),
      zeroCell(),
    );

    // Only food/dine/takeout/otro that actually have data are worth showing;
    // the UI always shows pickup, delivery, tickets, rooms.
    const activeChannels = ALL_CHANNELS.filter(
      (c) =>
        c === "pickup" ||
        c === "delivery" ||
        c === "tickets" ||
        c === "rooms" ||
        channels[c].orders > 0,
    );

    const days = Math.round((endUtc.getTime() - startUtc.getTime()) / DAY_MS);

    return NextResponse.json({
      success: true,
      range: { from, to, days },
      channels,
      activeChannels,
      totals,
      byLocation,
    });
  } catch (error) {
    logger.api.error("/api/admin/segments", error, {});
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
