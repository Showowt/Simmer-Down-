/**
 * Admin rooms CRUD (estadía catalog)
 *   GET    /api/admin/rooms?location_id=lago-coatepeque  → all rooms (incl. inactive)
 *   POST   /api/admin/rooms                              → create
 *   PATCH  /api/admin/rooms                              → update (by id)
 *   DELETE /api/admin/rooms?id=...                        → remove (soft-falls-back to inactive)
 *
 * Auth: profile role 'admin'. Writes via service client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import logger from "@/lib/logger";

const Fields = {
  location_id: z.string().min(2).max(60),
  code: z.string().min(1).max(40),
  name: z.string().min(2).max(120),
  name_es: z.string().min(2).max(120),
  description: z.string().max(1000).nullable().optional(),
  description_es: z.string().max(1000).nullable().optional(),
  capacity: z.number().int().min(1).max(30),
  price_per_night: z.number().min(0).max(100000).nullable().optional(),
  image_url: z.string().max(600).nullable().optional(),
  amenities: z.array(z.string().max(60)).max(30).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
};

const CreateSchema = z.object(Fields);
const UpdateSchema = z.object({
  id: z.string().uuid(),
  location_id: Fields.location_id.optional(),
  code: Fields.code.optional(),
  name: Fields.name.optional(),
  name_es: Fields.name_es.optional(),
  description: Fields.description,
  description_es: Fields.description_es,
  capacity: Fields.capacity.optional(),
  price_per_night: Fields.price_per_night,
  image_url: Fields.image_url,
  amenities: Fields.amenities,
  is_active: z.boolean().optional(),
  sort_order: Fields.sort_order,
});

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; res: NextResponse }
> {
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

const COLS =
  "id, location_id, code, name, name_es, description, description_es, capacity, price_per_night, image_url, amenities, is_active, sort_order";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const locationId = new URL(request.url).searchParams.get("location_id") || "lago-coatepeque";
    const service = createServiceClient();
    const { data, error } = await service
      .from("guest_rooms")
      .select(COLS)
      .eq("location_id", locationId)
      .order("sort_order", { ascending: true });
    if (error) {
      logger.error("[AdminRooms] list failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al cargar" }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? [], error: null });
  } catch (err) {
    logger.error("[AdminRooms] GET error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const parsed = CreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: "invalid_body", message: "Datos inválidos" }, { status: 400 });
    }
    const service = createServiceClient();
    const { data, error } = await service
      .from("guest_rooms")
      .insert([{ amenities: [], is_active: true, sort_order: 0, ...parsed.data }])
      .select("id")
      .single();
    if (error) {
      logger.error("[AdminRooms] insert failed", error);
      const dup = error.code === "23505";
      return NextResponse.json(
        { data: null, error: "db_error", message: dup ? "Ya existe una habitación con ese código" : "Error al crear" },
        { status: dup ? 409 : 500 },
      );
    }
    return NextResponse.json({ data: { id: data?.id }, error: null, message: "Habitación creada" });
  } catch (err) {
    logger.error("[AdminRooms] POST error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const parsed = UpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: "invalid_body", message: "Datos inválidos" }, { status: 400 });
    }
    const { id, ...fields } = parsed.data;
    const service = createServiceClient();
    const { error } = await service
      .from("guest_rooms")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      logger.error("[AdminRooms] update failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al guardar" }, { status: 500 });
    }
    return NextResponse.json({ data: { id }, error: null, message: "Habitación actualizada" });
  } catch (err) {
    logger.error("[AdminRooms] PATCH error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ data: null, error: "invalid_body", message: "id requerido" }, { status: 400 });
    }
    const service = createServiceClient();
    const del = await service.from("guest_rooms").delete().eq("id", id);
    if (del.error) {
      // Has bookings (FK) → deactivate instead so history stays intact
      const { error: deErr } = await service
        .from("guest_rooms")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (deErr) {
        logger.error("[AdminRooms] delete+deactivate failed", deErr);
        return NextResponse.json({ data: null, error: "db_error", message: "Error al eliminar" }, { status: 500 });
      }
      return NextResponse.json({
        data: { id, softDeleted: true },
        error: null,
        message: "La habitación tiene reservas; se desactivó en lugar de borrarse.",
      });
    }
    return NextResponse.json({ data: { id }, error: null, message: "Habitación eliminada" });
  } catch (err) {
    logger.error("[AdminRooms] DELETE error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}
