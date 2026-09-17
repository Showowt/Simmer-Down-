/**
 * Room bookings API — estadía reservation requests (public)
 *
 * POST /api/room-bookings
 *   Validates + guards against date-range double-booking, inserts a
 *   `pending` request, and notifies staff (Telegram + the venue WhatsApp).
 *   Reserve-request model: staff confirm and collect payment at check-in.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { roomBookingSchema, formatZodErrors, validationErrorResponse } from "@/lib/validation";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { sendTelegram, resolveLocationName } from "@/lib/telegram";
import { sendWhatsApp } from "@/lib/twilio/client";
import { LOCATIONS } from "@/lib/data";
import { nightsBetween, rangesOverlap, ACTIVE_ROOM_STATUSES } from "@/lib/rooms";
import logger from "@/lib/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`room-bookings:${clientIp}`, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit) as NextResponse;
  }

  try {
    const parsed = roomBookingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return validationErrorResponse(formatZodErrors(parsed.error)) as NextResponse;
    }

    const {
      location_id,
      room_id,
      check_in,
      check_out,
      guest_count,
      customer_name,
      customer_phone,
      customer_email,
      special_requests,
    } = parsed.data;

    const supabase = createServiceClient();

    // 1. Room must exist for this venue, be active, and fit the party
    const { data: room, error: roomErr } = await supabase
      .from("guest_rooms")
      .select("id, name_es, name, capacity, is_active")
      .eq("id", room_id)
      .eq("location_id", location_id)
      .single();

    if (roomErr || !room) {
      return NextResponse.json(
        { success: false, error: "La habitación seleccionada no es válida. / Invalid room." },
        { status: 400 },
      );
    }
    if (!room.is_active) {
      return NextResponse.json(
        { success: false, error: "Esa habitación no está disponible. / That room is unavailable." },
        { status: 409 },
      );
    }
    if (guest_count > (room.capacity as number)) {
      return NextResponse.json(
        { success: false, error: "La habitación no admite ese número de huéspedes. / Room capacity exceeded." },
        { status: 409 },
      );
    }

    // 2. No overlapping active booking for the same room
    const { data: overlaps, error: ovErr } = await supabase
      .from("room_bookings")
      .select("check_in, check_out")
      .eq("room_id", room_id)
      .in("status", ACTIVE_ROOM_STATUSES)
      .lt("check_in", check_out)
      .gt("check_out", check_in);

    if (!ovErr && overlaps && overlaps.length > 0) {
      const conflict = overlaps.some(
        (b) =>
          typeof b.check_in === "string" &&
          typeof b.check_out === "string" &&
          rangesOverlap(check_in, check_out, b.check_in, b.check_out),
      );
      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Esa habitación ya está reservada para esas fechas. Elige otras fechas u otra habitación. / That room is already booked for those dates.",
          },
          { status: 409 },
        );
      }
    }

    const nights = nightsBetween(check_in, check_out);

    // 3. Insert the pending request
    let insertedId: string | undefined;
    const { data: inserted, error: insErr } = await supabase
      .from("room_bookings")
      .insert([
        {
          room_id,
          location_id,
          check_in,
          check_out,
          nights,
          guest_count,
          customer_name,
          customer_phone,
          customer_email: customer_email || null,
          special_requests: special_requests || null,
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (insErr) {
      logger.warn("Room booking insert failed", { error: insErr.message });
      return NextResponse.json(
        { success: false, error: "No se pudo registrar la solicitud. Intenta de nuevo." },
        { status: 500 },
      );
    }
    insertedId = inserted?.id;

    // 4. Notify staff
    const locName = resolveLocationName(location_id);
    const roomName = (room.name_es as string) || (room.name as string);
    const safe = (s: string) => s.replace(/[_*`\[\]]/g, "");

    const tgMsg = [
      "🏨 *NUEVA SOLICITUD DE ESTADÍA*",
      "",
      `📍 ${locName}`,
      `🛏️ Habitación: ${safe(roomName)}`,
      `📅 Entrada: ${check_in}`,
      `📅 Salida: ${check_out} (${nights} noche${nights === 1 ? "" : "s"})`,
      `👥 Huéspedes: ${guest_count}`,
      "",
      `👤 ${safe(customer_name)}`,
      `📞 ${safe(customer_phone)}`,
      customer_email ? `✉️ ${safe(customer_email)}` : "",
      special_requests ? `\n📝 ${safe(special_requests)}` : "",
      "",
      "⏳ Estado: Pendiente de confirmar",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await sendTelegram(tgMsg);
    } catch (err) {
      logger.warn("Room booking Telegram failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const locationData = LOCATIONS.find((l) => l.id === location_id);
    if (locationData?.whatsapp) {
      const waMsg = [
        "🏨 NUEVA SOLICITUD DE ESTADÍA",
        "",
        `📍 ${locName}`,
        `🛏️ Habitación: ${roomName}`,
        `📅 Entrada: ${check_in}`,
        `📅 Salida: ${check_out} (${nights} noche${nights === 1 ? "" : "s"})`,
        `👥 Huéspedes: ${guest_count}`,
        "",
        `👤 ${customer_name}`,
        `📞 ${customer_phone}`,
        customer_email ? `✉️ ${customer_email}` : "",
        special_requests ? `\n📝 ${special_requests}` : "",
        "",
        "⏳ Pendiente de confirmar",
      ]
        .filter(Boolean)
        .join("\n");
      try {
        await sendWhatsApp(locationData.whatsapp, waMsg);
      } catch (err) {
        logger.warn("Room booking WhatsApp failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: insertedId, room: roomName, check_in, check_out, nights, status: "pending" },
      message:
        "Solicitud recibida. Te contactaremos para confirmar tu estadía. / Request received — we'll contact you to confirm.",
    });
  } catch (error) {
    logger.warn("Room booking endpoint error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
