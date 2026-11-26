/**
 * Admin — Calendario de Adviento
 *   GET   /api/admin/advent  → switch state + all 12 drawers (signed previews,
 *                              opens per drawer), regardless of date
 *   PATCH /api/admin/advent  → { kind: "settings", is_live }
 *                            | { kind: "day", day, unlock_date?, title?, description?, image_path? }
 *
 * Auth: profile role 'admin' (same gate as the /admin pages). Writes go
 * through the service client — advent_* tables have no RLS policies.
 * Replacing or removing a drawer image deletes the old object from the
 * private `advent` bucket.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminRequest, readAdventRows, signAdventPaths } from "@/lib/advent-server";
import {
  ADVENT_BUCKET,
  adventState,
  isAdventImagePath,
  isIsoDate,
  svToday,
  type AdminAdventDay,
  type AdminAdventPayload,
} from "@/lib/advent";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

function fail(status: number, error: string, message: string): NextResponse {
  return NextResponse.json({ data: null, error, message }, { status });
}

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === null || v.trim() === "" ? null : v.trim()));

const PatchSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("settings"), is_live: z.boolean() }),
  z.object({
    kind: z.literal("day"),
    day: z.number().int().min(1).max(12),
    unlock_date: z.string().refine(isIsoDate, "fecha inválida").optional(),
    title: optionalText(120),
    description: optionalText(600),
    image_path: z.string().max(300).nullable().optional(),
  }),
]);

async function buildPayload(): Promise<AdminAdventPayload> {
  const service = createServiceClient();
  const [{ isLive, days }, counts] = await Promise.all([
    readAdventRows(),
    service.rpc("advent_open_counts"),
  ]);
  if (counts.error) throw counts.error;
  const opensByDay = new Map<number, number>();
  for (const c of (counts.data ?? []) as Array<{ day: number; opens: number | string }>) {
    opensByDay.set(Number(c.day), Number(c.opens));
  }
  const signed = await signAdventPaths(
    days.filter((d) => d.image_path).map((d) => d.image_path as string),
  );
  const today = svToday();
  const out: AdminAdventDay[] = days.map((d) => ({
    day: d.day,
    date: d.unlock_date,
    state: adventState(d.unlock_date, today),
    title: d.title,
    description: d.description,
    imagePath: d.image_path,
    imageUrl: d.image_path ? signed.get(d.image_path) ?? null : null,
    opens: opensByDay.get(d.day) ?? 0,
    updatedAt: d.updated_at,
  }));
  return {
    today,
    isLive,
    totalOpens: out.reduce((sum, d) => sum + d.opens, 0),
    days: out,
  };
}

export async function GET(): Promise<NextResponse> {
  if (!(await isAdminRequest())) return fail(401, "unauthorized", "Sesión expirada o sin permiso.");
  try {
    return NextResponse.json({ data: await buildPayload(), error: null, message: "ok" });
  } catch (error) {
    logger.error("[api/admin/advent] GET", error);
    return fail(500, "server_error", "No se pudo cargar el calendario.");
  }
}

async function objectExists(path: string): Promise<boolean> {
  const slash = path.indexOf("/");
  const folder = path.slice(0, slash);
  const name = path.slice(slash + 1);
  const service = createServiceClient();
  const { data, error } = await service.storage.from(ADVENT_BUCKET).list(folder, { search: name, limit: 5 });
  if (error) {
    logger.error("[api/admin/advent] list", error.message);
    return false;
  }
  return (data ?? []).some((o) => o.name === name);
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  if (!(await isAdminRequest())) return fail(401, "unauthorized", "Sesión expirada o sin permiso.");
  const rl = checkRateLimit(`admin_advent:${getClientIp(request)}`, { maxRequests: 60, windowMs: 60_000 });
  if (!rl.success) return fail(429, "rate_limited", "Demasiadas solicitudes. Espera un momento.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_body", "Datos inválidos.");
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return fail(400, "invalid_body", "Datos inválidos.");
  const input = parsed.data;

  try {
    const service = createServiceClient();

    if (input.kind === "settings") {
      const { error } = await service
        .from("advent_settings")
        .update({ is_live: input.is_live })
        .eq("id", true);
      if (error) throw error;
      return NextResponse.json({ data: await buildPayload(), error: null, message: "Guardado" });
    }

    const { data: current, error: curErr } = await service
      .from("advent_days")
      .select("image_path")
      .eq("day", input.day)
      .maybeSingle();
    if (curErr) throw curErr;
    if (!current) return fail(404, "not_found", "Casilla no encontrada.");
    const oldPath = (current as { image_path: string | null }).image_path;

    const update: Record<string, string | null> = {};
    if (input.unlock_date !== undefined) update.unlock_date = input.unlock_date;
    if (input.title !== undefined) update.title = input.title;
    if (input.description !== undefined) update.description = input.description;
    if (input.image_path !== undefined) {
      if (input.image_path !== null) {
        if (!isAdventImagePath(input.image_path, input.day)) {
          return fail(400, "bad_image", "Imagen no válida para esta casilla.");
        }
        if (!(await objectExists(input.image_path))) {
          return fail(400, "image_missing", "La imagen no terminó de subirse. Inténtalo de nuevo.");
        }
      }
      update.image_path = input.image_path;
    }
    if (Object.keys(update).length === 0) return fail(400, "empty", "Nada que guardar.");

    const { error: upErr } = await service.from("advent_days").update(update).eq("day", input.day);
    if (upErr) {
      if ((upErr as { code?: string }).code === "23505") {
        return fail(409, "date_taken", "Otra casilla ya usa esa fecha.");
      }
      throw upErr;
    }

    if (input.image_path !== undefined && oldPath && oldPath !== input.image_path) {
      const { error: rmErr } = await service.storage.from(ADVENT_BUCKET).remove([oldPath]);
      if (rmErr) logger.error("[api/admin/advent] remove old image", rmErr.message);
    }

    return NextResponse.json({ data: await buildPayload(), error: null, message: "Guardado" });
  } catch (error) {
    logger.error("[api/admin/advent] PATCH", error);
    return fail(500, "server_error", "No se pudo guardar.");
  }
}
