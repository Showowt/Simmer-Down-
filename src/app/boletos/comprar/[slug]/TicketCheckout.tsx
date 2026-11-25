"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Minus, Plus, Ticket } from "lucide-react";
import CardPaymentForm, {
  type CardFormData,
} from "@/components/checkout/CardPaymentForm";
import ThreeDSecureModal from "@/components/checkout/ThreeDSecureModal";
import PaymentResult from "@/components/checkout/PaymentResult";
import {
  MAX_TICKETS_PER_TYPE,
  lineTotals,
  money,
  percentLabel,
} from "@/lib/ticket-tiers";
import { trackBeginCheckout } from "@/lib/track";

export interface CheckoutTier {
  id: string;
  name: string;
  description: string | null;
  /** The ticket's own price (taquilla), before the service fee. */
  price: number;
  fee: number;
  total: number;
  remaining: number | null;
  soldOut: boolean;
}

interface EventInfo {
  slug: string;
  title: string;
  startsAt: string | null;
  venue: string | null;
  imageUrl: string | null;
  /** 'tiers' = the event has ticket types; 'single' = one price. */
  mode: "tiers" | "single";
  feePercent: number;
  tiers: CheckoutTier[];
  /** Event-wide seats left across all types, null = no limit. */
  seatsLeft: number | null;
  /** Unpublished event opened by staff — a real (test) purchase. */
  draft: boolean;
}

interface IssuedTicket {
  token: string;
  tierName: string | null;
  quantity: number;
}

type Step = "review" | "payment" | "3ds" | "result";

const SV_TZ = "America/El_Salvador";
const SHOW_LEFT_BELOW = 20;
// The confirm trigger issues the QR in the same transaction that confirms the
// order, a moment after the payment row flips — poll briefly for it.
const TICKET_POLL_ATTEMPTS = 6;
const TICKET_POLL_MS = 1500;
const HELP_WHATSAPP = "50376804434";

function initialQuantities(event: EventInfo, initialTierId: string | null): Record<string, number> {
  const open = event.tiers.filter((t) => !t.soldOut);
  const pick =
    open.find((t) => t.id === initialTierId) ??
    (event.mode === "single" || open.length === 1 ? open[0] : undefined);
  return pick ? { [pick.id]: 1 } : {};
}

