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
import { timesConflict } from "@/lib/tables";

const ACTIVE_STATUSES = ["pending", "confirmed", "seated"];

const OCCASION_LABELS: Record<string, string> = {
  cumpleanos: "Cumpleaños",
  aniversario: "Aniversario",
  cita: "Cita romántica",
  negocios: "Negocios",
  celebracion: "Celebración",
};

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
      table_id,
      zone,
      occasion,
    } = parseResult.data;

    // Known occasions get a pretty label; an unknown value still reaches ops
    // (stripped of Markdown-breaking chars) so nothing is silently dropped.
    const occasionLabel =
      OCCASION_LABELS[occasion ?? ""] ??
      (occasion ? occasion.replace(/[_*`\[\]]/g, "") : null);

    // ── Specific-table booking: validate + guard against double-booking ──
    // Resolved server-side so we can include the table in notifications and
    // reject conflicts (never trust the client's availability read).
    let resolvedTableLabel: string | null = null;
    let resolvedZone: string | null = zone ?? null;

    if (table_id) {
      try {
        const supabase = createServiceClient();

        const { data: tableRow, error: tableErr } = await supabase
          .from("restaurant_tables")
          .select(
            "id, label, zone, seats, is_blocked, is_active, venue_areas(name_es, min_party, is_active)",
          )
          .eq("id", table_id)
          .eq("location_id", location_id)
          .single();

        if (tableErr || !tableRow) {
          return NextResponse.json(
            {
              success: false,
              error:
                "La mesa seleccionada no es válida. / The selected table is invalid.",
            },
            { status: 400 },
          );
        }

        if (!tableRow.is_active || tableRow.is_blocked) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Esa mesa no está disponible. Elige otra. / That table is unavailable. Please pick another.",
            },
            { status: 409 },
          );
        }

        // PostgREST returns an embedded to-one relation as an object, but some
        // shapes come back as a 1-item array — normalise both.
        const areaRel = (tableRow as { venue_areas?: unknown }).venue_areas;
        const area = (Array.isArray(areaRel) ? areaRel[0] : areaRel) as
          | {
              name_es?: string | null;
              min_party?: number | null;
              is_active?: boolean | null;
            }
          | null
          | undefined;
        const areaName = area?.name_es || null;

        // A hidden area must not be bookable, even if a table under it is
        // still flagged active.
        if (area && area.is_active === false) {
          return NextResponse.json(
            {
              success: false,
              error: `${areaName ? `${areaName} no está` : "Esa zona no está"} disponible para reservar. Elige otra mesa. / ${areaName ?? "That area"} is not available for booking. Please pick another table.`,
            },
            { status: 409 },
          );
        }

        // Server is authoritative on capacity — the party must fit the table.
        const seats =
          typeof tableRow.seats === "number" ? tableRow.seats : null;
        if (seats !== null && guest_count > seats) {
          return NextResponse.json(
            {
              success: false,
              error: `Esa mesa es para hasta ${seats} persona${seats === 1 ? "" : "s"} y tu reservación es para ${guest_count}. Elige una mesa más grande o déjanos asignarte una al llegar. / That table seats up to ${seats} and your party is ${guest_count}. Please pick a larger table or let us assign one on arrival.`,
            },
            { status: 409 },
          );
        }

        // …and the area's minimum party size.
        const minParty =
          typeof area?.min_party === "number" ? area.min_party : null;
        if (minParty !== null && guest_count < minParty) {
          return NextResponse.json(
            {
              success: false,
              error: `${areaName ?? "Esa zona"} requiere un mínimo de ${minParty} persona${minParty === 1 ? "" : "s"} y tu reservación es para ${guest_count}. Elige otra mesa. / ${areaName ?? "That area"} requires a minimum of ${minParty} guests and your party is ${guest_count}. Please pick another table.`,
            },
            { status: 409 },
          );
        }

        const { data: sameDay, error: sameDayErr } = await supabase
          .from("reservations")
          .select("time")
          .eq("location_id", location_id)
          .eq("date", date)
          .eq("table_id", table_id)
          .in("status", ACTIVE_STATUSES);

        // FAIL CLOSED: if we cannot read the day's bookings we do not know the
        // table is free, so we must not hand it out.
        if (sameDayErr) {
          logger.error("[Reservations] Table availability check failed", sameDayErr, {
            code: sameDayErr.code,
            location_id,
            date,
            time,
            table_id,
          });
          return NextResponse.json(
            {
              success: false,
              error:
                "No pudimos confirmar la disponibilidad de la mesa. Intenta de nuevo. / We couldn't confirm the table's availability. Please try again.",
            },
            { status: 503 },
          );
        }

        const collision = (sameDay ?? []).some(
          (r) => typeof r.time === "string" && timesConflict(r.time, time),
        );
        if (collision) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Esa mesa acaba de ser reservada para ese horario. Elige otra. / That table was just booked for this time. Please pick another.",
            },
            { status: 409 },
          );
        }

        resolvedTableLabel = tableRow.label as string;
        resolvedZone = areaName || (tableRow.zone as string) || resolvedZone;
      } catch (guardErr) {
        logger.error("[Reservations] Table booking guard failed", guardErr, {
          location_id,
          date,
          time,
          table_id,
        });
        return NextResponse.json(
          {
            success: false,
            error:
              "No pudimos confirmar la mesa. Intenta de nuevo. / We couldn't confirm the table. Please try again.",
          },
          { status: 503 },
        );
      }
    }

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
      table_id: table_id || null,
      zone: resolvedZone,
      occasion: occasion || null,
      status: "confirmed",
    };

    // Persist. A failed write must NEVER be reported as a confirmed booking:
    // no row means no table, so we return an error and send NO notification.
    let insertedId: string | undefined;

    try {
      const supabase = createServiceClient();
      const { data: dbData, error: dbError } = await supabase
        .from("reservations")
        .insert([reservation])
        .select("id")
        .single();

      if (dbError) {
        // Race-proof backstop: the DB rejects an overlapping table+slot with
        // an exclusion-constraint violation (23P01) or a unique index (23505).
        // Only meaningful when a table was actually chosen — a table-less
        // reservation must never be told to "pick another table".
        if (
          table_id &&
          (dbError.code === "23P01" || dbError.code === "23505")
        ) {
          logger.error("[Reservations] Table slot taken at insert", dbError, {
            code: dbError.code,
            location_id,
            date,
            time,
            table_id,
          });
          return NextResponse.json(
            {
              success: false,
              error:
                "Esa mesa acaba de ser reservada para ese horario. Elige otra. / That table was just booked for this time. Please pick another.",
            },
            { status: 409 },
          );
        }

        logger.error("[Reservations] DB insert failed", dbError, {
          code: dbError.code,
          hint: dbError.hint,
          location_id,
          date,
          time,
        });
        return NextResponse.json(
          {
            success: false,
            error:
              "No pudimos guardar tu reservación. Por favor intenta de nuevo. / We couldn't save your reservation. Please try again.",
          },
          { status: 500 },
        );
      }

      if (!dbData?.id) {
        logger.error("[Reservations] DB insert returned no row", null, {
          location_id,
          date,
          time,
        });
        return NextResponse.json(
          {
            success: false,
            error:
              "No pudimos guardar tu reservación. Por favor intenta de nuevo. / We couldn't save your reservation. Please try again.",
          },
          { status: 500 },
        );
      }

      insertedId = dbData.id;
    } catch (dbErr) {
      // Service client throws if env vars are missing — still a lost booking.
      logger.error("[Reservations] DB connection failed", dbErr, {
        location_id,
        date,
        time,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "No pudimos guardar tu reservación. Por favor intenta de nuevo. / We couldn't save your reservation. Please try again.",
        },
        { status: 500 },
      );
    }

    // Send Telegram notification to staff (non-blocking)
    const locName = resolveLocationName(location_id);
    const adminUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/admin/reservations`
      : "https://simmerdownsv.com/admin/reservations";

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
      resolvedTableLabel
        ? `\uD83E\uDE91 Mesa: ${resolvedTableLabel}${resolvedZone ? ` (${resolvedZone})` : ""}`
        : "",
      occasionLabel ? `\uD83C\uDF89 Ocasi\u00F3n: ${occasionLabel}` : "",
      ``,
      `\uD83D\uDC64 Nombre: ${safeName}`,
      `\uD83D\uDCDE Tel\u00E9fono: ${safePhone}`,
      safeEmail ? `\u2709\uFE0F Email: ${safeEmail}` : '',
      safeNotes ? `\n\uD83D\uDCDD Notas especiales: ${safeNotes}` : '',
      ``,
      `\u2705 Estado: Confirmada`,
      `\uD83C\uDF10 ${adminUrl}`,
    ].filter(Boolean).join('\n');

    // AWAIT notifications — Vercel kills the function before fire-and-forget completes
    try {
      await sendTelegram(reservationMsg);
    } catch (err) {
      logger.warn("Reservation Telegram notification failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Send WhatsApp notification to the specific location
    const locationData = LOCATIONS.find((l) => l.id === location_id);
    if (locationData?.whatsapp) {
      const whatsappMsg = [
        `📅 NUEVA RESERVACION`,
        ``,
        `📍 Ubicacion: ${locName}`,
        `📆 Fecha: ${date}`,
        `🕐 Hora: ${time}`,
        `👥 Personas: ${guest_count}`,
        resolvedTableLabel
          ? `🪑 Mesa: ${resolvedTableLabel}${resolvedZone ? ` (${resolvedZone})` : ""}`
          : "",
        occasionLabel ? `🎉 Ocasión: ${occasionLabel}` : "",
        ``,
        `👤 Nombre: ${customer_name}`,
        `📞 Telefono: ${customer_phone}`,
        customer_email ? `✉️ Email: ${customer_email}` : '',
        special_requests ? `\n📝 Notas: ${special_requests}` : '',
        ``,
        `✅ Estado: Confirmada`,
      ].filter(Boolean).join('\n');

      try {
        await sendWhatsApp(locationData.whatsapp, whatsappMsg);
      } catch (err) {
        logger.warn("Reservation WhatsApp notification failed", {
          location: location_id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, {
      location_id,
      date,
      time,
      guest_count,
      insertedId,
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
      optional: [
        "customer_email",
        "special_requests",
        "table_id",
        "zone",
        "occasion",
      ],
    },
  });
}
