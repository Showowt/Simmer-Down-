/**
 * POST /api/diagnostics/test-notify
 * Sends a test notification to Telegram and WhatsApp.
 * Protected by header. DELETE THIS AFTER DEBUGGING.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendTelegram } from "@/lib/telegram";
import { sendWhatsApp } from "@/lib/twilio/client";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = request.headers.get("x-diag-key");
  if (auth !== "simmer-check-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Replicate exact reservation message format
  const reservationMsg = [
    `\uD83D\uDDD3\uFE0F *NUEVA RESERVACION*`,
    ``,
    `\uD83D\uDCCD Ubicaci\u00F3n: Surf City`,
    `\uD83D\uDCC5 Fecha: 2026-07-09`,
    `\uD83D\uDD50 Hora: 13:00`,
    `\uD83D\uDC65 Personas: 2`,
    ``,
    `\uD83D\uDC64 Nombre: Tino sosa`,
    `\uD83D\uDCDE Tel\u00E9fono: +50360095229`,
    ``,
    `\u2705 Estado: Confirmada`,
    `\uD83C\uDF10 https://simmerdownsv.com/admin/orders`,
  ].join('\n');

  const telegramResult = await sendTelegram(reservationMsg);

  const whatsappNumber = process.env.STAFF_NOTIFICATION_WHATSAPP || "+50375764655";
  const whatsappResult = await sendWhatsApp(whatsappNumber, "Test de notificacion WhatsApp desde simmerdownsv.com");

  return NextResponse.json({
    telegram: telegramResult,
    whatsapp: whatsappResult,
    timestamp: new Date().toISOString(),
  });
}
