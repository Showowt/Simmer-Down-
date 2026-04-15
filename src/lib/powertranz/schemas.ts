import { z } from "zod";

/**
 * Luhn mod-10 check. Returns true if `digits` (string of 0-9) is a valid Luhn sequence.
 */
function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** Card PAN: 13-19 digits, Luhn-valid. Accepts spaces / dashes on input. */
export const panSchema = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .refine((s) => /^\d{13,19}$/.test(s), "Número de tarjeta inválido")
  .refine(luhnValid, "Número de tarjeta inválido (dígito de control)");

/** CVV: 3-4 digits. */
export const cvvSchema = z
  .string()
  .regex(/^\d{3,4}$/, "Código de seguridad inválido");

/**
 * Expiration in YYMM format (Powertranz spec) — e.g. "2310" = Oct 2023.
 * Input can also be MM/YY or MMYY; we normalize to YYMM.
 */
export const expirationSchema = z
  .string()
  .transform((s) => s.replace(/[\s/]/g, ""))
  .refine((s) => /^\d{4}$/.test(s), "Fecha de expiración inválida")
  .transform((s) => {
    // If user entered MMYY (month first), flip to YYMM.
    const first = parseInt(s.slice(0, 2), 10);
    const last = parseInt(s.slice(2, 4), 10);
    // MMYY: first is 01..12 and last is a plausible year.
    // YYMM: last is 01..12.
    if (first >= 1 && first <= 12 && (last < 1 || last > 12)) {
      return `${s.slice(2, 4)}${s.slice(0, 2)}`;
    }
    return s;
  })
  .refine((s) => {
    const yy = parseInt(s.slice(0, 2), 10);
    const mm = parseInt(s.slice(2, 4), 10);
    if (mm < 1 || mm > 12) return false;
    // Card not expired: YYMM >= current YYMM
    const now = new Date();
    const curYY = now.getFullYear() % 100;
    const curMM = now.getMonth() + 1;
    return yy > curYY || (yy === curYY && mm >= curMM);
  }, "La tarjeta está expirada");

export const cardHolderSchema = z
  .string()
  .trim()
  .min(2, "Nombre del titular requerido")
  .max(50, "Nombre del titular demasiado largo")
  .regex(/^[A-Za-zÀ-ÿ\s.'-]+$/, "Nombre inválido");

export const billingAddressSchema = z.object({
  line1: z.string().min(3).max(120),
  line2: z.string().max(120).optional().nullable(),
  city: z.string().min(2).max(60),
  state: z.string().max(60).optional().nullable(),
  postalCode: z.string().min(2).max(15),
  countryCode: z.string().length(2).default("SV"),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().max(20).optional().nullable(),
});

export const cardPaymentSchema = z.object({
  pan: panSchema,
  cvv: cvvSchema,
  exp: expirationSchema,
  holder: cardHolderSchema,
});

export type CardPaymentInput = z.infer<typeof cardPaymentSchema>;
export type BillingAddressInput = z.infer<typeof billingAddressSchema>;

export const initiatePaymentSchema = z.object({
  orderId: z.string().uuid("ID de pedido inválido"),
  card: cardPaymentSchema,
  billing: billingAddressSchema,
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
