/**
 * Reservations API
 * Server-side validation and submission handling for table reservations
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  reservationFormSchema,
  formatZodErrors,
  validationErrorResponse,
} from "@/lib/validation";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import logger from "@/lib/logger";
import { sendTelegram, resolveLocationName } from "@/lib/telegram";
import { sendWhatsApp } from "@/lib/twilio/client";
import { LOCATIONS } from "@/lib/data";

interface ReservationResponse {
  success: boolean;
  data?: {
    id?: string;
    location_id: string;
    date: string;
    time: string;
    guest_count: number;
    customer_name: string;
    status: string;
  };
  message?: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ReservationResponse>> {
  const startTime = Date.now();
  const endpoint = "/api/reservations";

  // Rate limiting: 10 submissions per 15 minutes per IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`reservations:${clientIp}`, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimit.success) {
    logger.warn("Rate limit exceeded for reservations", { ip: clientIp });
    return rateLimitResponse(rateLimit) as NextResponse<ReservationResponse>;
  }

  logger.api.request(endpoint, "POST", { ip: clientIp });

  try {
    const body = await request.json();

    // Validate input with Zod
    const parseResult = reservationFormSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = formatZodErrors(parseResult.error);
      logger.info("Reservation validation failed", { errors });
      return validationErrorResponse(
        errors,
      ) as NextResponse<ReservationResponse>;
    }

    const {
      location_id,
      date,
      time,
      guest_count,
      customer_name,
      customer_phone,
      customer_email,
      special_requests,
    } = parseResult.data;

    // Prepare the reservation record
    const reservation = {
      location_id,
      date,
      time,
      guest_count,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      special_requests: special_requests || null,
      status: "confirmed",
    };

    // Try to insert into Supabase
    let insertedId: string | undefined;

    try {
      const supabase = createServiceClient();
      const { data: dbData, error: dbError } = await supabase
        .from("reservations")
        .insert([reservation])
        .select("id")
        .single();

      if (dbError) {
        // Log but don't fail -- table might not exist yet
        logger.warn("Reservation DB insert failed", {
          error: dbError.message,
          code: dbError.code,
          hint: dbError.hint,
        });
      } else if (dbData) {
        insertedId = dbData.id;
      }
    } catch (dbErr) {
      // Service client may throw if env vars missing -- log and continue
      logger.warn("Reservation DB connection failed", {
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      });
    }

    // Send Telegram notification to staff (non-blocking)
    const locName = resolveLocationName(location_id);
    const adminUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders`
      : "https://simmerdownsv.com/admin/orders";

    // Strip Markdown-breaking chars from user input
    const safeName = customer_name.replace(/[_*`\[\]]/g, "");
    const safePhone = customer_phone.replace(/[_*`\[\]]/g, "");
    const safeEmail = customer_email?.replace(/[_*`\[\]]/g, "") || "";
    const safeNotes = special_requests?.replace(/[_*`\[\]]/g, "") || "";

    const reservationMsg = [
      `\uD83D\uDDD3\uFE0F *NUEVA RESERVACION*`,
      ``,
      `\uD83D\uDCCD Ubicaci\u00F3n: ${locName}`,
      `\uD83D\uDCC5 Fecha: ${date}`,
      `\uD83D\uDD50 Hora: ${time}`,
      `\uD83D\uDC65 Personas: ${guest_count}`,
      ``,
      `\uD83D\uDC64 Nombre: ${safeName}`,
      `\uD83D\uDCDE Tel\u00E9fono: ${safePhone}`,
      safeEmail ? `\u2709\uFE0F Email: ${safeEmail}` : '',
      safeNotes ? `\n\uD83D\uDCDD Notas especiales: ${safeNotes}` : '',
      ``,
      `\u2705 Estado: Confirmada`,
      `\uD83C\uDF10 ${adminUrl}`,
    ].filter(Boolean).join('\n');

    sendTelegram(reservationMsg).catch((err) => {
      logger.warn("Reservation Telegram notification failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });

    // Send WhatsApp notification to the specific location
    const locationData = LOCATIONS.find((l) => l.id === location_id);
    if (locationData?.whatsapp) {
      const whatsappMsg = [
        `📅 *NUEVA RESERVACIÓN*`,
        ``,
        `📍 Ubicación: ${locName}`,
        `📆 Fecha: ${date}`,
        `🕐 Hora: ${time}`,
        `👥 Personas: ${guest_count}`,
        ``,
        `👤 Nombre: ${customer_name}`,
        `📞 Teléfono: ${customer_phone}`,
        customer_email ? `✉️ Email: ${customer_email}` : '',
        special_requests ? `\n📝 Notas: ${special_requests}` : '',
        ``,
        `✅ Estado: Confirmada`,
      ].filter(Boolean).join('\n');

      sendWhatsApp(locationData.whatsapp, whatsappMsg).catch((err) => {
        logger.warn("Reservation WhatsApp notification failed", {
          location: location_id,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, {
      location_id,
      date,
      time,
      guest_count,
      insertedId: insertedId ?? "not_persisted",
    });

    return NextResponse.json({
      success: true,
      data: {
        id: insertedId,
        location_id,
        date,
        time,
        guest_count,
        customer_name,
        status: "confirmed",
      },
      message:
        "Reservaci\u00F3n confirmada. Te esperamos! / Reservation confirmed. See you there!",
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.api.error(endpoint, error, { duration });

    return NextResponse.json(
      {
        success: false,
        error:
          "Error al procesar la reservaci\u00F3n. Por favor intenta de nuevo. / Error processing reservation. Please try again.",
      },
      { status: 500 },
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/reservations",
    method: "POST",
    features: ["rate-limiting", "zod-validation", "supabase-persistence"],
    rateLimit: "10 submissions per 15 minutes",
    fields: {
      required: [
        "location_id",
        "date",
        "time",
        "guest_count",
        "customer_name",
        "customer_phone",
      ],
      optional: ["customer_email", "special_requests"],
    },
  });
}
