import { createHmac, timingSafeEqual } from "node:crypto";

import type { DeliveryAdapter, NormalizedDeliveryOrder } from "../types";

/**
 * PedidosYa (largest Central-Am delivery platform) webhook adapter.
 * Docs vary by partner agreement — this is a best-effort normalizer.
 */

interface PedidosYaPayload {
  orderId?: string | number;
  storeId?: string;
  customer?: { name?: string; phone?: string; email?: string };
  address?: { street?: string; city?: string; notes?: string };
  items?: Array<{
    id?: string | number;
    name?: string;
    notes?: string;
    price?: number;
    quantity?: number;
  }>;
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  deliveryType?: "delivery" | "pickup";
  notes?: string;
}

export const pedidosYaAdapter: DeliveryAdapter = {
  provider: "pedidos_ya",

  verify(headers: Headers, rawBody: string): boolean {
    const secret = process.env.PEDIDOS_YA_WEBHOOK_SECRET;
    if (!secret) return false;
    const sig = headers.get("x-pedidosya-signature");
    if (!sig) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    try {
      const a = Buffer.from(sig, "utf8");
      const b = Buffer.from(expected, "utf8");
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  },

  normalize(rawBody: string): NormalizedDeliveryOrder {
    const body = JSON.parse(rawBody) as PedidosYaPayload;
    const items = (body.items ?? []).map((it) => ({
      name: it.name ?? "Unknown item",
      description: it.notes ?? null,
      unitPrice: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      externalId: it.id ? String(it.id) : null,
    }));

    return {
      provider: "pedidos_ya",
      externalOrderId: String(body.orderId ?? "unknown"),
      locationSlug: body.storeId,
      customer: {
        name: body.customer?.name ?? "PedidosYa Customer",
        phone: body.customer?.phone ?? null,
        email: body.customer?.email ?? null,
      },
      orderType: body.deliveryType === "pickup" ? "pickup" : "delivery",
      deliveryAddress:
        body.deliveryType !== "pickup"
          ? {
              line1: body.address?.street ?? "",
              city: body.address?.city ?? null,
              notes: body.address?.notes ?? null,
            }
          : null,
      items,
      subtotal:
        body.subtotal ?? items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      deliveryFee: body.deliveryFee ?? 0,
      total:
        body.total ??
        (body.subtotal ?? 0) + (body.deliveryFee ?? 0),
      notes: body.notes ?? null,
      raw: body,
    };
  },
};
