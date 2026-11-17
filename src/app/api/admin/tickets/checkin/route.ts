/**
 * POST /api/admin/tickets/checkin  { token, count? }
 * Staff-authenticated door check-in. Delegates to the check_in_ticket DB
 * function, which is atomic and idempotent (a second scan of a fully used
 * ticket returns already_used rather than admitting twice). `count` admits
 * part of a multi-person ticket; omitted = everyone still remaining.
 * Returns the function's own { ok, reason, ... } shape (the door UIs read it).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { getActiveStaff } from "@/lib/staff-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().regex(/^[A-Za-z0-9]{16,80}$/),
  count: z.number().int().min(1).max(50).optional(),
});

export async function POST(request: NextRequest) {
  const staff = await getActiveStaff();
  if (!staff) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const rl = checkRateLimit(`door_checkin:${staff.id}`, { maxRequests: 120, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "bad_token" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("check_in_ticket", {
      p_token: parsed.data.token,
      p_staff: staff.id,
      p_count: parsed.data.count ?? null,
    });
    if (error) {
      logger.error("[tickets/checkin] rpc error", error);
      return NextResponse.json({ ok: false, reason: "error" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    logger.error("[tickets/checkin] error", error);
    return NextResponse.json({ ok: false, reason: "error" }, { status: 500 });
  }
}
