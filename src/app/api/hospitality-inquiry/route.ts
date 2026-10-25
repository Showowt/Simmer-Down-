/**
 * POST /api/hospitality-inquiry
 *
 * Events / catering lead capture for the Hospitality page. Writes to the same
 * `contact_submissions` table the admin "Consultas" view reads, tagged in
 * `meta` so hospitality leads are distinguishable (kind='hospitality') and
 * carry the structured event fields. Fires a Telegram ping to the ops group.
 *
 * NOTE: contact_submissions has NO `status` column — status lives in `meta`
 * (that's what /admin/inquiries reads). We insert meta.status='new'.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiClient } from "@/lib/supabase/api";
import { formatZodErrors, validationErrorResponse } from "@/lib/validation";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { notifyContactForm } from "@/lib/telegram";
import logger from "@/lib/logger";

interface InquiryResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const EVENT_TYPES = [
  "cumpleanos",
  "empresa",
  "aniversario",
  "catering",
  "boda",
  "lago",
  "otro",
] as const;

const EVENT_TYPE_LABEL: Record<(typeof EVENT_TYPES)[number], string> = {
  cumpleanos: "Cumpleaños",
  empresa: "Evento de empresa",
  aniversario: "Aniversario / Celebración",
  catering: "Catering",
  boda: "Boda",
  lago: "Experiencia en el Lago",
  otro: "Otro",
};

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Nombre requerido").max(120),
  phone: z.string().trim().min(6, "Teléfono requerido").max(40),
  email: z.string().trim().email("Correo inválido").max(160).optional().or(z.literal("")),
  eventType: z.enum(EVENT_TYPES),
  venue: z.string().trim().max(60).optional().or(z.literal("")),
  eventDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .optional()
    .or(z.literal("")),
  guests: z.coerce.number().int().min(1).max(100000).optional(),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function POST(request: NextRequest): Promise<NextResponse<InquiryResponse>> {
  const startTime = Date.now();
  const endpoint = "/api/hospitality-inquiry";

  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`hospitality:${clientIp}`, {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit) as NextResponse<InquiryResponse>;
  }

  try {
    const parsed = inquirySchema.safeParse(await request.json());
    if (!parsed.success) {
      return validationErrorResponse(
        formatZodErrors(parsed.error),
      ) as NextResponse<InquiryResponse>;
    }

    const { name, phone, email, eventType, venue, eventDate, guests, message } = parsed.data;
    const typeLabel = EVENT_TYPE_LABEL[eventType];
    const cleanEmail = email ? email : null;
    const subject = `Evento: ${typeLabel}${venue ? ` · ${venue}` : ""}`;

    const detailLines = [
      `Tipo: ${typeLabel}`,
      venue ? `Sucursal: ${venue}` : null,
      eventDate ? `Fecha: ${eventDate}` : null,
      guests ? `Invitados: ${guests}` : null,
      `Teléfono: ${phone}`,
      "",
      message ? message : "(sin mensaje adicional)",
    ].filter((l): l is string => l !== null);
    const fullMessage = detailLines.join("\n");

    const supabase = createApiClient();
    const { error: dbError } = await supabase.from("contact_submissions").insert([
      {
        name,
        email: cleanEmail,
        phone,
        subject,
        message: fullMessage,
        meta: {
          status: "new",
          kind: "hospitality",
          event_type: eventType,
          event_type_label: typeLabel,
          venue: venue || null,
          event_date: eventDate || null,
          guests: guests ?? null,
        },
      },
    ]);

    if (dbError) {
      logger.api.error(endpoint, dbError, { code: dbError.code });
      return NextResponse.json(
        { success: false, error: "No pudimos guardar tu solicitud. Intenta de nuevo." },
        { status: 500 },
      );
    }

    // Non-blocking ops notification.
    notifyContactForm({
      name,
      email: cleanEmail ?? "—",
      phone,
      reason: subject,
      message: fullMessage,
    }).catch((err) => {
      logger.warn("Hospitality inquiry Telegram notification failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });

    logger.api.response(endpoint, 200, Date.now() - startTime, { eventType });
    return NextResponse.json({
      success: true,
      message: "¡Recibido! Nuestro equipo te contactará muy pronto.",
    });
  } catch (error) {
    logger.api.error(endpoint, error, { duration: Date.now() - startTime });
    return NextResponse.json(
      { success: false, error: "Error al enviar la solicitud. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
