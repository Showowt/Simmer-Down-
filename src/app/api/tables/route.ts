/**
 * Tables API — floor plan availability (grouped by venue area)
 *
 * GET /api/tables?location_id=santa-ana&date=YYYY-MM-DD&time=HH:MM
 *   Returns the venue's ACTIVE areas, each with its active tables decorated
 *   with an `available` flag (manual blocks + reservations that collide with
 *   the requested time). `hasFloorPlan` tells the client whether to require a
 *   table selection at all.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  computeAvailability,
  groupTablesByArea,
  type RestaurantTable,
  type VenueArea,
} from "@/lib/tables";
import logger from "@/lib/logger";

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

    // 1. Active areas for the venue
    const { data: areas, error: areasError } = await supabase
      .from("venue_areas")
      .select(
        "id, location_id, code, name_es, name_en, description_es, description_en, floor, view, is_vip, image_url, min_party, is_active, sort_order",
      )
      .eq("location_id", locationId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (areasError) {
      logger.warn("Areas query failed", { error: areasError.message });
    }
    const areaList = (areas ?? []) as VenueArea[];

    // 2. Active tables for the venue
    const { data: tables, error: tablesError } = await supabase
      .from("restaurant_tables")
      .select(
        "id, location_id, zone, area_id, code, label, seats, pos_x, pos_y, shape, is_blocked, is_active, sort_order",
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

    // 3. Same-day reservations that still hold a table
    let reservationsOnDate: Array<{ table_id: string | null; time: string }> = [];
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

    // 4. Availability per table, then grouped into their areas
    const availability = computeAvailability(
      tableList,
      time ? reservationsOnDate : [],
      time ?? "00:00",
    );
    const areasWithTables = groupTablesByArea(areaList, availability);

    return NextResponse.json({
      success: true,
      location_id: locationId,
      date: date ?? null,
      time: time ?? null,
      hasFloorPlan: areasWithTables.length > 0,
      areas: areasWithTables,
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
