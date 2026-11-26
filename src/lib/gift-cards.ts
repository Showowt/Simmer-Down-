// ============================================================
// Digital gift cards — shared rules (client-safe).
//
// The money rules live in the database (migration 20261126_gift_cards):
// issue only on a confirmed order, row-locked redemption, balance never
// below zero, a ledger row for every movement. This file only shapes what
// people type and see.
// ============================================================

export const GIFT_CARD_AMOUNTS = [10, 15, 25, 50] as const;
export const GIFT_CARD_MIN = 5;
export const GIFT_CARD_MAX = 200;
export const GIFT_CARD_MESSAGE_MAX = 200;
export const GIFT_CARD_VALID_MONTHS = 12;

/** Same 32-symbol alphabet as public.gift_card_new_code() (no 0/1/I/O). */
const CODE_RE = /^[2-9A-HJ-NP-Z]{12}$/;

/**
 * Whatever staff type or a QR carries → the 12-char stored code, or null.
 * Accepts "SD-7K3M-Q9XA-4TRW", "sd 7k3m q9xa 4trw", lowercase, and maps the
 * look-alikes people type by mistake (O→0 is not in the alphabet, so O/0 and
 * I/1 can never be valid — they are rejected, not guessed).
 */
export function normalizeGiftCode(input: string): string | null {
  let s = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (s.length === 14 && s.startsWith("SD")) s = s.slice(2);
  return CODE_RE.test(s) ? s : null;
}

/** "7K3MQ9XA4TRW" → "SD-7K3M-Q9XA-4TRW" */
export function formatGiftCode(code: string): string {
  return `SD-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

/** Last four for staff alerts / receipts — never the full bearer code. */
export function giftCodeTail(code: string): string {
  return code.slice(-4);
}

export function giftMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Whole dollars only — keeps the amount on the card and on the charge identical. */
export function isValidGiftAmount(n: number): boolean {
  return Number.isInteger(n) && n >= GIFT_CARD_MIN && n <= GIFT_CARD_MAX;
}

export type GiftCardState = "active" | "used" | "expired" | "void";

export function giftCardState(card: {
  status: string;
  balance: number;
  expires_at: string;
}, now: Date = new Date()): GiftCardState {
  if (card.status === "void") return "void";
  if (new Date(card.expires_at).getTime() < now.getTime()) return "expired";
  if (card.balance <= 0) return "used";
  return "active";
}

export const GIFT_STATE_LABEL: Record<GiftCardState, string> = {
  active: "Activa",
  used: "Saldo agotado",
  expired: "Vencida",
  void: "Anulada",
};

const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "26 de noviembre de 2027" in El Salvador time, Intl-free (identical on server and client). */
export function giftDateLong(iso: string): string {
  const sv = new Date(new Date(iso).getTime() - 6 * 3600_000);
  return `${sv.getUTCDate()} de ${MONTHS_ES[sv.getUTCMonth()]} de ${sv.getUTCFullYear()}`;
}

/** "26/11/2026 3:05 p. m." in El Salvador time, Intl-free. */
export function giftDateTime(iso: string): string {
  const sv = new Date(new Date(iso).getTime() - 6 * 3600_000);
  const h = sv.getUTCHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(sv.getUTCMinutes()).padStart(2, "0");
  const dd = String(sv.getUTCDate()).padStart(2, "0");
  const mo = String(sv.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mo}/${sv.getUTCFullYear()} ${h12}:${mm} ${h < 12 ? "a. m." : "p. m."}`;
}
