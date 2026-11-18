/**
 * Admin site content settings (Trabaja con Nosotros, Nuestra Historia, page headings)
 *   GET   /api/admin/site-content → { careers, historia, headings }
 *   PATCH /api/admin/site-content → { careers?, historia?, heading_pages? }
 *
 * heading_pages carries ONLY the pages the editor changed, each with the copy
 * it started from ({ value, base }). The server merges those pages into the
 * stored headings and refuses (409) any page whose stored copy no longer
 * matches its base — so a second window, a phone, or a screen loaded before
 * someone else's save can't silently put old text back (Nov 17: TicketManía
 * edits were reverted a minute later by a save from an older screen).
 *
 * Backed by the settings key/value table (keys 'careers' / 'historia_stats' /
 * 'page_headings'). Auth: profile role 'admin'. Writes via service client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  DEFAULT_CAREERS,
  DEFAULT_HISTORIA,
  DEFAULT_PAGE_HEADINGS,
  HEADING_PAGE_KEYS,
  isRenderableSiteImage,
  samePageHeading,
  sanitizePageHeadings,
  type PageHeadings,
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

const HEADING_TOO_LONG = "El texto es demasiado largo (título y etiqueta: máx. 200 caracteres; subtítulo: 500).";

const HeadingSchema = z.object({
  eyebrow_es: z.string().max(200, HEADING_TOO_LONG),
  eyebrow_en: z.string().max(200, HEADING_TOO_LONG),
  title_es: z.string().max(200, HEADING_TOO_LONG),
  title_en: z.string().max(200, HEADING_TOO_LONG),
  subtitle_es: z.string().max(500, HEADING_TOO_LONG),
  subtitle_en: z.string().max(500, HEADING_TOO_LONG),
});

const HeadingsSchema = z.object({
  cortes: HeadingSchema,
  maridaje: HeadingSchema,
  hospitality: HeadingSchema,
  merch: HeadingSchema,
  events: HeadingSchema,
  trabaja: HeadingSchema,
});

const HeadingUpdateSchema = z.object({
  value: HeadingSchema,
  base: HeadingSchema,
});

const HeadingPagesSchema = z.object({
  cortes: HeadingUpdateSchema.optional(),
  maridaje: HeadingUpdateSchema.optional(),
  hospitality: HeadingUpdateSchema.optional(),
  merch: HeadingUpdateSchema.optional(),
  events: HeadingUpdateSchema.optional(),
  trabaja: HeadingUpdateSchema.optional(),
});

const PatchSchema = z.object({
  careers: CareersSchema.optional(),
  historia: HistoriaSchema.optional(),
  heading_pages: HeadingPagesSchema.optional(),
  // Editors loaded before Nov 17 send every page at once with no base copy;
  // that shape is refused below because it is what overwrote newer text.
  headings: HeadingsSchema.optional(),
});

const BAD_IMAGE_MESSAGE =
  "Las fotos deben subirse aquí (se guardan en Supabase) o ser enlaces de images.unsplash.com. / Photos must be uploaded here or be images.unsplash.com links.";

const STALE_EDITOR_MESSAGE =
  "No se guardó: el panel se actualizó. Recarga esta página del navegador y vuelve a guardar. / Not saved: the admin panel was updated — reload this page and save again.";

const CONFLICT_MESSAGE =
  "No se guardó: este encabezado se cambió desde otra ventana o teléfono mientras lo editabas. Toca «Actualizar» para ver la versión actual y vuelve a hacer tu cambio. / Not saved: this heading was changed in another window while you were editing — tap Actualizar and redo your change.";

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
      .in("key", ["careers", "historia_stats", "page_headings"]);
    if (error) {
      logger.error("[AdminSiteContent] load failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al cargar" }, { status: 500 });
    }
    let careers = DEFAULT_CAREERS;
    let historia = DEFAULT_HISTORIA;
    let headings = DEFAULT_PAGE_HEADINGS;
    for (const row of data || []) {
      if (row.key === "careers" && row.value) careers = { ...DEFAULT_CAREERS, ...row.value };
      if (row.key === "historia_stats" && row.value) historia = { ...DEFAULT_HISTORIA, ...row.value };
      if (row.key === "page_headings" && row.value) headings = sanitizePageHeadings(row.value);
    }
    return NextResponse.json({ data: { careers, historia, headings }, error: null });
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
    const { careers, historia, heading_pages: headingPages, headings: legacyHeadings } = parsed.data;
    if (legacyHeadings) {
      return NextResponse.json({ data: null, error: "stale_editor", message: STALE_EDITOR_MESSAGE }, { status: 409 });
    }
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

    let savedHeadings: PageHeadings | null = null;
    const headingUpdates = headingPages
      ? HEADING_PAGE_KEYS.flatMap((page) => {
          const update = headingPages[page];
          return update ? [{ page, value: update.value, base: update.base }] : [];
        })
      : [];
    if (headingUpdates.length > 0) {
      // Read → compare → write. Two admins saving within the same instant
      // could still race; the base check is what stops stale screens.
      const { data: stored, error: readErr } = await service
        .from("settings")
        .select("value")
        .eq("key", "page_headings")
        .maybeSingle();
      if (readErr) {
        logger.error("[AdminSiteContent] headings read failed", readErr);
        return NextResponse.json({ data: null, error: "db_error", message: "Error al guardar" }, { status: 500 });
      }
      const merged = sanitizePageHeadings(stored?.value);
      const conflicts = headingUpdates
        .filter((u) => !samePageHeading(merged[u.page], u.base))
        .map((u) => u.page);
      if (conflicts.length > 0) {
        return NextResponse.json(
          { data: { headings: merged, conflicts }, error: "conflict", message: CONFLICT_MESSAGE },
          { status: 409 },
        );
      }
      for (const u of headingUpdates) merged[u.page] = { ...u.value };
      rows.push({ key: "page_headings", value: merged });
      savedHeadings = merged;
    }

    if (rows.length === 0) {
      return NextResponse.json({ data: null, error: "invalid_body", message: "Nada que guardar" }, { status: 400 });
    }

    const { error } = await service.from("settings").upsert(rows, { onConflict: "key" });
    if (error) {
      logger.error("[AdminSiteContent] upsert failed", error);
      return NextResponse.json({ data: null, error: "db_error", message: "Error al guardar" }, { status: 500 });
    }
    return NextResponse.json({
      data: { saved: rows.map((r) => r.key), headings: savedHeadings },
      error: null,
      message: "Contenido guardado",
    });
  } catch (err) {
    logger.error("[AdminSiteContent] PATCH error", err);
    return NextResponse.json({ data: null, error: "internal", message: "Error interno" }, { status: 500 });
  }
}
