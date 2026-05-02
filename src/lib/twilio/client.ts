/**
 * Twilio WhatsApp Client — Direct REST API (no SDK dependency)
 *
 * Sends WhatsApp messages via Twilio's Messages API using fetch().
 * All failures are graceful — never throws, always returns a result object.
 */

import logger from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface TwilioMessageResponse {
  sid: string;
  status: string;
  error_code: number | null;
  error_message: string | null;
}

// ═══════════════════════════════════════════════════════════════
// Client
// ═══════════════════════════════════════════════════════════════

/**
 * Send a WhatsApp message via Twilio REST API.
 *
 * @param to - Recipient phone number in E.164 format (e.g. "+50376804434")
 * @param body - Message text (supports WhatsApp markdown: *bold*, _italic_)
 * @returns Result object — never throws
 */
export async function sendWhatsApp(
  to: string,
  body: string,
): Promise<SendWhatsAppResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

  // Validate configuration
  if (!accountSid || !authToken || !whatsappFrom) {
    logger.warn("Twilio not configured — missing env vars", {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasWhatsappFrom: !!whatsappFrom,
    });
    return { success: false, error: "Twilio not configured" };
  }

  // Normalize recipient — ensure whatsapp: prefix
  const toWhatsApp = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  // Build request
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
    "base64",
  );

  const formBody = [
    `From=${encodeURIComponent(whatsappFrom)}`,
    `To=${encodeURIComponent(toWhatsApp)}`,
    `Body=${encodeURIComponent(body)}`,
  ].join("&");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
    });

    const data = (await response.json()) as TwilioMessageResponse;

    if (!response.ok) {
      logger.warn("Twilio API error", {
        status: response.status,
        errorCode: data.error_code,
        errorMessage: data.error_message,
        to: toWhatsApp,
      });
      return {
        success: false,
        error: data.error_message || `HTTP ${response.status}`,
      };
    }

    logger.info("WhatsApp message sent", {
      messageId: data.sid,
      to: toWhatsApp,
      status: data.status,
    });

    return { success: true, messageId: data.sid };
  } catch (err) {
    logger.error("WhatsApp send failed", err, { to: toWhatsApp });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
