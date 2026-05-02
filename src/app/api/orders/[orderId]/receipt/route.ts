/**
 * GET /api/orders/[orderId]/receipt
 *
 * Returns a standalone, printable HTML receipt page for a given order.
 * Staff can bookmark this URL to print receipts from any device:
 *   simmerdownsv.com/api/orders/ORDER_ID/receipt
 *
 * The page:
 * - Auto-triggers window.print() on load
 * - Is formatted for Epson TM-20 thermal printers (80mm paper)
 * - Works without JavaScript (pure HTML/CSS content, JS only triggers print)
 * - All text in Spanish
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

interface OrderItemRow {
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format ISO date string to DD/MM/YYYY HH:MM in El Salvador timezone (UTC-6).
 */
function formatDateSV(isoString: string): string {
  const date = new Date(isoString);
  const offsetMs = -6 * 60 * 60 * 1000;
  const local = new Date(
    date.getTime() + offsetMs + date.getTimezoneOffset() * 60 * 1000,
  );
  const dd = String(local.getDate()).padStart(2, "0");
  const mm = String(local.getMonth() + 1).padStart(2, "0");
  const yyyy = local.getFullYear();
  const hh = String(local.getHours()).padStart(2, "0");
  const min = String(local.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function orderTypeLabel(orderType: string): string {
  switch (orderType) {
    case "delivery":
      return "DELIVERY";
    case "pickup":
      return "PARA RECOGER";
    case "dine_in":
      return "EN MESA";
    default:
      return orderType.toUpperCase();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ═══════════════════════════════════════════════════════════════
// Receipt HTML builder
// ═══════════════════════════════════════════════════════════════

const LINE_WIDTH = 42;
const SEP = "=".repeat(LINE_WIDTH);
const DASH = "-".repeat(LINE_WIDTH);

function center(text: string): string {
  if (text.length >= LINE_WIDTH) return text;
  const pad = Math.floor((LINE_WIDTH - text.length) / 2);
  return "&nbsp;".repeat(pad) + escapeHtml(text);
}

function totalLine(label: string, amount: number): string {
  const price =
    amount < 0 ? `-${formatMoney(Math.abs(amount))}` : formatMoney(amount);
  const spaces = LINE_WIDTH - label.length - price.length;
  return escapeHtml(label) + "&nbsp;".repeat(Math.max(1, spaces)) + price;
}

function itemLine(qty: number, name: string, total: number): string {
  const qtyStr = `${qty}x `;
  const price = formatMoney(total);
  const nameSpace = LINE_WIDTH - qtyStr.length - price.length - 1;
  const truncName = name.length > nameSpace ? name.slice(0, nameSpace) : name;
  const gap =
    LINE_WIDTH - qtyStr.length - truncName.length - price.length;
  return (
    escapeHtml(qtyStr + truncName) +
    "&nbsp;".repeat(Math.max(1, gap)) +
    price
  );
}

interface ReceiptData {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  orderType: string;
  deliveryAddress: string | null;
  customerNotes: string | null;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  discountCode: string | null;
  totalAmount: number;
  locationName: string;
  items: OrderItemRow[];
}

function buildReceiptPage(data: ReceiptData): string {
  const lines: string[] = [];

  lines.push(SEP);
  lines.push(center("SIMMER DOWN"));
  lines.push(center(data.locationName));
  lines.push(SEP);
  lines.push(`Pedido: #${escapeHtml(data.orderNumber)}`);
  lines.push(`Fecha: ${formatDateSV(data.createdAt)}`);
  lines.push(`Tipo: ${orderTypeLabel(data.orderType)}`);
  lines.push(DASH);
  lines.push(`Cliente: ${escapeHtml(data.customerName)}`);
  lines.push(`Tel: ${escapeHtml(data.customerPhone)}`);
  if (data.orderType === "delivery" && data.deliveryAddress) {
    lines.push(`Dir: ${escapeHtml(data.deliveryAddress)}`);
  }
  lines.push(SEP);
  lines.push(center("ARTICULOS"));
  lines.push(DASH);

  for (const item of data.items) {
    lines.push(itemLine(item.quantity, item.item_name, item.line_total));
  }

  lines.push(DASH);
  lines.push(totalLine("Subtotal:", data.subtotal));
  if (data.deliveryFee > 0) {
    lines.push(totalLine("Envio:", data.deliveryFee));
  }
  if (data.discountAmount > 0) {
    const discLabel = data.discountCode
      ? `Desc (${data.discountCode}):`
      : "Descuento:";
    lines.push(totalLine(discLabel, -data.discountAmount));
  }
  lines.push(SEP);
  lines.push(totalLine("TOTAL:", data.totalAmount));
  lines.push(SEP);

  if (data.customerNotes) {
    lines.push(`Notas: ${escapeHtml(data.customerNotes)}`);
    lines.push(SEP);
  }

  lines.push(center("Gracias por tu pedido!"));
  lines.push(center("www.simmerdownsv.com"));
  lines.push(SEP);

  const body = lines.map((l) => `<div>${l}</div>`).join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pedido #${escapeHtml(data.orderNumber)} - Simmer Down</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.4;
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 4mm 2mm;
      background: #fff;
      color: #000;
    }
    div {
      white-space: pre-wrap;
      word-break: break-word;
    }
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        width: 80mm;
        padding: 2mm;
      }
    }
    /* Screen-only: subtle styling for when viewed in browser */
    @media screen {
      body {
        margin: 20px auto;
        padding: 16px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
    }
  </style>
</head>
<body>
${body}
<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  };
</script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// GET handler
// ═══════════════════════════════════════════════════════════════

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const { orderId } = await context.params;

  // Validate UUID format
  const uuidResult = z
    .string()
    .uuid("ID de pedido invalido")
    .safeParse(orderId);
  if (!uuidResult.success) {
    return new Response(
      errorPage("ID de pedido invalido", "El enlace no es correcto."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  try {
    const supabase = createServiceClient();

    // Fetch order with location name via join
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        created_at,
        customer_name,
        customer_phone,
        order_type,
        delivery_address_line1,
        delivery_address_line2,
        delivery_city,
        customer_notes,
        subtotal,
        delivery_fee,
        discount_amount,
        discount_code,
        total_amount,
        location_id,
        locations!orders_location_id_fkey ( name )
      `,
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      console.error("[receipt/route]", orderError);
      return new Response(
        errorPage(
          "Pedido no encontrado",
          "No se encontro un pedido con ese ID.",
        ),
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("item_name, quantity, unit_price, line_total")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("[receipt/route] items error", itemsError);
    }

    // Build delivery address from parts
    const addressParts = [
      order.delivery_address_line1,
      order.delivery_address_line2,
      order.delivery_city,
    ].filter(Boolean);
    const deliveryAddress =
      addressParts.length > 0 ? addressParts.join(", ") : null;

    // Extract location name from joined data.
    // Supabase returns the join as an array (FK is not unique) or object.
    const locationRaw = order.locations as
      | { name: string }
      | { name: string }[]
      | null;
    const locationName = Array.isArray(locationRaw)
      ? (locationRaw[0]?.name ?? "Simmer Down")
      : (locationRaw?.name ?? "Simmer Down");

    const html = buildReceiptPage({
      orderNumber: order.order_number,
      createdAt: order.created_at ?? new Date().toISOString(),
      customerName: order.customer_name ?? "Cliente",
      customerPhone: order.customer_phone ?? "",
      orderType: order.order_type,
      deliveryAddress,
      customerNotes: order.customer_notes ?? null,
      subtotal: order.subtotal ?? 0,
      deliveryFee: order.delivery_fee ?? 0,
      discountAmount: order.discount_amount ?? 0,
      discountCode: order.discount_code ?? null,
      totalAmount: order.total_amount ?? 0,
      locationName,
      items: (items as OrderItemRow[]) ?? [],
    });

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[receipt/route] Unexpected error", error);
    return new Response(
      errorPage(
        "Error del servidor",
        "No se pudo generar el ticket. Intenta de nuevo.",
      ),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// Error page template
// ═══════════════════════════════════════════════════════════════

function errorPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Error - Simmer Down</title>
  <style>
    body {
      font-family: 'Courier New', Courier, monospace;
      max-width: 400px;
      margin: 40px auto;
      padding: 20px;
      text-align: center;
      color: #333;
    }
    h1 { font-size: 18px; margin-bottom: 10px; }
    p { font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(message)}</p>
</body>
</html>`;
}
