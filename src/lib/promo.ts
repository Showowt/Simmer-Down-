/**
 * Automatic item-level promotions — shared by the cart store (display) and
 * /api/orders/create (authoritative pricing). Keep both sides on THIS module:
 * a displayed discount the server doesn't honor (or vice versa) is exactly the
 * displayed≠charged class of bug.
 *
 * 2x1 PIZZAS TRADICIONALES ("Tu segunda pizza personal tradicional es gratis")
 * - Qualifies: category 'pizzas' (specialty-pizzas excluded), Personal size
 *   only. A missing size means the item was quick-added at base price, which
 *   IS the personal price — it qualifies.
 * - Mechanics: all qualifying units pair across flavors; in each pair the
 *   cheaper unit is free (sort desc, every 2nd unit free). 3 pizzas → 1 free.
 * - Extras/toppings are never free — the discount is the pizza's base price.
 * - Gating: the client-managed special row (dates/days/active in the admin
 *   Especiales tab) via isSpecialLive — the promo follows whatever window the
 *   client sets and expires on its own.
 */

import { MENU_ITEMS, TAX_RATE, type CartItem } from "@/lib/data";

/** The "Porque tu lo pedistes!!!!" 2x1 special row in `specials` (prod). */
export const PROMO_2X1_SPECIAL_ID = "42382c11-b22e-48e3-9683-2099b203bac9";
export const PROMO_2X1_CODE = "2X1PIZZA";
export const PROMO_2X1_DESCRIPTION = "Promo 2x1 Pizzas Tradicionales";

const PERSONAL_SIZE_ID = "personal";

const TRADITIONAL_PIZZA_IDS = new Set(
  MENU_ITEMS.filter((i) => i.categoryId === "pizzas").map((i) => i.id),
);

export interface PromoUnit {
  itemId: string;
  /** Selected size id; absent = base price = personal. */
  sizeId?: string | null;
  /** Unit BASE price (no size modifier, no extras) — the amount a free unit discounts. */
  unitBase: number;
  quantity: number;
}

/**
 * Total 2x1 discount for a set of order lines. Returns 0 when nothing pairs.
 * Pure math — callers gate on the special being live.
 */
export function computeTwoForOneDiscount(units: PromoUnit[]): number {
  const qualifying: number[] = [];
  for (const u of units) {
    if (!TRADITIONAL_PIZZA_IDS.has(u.itemId)) continue;
    if (u.sizeId && u.sizeId !== PERSONAL_SIZE_ID) continue;
    for (let i = 0; i < u.quantity; i++) qualifying.push(u.unitBase);
  }
  qualifying.sort((a, b) => b - a);
  let discount = 0;
  for (let i = 1; i < qualifying.length; i += 2) discount += qualifying[i];
  return Math.round(discount * 100) / 100;
}

/** Cart-store adapter: discount for the current cart items. */
export function computeCartTwoForOneDiscount(items: CartItem[]): number {
  return computeTwoForOneDiscount(
    items.map((i) => ({
      itemId: i.id,
      sizeId: i.selectedSize?.id ?? null,
      unitBase: i.basePrice,
      quantity: i.quantity,
    })),
  );
}

/**
 * Cart totals with the promo applied. `tax` is the IVA portion already
 * contained in the NET amount (prices include 13% IVA) — informational only.
 * `total` excludes the delivery fee, mirroring calculateCartTotal.
 */
export function calculateCartTotalsWithPromo(
  items: CartItem[],
  promoLive: boolean,
): { subtotal: number; discount: number; tax: number; total: number } {
  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  const discount = promoLive
    ? Math.min(computeCartTwoForOneDiscount(items), subtotal)
    : 0;
  const net = Math.max(0, subtotal - discount);
  const tax = net - net / (1 + TAX_RATE);
  return { subtotal, discount, tax, total: net };
}
