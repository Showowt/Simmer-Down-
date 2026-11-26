/**
 * POST /api/admin/advent/upload — signed upload slot for a drawer image.
 * Body: { day: 1-12, contentType: image/jpeg | image/png | image/webp }
 * → { path, token }. The browser uploads straight to the private `advent`
 * bucket with uploadToSignedUrl (no 4.5 MB Vercel body limit), then saves
 * the path with PATCH /api/admin/advent. The bucket itself enforces 5 MB
 * and the three image types.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminRequest } from "@/lib/advent-server";
import { ADVENT_BUCKET, ADVENT_IMAGE_TYPES, adventImageExt } from "@/lib/advent";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  day: z.number().int().min(1).max(12),
  contentType: z.enum(ADVENT_IMAGE_TYPES),
});

function fail(status: number, error: string, message: string): NextResponse {
  return NextResponse.json({ data: null, error, message }, { status });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isAdminRequest())) return fail(401, "unauthorized", "Sesión expirada o sin permiso.");
  const rl = checkRateLimit(`admin_advent_upload:${getClientIp(request)}`, { maxRequests: 30, windowMs: 60_000 });
  if (!rl.success) return fail(429, "rate_limited", "Demasiadas solicitudes. Espera un momento.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_body", "Datos inválidos.");
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return fail(400, "invalid_body", "Usa una imagen JPG, PNG o WebP.");
  const { day, contentType } = parsed.data;

  try {
    const path = `day-${day}/${crypto.randomUUID()}.${adventImageExt(contentType)}`;
    const service = createServiceClient();
    const { data, error } = await service.storage.from(ADVENT_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error("no upload url");
    return NextResponse.json({ data: { path: data.path, token: data.token }, error: null, message: "ok" });
  } catch (error) {
    logger.error("[api/admin/advent/upload]", error);
    return fail(500, "server_error", "No se pudo preparar la subida.");
  }
}
