/**
 * Tables API — floor plan availability
 *
 * GET /api/tables?location_id=juayua&date=YYYY-MM-DD&time=HH:MM
 *   Returns every active table for the venue, each decorated with an
 *   `available` flag computed from manual blocks + existing reservations
 *   that collide with the requested time (dining-window overlap).
 *
 * If date/time are omitted, tables are returned with availability based on
 * manual blocks only (used to render the layout before a slot is picked).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { computeAvailability, type RestaurantTable } from "@/lib/tables";
import logger from "@/lib/logger";

// Reservation statuses that still hold a table.
const ACTIVE_STATUSES = ["pending", "confirmed", "seated"];

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  if (!locationId) {
    return NextResponse.json(
      { success: false, error: "location_id is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    // 1. Load the venue's active tables
    const { data: tables, error: tablesError } = await supabase
      .from("restaurant_tables")
      .select(
        "id, location_id, zone, code, label, seats, pos_x, pos_y, shape, is_blocked, is_active, sort_order",
      )
      .eq("location_id", locationId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (tablesError) {
      logger.warn("Tables query failed", { error: tablesError.message });
      return NextResponse.json(
        { success: false, error: "No se pudieron cargar las mesas" },
        { status: 500 },
      );
    }

    const tableList = (tables ?? []) as RestaurantTable[];

    // 2. Load same-day reservations that still hold a table
    let reservationsOnDate: Array<{ table_id: string | null; time: string }> =
      [];

    if (date) {
      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select("table_id, time")
        .eq("location_id", locationId)
        .eq("date", date)
        .in("status", ACTIVE_STATUSES);

      if (resError) {
        logger.warn("Reservations query failed", { error: resError.message });
      } else {
        reservationsOnDate = (reservations ?? []).filter(
          (r): r is { table_id: string | null; time: string } =>
            typeof r.time === "string",
        );
      }
    }

    // 3. Compute availability. Without a time, only manual blocks matter.
    const availability = computeAvailability(
      tableList,
      time ? reservationsOnDate : [],
      time ?? "00:00",
    );

    return NextResponse.json({
      success: true,
      location_id: locationId,
      date: date ?? null,
      time: time ?? null,
      tables: availability,
    });
  } catch (error) {
    logger.warn("Tables endpoint error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 },
    );
  }
}
