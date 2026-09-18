/**
 * Admin venue areas CRUD (salón / floor plan)
 *   GET    /api/admin/areas?location_id=santa-ana  → all areas (incl. inactive)
 *   POST   /api/admin/areas                         → create
 *   PATCH  /api/admin/areas                         → update (by id)
 *   DELETE /api/admin/areas?id=...                   → remove (soft-falls-back if tables exist)
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
  name_es: z.string().min(2).max(120),
  name_en: z.string().min(2).max(120),
  description_es: z.string().max(1000).nullable().optional(),
  description_en: z.string().max(1000).nullable().optional(),
  floor: z.string().max(60).nullable().optional(),
  view: z.string().max(60).nullable().optional(),
  is_vip: z.boolean().optional(),
  image_url: z.string().max(600).nullable().optional(),
  min_party: z.number().int().min(0).max(100).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
};

const CreateSchema = z.object(Fields);
const UpdateSchema = z.object({
  id: z.string().uuid(),
  location_id: Fields.location_id.optional(),
  code: Fields.code.optional(),
  name_es: Fields.name_es.optional(),
  name_en: Fields.name_en.optional(),
  description_es: Fields.description_es,
  description_en: Fields.description_en,
  floor: Fields.floor,
  view: Fields.view,
  is_vip: z.boolean().optional(),
  image_url: Fields.image_url,
  min_party: Fields.min_party,
  is_active: z.boolean().optional(),
  sort_order: Fields.sort_order,
});

async function requireAdmin(): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, res: NextResponse.json({ data: null, error: "unauthorized", message: "No autenticado" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, res: NextResponse.json({ data: null, error: "forbidden", message: "Requiere rol admin" }, { status: 403 }) };
  return { ok: true };
}

const COLS =
  "id, location_id, code, name_es, name_en, description_es, description_en, floor, view, is_vip, image_url, min_party, is_active, sort_order";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const locationId = new URL(request.url).searchParams.get("location_id");
    if (!locationId) return NextResponse.json({ data: null, error: "invalid_body", message: "location_id requerido" }, { status: 400 });
    const service = createServiceClient();
    const { data, error } = await service.from("venue_areas").select(COLS).eq("location_id", locationId).order("sort_order", { ascending: true });
    if (error) {
      logger.error("[AdminAreas] list failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al cargar" }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? [], error: null });
  } catch (err) {
    logger.error("[AdminAreas] GET error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const parsed = CreateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ data: null, error: "invalid_body", message: "Datos inválidos" }, { status: 400 });
    const service = createServiceClient();
    const { data, error } = await service.from("venue_areas").insert([{ is_active: true, sort_order: 0, ...parsed.data }]).select("id").single();
    if (error) {
      const dup = error.code === "23505";
      return NextResponse.json({ data: null, error: "db_error", message: dup ? "Ya existe un área con ese código" : "Error al crear" }, { status: dup ? 409 : 500 });
    }
    return NextResponse.json({ data: { id: data?.id }, error: null, message: "Área creada" });
  } catch (err) {
    logger.error("[AdminAreas] POST error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const parsed = UpdateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ data: null, error: "invalid_body", message: "Datos inválidos" }, { status: 400 });
    const { id, ...fields } = parsed.data;
    const service = createServiceClient();
    const { error } = await service.from("venue_areas").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      logger.error("[AdminAreas] update failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al guardar" }, { status: 500 });
    }
    return NextResponse.json({ data: { id }, error: null, message: "Área actualizada" });
  } catch (err) {
    logger.error("[AdminAreas] PATCH error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ data: null, error: "invalid_body", message: "id requerido" }, { status: 400 });
    const service = createServiceClient();
    // Block delete if the area still has tables — ask the owner to move/remove them first.
    const { count } = await service.from("restaurant_tables").select("id", { count: "exact", head: true }).eq("area_id", id);
    if ((count ?? 0) > 0) {
      const { error: deErr } = await service.from("venue_areas").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
      if (deErr) return NextResponse.json({ data: null, error: "db_error", message: "Error al eliminar" }, { status: 500 });
      return NextResponse.json({ data: { id, softDeleted: true }, error: null, message: "El área tiene mesas; se ocultó en lugar de borrarse. Mueve o elimina sus mesas para borrarla." });
    }
    const { error } = await service.from("venue_areas").delete().eq("id", id);
    if (error) return NextResponse.json({ data: null, error: "db_error", message: "Error al eliminar" }, { status: 500 });
    return NextResponse.json({ data: { id }, error: null, message: "Área eliminada" });
  } catch (err) {
    logger.error("[AdminAreas] DELETE error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}
