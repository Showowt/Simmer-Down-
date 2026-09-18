/**
 * Admin tables API (salón floor plan)
 *   GET    /api/admin/tables?location_id=santa-ana  → all tables for a venue
 *   POST   /api/admin/tables                         → create a table in an area
 *   PATCH  /api/admin/tables   { id, ... }           → edit / block / retire
 *   DELETE /api/admin/tables?id=...                   → remove (soft-falls-back if reserved)
 *
 * Blocked tables render red on the public map and are rejected at booking time.
 * Auth: profile role 'admin'. Writes via service client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import logger from "@/lib/logger";

const CreateSchema = z.object({
  location_id: z.string().min(2).max(60),
  area_id: z.string().uuid(),
  zone: z.string().min(1).max(40),
  code: z.string().min(1).max(40),
  label: z.string().min(1).max(40),
  seats: z.number().int().min(1).max(30),
  shape: z.enum(["square", "rect"]).optional(),
  pos_x: z.number().min(0).max(100).optional(),
  pos_y: z.number().min(0).max(100).optional(),
  sort_order: z.number().int().min(0).max(100000).optional(),
});

const PatchSchema = z
  .object({
    id: z.string().uuid(),
    label: z.string().min(1).max(40).optional(),
    seats: z.number().int().min(1).max(30).optional(),
    shape: z.enum(["square", "rect"]).optional(),
    area_id: z.string().uuid().optional(),
    zone: z.string().min(1).max(40).optional(),
    pos_x: z.number().min(0).max(100).optional(),
    pos_y: z.number().min(0).max(100).optional(),
    is_blocked: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 1, { message: "Nada que actualizar" });

async function requireAdmin(): Promise<
  { ok: true; email: string } | { ok: false; res: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, res: NextResponse.json({ data: null, error: "unauthorized", message: "No autenticado" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, res: NextResponse.json({ data: null, error: "forbidden", message: "Requiere rol admin" }, { status: 403 }) };
  return { ok: true, email: user.email || "admin" };
}

const COLS =
  "id, location_id, zone, area_id, code, label, seats, pos_x, pos_y, shape, is_blocked, is_active, sort_order";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const locationId = new URL(request.url).searchParams.get("location_id");
    if (!locationId) return NextResponse.json({ data: null, error: "invalid_body", message: "location_id requerido" }, { status: 400 });
    const service = createServiceClient();
    const { data, error } = await service.from("restaurant_tables").select(COLS).eq("location_id", locationId).order("sort_order", { ascending: true });
    if (error) {
      logger.error("[AdminTables] list failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al cargar" }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? [], error: null });
  } catch (err) {
    logger.error("[AdminTables] GET error", err);
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
    const { data, error } = await service
      .from("restaurant_tables")
      .insert([{ shape: "square", pos_x: 50, pos_y: 50, is_active: true, sort_order: 0, ...parsed.data }])
      .select("id")
      .single();
    if (error) {
      const dup = error.code === "23505";
      return NextResponse.json({ data: null, error: "db_error", message: dup ? "Ya existe una mesa con ese código" : "Error al crear" }, { status: dup ? 409 : 500 });
    }
    return NextResponse.json({ data: { id: data?.id }, error: null, message: "Mesa creada" });
  } catch (err) {
    logger.error("[AdminTables] POST error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const parsed = PatchSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ data: null, error: "invalid_body", message: "Datos inválidos" }, { status: 400 });
    const { id, ...fields } = parsed.data;
    const service = createServiceClient();
    const { error } = await service.from("restaurant_tables").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      logger.error("[AdminTables] update failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al guardar" }, { status: 500 });
    }
    return NextResponse.json({ data: { id }, error: null, message: "Mesa actualizada" });
  } catch (err) {
    logger.error("[AdminTables] PATCH error", err);
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
    const del = await service.from("restaurant_tables").delete().eq("id", id);
    if (del.error) {
      // Has reservations (FK) → deactivate instead so history stays intact
      const { error: deErr } = await service.from("restaurant_tables").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
      if (deErr) return NextResponse.json({ data: null, error: "db_error", message: "Error al eliminar" }, { status: 500 });
      return NextResponse.json({ data: { id, softDeleted: true }, error: null, message: "La mesa tiene reservas; se ocultó en lugar de borrarse." });
    }
    return NextResponse.json({ data: { id }, error: null, message: "Mesa eliminada" });
  } catch (err) {
    logger.error("[AdminTables] DELETE error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}
