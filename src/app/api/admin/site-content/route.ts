/**
 * Admin site content settings (Trabaja con Nosotros + Nuestra Historia)
 *   GET   /api/admin/site-content → { careers, historia }
 *   PATCH /api/admin/site-content → update either or both settings rows
 *
 * Backed by the settings key/value table (keys 'careers' / 'historia_stats').
 * Auth: profile role 'admin'. Writes via service client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  DEFAULT_CAREERS,
  DEFAULT_HISTORIA,
  isRenderableSiteImage,
} from "@/lib/site-content";
import logger from "@/lib/logger";

const CareersSchema = z.object({
  form_url: z
    .string()
    .max(600)
    .refine((v) => v === "" || /^https:\/\//.test(v), {
      message: "El enlace del formulario debe empezar con https://",
    })
    .nullable(),
  intro_es: z.string().max(2000),
  intro_en: z.string().max(2000),
  photos: z.array(z.string().max(600)).max(24),
});

const HistoriaSchema = z.object({
  years: z.number().int().min(0).max(200),
  locations: z.number().int().min(0).max(100),
  reviews: z.number().int().min(0).max(10000000),
  stars: z.number().min(0).max(5),
});

const PatchSchema = z.object({
  careers: CareersSchema.optional(),
  historia: HistoriaSchema.optional(),
});

const BAD_IMAGE_MESSAGE =
  "Las fotos deben subirse aquí (se guardan en Supabase) o ser enlaces de images.unsplash.com. / Photos must be uploaded here or be images.unsplash.com links.";

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

export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const service = createServiceClient();
    const { data, error } = await service
      .from("settings")
      .select("key, value")
      .in("key", ["careers", "historia_stats"]);
    if (error) {
      logger.error("[AdminSiteContent] load failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al cargar" }, { status: 500 });
    }
    let careers = DEFAULT_CAREERS;
    let historia = DEFAULT_HISTORIA;
    for (const row of data || []) {
      if (row.key === "careers" && row.value) careers = { ...DEFAULT_CAREERS, ...row.value };
      if (row.key === "historia_stats" && row.value) historia = { ...DEFAULT_HISTORIA, ...row.value };
    }
    return NextResponse.json({ data: { careers, historia }, error: null });
  } catch (err) {
    logger.error("[AdminSiteContent] GET error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const parsed = PatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos inválidos";
      return NextResponse.json({ data: null, error: "invalid_body", message: msg }, { status: 400 });
    }
    const { careers, historia } = parsed.data;
    if (careers && careers.photos.some((p) => !isRenderableSiteImage(p))) {
      return NextResponse.json({ data: null, error: "invalid_image_url", message: BAD_IMAGE_MESSAGE }, { status: 400 });
    }

    const service = createServiceClient();
    const rows: { key: string; value: unknown }[] = [];
    if (careers) {
      rows.push({
        key: "careers",
        value: { ...careers, form_url: careers.form_url || null },
      });
    }
    if (historia) rows.push({ key: "historia_stats", value: historia });
    if (rows.length === 0) {
      return NextResponse.json({ data: null, error: "invalid_body", message: "Nada que guardar" }, { status: 400 });
    }

    const { error } = await service.from("settings").upsert(rows, { onConflict: "key" });
    if (error) {
      logger.error("[AdminSiteContent] upsert failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al guardar" }, { status: 500 });
    }
    return NextResponse.json({ data: { saved: rows.map((r) => r.key) }, error: null, message: "Contenido guardado" });
  } catch (err) {
    logger.error("[AdminSiteContent] PATCH error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}
