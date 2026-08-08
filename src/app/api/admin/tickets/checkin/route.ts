/**
 * POST /api/admin/tickets/checkin  { token }
 * Staff-authenticated door check-in. Delegates to the check_in_ticket DB
 * function, which is atomic and idempotent (a second scan of the same ticket
 * returns already_used rather than admitting twice).
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/service";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const schema = z.object({ token: z.string().min(16).max(80) });

async function requireStaff(): Promise<{ id: string } | null> {
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

export async function POST(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
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
