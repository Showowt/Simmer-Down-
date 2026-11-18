"use client";

import { Eye, EyeOff, Plus, X } from "lucide-react";
import {
  MAX_TICKET_TYPES,
  money,
  newTierId,
  ticketFee,
  type TicketTier,
} from "@/lib/ticket-tiers";

// Ticket types editor for the admin event form.
//   mode "sale"    — sold on simmerdownsv.com: price, cupo, sold count, hide
//   mode "display" — shows sold elsewhere: just the price list to display
// Each type keeps a stable id (newTierId) so sold counts and issued tickets
// stay linked to it when it is renamed or repriced.

const INPUT =
  "w-full px-3 py-2 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none";

export function emptyTier(price = 0): TicketTier {
  return {
    id: newTierId(),
    name: "",
    name_en: null,
    description: null,
    description_en: null,
    price,
    capacity: null,
    active: true,
  };
}

export default function TicketTierEditor({
  tiers,
  onChange,
  mode,
  sold,
  feePercent,
}: {
  tiers: TicketTier[];
  onChange: (next: TicketTier[]) => void;
  mode: "sale" | "display";
  /** Seats sold per type id (sale mode). */
  sold: Record<string, number>;
  /** Service fee % (sale mode) — shown as what the buyer pays. */
  feePercent: number;
}) {
  const update = (i: number, patch: Partial<TicketTier>) => {
    const next = [...tiers];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const remove = (i: number) => {
    const t = tiers[i];
    const n = sold[t.id] ?? 0;
    if (n > 0) {
      alert(
        `«${t.name || "Este tipo"}» ya tiene ${n} boleto${n === 1 ? "" : "s"} vendido${n === 1 ? "" : "s"}, ` +
          `así que no se puede quitar. Toca «A la venta» para ocultarlo: deja de venderse y los boletos ya comprados siguen válidos.`,
      );
      return;
    }
    onChange(tiers.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-3" data-testid={`tier-editor-${mode}`}>
      {tiers.map((tier, i) => {
        const n = sold[tier.id] ?? 0;
        const fee = mode === "sale" ? ticketFee(tier.price, feePercent) : 0;
        return (
          <div
            key={tier.id || i}
            className={`border p-3 space-y-2 ${
              tier.active ? "border-[#3D3936] bg-[#1F1D1A]/40" : "border-[#3D3936]/60 bg-[#1F1D1A]/20 opacity-70"
            }`}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
              <div>
                <label className="block text-xs text-[#6B6560] mb-1">Nombre del boleto *</label>
                <input
                  type="text"
                  value={tier.name}
                  maxLength={60}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className={INPUT}
                  placeholder={i === 0 ? "Ej: Preferencial" : "Ej: VIP Dinner"}
                  aria-label={`Nombre del tipo de boleto ${i + 1}`}
                />
              </div>
              <div>
                <label className="block text-xs text-[#6B6560] mb-1">Precio (USD) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tier.price || ""}
                  onChange={(e) => update(i, { price: e.target.value ? parseFloat(e.target.value) : 0 })}
                  className={INPUT}
                  placeholder="45.00"
                  aria-label={`Precio del tipo de boleto ${i + 1}`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#6B6560] mb-1">Qué incluye (opcional)</label>
              <input
                type="text"
                value={tier.description ?? ""}
                maxLength={160}
                onChange={(e) => update(i, { description: e.target.value || null })}
                className={INPUT}
                placeholder={i === 0 ? "Ej: Silla numerada + concierto" : "Ej: Cena + concierto"}
                aria-label={`Qué incluye el tipo de boleto ${i + 1}`}
              />
            </div>

            {mode === "sale" && (
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <div className="w-32">
                  <label className="block text-xs text-[#6B6560] mb-1">Cupo (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={tier.capacity ?? ""}
                    onChange={(e) =>
                      update(i, { capacity: e.target.value === "" ? null : Math.max(0, parseInt(e.target.value, 10) || 0) })
                    }
                    className={INPUT}
                    placeholder="Sin límite"
                    aria-label={`Cupo del tipo de boleto ${i + 1}`}
                  />
                </div>
                <p className="text-xs text-[#B8B0A8] pb-2">
                  Vendidos: <span className="font-semibold text-[#4CAF50]">{n}</span>
                  {tier.capacity != null && ` / ${tier.capacity}`}
                </p>
                {tier.price > 0 && fee > 0 && (
                  <p className="text-xs text-[#6B6560] pb-2">
                    Cliente paga {money(tier.price + fee)} ({money(tier.price)} + {money(fee)} cargo)
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              {mode === "sale" && (
                <button
                  type="button"
                  onClick={() => update(i, { active: !tier.active })}
                  className={`text-xs px-2.5 py-1.5 flex items-center gap-1.5 ${
                    tier.active ? "bg-[#4CAF50]/10 text-[#4CAF50]" : "bg-[#6B6560]/15 text-[#B8B0A8]"
                  }`}
                  title={tier.active ? "Ocultar: deja de venderse" : "Volver a vender"}
                >
                  {tier.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {tier.active ? "A la venta" : "Oculto"}
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs px-2.5 py-1.5 flex items-center gap-1 text-[#C73E1D] hover:bg-[#C73E1D]/10"
                aria-label={`Quitar el tipo de boleto ${tier.name || i + 1}`}
              >
                <X className="w-3.5 h-3.5" /> Quitar
              </button>
            </div>
          </div>
        );
      })}

      {tiers.length < MAX_TICKET_TYPES && (
        <button
          type="button"
          onClick={() => onChange([...tiers, emptyTier()])}
          className="text-sm text-[#FF6B35] hover:text-[#FF8555] flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Agregar otro tipo de boleto
        </button>
      )}
    </div>
  );
}
