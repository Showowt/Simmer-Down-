/**
 * Rooms API — estadía availability (public)
 *
 * GET /api/rooms?location_id=lago-coatepeque&check_in=YYYY-MM-DD&check_out=YYYY-MM-DD&guests=2
 *   Returns active rooms for the venue, each decorated with `available` computed
 *   from date-range overlap with existing active bookings + capacity.
 *   Without a valid range, rooms are returned with availability based on
 *   active/capacity only (used to render the catalog before dates are picked).
 *
 * Guards fail CLOSED: if the availability query cannot complete we return 5xx
 * rather than rendering every room as "Disponible".
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  computeRoomAvailability,
  isValidDate,
  isUndefinedColumn,
  ACTIVE_ROOM_STATUSES,
  HOLD_EXPIRY_MINUTES,
  GUEST_ROOM_COLUMNS,
  GUEST_ROOM_COLUMNS_LEGACY,
  type GuestRoom,
} from "@/lib/rooms";
import logger from "@/lib/logger";

const LOAD_ERROR =
  "No se pudieron cargar las habitaciones. Intenta de nuevo. / Could not load rooms. Please try again.";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id") || "lago-coatepeque";
  const checkIn = searchParams.get("check_in") || "";
  const checkOut = searchParams.get("check_out") || "";
  const guests = Math.max(1, parseInt(searchParams.get("guests") || "1", 10) || 1);

  try {
    const supabase = createServiceClient();

    const roomsQuery = (columns: string) =>
      supabase
        .from("guest_rooms")
        .select(columns)
        .eq("location_id", locationId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    let { data: rooms, error: roomsErr } = await roomsQuery(GUEST_ROOM_COLUMNS);
    if (isUndefinedColumn(roomsErr)) {
      // Migration 20260920c not applied yet — read the legacy column set.
      logger.warn("[Rooms] amenities_en missing; migration 20260920c pending");
      ({ data: rooms, error: roomsErr } = await roomsQuery(GUEST_ROOM_COLUMNS_LEGACY));
    }

    if (roomsErr) {
      logger.error("[Rooms] guest_rooms query failed", roomsErr);
      return NextResponse.json({ success: false, error: LOAD_ERROR }, { status: 500 });
    }

    const roomList = (rooms ?? []) as unknown as GuestRoom[];

    let bookings: Array<{ room_id: string | null; check_in: string; check_out: string }> = [];
    if (isValidDate(checkIn) && isValidDate(checkOut) && checkOut > checkIn) {
      const { data: bk, error: bkErr } = await supabase
        .from("room_bookings")
        .select("room_id, check_in, check_out")
        .eq("location_id", locationId)
        .in("status", ACTIVE_ROOM_STATUSES)
        // overlap prefilter: existing.check_in < requested.check_out
        .lt("check_in", checkOut)
        .gt("check_out", checkIn);
      if (bkErr) {
        // Fail closed: without the booked set we cannot tell free from taken,
        // and showing every room as available oversells the venue.
        logger.error("[Rooms] room_bookings availability query failed", bkErr);
        return NextResponse.json({ success: false, error: LOAD_ERROR }, { status: 500 });
      }
      bookings = (bk ?? []).filter(
        (b): b is { room_id: string | null; check_in: string; check_out: string } =>
          typeof b.check_in === "string" && typeof b.check_out === "string",
      );
    }

    const availability = computeRoomAvailability(roomList, bookings, checkIn, checkOut, guests);

    return NextResponse.json({
      success: true,
      location_id: locationId,
      check_in: checkIn || null,
      check_out: checkOut || null,
      rooms: availability,
    });
  } catch (error) {
    logger.error("[Rooms] endpoint error", error);
    return NextResponse.json({ success: false, error: LOAD_ERROR }, { status: 500 });
  }
}
