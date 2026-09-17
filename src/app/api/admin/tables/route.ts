/**
 * Admin tables API
 *   GET   /api/admin/tables?location_id=juayua   → all tables for a venue
 *   PATCH /api/admin/tables   { id, is_blocked?, is_active? }
 *         Manually block/unblock a table (maintenance, VIP hold, walk-in) or
 *         retire it. Blocked tables render red on the public floor plan and
 *         are rejected server-side at booking time.
 *
 * Auth: logged-in user whose profile role is 'admin'. Writes via service client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import logger from "@/lib/logger";

const PatchSchema = z
  .object({
    id: z.string().uuid(),
    is_blocked: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((d) => d.is_blocked !== undefined || d.is_active !== undefined, {
    message: "Nada que actualizar",
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");
    if (!locationId) {
      return NextResponse.json(
        { data: null, error: "invalid_body", message: "location_id requerido" },
        { status: 400 },
      );
    }

    const service = createServiceClient();
    const { data, error } = await service
      .from("restaurant_tables")
      .select(
        "id, location_id, zone, code, label, seats, pos_x, pos_y, shape, is_blocked, is_active, sort_order",
      )
      .eq("location_id", locationId)
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error("[AdminTables] list failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al cargar" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: data ?? [], error: null });
  } catch (err) {
    logger.error("[AdminTables] GET error", err);
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

    const parsed = PatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "invalid_body", message: "Datos inválidos" },
        { status: 400 },
      );
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.is_blocked !== undefined) patch.is_blocked = parsed.data.is_blocked;
    if (parsed.data.is_active !== undefined) patch.is_active = parsed.data.is_active;

    const service = createServiceClient();
    const { error } = await service
      .from("restaurant_tables")
      .update(patch)
      .eq("id", parsed.data.id);

    if (error) {
      logger.error("[AdminTables] update failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al guardar" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: { id: parsed.data.id },
      error: null,
      message: "Mesa actualizada",
    });
  } catch (err) {
    logger.error("[AdminTables] PATCH error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}
