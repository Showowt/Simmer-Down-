"use client";

import { useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface ReceiptOrderData {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  delivery_address?: string;
  customer_notes?: string;
  subtotal: number;
  delivery_fee: number;
  discount_amount?: number;
  discount_code?: string;
  total_amount: number;
}

export interface ReceiptItemData {
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderReceiptProps {
  order: ReceiptOrderData;
  items: ReceiptItemData[];
  locationName: string;
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/** Format a number as $X.XX */
function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format ISO date string to DD/MM/YYYY HH:MM in El Salvador timezone (UTC-6).
 * Uses manual offset to avoid locale/Intl inconsistencies on the server.
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  // El Salvador is UTC-6 year-round (no DST)
  const offsetMs = -6 * 60 * 60 * 1000;
  const local = new Date(date.getTime() + offsetMs + date.getTimezoneOffset() * 60 * 1000);

  const dd = String(local.getDate()).padStart(2, "0");
  const mm = String(local.getMonth() + 1).padStart(2, "0");
  const yyyy = local.getFullYear();
  const hh = String(local.getHours()).padStart(2, "0");
  const min = String(local.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

/** Translate order_type to Spanish display text */
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

/**
 * Right-pad/truncate a string to a fixed width.
 * Used to align receipt columns within the 42-char constraint.
 */
function padRight(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return str + " ".repeat(len - str.length);
}

// ═══════════════════════════════════════════════════════════════
// Receipt line constants (80mm ~ 42 chars in monospace at 12px)
// ═══════════════════════════════════════════════════════════════
const LINE_WIDTH = 42;
const SEPARATOR = "=".repeat(LINE_WIDTH);
const DASH_LINE = "-".repeat(LINE_WIDTH);

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export default function OrderReceipt({ order, items, locationName }: OrderReceiptProps) {
  const receiptLines = useMemo(() => {
    const lines: string[] = [];

    // Header
    lines.push(SEPARATOR);
    lines.push(centerText("SIMMER DOWN"));
    lines.push(centerText(locationName));
    lines.push(SEPARATOR);

    // Order info
    lines.push(`Pedido: #${order.order_number}`);
    lines.push(`Fecha: ${formatDate(order.created_at)}`);
    lines.push(`Tipo: ${orderTypeLabel(order.order_type)}`);
    lines.push(DASH_LINE);

    // Customer info
    lines.push(`Cliente: ${order.customer_name}`);
    lines.push(`Tel: ${order.customer_phone}`);
    if (order.order_type === "delivery" && order.delivery_address) {
      lines.push(`Dir: ${order.delivery_address}`);
    }

    // Items header
    lines.push(SEPARATOR);
    lines.push(centerText("ARTICULOS"));
    lines.push(DASH_LINE);

    // Item lines
    for (const item of items) {
      const qty = `${item.quantity}x `;
      const price = formatMoney(item.line_total);
      // Available space for name: LINE_WIDTH - qty.length - price.length - 1 (gap)
      const nameSpace = LINE_WIDTH - qty.length - price.length - 1;
      const name = item.item_name.length > nameSpace
        ? item.item_name.slice(0, nameSpace)
        : item.item_name;

      const leftPart = qty + padRight(name, nameSpace);
      lines.push(leftPart + " " + price);
    }

    // Totals
    lines.push(DASH_LINE);
    lines.push(formatTotalLine("Subtotal:", order.subtotal));

    if (order.delivery_fee > 0) {
      lines.push(formatTotalLine("Envio:", order.delivery_fee));
    }

    if (order.discount_amount && order.discount_amount > 0) {
      const discountLabel = order.discount_code
        ? `Desc (${order.discount_code}):`
        : "Descuento:";
      lines.push(formatTotalLine(discountLabel, -order.discount_amount));
    }

    lines.push(SEPARATOR);
    lines.push(formatTotalLine("TOTAL:", order.total_amount));
    lines.push(SEPARATOR);

    // Notes
    if (order.customer_notes) {
      lines.push(`Notas: ${order.customer_notes}`);
      lines.push(SEPARATOR);
    }

    // Footer
    lines.push(centerText("Gracias por tu pedido!"));
    lines.push(centerText("www.simmerdownsv.com"));
    lines.push(SEPARATOR);

    return lines;
  }, [order, items, locationName]);

  return (
    <>
      {/* Print-only CSS — @media print shows only [data-receipt] */}
      <style>{`
        @media print {
          /* Hide everything */
          body * {
            visibility: hidden !important;
          }
          /* Show only the receipt */
          [data-receipt],
          [data-receipt] * {
            visibility: visible !important;
          }
          [data-receipt] {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 2mm !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div
        data-receipt
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "12px",
          lineHeight: "1.4",
          width: "80mm",
          maxWidth: "80mm",
          margin: "0 auto",
          padding: "4mm 2mm",
          backgroundColor: "#ffffff",
          color: "#000000",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {receiptLines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Text formatting helpers
// ═══════════════════════════════════════════════════════════════

function centerText(text: string): string {
  if (text.length >= LINE_WIDTH) return text;
  const padding = Math.floor((LINE_WIDTH - text.length) / 2);
  return " ".repeat(padding) + text;
}

function formatTotalLine(label: string, amount: number): string {
  const price = amount < 0 ? `-${formatMoney(Math.abs(amount))}` : formatMoney(amount);
  return padRight(label, LINE_WIDTH - price.length) + price;
}