export default function TicketCheckout({
  event,
  initialTierId,
}: {
  event: EventInfo;
  initialTierId: string | null;
}) {
  const [step, setStep] = useState<Step>("review");
  const [qty, setQty] = useState<Record<string, number>>(() => initialQuantities(event, initialTierId));
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [redirectData, setRedirectData] = useState<string | null>(null);
  const [result, setResult] = useState<{
    status: "paid" | "failed";
    message?: string;
    authorizationCode?: string | null;
  } | null>(null);
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);
  const [ticketsChecked, setTicketsChecked] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const typed = event.mode === "tiers";
  const lines = useMemo(
    () =>
      event.tiers
        .filter((t) => (qty[t.id] ?? 0) > 0)
        .map((t) => ({ tier: t, unit_price: t.price, unit_fee: t.fee, quantity: qty[t.id] ?? 0 })),
    [event.tiers, qty],
  );
  const totals = lineTotals(lines);
  const phoneValid = /^(\+?503)?[\s-]?\d{4}[\s-]?\d{4}$/.test(phone.trim());
  const detailsValid = name.trim().length >= 2 && phoneValid;
  const canContinue = totals.seats > 0 && detailsValid;

  const maxFor = (t: CheckoutTier): number => {
    const own = Math.min(MAX_TICKETS_PER_TYPE, t.remaining ?? MAX_TICKETS_PER_TYPE);
    if (event.seatsLeft == null) return own;
    const others = totals.seats - (qty[t.id] ?? 0);
    return Math.max(0, Math.min(own, event.seatsLeft - others));
  };

  const setTierQty = (t: CheckoutTier, next: number) => {
    setError(null);
    setQty((prev) => ({ ...prev, [t.id]: Math.max(0, Math.min(maxFor(t), next)) }));
  };

  // Step 1 → 2: create the ticket order (priced by the server), then the card form.
  const goToPayment = useCallback(async () => {
    if (totals.seats === 0) {
      setError(typed ? "Elige al menos un boleto." : "Elige cuántos boletos quieres.");
      return;
    }
    if (!detailsValid) {
      setError("Ingresa tu nombre y un teléfono válido (XXXX-XXXX).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/events/tickets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          items: lines.map((l) => ({ tierId: l.tier.id, quantity: l.quantity })),
          buyerName: name.trim(),
          buyerPhone: phone.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "No se pudo crear la orden. Intenta de nuevo.");
      }
      setOrderId(data.orderId);
      setOrderNumber(data.orderNumber ?? null);
      setStep("payment");
      // GA4 funnel: reached the card step (add_payment_info fires on submit, purchase on approval).
      trackBeginCheckout(totals.total);
    } catch (e) {
      console.error("[TicketCheckout] create order failed", e);
      setError(e instanceof Error ? e.message : "Error al crear la orden.");
    } finally {
      setLoading(false);
    }
  }, [totals.seats, totals.total, typed, detailsValid, event.slug, lines, name, phone]);

  // Step 2 → 3: initiate the certified PowerTranz payment.
  const handlePayment = useCallback(
    async (form: CardFormData) => {
      if (!orderId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/payments/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, card: form.card, billing: form.billing }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Error al iniciar el pago.");
        }
        setRedirectData(data.redirectData);
        setStep("3ds");
      } catch (e) {
        console.error("[TicketCheckout] payment initiate failed", e);
        setError(e instanceof Error ? e.message : "Error de pago.");
      } finally {
        setLoading(false);
      }
    },
    [orderId],
  );

  const handle3DSComplete = useCallback(
    async (r: { status: "paid" | "failed"; message?: string; authorizationCode?: string | null }) => {
      setResult(r);
      setStep("result");
      if (r.status !== "paid" || !orderId) return;
      // The confirm trigger issues one QR per ticket type; fetch them so the
      // buyer goes straight to their boletos.
      for (let attempt = 0; attempt < TICKET_POLL_ATTEMPTS && aliveRef.current; attempt++) {
        try {
          const res = await fetch(`/api/payments/status?orderId=${encodeURIComponent(orderId)}`, {
            cache: "no-store",
          });
          const d = await res.json().catch(() => null);
          const list: IssuedTicket[] = Array.isArray(d?.tickets)
            ? d.tickets
            : d?.ticketToken
              ? [{ token: d.ticketToken, tierName: null, quantity: totals.seats }]
              : [];
          if (list.length > 0) {
            if (aliveRef.current) setTickets(list);
            break;
          }
        } catch (err) {
          console.error("[TicketCheckout] ticket lookup failed", err);
        }
        await new Promise((resolve) => setTimeout(resolve, TICKET_POLL_MS));
      }
      if (aliveRef.current) setTicketsChecked(true);
    },
    [orderId, totals.seats],
  );

  const summary = (
    <div className="space-y-1.5 text-sm" data-testid="ticket-summary">
      {lines.map((l) => (
        <div key={l.tier.id} className="flex justify-between gap-3 text-white/70">
          <span className="min-w-0 break-words">
            {l.quantity} × {typed ? l.tier.name : "Boleto"}
          </span>
          <span className="tabular-nums shrink-0">{money(l.tier.price * l.quantity)}</span>
        </div>
      ))}
      {totals.fee > 0 && (
        <div className="flex justify-between gap-3 text-white/50">
          <span>Cargo por servicio ({percentLabel(event.feePercent)})</span>
          <span className="tabular-nums shrink-0">{money(totals.fee)}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <span className="text-white/60">Total</span>
        <span className="text-2xl font-bold text-white tabular-nums">{money(totals.total)}</span>
      </div>
    </div>
  );

  // ─── Result step ───────────────────────────────────────────
  if (step === "result" && result) {
    const helpHref = `https://wa.me/${HELP_WHATSAPP}?text=${encodeURIComponent(
      `Hola, pagué boletos para ${event.title}${orderNumber ? ` (pedido #${orderNumber})` : ""} y no me aparece el QR.`,
    )}`;
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          {result.status === "paid" ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="font-display text-3xl text-white uppercase mb-2">
                ¡Boletos Confirmados!
              </h1>
              <p className="text-white/60 mb-1">
                {totals.seats} boleto{totals.seats === 1 ? "" : "s"} para {event.title}
              </p>
              {orderNumber && <p className="text-white/40 text-sm mb-8">Pedido #{orderNumber}</p>}
              <div className="space-y-3 max-w-xs mx-auto">
                {tickets.length > 0 ? (
                  <>
                    {tickets.length > 1 && (
                      <p className="text-white/50 text-sm">
                        Tienes un QR por cada tipo de boleto. Muéstralos en la entrada.
                      </p>
                    )}
                    {tickets.map((t) => (
                      <Link
                        key={t.token}
                        href={`/boletos/${t.token}`}
                        className="w-full py-3 px-4 bg-[#E85D04] hover:bg-[#C2410C] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition"
                      >
                        <Ticket className="w-5 h-5 shrink-0" />
                        <span className="min-w-0 break-words">
                          {t.tierName
                            ? `Ver boleto ${t.tierName} (${t.quantity})`
                            : tickets.length > 1
                              ? `Ver boleto (${t.quantity})`
                              : "Ver mi boleto (QR)"}
                        </span>
                      </Link>
                    ))}
                  </>
                ) : ticketsChecked ? (
                  <p className="text-white/60 text-sm">
                    Tu pago fue aprobado. Tu QR se está generando —{" "}
                    <a href={helpHref} target="_blank" rel="noopener noreferrer" className="text-[#25D366] underline">
                      escríbenos por WhatsApp
                    </a>
                    {orderNumber ? ` con tu pedido #${orderNumber}` : ""} y te lo enviamos.
                  </p>
                ) : (
                  <p className="text-white/50 text-sm">Generando tu boleto…</p>
                )}
                <Link
                  href="/ticketmania"
                  className="w-full py-3 bg-[#1A1A1A] border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium rounded-xl flex items-center justify-center transition"
                >
                  Ver más eventos
                </Link>
              </div>
            </div>
          ) : (
            <PaymentResult
              status="failed"
              message={result.message}
              onRetry={() => {
                setResult(null);
                setRedirectData(null);
                setOrderId(null);
                setOrderNumber(null);
                setStep("review");
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-28 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href={`/ticketmania/${event.slug}`}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Evento
        </Link>

        {event.draft && (
          <div className="mb-4 flex gap-3 rounded-xl border border-[#FBBF24]/40 bg-[#FBBF24]/10 px-4 py-3 text-sm text-[#FBBF24]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>
              Vista del personal: este evento está en <strong>Borrador</strong> y los clientes todavía no lo
              ven. Si pagas, el cobro es real.
            </p>
          </div>
        )}

        {/* Event summary */}
        <div className="bg-[#141414] border border-white/10 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 text-[#E85D04] text-xs font-bold uppercase tracking-wider mb-2">
            <Ticket className="w-4 h-4" /> Boletos
          </div>
          <h1 className="font-display text-2xl text-white leading-tight break-words">
            {event.title}
          </h1>
          {event.startsAt && (
            <p className="text-white/60 text-sm capitalize mt-1">
              {new Intl.DateTimeFormat("es-SV", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: SV_TZ,
              }).format(new Date(event.startsAt))}
            </p>
          )}
          {event.venue && <p className="text-white/40 text-sm">{event.venue}</p>}
        </div>

        {step === "review" && (
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5 space-y-5">
            {/* Ticket types / quantity */}
            <div>
              <p className="block text-sm text-white/60 mb-2">
                {typed ? "Elige tus boletos" : "Cantidad"}
              </p>
              <ul className="space-y-3" data-testid="ticket-type-picker">
                {event.tiers.map((t) => {
                  const n = qty[t.id] ?? 0;
                  const max = maxFor(t);
                  return (
                    <li
                      key={t.id}
                      className={`rounded-lg border px-4 py-3 ${
                        t.soldOut
                          ? "border-white/5 bg-white/[0.02] opacity-60"
                          : n > 0
                            ? "border-[#E85D04]/60 bg-[#E85D04]/5"
                            : "border-white/10 bg-[#1A1A1A]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          {typed && <p className="text-white font-semibold break-words">{t.name}</p>}
                          {t.description && (
                            <p className="text-white/50 text-sm break-words">{t.description}</p>
                          )}
                          <p className="text-[#FBBF24] font-semibold text-sm mt-0.5">
                            {money(t.price)}
                            {t.fee > 0 && (
                              <span className="text-white/40 font-normal"> + {money(t.fee)} de cargo</span>
                            )}
                            {!typed && <span className="text-white/40 font-normal"> por boleto</span>}
                          </p>
                          {t.soldOut ? (
                            <p className="text-xs font-semibold uppercase text-white/60 mt-0.5">Agotado</p>
                          ) : t.remaining != null && t.remaining <= SHOW_LEFT_BELOW ? (
                            <p className="text-xs text-white/40 mt-0.5">Quedan {t.remaining}</p>
                          ) : null}
                        </div>
                        {!t.soldOut && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setTierQty(t, n - 1)}
                              disabled={n <= 0}
                              className="w-11 h-11 rounded-lg bg-[#0F0F0F] border border-white/10 text-white flex items-center justify-center hover:border-white/30 disabled:opacity-40 transition"
                              aria-label={`Menos boletos ${t.name}`}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span
                              className="text-xl font-bold text-white tabular-nums w-7 text-center"
                              aria-live="polite"
                            >
                              {n}
                            </span>
                            <button
                              type="button"
                              onClick={() => setTierQty(t, n + 1)}
                              disabled={n >= max}
                              className="w-11 h-11 rounded-lg bg-[#0F0F0F] border border-white/10 text-white flex items-center justify-center hover:border-white/30 disabled:opacity-40 transition"
                              aria-label={`Más boletos ${t.name}`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <label htmlFor="ticket-buyer-name" className="block text-sm text-white/60 mb-2">
                Nombre
              </label>
              <input
                id="ticket-buyer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 text-white rounded-lg focus:border-[#E85D04] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="ticket-buyer-phone" className="block text-sm text-white/60 mb-2">
                WhatsApp
              </label>
              <input
                id="ticket-buyer-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+503 XXXX-XXXX"
                inputMode="tel"
                autoComplete="tel"
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 text-white rounded-lg focus:border-[#E85D04] focus:outline-none"
              />
            </div>

            {totals.seats > 0 ? (
              summary
            ) : (
              <p className="text-sm text-white/40">
                {typed ? "Toca + en el tipo de boleto que quieres." : "Elige cuántos boletos quieres."}
              </p>
            )}

            {error && (
              <p className="text-red-400 text-sm" role="alert">
                {error}
              </p>
            )}

            <button
              onClick={goToPayment}
              disabled={loading || !canContinue}
              className="w-full py-4 bg-[#E85D04] hover:bg-[#C2410C] disabled:opacity-50 text-white font-semibold rounded-xl transition"
            >
              {loading ? "..." : "Continuar al pago"}
            </button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-4">
            <div className="bg-[#141414] border border-white/10 rounded-xl p-5">{summary}</div>
            {/* Name + WhatsApp come from the previous step — never typed twice. */}
            <CardPaymentForm
              onSubmit={handlePayment}
              loading={loading}
              error={error}
              defaultBilling={{ phone: phone.trim() }}
              defaultHolder={name.trim()}
              amountLabel={money(totals.total)}
            />
          </div>
        )}

        {step === "3ds" && redirectData && orderId && (
          <ThreeDSecureModal
            redirectData={redirectData}
            orderId={orderId}
            onComplete={handle3DSComplete}
            onClose={() => {
              setRedirectData(null);
              setStep("payment");
              setError("Verificación cancelada. Puedes intentar de nuevo.");
            }}
          />
        )}
      </div>
    </div>
  );
}
