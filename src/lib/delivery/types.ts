/**
 * Provider-agnostic inbound delivery order shape.
 * Every adapter exports a `normalize(payload)` that returns this.
 */

import type { OrderSourceProvider } from "@/lib/types";

export interface NormalizedDeliveryItem {
  name: string;
  description?: string | null;
  /** Unit price in USD. */
  unitPrice: number;
  quantity: number;
  /** External item ID from the provider (for reconciliation). */
  externalId?: string | null;
}

export interface NormalizedDeliveryOrder {
  /** Source provider key (uber_eats, doordash, ...). */
  provider: OrderSourceProvider;
  /** Provider's unique order id (used for idempotency). */
  externalOrderId: string;
  /** Which of our locations this is for, by slug or id. */
  locationSlug?: string;
  locationId?: string;
  customer: {
    name: string;
    phone?: string | null;
    email?: string | null;
  };
  /** "delivery" / "pickup". */
  orderType: "delivery" | "pickup";
  deliveryAddress?: {
    line1: string;
    city?: string | null;
    notes?: string | null;
  } | null;
  items: NormalizedDeliveryItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** Notes from the customer or the platform. */
  notes?: string | null;
  /** Raw provider payload — stored as external_payload JSONB for audit. */
  raw: unknown;
}

export interface DeliveryAdapter {
  /** Verify the inbound request signature / shared secret. */
  verify(
    headers: Headers,
    rawBody: string,
  ): Promise<boolean> | boolean;

  /** Parse the provider payload into our canonical shape. */
  normalize(rawBody: string): NormalizedDeliveryOrder;

  /** Provider key. */
  provider: OrderSourceProvider;
}
