"use client";

/**
 * Admin — Gift Cards: what was sold, what is still owed (unspent balance),
 * what was redeemed; search any card; jump to the redeem screen by code.
 */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CreditCard, Loader2, RefreshCw, Search, ScanLine } from "lucide-react";
import { GIFT_STATE_LABEL, formatGiftCode, giftDateTime, giftMoney, normalizeGiftCode, type GiftCardState } from "@/lib/gift-cards";

interface ListCard {
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
  created_at: string;
}

interface Payload {
  cards: ListCard[];
  stats: { sold: number; soldAmount: number; outstanding: number; redeemed: number };
}

const STATE_STYLE: Record<GiftCardState, string> = {
  active: "bg-[#4CAF50]/15 text-[#4CAF50]",
  used: "bg-[#3D3936] text-[#A8A29E]",
  expired: "bg-[#FBBF24]/15 text-[#FBBF24]",
  void: "bg-red-500/15 text-red-300",
};

export default function AdminGiftCardsPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/gift-cards${query ? `?q=${encodeURIComponent(query)}` : ""}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) throw new Error(json?.message || `Error ${res.status}`);
      setPayload(json.data as Payload);
    } catch (e) {
      console.error("[AdminGiftCards] load", e);
      setError(e instanceof Error ? e.message : "No se pudo cargar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  const openCode = (e: FormEvent) => {
    e.preventDefault();
    const c = normalizeGiftCode(code);
    if (!c) {
      setCodeError("Código inválido: son 12 caracteres (SD-XXXX-XXXX-XXXX).");
      return;
    }
    router.push(`/admin/giftcards/${c}`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#FF6B35]" /> Gift Cards
          </h1>
          <p className="text-[#6B6560] max-w-2xl">
            Tarjetas digitales vendidas en simmerdownsv.com/giftcard. Para cobrar con una, escanea su QR con la cámara
            del teléfono o escribe el código aquí.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(q)}
          className="self-start inline-flex items-center gap-2 border border-[#3D3936] px-3 py-2 text-sm text-[#FFF8F0] hover:border-[#FF6B35] transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>

      {/* Redeem by code */}
      <form onSubmit={openCode} className="mb-6 bg-[#1F1D1A] border border-[#3D3936] p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <ScanLine className="hidden sm:block w-6 h-6 text-[#FF6B35]" />
        <label htmlFor="gc-code" className="text-sm text-[#FFF8F0] shrink-0">Cobrar con gift card</label>
        <input
          id="gc-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setCodeError(null);
          }}
          placeholder="SD-XXXX-XXXX-XXXX"
          autoCapitalize="characters"
          autoComplete="off"
          className="flex-1 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] px-3 py-2 font-mono tracking-wider focus:border-[#FF6B35] focus:outline-none"
          data-testid="gc-code-input"
        />
        <button type="submit" className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-4 py-2 font-medium">
          Abrir
        </button>
        {codeError && <p className="text-sm text-red-300 sm:basis-full">{codeError}</p>}
      </form>

      {error && (
        <div role="alert" className="mb-6 flex items-center gap-3 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="w-4 h-4" /> {error}
          <button type="button" onClick={() => void load(q)} className="underline font-semibold">Reintentar</button>
        </div>
      )}

      {payload && (
        <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Vendidas", value: String(payload.stats.sold) },
            { label: "Total vendido", value: giftMoney(payload.stats.soldAmount) },
            { label: "Saldo por canjear", value: giftMoney(payload.stats.outstanding), hint: "lo que Simmer Down debe en tarjetas activas" },
            { label: "Ya canjeado", value: giftMoney(payload.stats.redeemed) },
          ].map((s) => (
            <div key={s.label} className="bg-[#1F1D1A] border border-[#3D3936] p-4" data-testid="gc-stat">
              <p className="text-sm text-[#6B6560]">{s.label}</p>
              <p className="text-2xl font-bold text-[#FFF8F0]">{s.value}</p>
              {s.hint && <p className="text-[11px] text-[#6B6560]">{s.hint}</p>}
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(q.trim());
        }}
        className="mb-4 relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código, teléfono o nombre… (Enter)"
          className="w-full pl-10 pr-4 py-2 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
        />
      </form>

      {loading && !payload ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-[#1F1D1A] border border-[#3D3936] animate-pulse" />)}
        </div>
      ) : payload && payload.cards.length === 0 ? (
        <div className="bg-[#1F1D1A] border border-[#3D3936] p-8 text-center text-[#6B6560]">
          {q ? "Ninguna gift card coincide con la búsqueda." : "Todavía no se ha vendido ninguna gift card en línea."}
        </div>
      ) : payload ? (
        <div className="bg-[#1F1D1A] border border-[#3D3936] divide-y divide-[#3D3936]" data-testid="gc-list">
          {payload.cards.map((c) => (
            <Link
              key={c.id}
              href={`/admin/giftcards/${c.code}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-[#252320] transition"
            >
              <span className="font-mono text-sm text-[#FFF8F0] w-44">{formatGiftCode(c.code)}</span>
              <span className="flex-1 min-w-[10rem] text-sm text-[#A8A29E]">
                Para <span className="text-[#FFF8F0]">{c.recipient_name ?? "—"}</span> · compró {c.buyer_name ?? "—"}
                {c.buyer_phone ? ` (${c.buyer_phone})` : ""}
              </span>
              <span className="text-sm text-[#FFF8F0] tabular-nums w-36 text-right">
                {giftMoney(c.balance)} <span className="text-[#6B6560]">/ {giftMoney(c.initial_amount)}</span>
              </span>
              <span className={`px-2 py-0.5 text-xs ${STATE_STYLE[c.state]}`}>{GIFT_STATE_LABEL[c.state]}</span>
              <span className="text-xs text-[#6B6560] w-36 text-right">{giftDateTime(c.created_at)}</span>
            </Link>
          ))}
        </div>
      ) : null}
      {loading && payload && <Loader2 className="mt-3 w-5 h-5 animate-spin text-[#FF6B35]" />}
    </div>
  );
}
