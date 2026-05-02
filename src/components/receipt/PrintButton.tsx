"use client";

import { useCallback, useState } from "react";
import { Printer, Loader2 } from "lucide-react";
import type { ReceiptOrderData, ReceiptItemData } from "./OrderReceipt";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface PrintButtonProps {
  order: ReceiptOrderData;
  items: ReceiptItemData[];
  locationName: string;
  /** Optional: render as icon-only button (no text label) */
  iconOnly?: boolean;
  /** Optional: extra CSS classes on the button */
  className?: string;
}

// ═══════════════════════════════════════════════════════════════
// Helpers (duplicated from OrderReceipt to keep the print window self-contained)
// ═══════════════════════════════════════════════════════════════

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const offsetMs = -6 * 60 * 60 * 1000;
  const local = new Date(date.getTime() + offsetMs + date.getTimezoneOffset() * 60 * 1000);
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

// ═══════════════════════════════════════════════════════════════
// Receipt HTML builder — standalone HTML page for the print window
// ═══════════════════════════════════════════════════════════════

function buildReceiptHtml(
  order: ReceiptOrderData,
  items: ReceiptItemData[],
  locationName: string,
): string {
  const LINE_WIDTH = 42;
  const SEP = "=".repeat(LINE_WIDTH);
  const DASH = "-".repeat(LINE_WIDTH);

  function center(text: string): string {
    if (text.length >= LINE_WIDTH) return text;
    const pad = Math.floor((LINE_WIDTH - text.length) / 2);
    return "&nbsp;".repeat(pad) + text;
  }

  function totalLine(label: string, amount: number): string {
    const price = amount < 0 ? `-${formatMoney(Math.abs(amount))}` : formatMoney(amount);
    const spaces = LINE_WIDTH - label.length - price.length;
    return label + "&nbsp;".repeat(Math.max(1, spaces)) + price;
  }

  function itemLine(qty: number, name: string, total: number): string {
    const qtyStr = `${qty}x `;
    const price = formatMoney(total);
    const nameSpace = LINE_WIDTH - qtyStr.length - price.length - 1;
    const truncName = name.length > nameSpace ? name.slice(0, nameSpace) : name;
    const gap = LINE_WIDTH - qtyStr.length - truncName.length - price.length;
    return qtyStr + truncName + "&nbsp;".repeat(Math.max(1, gap)) + price;
  }

  const lines: string[] = [];

  lines.push(SEP);
  lines.push(center("SIMMER DOWN"));
  lines.push(center(locationName));
  lines.push(SEP);
  lines.push(`Pedido: #${order.order_number}`);
  lines.push(`Fecha: ${formatDate(order.created_at)}`);
  lines.push(`Tipo: ${orderTypeLabel(order.order_type)}`);
  lines.push(DASH);
  lines.push(`Cliente: ${order.customer_name}`);
  lines.push(`Tel: ${order.customer_phone}`);
  if (order.order_type === "delivery" && order.delivery_address) {
    lines.push(`Dir: ${order.delivery_address}`);
  }
  lines.push(SEP);
  lines.push(center("ARTICULOS"));
  lines.push(DASH);

  for (const item of items) {
    lines.push(itemLine(item.quantity, item.item_name, item.line_total));
  }

  lines.push(DASH);
  lines.push(totalLine("Subtotal:", order.subtotal));
  if (order.delivery_fee > 0) {
    lines.push(totalLine("Envio:", order.delivery_fee));
  }
  if (order.discount_amount && order.discount_amount > 0) {
    const discLabel = order.discount_code
      ? `Desc (${order.discount_code}):`
      : "Descuento:";
    lines.push(totalLine(discLabel, -order.discount_amount));
  }
  lines.push(SEP);
  lines.push(totalLine("TOTAL:", order.total_amount));
  lines.push(SEP);

  if (order.customer_notes) {
    lines.push(`Notas: ${escapeHtml(order.customer_notes)}`);
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
  <title>Pedido #${escapeHtml(order.order_number)} - Simmer Down</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.4;
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 2mm;
      background: #fff;
      color: #000;
    }
    div { white-space: pre-wrap; word-break: break-word; }
    @media print {
      @page { size: 80mm auto; margin: 0; }
      body { width: 80mm; padding: 2mm; }
    }
  </style>
</head>
<body>
${body}
<script>
  window.onload = function() {
    window.print();
    // Close after print dialog completes or is cancelled
    window.onafterprint = function() { window.close(); };
    // Fallback: close after 3 seconds if onafterprint not supported
    setTimeout(function() { window.close(); }, 3000);
  };
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export default function PrintButton({
  order,
  items,
  locationName,
  iconOnly = false,
  className = "",
}: PrintButtonProps) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = useCallback(() => {
    setPrinting(true);

    try {
      const html = buildReceiptHtml(order, items, locationName);
      const printWindow = window.open("", "_blank", "width=320,height=600");

      if (!printWindow) {
        console.error("[PrintButton] No se pudo abrir la ventana de impresion. Verifica que los pop-ups esten habilitados.");
        setPrinting(false);
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      console.error("[PrintButton]", error);
    } finally {
      // Reset printing state after a short delay
      setTimeout(() => setPrinting(false), 1000);
    }
  }, [order, items, locationName]);

  const baseClasses = iconOnly
    ? "p-2 hover:bg-[#3D3936] transition"
    : "flex items-center gap-2 px-4 py-2 bg-[#252320] border border-[#3D3936] hover:bg-[#3D3936] transition text-[#B8B0A8] hover:text-[#FFF8F0] text-sm font-medium";

  return (
    <button
      onClick={handlePrint}
      disabled={printing}
      className={`${baseClasses} disabled:opacity-50 ${className}`}
      title="Imprimir Ticket"
      aria-label="Imprimir Ticket"
    >
      {printing ? (
        <Loader2 className="w-4 h-4 animate-spin text-[#6B6560]" />
      ) : (
        <Printer className="w-4 h-4 text-[#6B6560]" />
      )}
      {!iconOnly && <span>Imprimir Ticket</span>}
    </button>
  );
}
