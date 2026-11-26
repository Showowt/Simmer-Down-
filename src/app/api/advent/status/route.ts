/**
 * GET /api/advent/status — should the Calendario de Adviento gift button and
 * menu chip show? Polled by every public page, so it is edge-cached for 60 s
 * (a drawer opening at midnight shows up within a minute). Fails soft to
 * { active: false } — the button simply doesn't appear.
 */

import { NextResponse } from "next/server";
import { loadAdventStatus } from "@/lib/advent-server";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const status = await loadAdventStatus();
    return NextResponse.json(
      { data: status, error: null, message: "ok" },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    logger.error("[api/advent/status]", error);
    return NextResponse.json(
      { data: { active: false, todayIsDrawer: false }, error: "status_failed", message: "No disponible" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
