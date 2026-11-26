/**
 * POST /api/gift-cards/create — start a gift card purchase.
 * Body: { amount, recipientName, senderName, message?, buyerName, buyerPhone }
 * → { success, orderId, orderNumber, amount }
 *
 * Creates the gift_card_purchases row (who it's for, the message) and a
 * PENDING order for exactly that amount. Nothing is issued here: the card is
 * created by the database when the bank approves (orders → 'confirmed'
 * trigger → issue_gift_card), the same certified path as tickets. The buyer
 * then pays with /api/payments/initiate like any other order.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { GIFT_CARD_MAX, GIFT_CARD_MESSAGE_MAX, GIFT_CARD_MIN, giftMoney } from "@/lib/gift-cards";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const name = (label: string) =>
  z.string().trim().min(1, `${label} requerido`).max(80, `${label} demasiado largo`);

const bodySchema = z.object({
  amount: z
    .number()
    .int("Monto en dólares enteros")
    .min(GIFT_CARD_MIN, `Mínimo $${GIFT_CARD_MIN}`)
    .max(GIFT_CARD_MAX, `Máximo $${GIFT_CARD_MAX}`),
  recipientName: name("Nombre de quien recibe"),
  senderName: name("Nombre de quien regala"),
  message: z.string().trim().max(GIFT_CARD_MESSAGE_MAX, "Mensaje demasiado largo").optional(),
  buyerName: z.string().trim().min(2, "Nombre requerido").max(120),
  // El Salvador phone — same shape as ticket checkout.
  buyerPhone: z
    .string()
    .trim()
    .regex(/^(\+?503)?[\s-]?\d{4}[\s-]?\d{4}$/, "Teléfono inválido (XXXX-XXXX)"),
});

function fail(status: number, error: string, message: string) {
  return NextResponse.json({ success: false, error, message }, { status });
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(`giftcard_create:${getClientIp(request)}`, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse(rl);

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return fail(400, "invalid_json", "Solicitud inválida.");
  }
  if (!parsed.success) {
    return fail(400, "validation", parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }
  const { amount, recipientName, senderName, message, buyerName, buyerPhone } = parsed.data;

  const supabase = createServiceClient();
  let purchaseId: string | null = null;
  try {
    // Orders require a location: the first (flagship) one, as ticket orders do.
    const { data: loc, error: locErr } = await supabase
      .from("locations")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (locErr) throw locErr;
    if (!loc?.id) return fail(500, "no_location", "Configuración incompleta.");

    const { data: purchase, error: pErr } = await supabase
      .from("gift_card_purchases")
      .insert({
        amount,
        recipient_name: recipientName,
        sender_name: senderName,
        message: message ? message : null,
      })
      .select("id")
      .single();
    if (pErr || !purchase) throw pErr ?? new Error("purchase insert returned nothing");
    purchaseId = String(purchase.id);

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        location_id: loc.id,
        order_type: "pickup",
        status: "pending",
        customer_name: buyerName,
        customer_phone: buyerPhone,
        subtotal: amount,
        total_amount: amount,
        order_source: "website",
        gift_card_purchase_id: purchaseId,
        customer_notes: `Gift Card ${giftMoney(amount)} — Para: ${recipientName} · De: ${senderName}`.slice(0, 500),
      })
      .select("id, order_number")
      .single();
    if (oErr || !order) throw oErr ?? new Error("order insert returned nothing");

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      amount,
    });
  } catch (error) {
    logger.error("[gift-cards/create]", error);
    if (purchaseId) {
      const { error: cleanErr } = await supabase.from("gift_card_purchases").delete().eq("id", purchaseId);
      if (cleanErr) logger.error("[gift-cards/create] cleanup purchase failed", cleanErr.message);
    }
    return fail(500, "internal", "No se pudo iniciar la compra. Intenta de nuevo.");
  }
}
