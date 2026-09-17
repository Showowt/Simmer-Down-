/**
 * Admin room bookings API (estadía requests)
 *   GET   /api/admin/room-bookings?location_id=&range=upcoming
 *   PATCH /api/admin/room-bookings   { id, status }
 *         status ∈ pending|confirmed|checked_in|checked_out|cancelled
 *
 * Auth: profile role 'admin'. Writes via service client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import logger from "@/lib/logger";

const STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"] as const;
const PatchSchema = z.object({ id: z.string().uuid(), status: z.enum(STATUSES) });

async function requireAdmin(): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, res: NextResponse.json({ data: null, error: "unauthorized", message: "No autenticado" }, { status: 401 }) };
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return { ok: false, res: NextResponse.json({ data: null, error: "forbidden", message: "Requiere rol admin" }, { status: 403 }) };
  }
  return { ok: true };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");
    const range = searchParams.get("range");

    const service = createServiceClient();
    let query = service
      .from("room_bookings")
      .select(
        "id, room_id, location_id, check_in, check_out, nights, guest_count, customer_name, customer_phone, customer_email, special_requests, status, created_at, guest_rooms(code, name_es, name)",
      );
    if (locationId) query = query.eq("location_id", locationId);
    if (range === "upcoming") {
      query = query.gte("check_out", new Date().toISOString().slice(0, 10));
    }
    query = query.order("check_in", { ascending: true }).limit(500);

    const { data, error } = await query;
    if (error) {
      logger.error("[AdminRoomBookings] list failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al cargar" }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? [], error: null });
  } catch (err) {
    logger.error("[AdminRoomBookings] GET error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const parsed = PatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: "invalid_body", message: "Datos inválidos" }, { status: 400 });
    }
    const service = createServiceClient();
    const { error } = await service
      .from("room_bookings")
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.id);
    if (error) {
      logger.error("[AdminRoomBookings] update failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al guardar" }, { status: 500 });
    }
    return NextResponse.json({ data: { id: parsed.data.id, status: parsed.data.status }, error: null, message: "Solicitud actualizada" });
  } catch (err) {
    logger.error("[AdminRoomBookings] PATCH error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}
