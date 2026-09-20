/**
 * Room bookings API — estadía reservation requests (public)
 *
 * POST /api/room-bookings
 *   Validates + guards against date-range double-booking, records the rate the
 *   venue publishes (read from guest_rooms — never from the client), inserts a
 *   `pending` request, and notifies staff (Telegram + the venue WhatsApp).
 *   Reserve-request model: staff confirm and collect payment at check-in.
 *
 * The overlap guard fails CLOSED: if it cannot complete, the request is
 * rejected rather than accepted into a possible double-booking.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { roomBookingSchema, formatZodErrors, validationErrorResponse } from "@/lib/validation";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { sendTelegram, resolveLocationName } from "@/lib/telegram";
import { sendWhatsApp } from "@/lib/twilio/client";
import { LOCATIONS } from "@/lib/data";
import {
  nightsBetween,
  rangesOverlap,
  computeStayTotal,
  isUndefinedColumn,
  ACTIVE_ROOM_STATUSES,
} from "@/lib/rooms";
import logger from "@/lib/logger";

const RETRY_ERROR =
  "No se pudo procesar la solicitud. Intenta de nuevo. / Could not process the request. Please try again.";

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
      .select("id, name_es, name, capacity, is_active, price_per_night")
      .eq("id", room_id)
      .eq("location_id", location_id)
      .single();

    // PGRST116 = .single() found no row → genuinely an invalid room.
    // Any other error means the guard could not complete: fail closed with a
    // retry, never tell the guest their room is invalid because the DB blipped.
    if (roomErr && roomErr.code !== "PGRST116") {
      logger.error("[RoomBookings] room lookup failed", roomErr);
      return NextResponse.json({ success: false, error: RETRY_ERROR }, { status: 500 });
    }
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

    if (ovErr) {
      // Fail closed — an unverified range must not become a confirmed stay.
      logger.error("[RoomBookings] overlap guard query failed", ovErr);
      return NextResponse.json({ success: false, error: RETRY_ERROR }, { status: 500 });
    }

    const conflict = (overlaps ?? []).some(
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

    const nights = nightsBetween(check_in, check_out);

    // 3. Price comes from the DB, never from the client
    const pricePerNight =
      typeof room.price_per_night === "number" ? room.price_per_night : null;
    const totalAmount = computeStayTotal(pricePerNight, nights);

    // 4. Insert the pending request
    const bookingRow = {
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
    };

    let { data: inserted, error: insErr } = await supabase
      .from("room_bookings")
      .insert([{ ...bookingRow, price_per_night: pricePerNight, total_amount: totalAmount }])
      .select("id")
      .single();

    if (isUndefinedColumn(insErr)) {
      // Migration 20260920c not applied yet — still take the request, minus the quote.
      logger.warn("[RoomBookings] price columns missing; migration 20260920c pending");
      ({ data: inserted, error: insErr } = await supabase
        .from("room_bookings")
        .insert([bookingRow])
        .select("id")
        .single());
    }

    if (insErr) {
      // Race-proof backstop: migration 20260920_reservation_table_integrity
      // adds an exclusion constraint on (room_id, stay range), so two guests
      // submitting the same dates within the same second lose the race here
      // rather than both being told the room is theirs.
      if (insErr.code === "23P01" || insErr.code === "23505") {
        logger.error("[RoomBookings] stay taken at insert", insErr, {
          room_id,
          check_in,
          check_out,
        });
        return NextResponse.json(
          {
            success: false,
            error:
              "Esa habitación ya está reservada para esas fechas. Elige otras fechas u otra habitación. / That room is already booked for those dates.",
          },
          { status: 409 },
        );
      }
      logger.error("[RoomBookings] insert failed", insErr);
      return NextResponse.json({ success: false, error: RETRY_ERROR }, { status: 500 });
    }
    const insertedId: string | undefined = inserted?.id;

    // 5. Notify staff
    const locName = resolveLocationName(location_id);
    const roomName = (room.name_es as string) || (room.name as string);
    const safe = (s: string) => s.replace(/[_*`\[\]]/g, "");
    const moneyLine =
      totalAmount != null && pricePerNight != null
        ? `💵 $${pricePerNight.toFixed(2)}/noche · Total: $${totalAmount.toFixed(2)}`
        : "💵 Tarifa pendiente de definir";

    const tgMsg = [
      "🏨 *NUEVA SOLICITUD DE ESTADÍA*",
      "",
      `📍 ${locName}`,
      `🛏️ Habitación: ${safe(roomName)}`,
      `📅 Entrada: ${check_in}`,
      `📅 Salida: ${check_out} (${nights} noche${nights === 1 ? "" : "s"})`,
      `👥 Huéspedes: ${guest_count}`,
      moneyLine,
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
      logger.error("[RoomBookings] Telegram notification failed", err);
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
        moneyLine,
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
        logger.error("[RoomBookings] WhatsApp notification failed", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: insertedId,
        room: roomName,
        check_in,
        check_out,
        nights,
        price_per_night: pricePerNight,
        total_amount: totalAmount,
        status: "pending",
      },
      message:
        "Solicitud recibida. Te contactaremos para confirmar tu estadía. / Request received — we'll contact you to confirm.",
    });
  } catch (error) {
    logger.error("[RoomBookings] endpoint error", error);
    return NextResponse.json({ success: false, error: RETRY_ERROR }, { status: 500 });
  }
}
