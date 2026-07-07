/**
 * POST /api/admin/menu-item — set price/availability/text overrides for a menu item.
 * DELETE /api/admin/menu-item — clear overrides (item reverts to static values).
 *
 * Auth: requires a logged-in user whose profile role is 'admin'.
 * Writes go through the service client (RLS blocks direct writes).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { MENU_ITEMS } from "@/lib/data";
import logger from "@/lib/logger";

const BodySchema = z.object({
  itemId: z.string().min(1).max(80),
  price: z.number().gt(0).lt(1000).nullable().optional(),
  isAvailable: z.boolean().nullable().optional(),
  isFeatured: z.boolean().nullable().optional(),
  nameEs: z.string().min(2).max(120).nullable().optional(),
  nameEn: z.string().min(2).max(120).nullable().optional(),
  descriptionEs: z.string().max(500).nullable().optional(),
  descriptionEn: z.string().max(500).nullable().optional(),
});

const DeleteSchema = z.object({
  itemId: z.string().min(1).max(80),
});

async function requireAdmin(): Promise<
  { ok: true; email: string } | { ok: false; res: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      res: NextResponse.json(
        { data: null, error: "unauthorized", message: "No autenticado" },
        { status: 401 },
      ),
    };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return {
      ok: false,
      res: NextResponse.json(
        { data: null, error: "forbidden", message: "Requiere rol admin" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, email: user.email || "admin" };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "invalid_body", message: "Datos inválidos" },
        { status: 400 },
      );
    }
    const b = parsed.data;

    if (!MENU_ITEMS.some((i) => i.id === b.itemId)) {
      return NextResponse.json(
        { data: null, error: "unknown_item", message: "Platillo no existe" },
        { status: 400 },
      );
    }

    const row: Record<string, unknown> = {
      item_id: b.itemId,
      updated_by: auth.email,
      updated_at: new Date().toISOString(),
    };
    if (b.price !== undefined) row.price = b.price;
    if (b.isAvailable !== undefined) row.is_available = b.isAvailable;
    if (b.isFeatured !== undefined) row.is_featured = b.isFeatured;
    if (b.nameEs !== undefined) row.name_es = b.nameEs;
    if (b.nameEn !== undefined) row.name_en = b.nameEn;
    if (b.descriptionEs !== undefined) row.description_es = b.descriptionEs;
    if (b.descriptionEn !== undefined) row.description_en = b.descriptionEn;

    const service = createServiceClient();
    const { error } = await service
      .from("menu_item_overrides")
      .upsert(row, { onConflict: "item_id" });
    if (error) {
      logger.error("[AdminMenuItem] Upsert failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al guardar" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { itemId: b.itemId }, error: null, message: "Cambios guardados" });
  } catch (err) {
    logger.error("[AdminMenuItem] POST error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const parsed = DeleteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "invalid_body", message: "Datos inválidos" },
        { status: 400 },
      );
    }

    const service = createServiceClient();
    const { error } = await service
      .from("menu_item_overrides")
      .delete()
      .eq("item_id", parsed.data.itemId);
    if (error) {
      logger.error("[AdminMenuItem] Delete failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al eliminar" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: { itemId: parsed.data.itemId },
      error: null,
      message: "Valores originales restaurados",
    });
  } catch (err) {
    logger.error("[AdminMenuItem] DELETE error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}
