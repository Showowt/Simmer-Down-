/**
 * PCI-safe sanitization utilities.
 *
 * PAN and CVV must NEVER appear in logs, DB rows (except last4/brand),
 * or any response body. These helpers are used everywhere card data
 * could conceivably leak, including Powertranz request/response objects
 * before they hit `logger.*` or `payment_attempts`.
 */

const CARD_FIELD_KEYS = new Set([
  "CardPan",
  "CardCvv",
  "pan",
  "cvv",
  "cvc",
  "cardNumber",
  "card_number",
  "securityCode",
  "security_code",
  "cardCode",
]);

/** Mask a PAN as `****-****-****-last4`. Rejects non-string input safely. */
export function maskPan(pan: unknown): string {
  if (typeof pan !== "string") return "****";
  const digits = pan.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `****-****-****-${digits.slice(-4)}`;
}

/** Return the last 4 digits of a PAN or null. */
export function last4(pan: unknown): string | null {
  if (typeof pan !== "string") return null;
  const digits = pan.replace(/\D/g, "");
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

/** Infer card brand from BIN. Defensive — returns `null` if unknown. */
export function inferBrand(pan: unknown): string | null {
  if (typeof pan !== "string") return null;
  const d = pan.replace(/\D/g, "");
  if (!d) return null;
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6(?:011|5|4[4-9])/.test(d)) return "Discover";
  if (/^35(2[89]|[3-8])/.test(d)) return "JCB";
  if (/^3(?:0[0-5]|[68])/.test(d)) return "DinersClub";
  return null;
}

/**
 * Deeply strip card fields from an object graph. Returns a new object
 * with sensitive keys removed or masked. Does not mutate input.
 * Handles nested objects, arrays, and circular refs (via WeakSet).
 */
export function stripCardFields<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((v) => stripCardFields(v, seen)) as unknown as T;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (seen.has(obj)) return value;
    seen.add(obj);

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (CARD_FIELD_KEYS.has(k)) {
        // Keep only masked representation for PAN, drop CVV entirely.
        if (k === "CardPan" || k === "pan" || k.toLowerCase().includes("number")) {
          out[k] = maskPan(v);
        }
        continue;
      }
      out[k] = stripCardFields(v, seen);
    }
    return out as unknown as T;
  }

  return value;
}

/**
 * Regex to detect raw PANs (13-19 consecutive digits) in a string.
 * Used as a defense-in-depth check before logging arbitrary strings.
 */
export function containsPan(s: unknown): boolean {
  if (typeof s !== "string") return false;
  return /\b\d{13,19}\b/.test(s);
}
