/**
 * Order Notification Formatters — WhatsApp Messages
 *
 * Formats order and payment data into clean WhatsApp-compatible messages
 * for staff notifications. All text in Spanish.
 */

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface OrderForNotification {
  order_number: string;
  order_type: "delivery" | "pickup";
  customer_name: string;
  customer_phone: string;
  customer_notes?: string | null;
  subtotal: number;
  delivery_fee: number;
  discount_amount?: number | null;
  discount_code?: string | null;
  total_amount: number;
  delivery_address_line1?: string | null;
  delivery_city?: string | null;
}

interface OrderItemForNotification {
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface PaymentForNotification {
  order_number: string;
  total_amount: number;
  payment_method?: string | null;
  card_brand?: string | null;
  card_last_four?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// Formatters
// ═══════════════════════════════════════════════════════════════

/**
 * Format a new order notification for WhatsApp.
 */
export function formatOrderWhatsApp(
  order: OrderForNotification,
  items: OrderItemForNotification[],
  locationName: string,
): string {
  const orderTypeLabel =
    order.order_type === "delivery" ? "Delivery" : "Para recoger";

  // Build items list
  const itemLines = items
    .map(
      (item) =>
        `\u2022 ${item.quantity}x ${item.item_name} \u2014 $${item.line_total.toFixed(2)}`,
    )
    .join("\n");

  // Build address line for delivery
  const addressLine =
    order.order_type === "delivery" && order.delivery_address_line1
      ? `\n\ud83d\udccd Direcci\u00f3n: ${order.delivery_address_line1}${order.delivery_city ? `, ${order.delivery_city}` : ""}`
      : "";

  // Build discount line
  const discountLine =
    order.discount_amount && order.discount_amount > 0
      ? `\n\ud83c\udf81 Descuento${order.discount_code ? ` (${order.discount_code})` : ""}: -$${order.discount_amount.toFixed(2)}`
      : "";

  // Build notes line
  const notesLine =
    order.customer_notes && order.customer_notes.trim()
      ? `\n\n\ud83d\udcdd Notas: ${order.customer_notes}`
      : "";

  const adminUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders`
    : "https://simmerdownsv.com/admin/orders";

  return [
    `\ud83d\udd14 *NUEVO PEDIDO WEB*`,
    ``,
    `\ud83d\udccb Pedido: #${order.order_number}`,
    `\ud83d\udccd Ubicaci\u00f3n: ${locationName}`,
    `\ud83d\udd50 Tipo: ${orderTypeLabel}${addressLine}`,
    ``,
    `\ud83d\udc64 Cliente: ${order.customer_name}`,
    `\ud83d\udcde Tel\u00e9fono: ${order.customer_phone}`,
    ``,
    `\ud83c\udf55 *Art\u00edculos:*`,
    itemLines,
    ``,
    `\ud83d\udcb0 Subtotal: $${order.subtotal.toFixed(2)}`,
    order.delivery_fee > 0
      ? `\ud83d\ude9a Delivery: $${order.delivery_fee.toFixed(2)}`
      : null,
    discountLine || null,
    `\ud83d\udcb0 *Total: $${order.total_amount.toFixed(2)}*`,
    notesLine || null,
    ``,
    `\ud83c\udf10 Ver en admin: ${adminUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * Format a payment confirmation notification for WhatsApp.
 */
export function formatPaymentConfirmWhatsApp(
  payment: PaymentForNotification,
): string {
  // Build payment method description
  let methodDescription = "Tarjeta";
  if (payment.card_brand && payment.card_last_four) {
    methodDescription = `Tarjeta ${payment.card_brand} \u00b7\u00b7\u00b7\u00b7${payment.card_last_four}`;
  } else if (payment.payment_method) {
    methodDescription = payment.payment_method;
  }

  return [
    `\u2705 *PAGO CONFIRMADO*`,
    ``,
    `Pedido #${payment.order_number} \u2014 $${payment.total_amount.toFixed(2)}`,
    `M\u00e9todo: ${methodDescription}`,
    `Estado: Pagado \u2705`,
    ``,
    `El pedido pasa a preparaci\u00f3n.`,
  ].join("\n");
}
