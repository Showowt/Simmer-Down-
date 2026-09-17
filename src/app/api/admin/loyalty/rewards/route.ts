/**
 * Admin loyalty rewards CRUD
 *   GET    /api/admin/loyalty/rewards          → all rewards (incl. inactive)
 *   POST   /api/admin/loyalty/rewards          → create
 *   PATCH  /api/admin/loyalty/rewards          → update (by id)
 *   DELETE /api/admin/loyalty/rewards?id=...    → remove (soft: is_active=false if referenced)
 *
 * Auth: logged-in user whose profile role is 'admin'. Writes via service client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import logger from "@/lib/logger";

const REWARD_TYPES = ["free_item", "percent_discount", "fixed_discount"] as const;
const TIERS = ["bronze", "silver", "gold", "platinum"] as const;

const BaseFields = {
  name: z.string().min(2).max(120),
  name_es: z.string().min(2).max(120),
  description: z.string().max(500).nullable().optional(),
  description_es: z.string().max(500).nullable().optional(),
  points_required: z.number().int().min(1).max(1000000),
  reward_type: z.enum(REWARD_TYPES),
  discount_percent: z.number().int().min(0).max(100).nullable().optional(),
  discount_amount: z.number().min(0).max(100000).nullable().optional(),
  min_tier_required: z.enum(TIERS).default("bronze"),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).max(10000).optional(),
};

const CreateSchema = z.object(BaseFields);
const UpdateSchema = z.object({
  id: z.string().uuid(),
  name: BaseFields.name.optional(),
  name_es: BaseFields.name_es.optional(),
  description: BaseFields.description,
  description_es: BaseFields.description_es,
  points_required: BaseFields.points_required.optional(),
  reward_type: z.enum(REWARD_TYPES).optional(),
  discount_percent: BaseFields.discount_percent,
  discount_amount: BaseFields.discount_amount,
  min_tier_required: z.enum(TIERS).optional(),
  is_active: z.boolean().optional(),
  display_order: BaseFields.display_order,
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

const SELECT_COLS =
  "id, name, name_es, description, description_es, points_required, reward_type, discount_percent, discount_amount, min_tier_required, is_active, display_order";

export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const service = createServiceClient();
    const { data, error } = await service
      .from("loyalty_rewards")
      .select(SELECT_COLS)
      .order("display_order", { ascending: true });

    if (error) {
      logger.error("[AdminRewards] list failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al cargar" },
        { status: 500 },
      );
    }
    return NextResponse.json({ data: data ?? [], error: null });
  } catch (err) {
    logger.error("[AdminRewards] GET error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const parsed = CreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "invalid_body", message: "Datos inválidos" },
        { status: 400 },
      );
    }

    const service = createServiceClient();
    const { data, error } = await service
      .from("loyalty_rewards")
      .insert([{ is_active: true, display_order: 0, ...parsed.data }])
      .select("id")
      .single();

    if (error) {
      logger.error("[AdminRewards] insert failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al crear" },
        { status: 500 },
      );
    }
    return NextResponse.json({ data: { id: data?.id }, error: null, message: "Premio creado" });
  } catch (err) {
    logger.error("[AdminRewards] POST error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const parsed = UpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "invalid_body", message: "Datos inválidos" },
        { status: 400 },
      );
    }
    const { id, ...fields } = parsed.data;
    const patch: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() };

    const service = createServiceClient();
    const { error } = await service.from("loyalty_rewards").update(patch).eq("id", id);
    if (error) {
      logger.error("[AdminRewards] update failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al guardar" },
        { status: 500 },
      );
    }
    return NextResponse.json({ data: { id }, error: null, message: "Premio actualizado" });
  } catch (err) {
    logger.error("[AdminRewards] PATCH error", err);
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

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { data: null, error: "invalid_body", message: "id requerido" },
        { status: 400 },
      );
    }

    const service = createServiceClient();
    // Try a hard delete; if the reward has been redeemed (FK), fall back to
    // deactivating so history stays intact.
    const del = await service.from("loyalty_rewards").delete().eq("id", id);
    if (del.error) {
      const { error: deactErr } = await service
        .from("loyalty_rewards")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (deactErr) {
        logger.error("[AdminRewards] delete+deactivate failed", deactErr);
        return NextResponse.json(
          { data: null, error: "db_error", message: "Error al eliminar" },
          { status: 500 },
        );
      }
      return NextResponse.json({
        data: { id, softDeleted: true },
        error: null,
        message: "El premio ya fue canjeado; se desactivó en lugar de borrarse.",
      });
    }
    return NextResponse.json({ data: { id }, error: null, message: "Premio eliminado" });
  } catch (err) {
    logger.error("[AdminRewards] DELETE error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}
