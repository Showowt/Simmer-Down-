"use client";

/**
 * /giftcard — buy a digital gift card with the certified card checkout.
 *
 * review → POST /api/gift-cards/create (pending order for exactly the amount)
 * payment → CardPaymentForm → /api/payments/initiate → 3DS (ThreeDSecureModal)
 * result → the bank approved: the confirm trigger issued the card; poll
 *          /api/payments/status for its private link and open it.
 * Same building blocks as the ticket checkout — nothing new on the money path.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Lock } from "lucide-react";
import CardPaymentForm, { type CardFormData } from "@/components/checkout/CardPaymentForm";
import ThreeDSecureModal from "@/components/checkout/ThreeDSecureModal";
import PaymentResult from "@/components/checkout/PaymentResult";
import GiftCardArt from "@/components/gift-cards/GiftCardArt";
import {
  GIFT_CARD_AMOUNTS,
  GIFT_CARD_MAX,
  GIFT_CARD_MESSAGE_MAX,
  GIFT_CARD_MIN,
  GIFT_CARD_VALID_MONTHS,
  giftMoney,
  isValidGiftAmount,
} from "@/lib/gift-cards";
import { trackBeginCheckout, trackPurchase } from "@/lib/track";

type Step = "review" | "payment" | "3ds" | "result";

const CARD_POLL_ATTEMPTS = 8;
const CARD_POLL_MS = 1500;
const HELP_WHATSAPP = "50376804434";
const PHONE_RE = /^(\+?503)?[\s-]?\d{4}[\s-]?\d{4}$/;

const inputClass =
  "w-full px-4 py-3 bg-[#1A1A1A] border border-white/10 text-white rounded-lg focus:border-[#E85D04] focus:outline-none placeholder:text-white/30";

export default function GiftCardCheckout({ initialAmount }: { initialAmount: number | null }) {
  const router = useRouter();
  const preset = initialAmount != null && (GIFT_CARD_AMOUNTS as readonly number[]).includes(initialAmount);
  const [choice, setChoice] = useState<number | "custom">(
    preset ? (initialAmount as number) : initialAmount != null && isValidGiftAmount(initialAmount) ? "custom" : 25,
  );
  const [custom, setCustom] = useState(initialAmount != null && !preset && isValidGiftAmount(initialAmount) ? String(initialAmount) : "");
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [phone, setPhone] = useState("");

  const [step, setStep] = useState<Step>("review");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [redirectData, setRedirectData] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: "paid" | "failed"; message?: string } | null>(null);
  const [cardMissing, setCardMissing] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const amount = useMemo(() => {
    if (choice !== "custom") return choice;
    const n = Number(custom);
    return isValidGiftAmount(n) ? n : null;
  }, [choice, custom]);

  const customInvalid = choice === "custom" && custom !== "" && amount == null;
  const canContinue =
    amount != null &&
    recipient.trim().length > 0 &&
    sender.trim().length > 0 &&
    buyerName.trim().length >= 2 &&
    PHONE_RE.test(phone.trim());

  const goToPayment = useCallback(async () => {
    if (amount == null) {
      setError(`Elige un monto entre $${GIFT_CARD_MIN} y $${GIFT_CARD_MAX} (dólares enteros).`);
      return;
    }
    if (!recipient.trim() || !sender.trim()) {
      setError("Escribe para quién es y de parte de quién.");
      return;
    }
    if (buyerName.trim().length < 2 || !PHONE_RE.test(phone.trim())) {
      setError("Ingresa tu nombre y un WhatsApp válido (XXXX-XXXX).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gift-cards/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          recipientName: recipient.trim(),
          senderName: sender.trim(),
          message: message.trim() || undefined,
          buyerName: buyerName.trim(),
          buyerPhone: phone.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.message || "No se pudo iniciar la compra.");
      setOrderId(data.orderId);
      setOrderNumber(data.orderNumber ?? null);
      setStep("payment");
      trackBeginCheckout(amount);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error("[GiftCardCheckout] create failed", e);
      setError(e instanceof Error ? e.message : "No se pudo iniciar la compra.");
    } finally {
      setLoading(false);
    }
  }, [amount, recipient, sender, message, buyerName, phone]);

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
        if (!res.ok || !data?.success) throw new Error(data?.message || "Error al iniciar el pago.");
        setRedirectData(data.redirectData);
        setStep("3ds");
      } catch (e) {
        console.error("[GiftCardCheckout] payment initiate failed", e);
        setError(e instanceof Error ? e.message : "Error de pago.");
      } finally {
        setLoading(false);
      }
    },
    [orderId],
  );

  const handle3DSComplete = useCallback(
    async (r: { status: "paid" | "failed"; message?: string }) => {
      setResult(r);
      setStep("result");
      if (r.status !== "paid" || !orderId) return;
      if (amount != null) trackPurchase({ value: amount, transactionId: orderId });
      for (let attempt = 0; attempt < CARD_POLL_ATTEMPTS && aliveRef.current; attempt++) {
        try {
          const res = await fetch(`/api/payments/status?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
          const d = await res.json().catch(() => null);
          if (typeof d?.giftCardToken === "string" && d.giftCardToken) {
            router.replace(`/regalo/${d.giftCardToken}?nueva=1`);
            return;
          }
        } catch (err) {
          console.error("[GiftCardCheckout] card lookup failed", err);
        }
        await new Promise((resolve) => setTimeout(resolve, CARD_POLL_MS));
      }
      if (aliveRef.current) setCardMissing(true);
    },
    [orderId, amount, router],
  );

  const finePrint = (
    <p className="text-xs text-white/40 leading-relaxed">
      Válida por {GIFT_CARD_VALID_MONTHS} meses desde la compra · Se canjea en nuestras 5 sucursales · El saldo se
      descuenta en cada visita · No canjeable por efectivo.
    </p>
  );

  // ─── Result ────────────────────────────────────────────────
  if (step === "result" && result) {
    const helpHref = `https://wa.me/${HELP_WHATSAPP}?text=${encodeURIComponent(
      `Hola, pagué una Gift Card${orderNumber ? ` (pedido #${orderNumber})` : ""} y no me aparece.`,
    )}`;
    return (
      <div className="max-w-lg mx-auto">
        {result.status === "paid" ? (
          <div className="text-center" data-testid="giftcard-paid">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gift className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="font-display text-3xl text-white uppercase mb-2">¡Pago aprobado!</h2>
            {cardMissing ? (
              <p className="text-white/60 text-sm">
                Tu gift card se está generando.{" "}
                <a href={helpHref} target="_blank" rel="noopener noreferrer" className="text-[#25D366] underline">
                  Escríbenos por WhatsApp
                </a>
                {orderNumber ? ` con tu pedido #${orderNumber}` : ""} y te la enviamos.
              </p>
            ) : (
              <p className="text-white/50 text-sm">Abriendo tu gift card…</p>
            )}
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
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <GiftCardArt amount={amount} recipientName={recipient.trim() || null} />

      {step === "review" && (
        <div className="bg-[#141414] border border-white/10 rounded-xl p-5 space-y-5" data-testid="giftcard-form">
          <div>
            <p className="text-sm text-white/60 mb-2">Monto</p>
            <div className="grid grid-cols-5 gap-2">
              {GIFT_CARD_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setChoice(a);
                    setError(null);
                  }}
                  aria-pressed={choice === a}
                  className={`h-12 rounded-lg border text-sm font-bold transition ${
                    choice === a
                      ? "bg-[#E85D04] border-[#E85D04] text-white"
                      : "bg-[#1A1A1A] border-white/10 text-white/80 hover:border-white/30"
                  }`}
                >
                  ${a}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setChoice("custom");
                  setError(null);
                }}
                aria-pressed={choice === "custom"}
                className={`h-12 rounded-lg border text-xs font-bold transition ${
                  choice === "custom"
                    ? "bg-[#E85D04] border-[#E85D04] text-white"
                    : "bg-[#1A1A1A] border-white/10 text-white/80 hover:border-white/30"
                }`}
              >
                Otro
              </button>
            </div>
            {choice === "custom" && (
              <div className="mt-3">
                <label htmlFor="gift-custom" className="sr-only">
                  Monto en dólares
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                  <input
                    id="gift-custom"
                    inputMode="numeric"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder={`${GIFT_CARD_MIN} a ${GIFT_CARD_MAX}`}
                    className={`${inputClass} pl-8`}
                  />
                </div>
                {customInvalid && (
                  <p className="mt-1 text-xs text-red-400">
                    Entre ${GIFT_CARD_MIN} y ${GIFT_CARD_MAX}, en dólares enteros.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="gift-to" className="block text-sm text-white/60 mb-2">
                Para
              </label>
              <input id="gift-to" value={recipient} onChange={(e) => setRecipient(e.target.value.slice(0, 80))} placeholder="Nombre" className={inputClass} />
            </div>
            <div>
              <label htmlFor="gift-from" className="block text-sm text-white/60 mb-2">
                De
              </label>
              <input id="gift-from" value={sender} onChange={(e) => setSender(e.target.value.slice(0, 80))} placeholder="Tu nombre" className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="gift-msg" className="block text-sm text-white/60 mb-2">
              Mensaje <span className="text-white/30">(opcional)</span>
            </label>
            <textarea
              id="gift-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, GIFT_CARD_MESSAGE_MAX))}
              rows={2}
              placeholder="¡Feliz Navidad! Disfrútala."
              className={`${inputClass} resize-none`}
            />
            <p className="mt-1 text-right text-[11px] text-white/30">
              {message.length}/{GIFT_CARD_MESSAGE_MAX}
            </p>
          </div>

          <div className="border-t border-white/10 pt-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Tus datos (quien paga)</p>
            <div>
              <label htmlFor="gift-buyer" className="block text-sm text-white/60 mb-2">
                Nombre
              </label>
              <input id="gift-buyer" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} autoComplete="name" placeholder="Tu nombre completo" className={inputClass} />
            </div>
            <div>
              <label htmlFor="gift-phone" className="block text-sm text-white/60 mb-2">
                WhatsApp
              </label>
              <input id="gift-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="+503 XXXX-XXXX" className={inputClass} />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-white/60">Total</span>
            <span className="text-2xl font-bold text-white tabular-nums">{amount != null ? giftMoney(amount) : "—"}</span>
          </div>

          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={goToPayment}
            disabled={loading || !canContinue}
            data-testid="giftcard-continue"
            className="w-full py-4 bg-[#E85D04] hover:bg-[#C2410C] disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {loading ? "..." : "Continuar al pago"}
          </button>
          {finePrint}
        </div>
      )}

      {step === "payment" && amount != null && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-white/10 rounded-xl p-5 text-sm">
            <div className="flex justify-between gap-3 text-white/70">
              <span>
                Gift Card para {recipient.trim()} · de {sender.trim()}
              </span>
              <span className="tabular-nums">{giftMoney(amount)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("review");
                setOrderId(null);
                setOrderNumber(null);
                setError(null);
              }}
              className="mt-2 text-xs text-[#E85D04] hover:underline"
            >
              Cambiar datos
            </button>
          </div>
          <CardPaymentForm
            onSubmit={handlePayment}
            loading={loading}
            error={error}
            defaultBilling={{ phone: phone.trim() }}
            defaultHolder={buyerName.trim()}
            amountLabel={giftMoney(amount)}
          />
          {finePrint}
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
  );
}
