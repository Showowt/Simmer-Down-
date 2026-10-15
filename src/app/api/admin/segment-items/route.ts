/**
 * Admin segment items CRUD (brand-page CMS: Cortes, Maridaje, Hospitality, Merch)
 *   GET    /api/admin/segment-items?segment=cortes  → all items (incl. inactive)
 *   POST   /api/admin/segment-items                 → create
 *   PATCH  /api/admin/segment-items                 → update (by id)
 *   DELETE /api/admin/segment-items?id=...          → remove
 *
 * Auth: profile role 'admin'. Writes via service client. An image_url the
 * browser could not load is rejected instead of stored (same as rooms).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isRenderableSiteImage, SEGMENT_KEYS } from "@/lib/site-content";
import logger from "@/lib/logger";

const Fields = {
  segment: z.enum(["cortes", "maridaje", "hospitality", "merch"]),
  category: z.string().max(60).nullable().optional(),
  name_es: z.string().min(1).max(140),
  name_en: z.string().max(140).optional(),
  description_es: z.string().max(1000).nullable().optional(),
  description_en: z.string().max(1000).nullable().optional(),
  price: z.number().min(0).max(100000).nullable().optional(),
  image_url: z.string().max(600).nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10000).optional(),
};

const CreateSchema = z.object(Fields);
const UpdateSchema = z.object({
  id: z.string().uuid(),
  segment: Fields.segment.optional(),
  category: Fields.category,
  name_es: Fields.name_es.optional(),
  name_en: Fields.name_en,
  description_es: Fields.description_es,
  description_en: Fields.description_en,
  price: Fields.price,
  image_url: Fields.image_url,
  is_active: Fields.is_active,
  sort_order: Fields.sort_order,
});

const BAD_IMAGE_MESSAGE =
  "La imagen debe subirse aquí (se guarda en Supabase) o ser un enlace de images.unsplash.com. Otros enlaces los bloquea el navegador. / Upload the photo here or use an images.unsplash.com link — other hosts are blocked by the browser.";

function imageUrlRejected(imageUrl: string | null | undefined): boolean {
  if (imageUrl === undefined || imageUrl === null || imageUrl === "") return false;
  return !isRenderableSiteImage(imageUrl);
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
    const segment = new URL(request.url).searchParams.get("segment");
    const service = createServiceClient();

    let query = service
      .from("segment_items")
      .select("id, segment, category, name_es, name_en, description_es, description_en, price, image_url, is_active, sort_order")
      .order("sort_order", { ascending: true });
    if (segment && (SEGMENT_KEYS as string[]).includes(segment)) {
      query = query.eq("segment", segment);
    }
    const { data, error } = await query;
    if (error) {
      logger.error("[AdminSegmentItems] list failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al cargar" }, { status: 500 });
    }
    return NextResponse.json({
      data: (data ?? []).map((r) => ({ ...r, price: r.price != null ? Number(r.price) : null })),
      error: null,
    });
  } catch (err) {
    logger.error("[AdminSegmentItems] GET error", err);
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
    const row = { name_en: "", is_active: true, sort_order: 0, ...parsed.data };
    const { data, error } = await service.from("segment_items").insert([row]).select("id").single();
    if (error) {
      logger.error("[AdminSegmentItems] insert failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al crear" }, { status: 500 });
    }
    return NextResponse.json({ data: { id: data?.id }, error: null, message: "Elemento creado" });
  } catch (err) {
    logger.error("[AdminSegmentItems] POST error", err);
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
    const { id, ...fields } = parsed.data;
    const service = createServiceClient();
    const { error } = await service
      .from("segment_items")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      logger.error("[AdminSegmentItems] update failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al guardar" }, { status: 500 });
    }
    return NextResponse.json({ data: { id }, error: null, message: "Elemento actualizado" });
  } catch (err) {
    logger.error("[AdminSegmentItems] PATCH error", err);
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
    const { error } = await service.from("segment_items").delete().eq("id", id);
    if (error) {
      logger.error("[AdminSegmentItems] delete failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al eliminar" }, { status: 500 });
    }
    return NextResponse.json({ data: { id }, error: null, message: "Elemento eliminado" });
  } catch (err) {
    logger.error("[AdminSegmentItems] DELETE error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}
