"use client";

/**
 * /admin/giftcards/<code> — the register screen. Opened by scanning the gift
 * card's QR with the phone camera (or typing the code). Shows the balance big,
 * deducts an amount at a chosen branch with a second confirming tap, and shows
 * the full ledger. Managers can void a card (reason required).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Ban } from "lucide-react";
import {
  GIFT_STATE_LABEL,
  formatGiftCode,
  giftDateLong,
  giftDateTime,
  giftMoney,
  type GiftCardState,
} from "@/lib/gift-cards";

interface Tx {
  id: string;
  kind: "issue" | "redeem" | "void";
  amount: number;
  balance_after: number;
  location_name: string | null;
  staff_name: string | null;
  note: string | null;
  created_at: string;
}

interface Card {
  id: string;
  code: string;
  initial_amount: number;
  balance: number;
  state: GiftCardState;
  recipient_name: string | null;
  sender_name: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  expires_at: string;
  void_reason: string | null;
  order_number: string | null;
  transactions: Tx[];
}

interface Payload {
  card: Card;
  locations: { id: string; name: string }[];
  staffRole: string;
}

const LOC_KEY = "sd_giftcard_location";
const STATE_STYLE: Record<GiftCardState, string> = {
  active: "bg-[#4CAF50]/15 text-[#4CAF50]",
  used: "bg-[#3D3936] text-[#A8A29E]",
  expired: "bg-[#FBBF24]/15 text-[#FBBF24]",
  void: "bg-red-500/15 text-red-300",
};
const KIND_LABEL: Record<Tx["kind"], string> = { issue: "Compra", redeem: "Canje", void: "Anulación" };

export default function GiftCardRedeemPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [locationId, setLocationId] = useState("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const [voidReason, setVoidReason] = useState("");
  const [voidConfirm, setVoidConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/gift-cards/${encodeURIComponent(code)}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) throw new Error(json?.message || `Error ${res.status}`);
      const data = json.data as Payload;
      setPayload(data);
      setLocationId((prev) => {
        if (prev) return prev;
        let saved = "";
        try {
          saved = localStorage.getItem(LOC_KEY) ?? "";
        } catch {
          saved = "";
        }
        return data.locations.some((l) => l.id === saved) ? saved : "";
      });
    } catch (e) {
      console.error("[GiftCardRedeem] load", e);
      setLoadError(e instanceof Error ? e.message : "No se pudo cargar.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  const card = payload?.card ?? null;
  const parsedAmount = useMemo(() => {
    const n = Number(amount.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  }, [amount]);
  const tooMuch = card != null && parsedAmount != null && parsedAmount > card.balance;
  const canRedeem = card?.state === "active" && parsedAmount != null && !tooMuch && locationId !== "";

  const redeem = async () => {
    if (!card || parsedAmount == null) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/gift-cards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: card.code, amount: parsedAmount, locationId, note: note.trim() || undefined }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) throw new Error(json?.message || `Error ${res.status}`);
      try {
        localStorage.setItem(LOC_KEY, locationId);
      } catch {
        /* private mode — only the default branch is lost */
      }
      // Refresh first: the confirmation must never sit next to the old balance.
      setAmount("");
      setNote("");
      await load();
      setNotice({ kind: "ok", text: json.message as string });
    } catch (e) {
      console.error("[GiftCardRedeem] redeem", e);
      await load();
      setNotice({ kind: "error", text: e instanceof Error ? e.message : "No se pudo descontar." });
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  const voidCard = async () => {
    if (!card) return;
    if (!voidConfirm) {
      setVoidConfirm(true);
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/gift-cards/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, reason: voidReason.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) throw new Error(json?.message || `Error ${res.status}`);
      setVoidReason("");
      await load();
      setNotice({ kind: "ok", text: json.message as string });
    } catch (e) {
      console.error("[GiftCardRedeem] void", e);
      setNotice({ kind: "error", text: e instanceof Error ? e.message : "No se pudo anular." });
    } finally {
      setBusy(false);
      setVoidConfirm(false);
    }
  };

  const canVoid = payload != null && ["owner", "admin", "manager"].includes(payload.staffRole);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/giftcards" className="inline-flex items-center gap-2 text-sm text-[#A8A29E] hover:text-[#FFF8F0] mb-4">
        <ArrowLeft className="w-4 h-4" /> Gift Cards
      </Link>

      {loading && !payload ? (
        <div className="h-64 bg-[#1F1D1A] border border-[#3D3936] animate-pulse" aria-busy="true" />
      ) : loadError ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 border border-red-500/40 bg-red-500/10 px-4 py-4 text-red-200">
          <AlertTriangle className="w-5 h-5" /> {loadError}
          <button type="button" onClick={() => void load()} className="underline font-semibold">Reintentar</button>
        </div>
      ) : card && payload ? (
        <div className="space-y-4">
          <div className="bg-[#1F1D1A] border border-[#3D3936] p-5" data-testid="gc-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-lg text-[#FFF8F0]">{formatGiftCode(card.code)}</p>
                <p className="text-sm text-[#A8A29E]">
                  Para <span className="text-[#FFF8F0]">{card.recipient_name ?? "—"}</span>
                  {card.sender_name ? ` · de ${card.sender_name}` : ""}
                </p>
              </div>
              <span className={`px-2 py-1 text-sm ${STATE_STYLE[card.state]}`} data-testid="gc-state">
                {GIFT_STATE_LABEL[card.state]}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-6">
              <div>
                <p className="text-sm text-[#6B6560]">Saldo disponible</p>
                <p className="text-5xl font-bold text-[#FFF8F0] tabular-nums" data-testid="gc-balance">{giftMoney(card.balance)}</p>
                <p className="text-sm text-[#6B6560]">de {giftMoney(card.initial_amount)}</p>
              </div>
              <div className="text-sm text-[#A8A29E] space-y-0.5">
                <p>Vence: <span className="text-[#FFF8F0]">{giftDateLong(card.expires_at)}</span></p>
                <p>Compró: {card.buyer_name ?? "—"}{card.buyer_phone ? ` · ${card.buyer_phone}` : ""}</p>
                {card.order_number && <p>Pedido #{card.order_number}</p>}
                {card.void_reason && <p className="text-red-300">Anulada: {card.void_reason}</p>}
              </div>
            </div>
          </div>

          {notice && (
            <div
              role="status"
              data-testid="gc-notice"
              data-kind={notice.kind}
              className={`flex items-center gap-2 border px-4 py-3 text-sm ${
                notice.kind === "ok" ? "border-[#4CAF50]/40 bg-[#4CAF50]/10 text-[#9BE39F]" : "border-red-500/40 bg-red-500/10 text-red-200"
              }`}
            >
              {notice.kind === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {notice.text}
            </div>
          )}

          {card.state === "active" ? (
            <div className="bg-[#1F1D1A] border border-[#3D3936] p-5 space-y-4" data-testid="gc-redeem">
              <p className="font-semibold text-[#FFF8F0]">Cobrar con esta gift card</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs text-[#A8A29E]">
                  Monto a descontar
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6560]">$</span>
                    <input
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value.replace(/[^0-9.,]/g, "").slice(0, 8));
                        setConfirming(false);
                      }}
                      inputMode="decimal"
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-3 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] text-lg focus:border-[#FF6B35] focus:outline-none"
                      data-testid="gc-amount"
                    />
                  </div>
                  {tooMuch && <span className="mt-1 block text-red-300">Supera el saldo ({giftMoney(card.balance)}).</span>}
                </label>
                <label className="text-xs text-[#A8A29E]">
                  Sucursal
                  <select
                    value={locationId}
                    onChange={(e) => {
                      setLocationId(e.target.value);
                      setConfirming(false);
                    }}
                    className="mt-1 w-full px-3 py-3 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
                    data-testid="gc-location"
                  >
                    <option value="">Elige la sucursal…</option>
                    {payload.locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-xs text-[#A8A29E]">
                Nota <span className="text-[#6B6560]">(opcional: # de cuenta o mesa)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  className="mt-1 w-full px-3 py-2 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] text-sm focus:border-[#FF6B35] focus:outline-none"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void redeem()}
                  disabled={!canRedeem || busy}
                  data-testid="gc-redeem-btn"
                  className={`inline-flex items-center gap-2 px-5 py-3 font-semibold text-white transition disabled:bg-[#3D3936] disabled:text-[#6B6560] ${
                    confirming ? "bg-[#4CAF50] hover:bg-[#43A047]" : "bg-[#FF6B35] hover:bg-[#E55A2B]"
                  }`}
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {parsedAmount == null
                    ? "Descontar"
                    : confirming
                      ? `Confirmar: descontar ${giftMoney(parsedAmount)}`
                      : `Descontar ${giftMoney(parsedAmount)}`}
                </button>
                {confirming && (
                  <button type="button" onClick={() => setConfirming(false)} className="text-sm text-[#A8A29E] hover:underline">
                    Cancelar
                  </button>
                )}
                {locationId === "" && parsedAmount != null && <span className="text-xs text-[#FBBF24]">Elige la sucursal.</span>}
              </div>
            </div>
          ) : (
            <div className="bg-[#1F1D1A] border border-[#3D3936] p-5 text-[#A8A29E]">
              Esta gift card no se puede usar: {GIFT_STATE_LABEL[card.state].toLowerCase()}.
            </div>
          )}

          <div className="bg-[#1F1D1A] border border-[#3D3936] p-5" data-testid="gc-ledger">
            <p className="font-semibold text-[#FFF8F0] mb-3">Movimientos</p>
            <ul className="divide-y divide-[#3D3936] text-sm">
              {card.transactions.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-[#A8A29E]">
                    <span className="text-[#FFF8F0]">{KIND_LABEL[t.kind]}</span> · {giftDateTime(t.created_at)}
                    {t.location_name ? ` · ${t.location_name}` : ""}
                    {t.staff_name ? ` · ${t.staff_name}` : ""}
                    {t.note ? ` · ${t.note}` : ""}
                  </span>
                  <span className="tabular-nums text-[#FFF8F0]">
                    {t.kind === "issue" ? "+" : "−"}
                    {giftMoney(t.amount)} <span className="text-[#6B6560]">→ {giftMoney(t.balance_after)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {canVoid && card.state !== "void" && (
            <div className="bg-[#1F1D1A] border border-red-500/20 p-5 space-y-3">
              <p className="font-semibold text-red-200 flex items-center gap-2"><Ban className="w-4 h-4" /> Anular gift card</p>
              <p className="text-xs text-[#A8A29E]">Para reembolsos, fraude o errores. El saldo restante queda inutilizable y queda registrado quién y por qué.</p>
              <input
                value={voidReason}
                onChange={(e) => {
                  setVoidReason(e.target.value.slice(0, 200));
                  setVoidConfirm(false);
                }}
                placeholder="Motivo (obligatorio)"
                className="w-full px-3 py-2 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] text-sm focus:border-red-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void voidCard()}
                disabled={voidReason.trim().length < 3 || busy}
                className="px-4 py-2 text-sm font-semibold border border-red-400/50 text-red-200 hover:bg-red-500/10 disabled:opacity-40"
              >
                {voidConfirm ? "Confirmar anulación" : "Anular"}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
