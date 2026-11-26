/**
 * POST /api/advent/open — record that a visitor opened a drawer.
 * Body: { day: 1-12, deviceId: string (localStorage id) }
 *
 * One row per (drawer, device) — repeats are ignored, so the admin count is
 * reach, not clicks. Refused for drawers whose date hasn't arrived (or while
 * the campaign is off), so the count can't be padded ahead of time.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { readAdventRows } from "@/lib/advent-server";
import { svToday } from "@/lib/advent";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  day: z.number().int().min(1).max(12),
  deviceId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/),
});

function fail(status: number, error: string, message: string): NextResponse {
  return NextResponse.json({ data: null, error, message }, { status });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rl = checkRateLimit(`advent_open:${getClientIp(request)}`, { maxRequests: 40, windowMs: 60_000 });
  if (!rl.success) return fail(429, "rate_limited", "Demasiadas solicitudes / Too many requests");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_body", "Datos inválidos / Invalid data");
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return fail(400, "invalid_body", "Datos inválidos / Invalid data");
  const { day, deviceId } = parsed.data;

  try {
    const { isLive, days } = await readAdventRows();
    const row = days.find((d) => d.day === day);
    if (!isLive || !row || row.unlock_date > svToday()) {
      return fail(409, "locked", "Esta casilla aún no se abre / This drawer isn't open yet");
    }

    const service = createServiceClient();
    const { error } = await service
      .from("advent_opens")
      .upsert({ day, device_id: deviceId }, { onConflict: "day,device_id", ignoreDuplicates: true });
    if (error) throw error;

    return NextResponse.json({ data: { recorded: true }, error: null, message: "ok" });
  } catch (error) {
    logger.error("[api/advent/open]", error);
    return fail(500, "server_error", "No se pudo registrar / Could not record");
  }
}
