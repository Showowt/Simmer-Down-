/**
 * GET /api/health — external uptime monitor target.
 * Verifies the app AND its database answer, not just that Vercel serves HTML.
 * Point any pinger (UptimeRobot, BetterStack, cron) at this URL; a non-200
 * or {"ok":false} means customers can't order.
 */

import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let db = false;
  try {
    const supabase = createApiClient();
    const { error } = await supabase
      .from("locations")
      .select("id", { count: "exact", head: true });
    db = !error;
  } catch {
    db = false;
  }

  const ok = db;
  return NextResponse.json(
    {
      ok,
      db,
      latencyMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
