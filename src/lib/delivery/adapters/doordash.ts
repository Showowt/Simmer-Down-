import { createHmac, timingSafeEqual } from "node:crypto";

import type { DeliveryAdapter, NormalizedDeliveryOrder } from "../types";

/**
 * DoorDash webhook adapter (Drive / Marketplace).
 *
 * DoorDash signs webhook bodies with HMAC-SHA256; signature in
 * `x-doordash-signature`. See:
 *   https://developer.doordash.com/en-US/docs/drive/reference/webhooks/
 */

interface DoorDashPayload {
  event_name?: string;
  order?: {
    external_delivery_id?: string;
    external_store_id?: string;
    customer?: { first_name?: string; last_name?: string; phone_number?: string; email?: string };
    dropoff_address?: { street?: string; city?: string; subpremise?: string };
    order_items?: Array<{
      id?: string;
      name?: string;
      description?: string;
      quantity?: number;
      unit_price_monetary_fields?: { unit_amount?: number; currency?: string };
    }>;
    order_value_monetary_fields?: { unit_amount?: number; currency?: string };
    delivery_fee_monetary_fields?: { unit_amount?: number; currency?: string };
    subtotal_monetary_fields?: { unit_amount?: number; currency?: string };
    fulfillment_type?: "delivery" | "pickup";
    pickup_instructions?: string;
  };
}

function cents(n?: number): number {
  if (!n || !Number.isFinite(n)) return 0;
  return n / 100;
}

export const doorDashAdapter: DeliveryAdapter = {
  provider: "doordash",

  verify(headers: Headers, rawBody: string): boolean {
    const secret = process.env.DOORDASH_WEBHOOK_SECRET;
    if (!secret) return false;
    const sig = headers.get("x-doordash-signature");
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
    const body = JSON.parse(rawBody) as DoorDashPayload;
    const o = body.order ?? {};
    const firstName = o.customer?.first_name ?? "";
    const lastName = o.customer?.last_name ?? "";

    const items = (o.order_items ?? []).map((it) => ({
      name: it.name ?? "Unknown item",
      description: it.description ?? null,
      unitPrice: cents(it.unit_price_monetary_fields?.unit_amount),
      quantity: it.quantity ?? 1,
      externalId: it.id ?? null,
    }));

    const subtotal = cents(o.subtotal_monetary_fields?.unit_amount);
    const deliveryFee = cents(o.delivery_fee_monetary_fields?.unit_amount);
    const total = cents(o.order_value_monetary_fields?.unit_amount);

    return {
      provider: "doordash",
      externalOrderId: o.external_delivery_id ?? "unknown",
      locationSlug: o.external_store_id,
      customer: {
        name: `${firstName} ${lastName}`.trim() || "DoorDash Customer",
        phone: o.customer?.phone_number ?? null,
        email: o.customer?.email ?? null,
      },
      orderType: o.fulfillment_type === "pickup" ? "pickup" : "delivery",
      deliveryAddress:
        o.fulfillment_type === "delivery"
          ? {
              line1: o.dropoff_address?.street ?? "",
              city: o.dropoff_address?.city ?? null,
              notes: o.dropoff_address?.subpremise ?? null,
            }
          : null,
      items,
      subtotal: subtotal || items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      deliveryFee,
      total: total || subtotal + deliveryFee,
      notes: o.pickup_instructions ?? null,
      raw: body,
    };
  },
};
