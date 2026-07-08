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

  const telegramResult = await sendTelegram("Test de notificacion desde simmerdownsv.com - " + new Date().toISOString());

  const whatsappNumber = process.env.STAFF_NOTIFICATION_WHATSAPP || "+50375764655";
  const whatsappResult = await sendWhatsApp(whatsappNumber, "Test de notificacion WhatsApp desde simmerdownsv.com");

  return NextResponse.json({
    telegram: telegramResult,
    whatsapp: whatsappResult,
    timestamp: new Date().toISOString(),
  });
}
