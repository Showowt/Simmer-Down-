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

  const url = new URL(request.url);
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  // If ?msg=TEXT, send custom message to group
  const customMsg = url.searchParams.get("msg");
  if (customMsg && chatId) {
    const msgRes = await fetch(`${API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: customMsg,
        disable_web_page_preview: false,
      }),
    });
    const msgData = await msgRes.json();
    return NextResponse.json({ action: "sendMessage", result: msgData });
  }

  // If ?test=true, send a test command response
  if (url.searchParams.get("test") === "true") {
    if (!chatId) return NextResponse.json({ error: "No TELEGRAM_CHAT_ID" });
    const testRes = await fetch(`${API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🤖 Bot test: /menu command works!\n\nMENU SIMMER DOWN\nhttps://simmerdownsv.com/carta",
        disable_web_page_preview: true,
      }),
    });
    const testData = await testRes.json();
    return NextResponse.json({ action: "testMessage", chatId, result: testData });
  }

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
