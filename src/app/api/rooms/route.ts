/**
 * Rooms API — estadía availability (public)
 *
 * GET /api/rooms?location_id=lago-coatepeque&check_in=YYYY-MM-DD&check_out=YYYY-MM-DD&guests=2
 *   Returns active rooms for the venue, each decorated with `available` computed
 *   from date-range overlap with existing active bookings + capacity.
 *   Without a valid range, rooms are returned with availability based on
 *   active/capacity only (used to render the catalog before dates are picked).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  computeRoomAvailability,
  isValidDate,
  ACTIVE_ROOM_STATUSES,
  type GuestRoom,
} from "@/lib/rooms";
import logger from "@/lib/logger";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id") || "lago-coatepeque";
  const checkIn = searchParams.get("check_in") || "";
  const checkOut = searchParams.get("check_out") || "";
  const guests = Math.max(1, parseInt(searchParams.get("guests") || "1", 10) || 1);

  try {
    const supabase = createServiceClient();

    const { data: rooms, error: roomsErr } = await supabase
      .from("guest_rooms")
      .select(
        "id, location_id, code, name, name_es, description, description_es, capacity, price_per_night, image_url, amenities, is_active, sort_order",
      )
      .eq("location_id", locationId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (roomsErr) {
      logger.warn("Rooms query failed", { error: roomsErr.message });
      return NextResponse.json(
        { success: false, error: "No se pudieron cargar las habitaciones" },
        { status: 500 },
      );
    }

    const roomList = (rooms ?? []) as GuestRoom[];

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
        logger.warn("Room bookings query failed", { error: bkErr.message });
      } else {
        bookings = (bk ?? []).filter(
          (b): b is { room_id: string | null; check_in: string; check_out: string } =>
            typeof b.check_in === "string" && typeof b.check_out === "string",
        );
      }
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
    logger.warn("Rooms endpoint error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
