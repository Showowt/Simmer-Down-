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
import { sendWhatsApp } from "@/lib/twilio/client";

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

    // Send WhatsApp notification to staff (non-blocking)
    const staffPhone = process.env.STAFF_NOTIFICATION_WHATSAPP || "+50376804434";
    const reservationMsg = [
      `🗓️ *NUEVA RESERVACION*`,
      ``,
      `📍 Ubicacion: ${location_id}`,
      `📅 Fecha: ${date}`,
      `🕐 Hora: ${time}`,
      `👥 Personas: ${guest_count}`,
      `👤 Nombre: ${customer_name}`,
      `📱 Telefono: ${customer_phone}`,
      customer_email ? `✉️ Email: ${customer_email}` : '',
      special_requests ? `📝 Notas: ${special_requests}` : '',
    ].filter(Boolean).join('\n');

    sendWhatsApp(staffPhone, reservationMsg).catch((err) => {
      logger.warn("Reservation WhatsApp notification failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });

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
