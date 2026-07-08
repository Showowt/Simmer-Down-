/**
 * GET /api/diagnostics/notifications
 * Reports which notification services are configured (no values exposed).
 * Protected by a simple secret header.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Simple protection — require a header
  const auth = request.headers.get("x-diag-key");
  if (auth !== "simmer-check-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const check = (name: string) => {
    const val = process.env[name]?.trim();
    return val ? `SET (${val.length} chars)` : "MISSING";
  };

  return NextResponse.json({
    telegram: {
      TELEGRAM_BOT_TOKEN: check("TELEGRAM_BOT_TOKEN"),
      TELEGRAM_CHAT_ID: check("TELEGRAM_CHAT_ID"),
      TELEGRAM_WEBHOOK_SECRET: check("TELEGRAM_WEBHOOK_SECRET"),
    },
    twilio: {
      TWILIO_ACCOUNT_SID: check("TWILIO_ACCOUNT_SID"),
      TWILIO_AUTH_TOKEN: check("TWILIO_AUTH_TOKEN"),
      TWILIO_WHATSAPP_FROM: check("TWILIO_WHATSAPP_FROM"),
    },
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL: check("NEXT_PUBLIC_SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: check("SUPABASE_SERVICE_ROLE_KEY"),
    },
    app: {
      NEXT_PUBLIC_APP_URL: check("NEXT_PUBLIC_APP_URL"),
      STAFF_NOTIFICATION_WHATSAPP: check("STAFF_NOTIFICATION_WHATSAPP"),
    },
  });
}
