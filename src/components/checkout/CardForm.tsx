"use client";

import { useMemo, useState } from "react";
import { CreditCard, Lock, User as UserIcon } from "lucide-react";

import { cardPaymentSchema } from "@/lib/powertranz/schemas";
import { inferBrand } from "@/lib/powertranz/sanitize";

export interface CardFormValue {
  pan: string;
  cvv: string;
  exp: string;
  holder: string;
}

interface CardFormProps {
  value: CardFormValue;
  onChange: (next: CardFormValue) => void;
  disabled?: boolean;
  errors?: Partial<Record<keyof CardFormValue, string>>;
}

function formatPan(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCvv(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 4);
}

export function CardForm({ value, onChange, disabled, errors }: CardFormProps) {
  const brand = useMemo(() => inferBrand(value.pan), [value.pan]);
  const [touched, setTouched] = useState<
    Partial<Record<keyof CardFormValue, boolean>>
  >({});

  const showErr = (k: keyof CardFormValue) =>
    touched[k] && errors?.[k] ? errors[k] : null;

  const update = <K extends keyof CardFormValue>(k: K, v: string) => {
    onChange({ ...value, [k]: v });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#B8B0A8] text-xs">
        <Lock className="w-3.5 h-3.5" />
        <span>
          Pago seguro con 3D-Secure / Secure payment via 3D-Secure · BAC
          Credomatic
        </span>
      </div>

      {/* Cardholder */}
      <div>
        <label
          htmlFor="cc-holder"
          className="block text-sm font-medium text-[#B8B0A8] mb-2"
        >
          Titular de la tarjeta
        </label>
        <div className="relative">
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
          <input
            id="cc-holder"
            name="cc-holder"
            type="text"
            autoComplete="cc-name"
            inputMode="text"
            required
            disabled={disabled}
            value={value.holder}
            onChange={(e) => update("holder", e.target.value.toUpperCase())}
            onBlur={() => setTouched((t) => ({ ...t, holder: true }))}
            placeholder="NOMBRE COMO APARECE EN LA TARJETA"
            className="w-full pl-12 pr-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition uppercase tracking-wide"
          />
        </div>
        {showErr("holder") && (
          <p className="mt-1 text-xs text-[#FF6B35]">{showErr("holder")}</p>
        )}
      </div>

      {/* PAN */}
      <div>
        <label
          htmlFor="cc-number"
          className="block text-sm font-medium text-[#B8B0A8] mb-2"
        >
          Número de tarjeta
        </label>
        <div className="relative">
          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
          <input
            id="cc-number"
            name="cc-number"
            type="text"
            autoComplete="cc-number"
            inputMode="numeric"
            required
            disabled={disabled}
            value={formatPan(value.pan)}
            onChange={(e) => update("pan", e.target.value.replace(/\s/g, ""))}
            onBlur={() => setTouched((t) => ({ ...t, pan: true }))}
            placeholder="1234 5678 9012 3456"
            className="w-full pl-12 pr-20 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition font-mono tracking-wider"
          />
          {brand && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-wide text-[#C9A84C]">
              {brand}
            </div>
          )}
        </div>
        {showErr("pan") && (
          <p className="mt-1 text-xs text-[#FF6B35]">{showErr("pan")}</p>
        )}
      </div>

      {/* Exp + CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="cc-exp"
            className="block text-sm font-medium text-[#B8B0A8] mb-2"
          >
            Expiración (MM/AA)
          </label>
          <input
            id="cc-exp"
            name="cc-exp"
            type="text"
            autoComplete="cc-exp"
            inputMode="numeric"
            required
            disabled={disabled}
            value={formatExp(value.exp)}
            onChange={(e) => update("exp", e.target.value.replace(/\D/g, ""))}
            onBlur={() => setTouched((t) => ({ ...t, exp: true }))}
            placeholder="MM/AA"
            className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition font-mono"
          />
          {showErr("exp") && (
            <p className="mt-1 text-xs text-[#FF6B35]">{showErr("exp")}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="cc-cvv"
            className="block text-sm font-medium text-[#B8B0A8] mb-2"
          >
            CVV
          </label>
          <input
            id="cc-cvv"
            name="cc-cvv"
            type="password"
            autoComplete="cc-csc"
            inputMode="numeric"
            required
            disabled={disabled}
            value={value.cvv}
            onChange={(e) => update("cvv", formatCvv(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, cvv: true }))}
            placeholder="123"
            className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] transition font-mono tracking-widest"
          />
          {showErr("cvv") && (
            <p className="mt-1 text-xs text-[#FF6B35]">{showErr("cvv")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Validate a CardFormValue; returns error map or null if clean. */
export function validateCardForm(
  value: CardFormValue,
): Partial<Record<keyof CardFormValue, string>> | null {
  const parsed = cardPaymentSchema.safeParse(value);
  if (parsed.success) return null;
  const errors: Partial<Record<keyof CardFormValue, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof CardFormValue;
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}
