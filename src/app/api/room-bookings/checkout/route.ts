/**
 * Room bookings — ONLINE CARD checkout (public)
 *
 * POST /api/room-bookings/checkout
 *   Pay-now path for estadía. Unlike /api/room-bookings (the WhatsApp
 *   reserve-request), this:
 *     1. sweeps abandoned card holds (pending_payment older than 15 min),
 *     2. creates the booking as `pending_payment` so the room is RESERVED
 *        during the 3DS window (the DB exclusion constraint makes a race loser
 *        fail here, before any money moves),
 *     3. creates an `orders` row linked by room_booking_id and returns its id.
 *   The caller then runs the CERTIFIED /api/payments/initiate → 3DS →
 *   /api/payments/callback flow unchanged. On ISO 00 the callback flips the
 *   order to 'confirmed', and on_order_confirmed_confirm_booking promotes the
 *   booking pending_payment → confirmed (migration 20261002).
 *
 * Online pay REQUIRES a published nightly rate — we never charge an amount the
 * room has not quoted. Rooms with no rate fall back to the WhatsApp request.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { roomBookingSchema, formatZodErrors, validationErrorResponse } from "@/lib/validation";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import {
  nightsBetween,
  rangesOverlap,
  computeStayTotal,
  isUndefinedColumn,
  ACTIVE_ROOM_STATUSES,
  HOLD_EXPIRY_MINUTES,
} from "@/lib/rooms";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const RETRY_ERROR =
  "No se pudo procesar la solicitud. Intenta de nuevo. / Could not process the request. Please try again.";
const TAKEN_ERROR =
  "Esa habitación ya está reservada para esas fechas. Elige otras fechas u otra habitación. / That room is already booked for those dates.";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`room-bookings-checkout:${clientIp}`, {
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

    // 0. Free abandoned card holds so a dropped 3DS never locks a room.
    try {
      const cutoff = new Date(Date.now() - HOLD_EXPIRY_MINUTES * 60 * 1000).toISOString();
      await supabase
        .from("room_bookings")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("status", "pending_payment")
        .lt("created_at", cutoff);
    } catch (err) {
      // Non-fatal: the exclusion constraint still prevents a real double-book.
      logger.warn("[RoomCheckout] stale-hold sweep failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // 1. Room must exist for this venue, be active, and fit the party.
    const { data: room, error: roomErr } = await supabase
      .from("guest_rooms")
      .select("id, name_es, name, capacity, is_active, price_per_night")
      .eq("id", room_id)
      .eq("location_id", location_id)
      .single();

    if (roomErr && roomErr.code !== "PGRST116") {
      logger.error("[RoomCheckout] room lookup failed", roomErr);
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

    const nights = nightsBetween(check_in, check_out);
    const pricePerNight =
      typeof room.price_per_night === "number" ? room.price_per_night : null;
    const totalAmount = computeStayTotal(pricePerNight, nights);

    // 2. Online pay needs a real, positive amount — never charge a guess.
    if (pricePerNight == null || totalAmount == null || totalAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Esta habitación no tiene tarifa en línea. Solicítala por WhatsApp. / This room has no online rate — request it by WhatsApp.",
        },
        { status: 409 },
      );
    }

    // 3. Friendly overlap pre-check (the exclusion constraint is the authority).
    const { data: overlaps, error: ovErr } = await supabase
      .from("room_bookings")
      .select("check_in, check_out")
      .eq("room_id", room_id)
      .in("status", ACTIVE_ROOM_STATUSES)
      .lt("check_in", check_out)
      .gt("check_out", check_in);

    if (ovErr) {
      logger.error("[RoomCheckout] overlap guard query failed", ovErr);
      return NextResponse.json({ success: false, error: RETRY_ERROR }, { status: 500 });
    }
    const conflict = (overlaps ?? []).some(
      (b) =>
        typeof b.check_in === "string" &&
        typeof b.check_out === "string" &&
        rangesOverlap(check_in, check_out, b.check_in, b.check_out),
    );
    if (conflict) {
      return NextResponse.json({ success: false, error: TAKEN_ERROR }, { status: 409 });
    }

    // Resolve the location UUID for the order. orders.location_id is a UUID,
    // but estadía's location key ('lago-coatepeque') is a slug — resolve it via
    // the same name lookup the food order route uses (DB slug is 'coatepeque').
    // room_bookings keeps the text slug.
    const LODGING_LOCATION_NAMES: Record<string, string> = {
      "lago-coatepeque": "Lago de Coatepeque",
    };
    const { data: loc, error: locErr } = await supabase
      .from("locations")
      .select("id")
      .ilike("name", `%${LODGING_LOCATION_NAMES[location_id] ?? location_id}%`)
      .limit(1)
      .maybeSingle();
    if (locErr || !loc?.id) {
      logger.error("[RoomCheckout] location uuid lookup failed", locErr);
      return NextResponse.json({ success: false, error: RETRY_ERROR }, { status: 500 });
    }
    const orderLocationId = loc.id as string;

    // 4. Create the HOLD (reserves the room during 3DS).
    const holdRow = {
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
      status: "pending_payment",
    };

    let { data: booking, error: bookErr } = await supabase
      .from("room_bookings")
      .insert([{ ...holdRow, price_per_night: pricePerNight, total_amount: totalAmount }])
      .select("id")
      .single();

    if (isUndefinedColumn(bookErr)) {
      // Price columns (20260920c) absent — keep the hold, amount still rides the order.
      logger.warn("[RoomCheckout] price columns missing; migration 20260920c pending");
      ({ data: booking, error: bookErr } = await supabase
        .from("room_bookings")
        .insert([holdRow])
        .select("id")
        .single());
    }

    if (bookErr) {
      // 23P01 exclusion / 23505 unique → lost the race for these dates.
      if (bookErr.code === "23P01" || bookErr.code === "23505") {
        return NextResponse.json({ success: false, error: TAKEN_ERROR }, { status: 409 });
      }
      logger.error("[RoomCheckout] hold insert failed", bookErr);
      return NextResponse.json({ success: false, error: RETRY_ERROR }, { status: 500 });
    }
    const bookingId: string | undefined = booking?.id;
    if (!bookingId) {
      return NextResponse.json({ success: false, error: RETRY_ERROR }, { status: 500 });
    }

    // 5. Create the ORDER the certified payment rail will charge.
    const roomName = (room.name_es as string) || (room.name as string);
    const notes =
      `Estadía: ${roomName} · ${check_in}→${check_out} (${nights} noche${nights === 1 ? "" : "s"}) · ` +
      `${guest_count} huésped${guest_count === 1 ? "" : "es"}` +
      (special_requests ? ` · ${special_requests}` : "");

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert([
        {
          location_id: orderLocationId,
          order_type: "pickup",
          status: "pending",
          customer_name,
          customer_phone,
          customer_email: customer_email || null,
          subtotal: totalAmount,
          total_amount: totalAmount,
          order_source: "website",
          room_booking_id: bookingId,
          customer_notes: notes,
        },
      ])
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      // Roll back the hold so it does not reserve a room with no order behind it.
      logger.error("[RoomCheckout] order insert failed; rolling back hold", orderErr);
      await supabase.from("room_bookings").delete().eq("id", bookingId);
      return NextResponse.json(
        { success: false, error: "No se pudo crear el pedido. / Could not create the order." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      bookingId,
      room: roomName,
      check_in,
      check_out,
      nights,
      total: totalAmount,
    });
  } catch (error) {
    logger.error("[RoomCheckout] endpoint error", error);
    return NextResponse.json({ success: false, error: RETRY_ERROR }, { status: 500 });
  }
}
