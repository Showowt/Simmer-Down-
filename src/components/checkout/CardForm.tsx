"use client";

import { CreditCard } from "lucide-react";

export interface CardFormValue {
  pan: string;
  cvv: string;
  exp: string;
  holder: string;
}

/**
 * Placeholder component — card payments are disabled until
 * PowerTranz Hosted Payment Page (HPP) integration is complete.
 */
export function CardForm() {
  return (
    <div className="p-6 bg-[#1F1D1A] border border-[#3D3936] text-center space-y-3">
      <CreditCard className="w-8 h-8 text-[#6B6560] mx-auto" />
      <p className="text-[#B8B0A8] text-sm">
        Pago con tarjeta pr&oacute;ximamente / Card payment coming soon
      </p>
    </div>
  );
}

/** No-op validator kept so any stale imports don't break the build. */
export function validateCardForm(
  _value: CardFormValue,
): Partial<Record<keyof CardFormValue, string>> | null {
  return null;
}
