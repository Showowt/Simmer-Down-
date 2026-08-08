"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Ticket, ArrowLeft } from "lucide-react";
import CardPaymentForm, {
  type CardFormData,
} from "@/components/checkout/CardPaymentForm";
import ThreeDSecureModal from "@/components/checkout/ThreeDSecureModal";
import PaymentResult from "@/components/checkout/PaymentResult";

interface EventInfo {
  slug: string;
  title: string;
  startsAt: string | null;
  venue: string | null;
  imageUrl: string | null;
  price: number;
  remaining: number | null;
}

type Step = "review" | "payment" | "3ds" | "result";

const SV_TZ = "America/El_Salvador";

export default function TicketCheckout({ event }: { event: EventInfo }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("review");
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [redirectData, setRedirectData] = useState<string | null>(null);
  const [result, setResult] = useState<{
    status: "paid" | "failed";
    message?: string;
    authorizationCode?: string | null;
  } | null>(null);
  const [ticketToken, setTicketToken] = useState<string | null>(null);

  const maxQty = Math.min(10, event.remaining ?? 10);
  const total = Math.round(event.price * qty * 100) / 100;
  const phoneValid = /^(\+?503)?[\s-]?\d{4}[\s-]?\d{4}$/.test(phone.trim());
  const detailsValid = name.trim().length >= 2 && phoneValid;

  // Step 1 → 2: create the ticket order, then show the card form.
  const goToPayment = useCallback(async () => {
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
          quantity: qty,
          buyerName: name.trim(),
          buyerPhone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudo crear la orden.");
      }
      setOrderId(data.orderId);
      setStep("payment");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la orden.");
    } finally {
      setLoading(false);
    }
  }, [detailsValid, event.slug, qty, name, phone]);

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
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Error al iniciar el pago.");
        }
        setRedirectData(data.redirectData);
        setStep("3ds");
      } catch (e) {
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
      if (r.status === "paid" && orderId) {
        // The confirm trigger has issued the ticket; grab its token to route
        // the buyer to their QR boleto.
        try {
          const res = await fetch(`/api/payments/status?orderId=${orderId}`);
          const d = await res.json();
          if (d?.success && d.ticketToken) setTicketToken(d.ticketToken);
        } catch {
          /* the buyer can still find it via WhatsApp / order lookup */
        }
      }
    },
    [orderId],
  );

  // ─── Result step ───────────────────────────────────────────
  if (step === "result" && result) {
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
              <p className="text-white/60 mb-8">
                {qty} boleto(s) para {event.title}
              </p>
              <div className="space-y-3 max-w-xs mx-auto">
                {ticketToken ? (
                  <Link
                    href={`/boletos/${ticketToken}`}
                    className="w-full py-3 bg-[#E85D04] hover:bg-[#C2410C] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Ticket className="w-5 h-5" />
                    Ver mi boleto (QR)
                  </Link>
                ) : (
                  <p className="text-white/50 text-sm">
                    Tu boleto llegará en un momento. Revisa por WhatsApp.
                  </p>
                )}
                <Link
                  href="/events"
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
          href="/events"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Eventos
        </Link>

        {/* Event summary */}
        <div className="bg-[#141414] border border-white/10 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 text-[#E85D04] text-xs font-bold uppercase tracking-wider mb-2">
            <Ticket className="w-4 h-4" /> Boletos
          </div>
          <h1 className="font-display text-2xl text-white leading-tight">
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
          <p className="text-[#FBBF24] font-semibold mt-3">
            ${event.price.toFixed(2)} por boleto
            {event.remaining != null && event.remaining <= 20 && (
              <span className="text-white/40 font-normal">
                {" "}· quedan {event.remaining}
              </span>
            )}
          </p>
        </div>

        {step === "review" && (
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5 space-y-5">
            {/* Quantity */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Cantidad</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 rounded-lg bg-[#1A1A1A] border border-white/10 text-white flex items-center justify-center hover:border-white/30 transition"
                  aria-label="Menos"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-bold text-white tabular-nums w-10 text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  className="w-11 h-11 rounded-lg bg-[#1A1A1A] border border-white/10 text-white flex items-center justify-center hover:border-white/30 transition"
                  aria-label="Más"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 text-white rounded-lg focus:border-[#E85D04] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">WhatsApp</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+503 XXXX-XXXX"
                inputMode="tel"
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 text-white rounded-lg focus:border-[#E85D04] focus:outline-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-white/60">Total</span>
              <span className="text-2xl font-bold text-white tabular-nums">
                ${total.toFixed(2)}
              </span>
            </div>
            <button
              onClick={goToPayment}
              disabled={loading || !detailsValid}
              className="w-full py-4 bg-[#E85D04] hover:bg-[#C2410C] disabled:opacity-50 text-white font-semibold rounded-xl transition"
            >
              {loading ? "..." : "Continuar al pago"}
            </button>
          </div>
        )}

        {step === "payment" && (
          <CardPaymentForm onSubmit={handlePayment} loading={loading} error={error} />
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
