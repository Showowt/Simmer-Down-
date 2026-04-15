import { createHmac, timingSafeEqual } from "node:crypto";

import type { DeliveryAdapter, NormalizedDeliveryOrder } from "../types";

/**
 * Hugo App (El Salvador / Central America) webhook adapter.
 * Partner API shape varies; this is a best-effort normalizer.
 */

interface HugoPayload {
  order_id?: string | number;
  branch_id?: string;
  client?: { name?: string; phone?: string; email?: string };
  address?: { reference?: string; city?: string; notes?: string };
  products?: Array<{
    id?: string | number;
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
  }>;
  subtotal?: number;
  delivery?: number;
  total?: number;
  type?: "delivery" | "pickup";
  comment?: string;
}

export const hugoAdapter: DeliveryAdapter = {
  provider: "hugo",

  verify(headers: Headers, rawBody: string): boolean {
    const secret = process.env.HUGO_WEBHOOK_SECRET;
    if (!secret) return false;
    const sig = headers.get("x-hugo-signature");
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
    const body = JSON.parse(rawBody) as HugoPayload;
    const items = (body.products ?? []).map((it) => ({
      name: it.name ?? "Unknown item",
      description: it.description ?? null,
      unitPrice: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      externalId: it.id ? String(it.id) : null,
    }));

    return {
      provider: "hugo",
      externalOrderId: String(body.order_id ?? "unknown"),
      locationSlug: body.branch_id,
      customer: {
        name: body.client?.name ?? "Hugo Customer",
        phone: body.client?.phone ?? null,
        email: body.client?.email ?? null,
      },
      orderType: body.type === "pickup" ? "pickup" : "delivery",
      deliveryAddress:
        body.type !== "pickup"
          ? {
              line1: body.address?.reference ?? "",
              city: body.address?.city ?? null,
              notes: body.address?.notes ?? null,
            }
          : null,
      items,
      subtotal:
        body.subtotal ?? items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      deliveryFee: body.delivery ?? 0,
      total: body.total ?? (body.subtotal ?? 0) + (body.delivery ?? 0),
      notes: body.comment ?? null,
      raw: body,
    };
  },
};
