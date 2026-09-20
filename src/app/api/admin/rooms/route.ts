/**
 * Admin rooms CRUD (estadía catalog)
 *   GET    /api/admin/rooms?location_id=lago-coatepeque  → all rooms (incl. inactive)
 *   POST   /api/admin/rooms                              → create
 *   PATCH  /api/admin/rooms                              → update (by id)
 *   DELETE /api/admin/rooms?id=...                        → remove (soft-falls-back to inactive)
 *
 * Auth: profile role 'admin'. Writes via service client.
 * Everything the public page reads is writable here (ES + EN), and an
 * image_url the browser could not load is rejected instead of stored.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  isRenderableRoomImage,
  isUndefinedColumn,
  GUEST_ROOM_COLUMNS,
  GUEST_ROOM_COLUMNS_LEGACY,
} from "@/lib/rooms";
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
  amenities_en: z.array(z.string().max(60)).max(30).optional(),
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
  amenities_en: Fields.amenities_en,
  is_active: z.boolean().optional(),
  sort_order: Fields.sort_order,
});

const BAD_IMAGE_MESSAGE =
  "La imagen debe subirse aquí (se guarda en Supabase) o ser un enlace de images.unsplash.com. Otros enlaces los bloquea el navegador. / Upload the photo here or use an images.unsplash.com link — other hosts are blocked by the browser.";

/** null/'' clears the photo; anything else must be loadable by the public page. */
function imageUrlRejected(imageUrl: string | null | undefined): boolean {
  if (imageUrl === undefined || imageUrl === null || imageUrl === "") return false;
  return !isRenderableRoomImage(imageUrl);
}

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const locationId = new URL(request.url).searchParams.get("location_id") || "lago-coatepeque";
    const service = createServiceClient();

    const list = (columns: string) =>
      service
        .from("guest_rooms")
        .select(columns)
        .eq("location_id", locationId)
        .order("sort_order", { ascending: true });

    let { data, error } = await list(GUEST_ROOM_COLUMNS);
    if (isUndefinedColumn(error)) {
      logger.warn("[AdminRooms] amenities_en missing; migration 20260920c pending");
      ({ data, error } = await list(GUEST_ROOM_COLUMNS_LEGACY));
    }
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
    if (imageUrlRejected(parsed.data.image_url)) {
      return NextResponse.json({ data: null, error: "invalid_image_url", message: BAD_IMAGE_MESSAGE }, { status: 400 });
    }
    const service = createServiceClient();
    const row = { amenities: [], is_active: true, sort_order: 0, ...parsed.data };

    let { data, error } = await service.from("guest_rooms").insert([row]).select("id").single();
    if (isUndefinedColumn(error)) {
      logger.warn("[AdminRooms] amenities_en missing on insert; migration 20260920c pending");
      const legacyRow: Record<string, unknown> = { ...row };
      delete legacyRow.amenities_en;
      ({ data, error } = await service.from("guest_rooms").insert([legacyRow]).select("id").single());
    }
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
    if (imageUrlRejected(parsed.data.image_url)) {
      return NextResponse.json({ data: null, error: "invalid_image_url", message: BAD_IMAGE_MESSAGE }, { status: 400 });
    }
    const { id, amenities_en, ...legacyFields } = parsed.data;
    const service = createServiceClient();
    const stamped = { ...legacyFields, updated_at: new Date().toISOString() };

    let { error } = await service
      .from("guest_rooms")
      .update(amenities_en === undefined ? stamped : { ...stamped, amenities_en })
      .eq("id", id);
    if (isUndefinedColumn(error)) {
      logger.warn("[AdminRooms] amenities_en missing on update; migration 20260920c pending");
      ({ error } = await service.from("guest_rooms").update(stamped).eq("id", id));
    }
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
