/**
 * Admin location media CRUD (Ubicaciones photos: cover / hero / gallery)
 *   GET    /api/admin/location-media?location_id=santa-ana → all rows for a venue
 *   POST   /api/admin/location-media                       → create (cover/hero replace the existing one)
 *   PATCH  /api/admin/location-media                       → update (by id)
 *   DELETE /api/admin/location-media?id=...                → remove (public page falls back to the static photo)
 *
 * Auth: profile role 'admin'. Writes via service client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isRenderableSiteImage } from "@/lib/site-content";
import logger from "@/lib/logger";

const Fields = {
  location_id: z.string().min(2).max(60),
  kind: z.enum(["cover", "hero", "gallery"]),
  image_url: z.string().max(600),
  sort_order: z.number().int().min(0).max(10000).optional(),
  is_active: z.boolean().optional(),
};

const CreateSchema = z.object(Fields);
const UpdateSchema = z.object({
  id: z.string().uuid(),
  image_url: Fields.image_url.optional(),
  sort_order: Fields.sort_order,
  is_active: Fields.is_active,
});

const BAD_IMAGE_MESSAGE =
  "La imagen debe subirse aquí (se guarda en Supabase) o ser un enlace de images.unsplash.com. Otros enlaces los bloquea el navegador. / Upload the photo here or use an images.unsplash.com link — other hosts are blocked by the browser.";

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
    const locationId = new URL(request.url).searchParams.get("location_id");
    const service = createServiceClient();

    let query = service
      .from("location_media")
      .select("id, location_id, kind, image_url, sort_order, is_active")
      .order("sort_order", { ascending: true });
    if (locationId) query = query.eq("location_id", locationId);
    const { data, error } = await query;
    if (error) {
      logger.error("[AdminLocationMedia] list failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al cargar" }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? [], error: null });
  } catch (err) {
    logger.error("[AdminLocationMedia] GET error", err);
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
    if (!isRenderableSiteImage(parsed.data.image_url)) {
      return NextResponse.json({ data: null, error: "invalid_image_url", message: BAD_IMAGE_MESSAGE }, { status: 400 });
    }
    const service = createServiceClient();
    const { location_id, kind } = parsed.data;

    // cover/hero are single-slot (unique index): replace the existing row.
    if (kind === "cover" || kind === "hero") {
      const { error: delErr } = await service
        .from("location_media")
        .delete()
        .eq("location_id", location_id)
        .eq("kind", kind);
      if (delErr) {
        logger.error("[AdminLocationMedia] replace-delete failed", delErr);
        return NextResponse.json({ data: null, error: "db_error", message: "Error al guardar" }, { status: 500 });
      }
    }

    const row = { sort_order: 0, is_active: true, ...parsed.data };
    const { data, error } = await service.from("location_media").insert([row]).select("id").single();
    if (error) {
      logger.error("[AdminLocationMedia] insert failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al crear" }, { status: 500 });
    }
    return NextResponse.json({ data: { id: data?.id }, error: null, message: "Foto guardada" });
  } catch (err) {
    logger.error("[AdminLocationMedia] POST error", err);
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
    if (parsed.data.image_url !== undefined && !isRenderableSiteImage(parsed.data.image_url)) {
      return NextResponse.json({ data: null, error: "invalid_image_url", message: BAD_IMAGE_MESSAGE }, { status: 400 });
    }
    const { id, ...fields } = parsed.data;
    const service = createServiceClient();
    const { error } = await service
      .from("location_media")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      logger.error("[AdminLocationMedia] update failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al guardar" }, { status: 500 });
    }
    return NextResponse.json({ data: { id }, error: null, message: "Foto actualizada" });
  } catch (err) {
    logger.error("[AdminLocationMedia] PATCH error", err);
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
    const { error } = await service.from("location_media").delete().eq("id", id);
    if (error) {
      logger.error("[AdminLocationMedia] delete failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al eliminar" }, { status: 500 });
    }
    return NextResponse.json({ data: { id }, error: null, message: "Foto eliminada" });
  } catch (err) {
    logger.error("[AdminLocationMedia] DELETE error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}
