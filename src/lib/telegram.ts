/**
 * Telegram Bot notification client for Simmer Down SV.
 *
 * Requires two env vars:
 *   TELEGRAM_BOT_TOKEN  — from @BotFather
 *   TELEGRAM_CHAT_ID    — group chat or individual chat ID
 */

import logger from "@/lib/logger";

const API_BASE = "https://api.telegram.org/bot";

interface TelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

/**
 * Send a Markdown-formatted message to the Telegram group.
 */
export async function sendTelegram(
  message: string,
  chatId?: string,
): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const targetChat = chatId || process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !targetChat) {
    logger.warn("Telegram not configured — missing env vars", {
      hasToken: !!token,
      hasChatId: !!targetChat,
    });
    return { success: false, error: "Telegram not configured" };
  }

  try {
    // Try with Markdown first
    const res = await fetch(`${API_BASE}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChat,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      // If Markdown parsing failed, retry WITHOUT parse_mode (plain text)
      if (data.error_code === 400 && data.description?.includes("parse")) {
        logger.warn("Telegram Markdown parse failed, retrying as plain text", {
          error: data.description,
        });
        const plainRes = await fetch(`${API_BASE}${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChat,
            text: message.replace(/[*_`\[\]]/g, ""),
            disable_web_page_preview: true,
          }),
        });
        const plainData = await plainRes.json();
        if (plainData.ok) {
          return { success: true, messageId: plainData.result?.message_id };
        }
        logger.warn("Telegram plain text send also failed", {
          error: plainData.description,
        });
        return { success: false, error: plainData.description };
      }

      logger.warn("Telegram send failed", {
        error: data.description,
        errorCode: data.error_code,
      });
      return { success: false, error: data.description };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn("Telegram network error", { error: msg });
    return { success: false, error: msg };
  }
}

// ═══════════════════════════════════════════════════════════════
// Location slug → display name mapping
// ═══════════════════════════════════════════════════════════════

const LOCATION_NAMES: Record<string, string> = {
  "santa-ana": "Santa Ana",
  "lago-coatepeque": "Lago de Coatepeque",
  coatepeque: "Lago de Coatepeque",
  "san-benito": "San Benito",
  "surf-city": "Surf City",
  "simmer-garden": "Simmer Garden (Juayua)",
  juayua: "Simmer Garden (Juayua)",
};

/** Resolve a location slug or UUID to a display name. Falls back to the raw value. */
export function resolveLocationName(locationId: string): string {
  return LOCATION_NAMES[locationId] || locationId;
}

// ═══════════════════════════════════════════════════════════════
// Order status labels (Spanish)
// ═══════════════════════════════════════════════════════════════

const STATUS_LABELS: Record<string, { emoji: string; label: string }> = {
  pending: { emoji: "\u23F3", label: "Pendiente" },
  confirmed: { emoji: "\u2705", label: "Confirmado" },
  preparing: { emoji: "\uD83D\uDC68\u200D\uD83C\uDF73", label: "En Preparaci\u00F3n" },
  ready: { emoji: "\uD83C\uDF1F", label: "Listo para Entregar" },
  out_for_delivery: { emoji: "\uD83D\uDE9A", label: "En Camino" },
  completed: { emoji: "\uD83C\uDF89", label: "Completado" },
  cancelled: { emoji: "\u274C", label: "Cancelado" },
  refunded: { emoji: "\uD83D\uDCB8", label: "Reembolsado" },
};

export function getStatusDisplay(status: string): { emoji: string; label: string } {
  return STATUS_LABELS[status] || { emoji: "\u2753", label: status };
}

// ═══════════════════════════════════════════════════════════════
// Pre-built notification templates
// ═══════════════════════════════════════════════════════════════

/** Notify group when order status changes (staff action) */
export async function notifyOrderStatusChange(params: {
  orderNumber: string;
  customerName: string;
  newStatus: string;
  locationName?: string;
  total?: number;
  updatedBy?: string;
}): Promise<TelegramResult> {
  const { emoji, label } = getStatusDisplay(params.newStatus);
  const adminUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders`
    : "https://simmerdownsv.com/admin/orders";

  const lines = [
    `${emoji} *PEDIDO ACTUALIZADO*`,
    ``,
    `\uD83D\uDCCB Pedido: #${params.orderNumber}`,
    `\uD83D\uDC64 Cliente: ${params.customerName}`,
    params.locationName ? `\uD83D\uDCCD Ubicaci\u00F3n: ${params.locationName}` : null,
    `\uD83D\uDD04 Nuevo estado: *${label}*`,
    params.total ? `\uD83D\uDCB0 Total: $${params.total.toFixed(2)}` : null,
    params.updatedBy ? `\uD83D\uDC64 Por: ${params.updatedBy}` : null,
    ``,
    `\uD83C\uDF10 ${adminUrl}`,
  ];

  return sendTelegram(lines.filter((l) => l !== null).join("\n"));
}

/** Notify group when a customer cancels their order */
export async function notifyOrderCancelled(params: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  locationName?: string;
}): Promise<TelegramResult> {
  const adminUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders`
    : "https://simmerdownsv.com/admin/orders";

  const lines = [
    `\u274C *PEDIDO CANCELADO POR CLIENTE*`,
    ``,
    `\uD83D\uDCCB Pedido: #${params.orderNumber}`,
    `\uD83D\uDC64 Cliente: ${params.customerName}`,
    `\uD83D\uDCDE Tel\u00E9fono: ${params.customerPhone}`,
    params.locationName ? `\uD83D\uDCCD Ubicaci\u00F3n: ${params.locationName}` : null,
    `\uD83D\uDCB0 Total perdido: $${params.total.toFixed(2)}`,
    ``,
    `\u26A0\uFE0F Si ya se empez\u00F3 a preparar, contactar al cliente.`,
    `\uD83C\uDF10 ${adminUrl}`,
  ];

  return sendTelegram(lines.filter((l) => l !== null).join("\n"));
}

/** Notify group of a failed payment */
export async function notifyPaymentFailed(params: {
  orderNumber: string;
  customerName: string;
  total: number;
  reason?: string;
}): Promise<TelegramResult> {
  const lines = [
    `\u26A0\uFE0F *PAGO FALLIDO*`,
    ``,
    `\uD83D\uDCCB Pedido: #${params.orderNumber}`,
    `\uD83D\uDC64 Cliente: ${params.customerName}`,
    `\uD83D\uDCB0 Monto: $${params.total.toFixed(2)}`,
    params.reason ? `\uD83D\uDCDD Raz\u00F3n: ${params.reason}` : null,
    ``,
    `\u274C NO preparar este pedido hasta confirmar pago.`,
  ];

  return sendTelegram(lines.filter((l) => l !== null).join("\n"));
}

/** Notify group of a new contact form submission */
export async function notifyContactForm(params: {
  name: string;
  email: string;
  phone?: string;
  reason?: string;
  message: string;
}): Promise<TelegramResult> {
  const lines = [
    `\u2709\uFE0F *NUEVO MENSAJE DE CONTACTO*`,
    ``,
    `\uD83D\uDC64 Nombre: ${params.name}`,
    `\u2709\uFE0F Email: ${params.email}`,
    params.phone ? `\uD83D\uDCDE Tel\u00E9fono: ${params.phone}` : null,
    params.reason ? `\uD83D\uDCCB Asunto: ${params.reason}` : null,
    ``,
    `\uD83D\uDCDD Mensaje:`,
    params.message.length > 500 ? params.message.slice(0, 500) + "..." : params.message,
    ``,
    `\u2197\uFE0F Responder dentro de 24 horas.`,
  ];

  return sendTelegram(lines.filter((l) => l !== null).join("\n"));
}
