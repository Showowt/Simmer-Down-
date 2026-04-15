import { createHmac, timingSafeEqual } from "node:crypto";

import type { DeliveryAdapter, NormalizedDeliveryOrder } from "../types";

/**
 * Uber Eats webhook adapter.
 *
 * Spec: Uber signs webhook bodies with HMAC-SHA256 using a per-webhook
 * shared secret. Signature is delivered in header `x-uber-signature`.
 *
 * Payload reference: https://developer.uber.com/docs/eats/guides/webhooks
 * We handle event types "orders.notification" and "orders.cancel".
 */

interface UberEatsOrderPayload {
  event_type?: string;
  meta?: { resource_id?: string };
  resource_href?: string;
  data?: {
    id?: string;
    store?: { id?: string; name?: string };
    eater?: {
      first_name?: string;
      last_name?: string;
      phone?: string;
      email?: string;
    };
    delivery?: {
      location?: {
        street_address_line_one?: string;
        city?: string;
        notes?: string;
      };
    };
    cart?: {
      items?: Array<{
        id?: string;
        title?: string;
        special_instructions?: string;
        price?: { unit_price?: { amount_e5?: number } };
        quantity?: number;
      }>;
    };
    payment?: {
      charges?: {
        total?: { amount_e5?: number };
        sub_total?: { amount_e5?: number };
        delivery_fee?: { amount_e5?: number };
      };
    };
    type?: "DELIVERY_BY_UBER" | "PICK_UP";
  };
}

function e5ToUsd(amountE5?: number): number {
  if (!amountE5 || !Number.isFinite(amountE5)) return 0;
  return amountE5 / 1e5;
}

export const uberEatsAdapter: DeliveryAdapter = {
  provider: "uber_eats",

  verify(headers: Headers, rawBody: string): boolean {
    const secret = process.env.UBER_EATS_WEBHOOK_SECRET;
    if (!secret) return false;
    const sig = headers.get("x-uber-signature");
    if (!sig) return false;
    const expected = createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
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
    const body = JSON.parse(rawBody) as UberEatsOrderPayload;
    const d = body.data ?? {};
    const externalOrderId = d.id ?? body.meta?.resource_id ?? "unknown";
    const firstName = d.eater?.first_name ?? "";
    const lastName = d.eater?.last_name ?? "";

    const items = (d.cart?.items ?? []).map((it) => ({
      name: it.title ?? "Unknown item",
      description: it.special_instructions ?? null,
      unitPrice: e5ToUsd(it.price?.unit_price?.amount_e5),
      quantity: it.quantity ?? 1,
      externalId: it.id ?? null,
    }));

    const subtotal = e5ToUsd(d.payment?.charges?.sub_total?.amount_e5);
    const deliveryFee = e5ToUsd(d.payment?.charges?.delivery_fee?.amount_e5);
    const total = e5ToUsd(d.payment?.charges?.total?.amount_e5);

    const isDelivery = d.type === "DELIVERY_BY_UBER";

    return {
      provider: "uber_eats",
      externalOrderId,
      locationSlug: d.store?.id,
      customer: {
        name: `${firstName} ${lastName}`.trim() || "Uber Eats Customer",
        phone: d.eater?.phone ?? null,
        email: d.eater?.email ?? null,
      },
      orderType: isDelivery ? "delivery" : "pickup",
      deliveryAddress: isDelivery
        ? {
            line1: d.delivery?.location?.street_address_line_one ?? "",
            city: d.delivery?.location?.city ?? null,
            notes: d.delivery?.location?.notes ?? null,
          }
        : null,
      items,
      subtotal: subtotal || items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      deliveryFee,
      total: total || subtotal + deliveryFee,
      notes: null,
      raw: body,
    };
  },
};
