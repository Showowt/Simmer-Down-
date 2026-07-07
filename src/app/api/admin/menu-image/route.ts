/**
 * POST /api/admin/menu-image — assign an uploaded photo to a menu item.
 * DELETE /api/admin/menu-image — remove an override (falls back to static).
 *
 * Auth: requires a logged-in user whose profile role is 'admin'.
 * Writes go through the service client (RLS blocks direct writes).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { MENU_ITEMS } from "@/lib/data";
import { isAllowedImageUrl } from "@/lib/menu-images";
import logger from "@/lib/logger";

const BodySchema = z.object({
  itemId: z.string().min(1).max(80),
  imageUrl: z.string().url().max(600).or(z.string().startsWith("/images/").max(600)),
});

const DeleteSchema = z.object({
  itemId: z.string().min(1).max(80),
});

async function requireAdmin(): Promise<{ ok: true; email: string } | { ok: false; res: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, res: NextResponse.json({ data: null, error: "unauthorized", message: "No autenticado" }, { status: 401 }) };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { ok: false, res: NextResponse.json({ data: null, error: "forbidden", message: "Requiere rol admin" }, { status: 403 }) };
  }
  return { ok: true, email: user.email || "admin" };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: "invalid_body", message: "Datos invalidos" }, { status: 400 });
    }
    const { itemId, imageUrl } = parsed.data;

    if (!MENU_ITEMS.some((i) => i.id === itemId)) {
      return NextResponse.json({ data: null, error: "unknown_item", message: "Platillo no existe" }, { status: 400 });
    }
    if (!isAllowedImageUrl(imageUrl)) {
      return NextResponse.json({ data: null, error: "invalid_url", message: "URL de imagen no permitida" }, { status: 400 });
    }

    const service = createServiceClient();
    const { error } = await service.from("menu_image_overrides").upsert(
      {
        item_id: itemId,
        image_url: imageUrl,
        updated_by: auth.email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "item_id" },
    );
    if (error) {
      logger.error("[AdminMenuImage] Upsert failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al guardar" }, { status: 500 });
    }

    return NextResponse.json({ data: { itemId, imageUrl }, error: null, message: "Foto asignada" });
  } catch (err) {
    logger.error("[AdminMenuImage] POST error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const parsed = DeleteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: "invalid_body", message: "Datos invalidos" }, { status: 400 });
    }

    const service = createServiceClient();
    const { error } = await service
      .from("menu_image_overrides")
      .delete()
      .eq("item_id", parsed.data.itemId);
    if (error) {
      logger.error("[AdminMenuImage] Delete failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al eliminar" }, { status: 500 });
    }

    return NextResponse.json({ data: { itemId: parsed.data.itemId }, error: null, message: "Override eliminado" });
  } catch (err) {
    logger.error("[AdminMenuImage] DELETE error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}
