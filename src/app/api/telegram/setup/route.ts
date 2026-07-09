/**
 * GET /api/telegram/setup — Check webhook status
 * POST /api/telegram/setup — Register/fix webhook
 * Protected by header. Remove after setup confirmed.
 */
import { NextRequest, NextResponse } from "next/server";

const API = "https://api.telegram.org/bot";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get("x-setup-key") !== "simmer-setup-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" });

  // Get current webhook info
  const res = await fetch(`${API}${token}/getWebhookInfo`);
  const info = await res.json();

  // Get bot info
  const meRes = await fetch(`${API}${token}/getMe`);
  const me = await meRes.json();

  return NextResponse.json({
    bot: me.result ? { username: me.result.username, id: me.result.id } : me,
    webhook: info.result || info,
    configuredChatId: chatId,
    expectedUrl: "https://simmerdownsv.com/api/telegram/webhook",
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get("x-setup-key") !== "simmer-setup-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" });
  if (!secret) return NextResponse.json({ error: "TELEGRAM_WEBHOOK_SECRET not set" });

  const webhookUrl = "https://simmerdownsv.com/api/telegram/webhook";

  const res = await fetch(`${API}${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message"],
    }),
  });

  const result = await res.json();
  return NextResponse.json({ action: "setWebhook", url: webhookUrl, result });
}
