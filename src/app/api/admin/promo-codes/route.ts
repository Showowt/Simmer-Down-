/**
 * Admin promo codes CRUD — closes the loop on an orphaned feature: the order
 * API has validated `promo_codes` at checkout since day one, but there was no
 * way to CREATE a code (table empty forever) nor a customer input (added to
 * /checkout in the same drop).
 *
 *   GET    /api/admin/promo-codes
 *   POST   /api/admin/promo-codes   { code, description?, discount_type, discount_value, min_order_amount?, expires_at?, is_active }
 *   PATCH  /api/admin/promo-codes   { id, ...same fields }
 *   DELETE /api/admin/promo-codes?id=…   (soft: is_active=false — codes may be printed on flyers)
 *
 * Only the fields the order API actually enforces are exposed (code, type,
 * value, min order, expiry, active). The table has more columns (max_uses,
 * valid_days…) that checkout does NOT check — hiding them avoids selling
 * limits that don't exist.
 *
 * Auth: profiles.role='admin'. Writes via service client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; res: NextResponse }
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
  return { ok: true };
}

const CodeFields = {
  code: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[A-Z0-9-]+$/, "Solo letras mayúsculas, números y guiones"),
  description: z.string().max(200).nullable().optional(),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.number().min(0.01).max(1000),
  min_order_amount: z.number().min(0).max(10000).nullable().optional(),
  expires_at: z.string().datetime({ offset: true }).nullable().optional(),
  is_active: z.boolean(),
};

const CreateSchema = z.object(CodeFields).refine(
  (v) => v.discount_type !== "percent" || v.discount_value <= 100,
  { message: "Un porcentaje no puede ser mayor a 100" },
);

const UpdateSchema = z
  .object({ id: z.string().uuid(), ...CodeFields })
  .refine((v) => v.discount_type !== "percent" || v.discount_value <= 100, {
    message: "Un porcentaje no puede ser mayor a 100",
  });

const SELECT_COLS =
  "id, code, description, discount_type, discount_value, min_order_amount, expires_at, is_active, current_uses, created_at";

export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const service = createServiceClient();
    const { data, error } = await service
      .from("promo_codes")
      .select(SELECT_COLS)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      logger.error("[AdminPromoCodes] list failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al cargar códigos" },
        { status: 500 },
      );
    }
    return NextResponse.json({ data, error: null });
  } catch (err) {
    logger.error("[AdminPromoCodes] GET error", err);
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
      const msg = parsed.error.issues[0]?.message || "Datos inválidos";
      return NextResponse.json(
        { data: null, error: "invalid_body", message: msg },
        { status: 400 },
      );
    }
    const v = parsed.data;
    const service = createServiceClient();
    const { data, error } = await service
      .from("promo_codes")
      .insert({
        code: v.code.toUpperCase(),
        description: v.description || null,
        discount_type: v.discount_type,
        discount_value: v.discount_value,
        min_order_amount: v.min_order_amount ?? null,
        expires_at: v.expires_at ?? null,
        is_active: v.is_active,
      })
      .select(SELECT_COLS)
      .single();
    if (error) {
      const dup = error.code === "23505";
      logger.error("[AdminPromoCodes] insert failed", error);
      return NextResponse.json(
        {
          data: null,
          error: dup ? "duplicate" : "db_error",
          message: dup ? "Ese código ya existe" : "Error al crear el código",
        },
        { status: dup ? 409 : 500 },
      );
    }
    return NextResponse.json({ data, error: null, message: "Código creado" });
  } catch (err) {
    logger.error("[AdminPromoCodes] POST error", err);
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
      const msg = parsed.error.issues[0]?.message || "Datos inválidos";
      return NextResponse.json(
        { data: null, error: "invalid_body", message: msg },
        { status: 400 },
      );
    }
    const { id, ...v } = parsed.data;
    const service = createServiceClient();
    const { data, error } = await service
      .from("promo_codes")
      .update({
        code: v.code.toUpperCase(),
        description: v.description || null,
        discount_type: v.discount_type,
        discount_value: v.discount_value,
        min_order_amount: v.min_order_amount ?? null,
        expires_at: v.expires_at ?? null,
        is_active: v.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(SELECT_COLS)
      .single();
    if (error) {
      logger.error("[AdminPromoCodes] update failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al guardar" },
        { status: 500 },
      );
    }
    return NextResponse.json({ data, error: null, message: "Código guardado" });
  } catch (err) {
    logger.error("[AdminPromoCodes] PATCH error", err);
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
    const id = request.nextUrl.searchParams.get("id");
    if (!id || !z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { data: null, error: "invalid_id", message: "id inválido" },
        { status: 400 },
      );
    }
    const service = createServiceClient();
    const { error } = await service
      .from("promo_codes")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      logger.error("[AdminPromoCodes] deactivate failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al desactivar" },
        { status: 500 },
      );
    }
    return NextResponse.json({ data: { id }, error: null, message: "Código desactivado" });
  } catch (err) {
    logger.error("[AdminPromoCodes] DELETE error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}
