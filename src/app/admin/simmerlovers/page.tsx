"use client";

/**
 * Admin → SimmerLovers: loyalty members + the COUNTER (canje) console.
 *
 * Martin's Nov 2026 ask: "saber de dónde descuento los puntos que acumulen
 * nuestros clientes". Click a member → drawer with their balance, the reward
 * catalog (eligibility pre-computed), one-tap "Canjear" that deducts points
 * and writes the ledger, an admin-only manual ± adjustment, and the member's
 * recent movements. Backed by /api/admin/loyalty/canje.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Flame, Search, RefreshCw, AlertCircle, Users, Star, X, Gift, Loader2,
  MinusCircle, PlusCircle, History,
} from "lucide-react";

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  loyalty_tier: string | null;
  loyalty_points_balance: number | null;
  lifetime_points_earned: number | null;
  total_orders: number | null;
  total_spent: number | null;
  last_order_at: string | null;
  created_at: string;
}

interface DrawerReward {
  id: string;
  name: string;
  name_es: string | null;
  points_required: number;
  reward_type: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  min_tier_required: string | null;
  eligible: boolean;
  reason: string | null;
}

interface DrawerTx {
  id: string;
  transaction_type: string;
  points: number;
  balance_after: number | null;
  description: string | null;
  created_at: string;
}

interface DrawerData {
  customer: Member;
  rewards: DrawerReward[];
  transactions: DrawerTx[];
}

const TIERS: Record<string, { label: string; cls: string }> = {
  bronze: { label: "Bronce", cls: "text-[#CD7F32] bg-[#CD7F32]/10" },
  silver: { label: "Plata", cls: "text-[#C0C0C0] bg-[#C0C0C0]/10" },
  gold: { label: "Oro", cls: "text-[#FFD700] bg-[#FFD700]/10" },
  platinum: { label: "Platino", cls: "text-[#5EEAD4] bg-[#5EEAD4]/10" },
};

const money = (n: number | null) => `$${(Number(n) || 0).toFixed(2)}`;
const fullName = (m: Member) =>
  `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "—";
const fmtDate = (s: string | null) =>
  s
    ? new Date(s).toLocaleDateString("es-SV", { day: "numeric", month: "short", year: "numeric" })
    : "—";
const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString("es-SV", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

export default function AdminSimmerLoversPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<{ total: number; pointsOutstanding: number }>({
    total: 0,
    pointsOutstanding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // ── Drawer (counter console) state ─────────────────────────
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerData | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [busyRewardId, setBusyRewardId] = useState<string | null>(null);
  const [confirmRewardId, setConfirmRewardId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [adjPoints, setAdjPoints] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjBusy, setAdjBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/customers");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al cargar");
      setMembers(json.data?.members ?? []);
      setSummary(json.data?.summary ?? { total: 0, pointsOutstanding: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar miembros");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadDrawer = async (memberId: string) => {
    setDrawerLoading(true);
    setDrawerError(null);
    try {
      const res = await fetch(`/api/admin/loyalty/canje?customer_id=${memberId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al cargar miembro");
      setDrawer(json.data as DrawerData);
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setDrawerLoading(false);
    }
  };

  const openDrawer = (m: Member) => {
    setOpenMemberId(m.id);
    setDrawer(null);
    setConfirmRewardId(null);
    setAdjPoints("");
    setAdjReason("");
    void loadDrawer(m.id);
  };

  const closeDrawer = () => {
    setOpenMemberId(null);
    setDrawer(null);
    setConfirmRewardId(null);
  };

  const redeem = async (reward: DrawerReward) => {
    if (!openMemberId) return;
    setBusyRewardId(reward.id);
    try {
      const res = await fetch("/api/admin/loyalty/canje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: openMemberId, reward_id: reward.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({ kind: "err", text: json.message || "Error al canjear" });
      } else {
        setToast({ kind: "ok", text: json.message || "Canje aplicado" });
        await Promise.all([loadDrawer(openMemberId), load()]);
      }
    } catch {
      setToast({ kind: "err", text: "Error de conexión" });
    } finally {
      setBusyRewardId(null);
      setConfirmRewardId(null);
    }
  };

  const adjust = async (sign: 1 | -1) => {
    if (!openMemberId) return;
    const pts = Math.abs(parseInt(adjPoints, 10) || 0) * sign;
    if (!pts) {
      setToast({ kind: "err", text: "Ingresa los puntos a ajustar" });
      return;
    }
    if (adjReason.trim().length < 3) {
      setToast({ kind: "err", text: "Escribe el motivo del ajuste" });
      return;
    }
    setAdjBusy(true);
    try {
      const res = await fetch("/api/admin/loyalty/canje", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: openMemberId, points: pts, reason: adjReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({ kind: "err", text: json.message || "Error al ajustar" });
      } else {
        setToast({ kind: "ok", text: json.message || "Ajuste aplicado" });
        setAdjPoints("");
        setAdjReason("");
        await Promise.all([loadDrawer(openMemberId), load()]);
      }
    } catch {
      setToast({ kind: "err", text: "Error de conexión" });
    } finally {
      setAdjBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [fullName(m), m.email ?? "", m.phone ?? ""].join(" ").toLowerCase().includes(q),
    );
  }, [members, query]);

  const drawerTier = drawer
    ? (TIERS[drawer.customer.loyalty_tier ?? "bronze"] ?? TIERS.bronze)
    : TIERS.bronze;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0] flex items-center gap-2">
            <Flame className="w-6 h-6 text-[#FF6B35]" /> SimmerLovers
          </h1>
          <p className="text-[#6B6560]">
            Toca un miembro para canjear recompensas y descontar puntos en mostrador
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2.5 text-[#B8B0A8] border border-[#3D3936] hover:bg-[#3D3936] transition"
          title="Recargar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {toast && (
        <div
          className={`mb-5 px-4 py-3 text-sm border ${
            toast.kind === "ok"
              ? "bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#8FD694]"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#252320] border border-[#3D3936] p-4">
          <p className="text-xs text-[#6B6560] uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Miembros
          </p>
          <p className="text-2xl font-bold text-[#FFF8F0] mt-1">{summary.total}</p>
        </div>
        <div className="bg-[#252320] border border-[#3D3936] p-4">
          <p className="text-xs text-[#6B6560] uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" /> Puntos activos
          </p>
          <p className="text-2xl font-bold text-[#FF6B35] mt-1">
            {summary.pointsOutstanding.toLocaleString("es-SV")}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-[#6B6560] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, correo o teléfono…"
          className="w-full pl-10 pr-4 py-2.5 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:border-[#FF6B35] focus:outline-none"
        />
      </div>

      {/* Body */}
      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : error ? (
        <div className="bg-[#252320] border border-red-500/30 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-[#B8B0A8] mb-4">{error}</p>
          <button
            onClick={load}
            className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-4 py-2 font-medium transition"
          >
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <Flame className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
          <p className="text-[#B8B0A8]">
            {members.length === 0 ? "Aún no hay miembros SimmerLovers" : "Sin resultados"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-[#252320] border border-[#3D3936] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#6B6560] border-b border-[#3D3936]">
                  <th className="px-4 py-3 font-medium">Miembro</th>
                  <th className="px-4 py-3 font-medium">Nivel</th>
                  <th className="px-4 py-3 font-medium text-right">Puntos</th>
                  <th className="px-4 py-3 font-medium text-right">Histórico</th>
                  <th className="px-4 py-3 font-medium text-right">Pedidos</th>
                  <th className="px-4 py-3 font-medium text-right">Gastado</th>
                  <th className="px-4 py-3 font-medium">Se unió</th>
                  <th className="px-4 py-3 font-medium text-right">Canje</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const tier = TIERS[m.loyalty_tier ?? "bronze"] ?? TIERS.bronze;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => openDrawer(m)}
                      className="border-b border-[#3D3936]/60 last:border-0 cursor-pointer hover:bg-[#2D2A26] transition"
                    >
                      <td className="px-4 py-3">
                        <p className="text-[#FFF8F0] font-medium">{fullName(m)}</p>
                        <p className="text-[#6B6560] text-xs">{m.email || m.phone || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 ${tier.cls}`}>
                          {tier.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#FF6B35] font-semibold tabular-nums">
                        {(m.loyalty_points_balance ?? 0).toLocaleString("es-SV")}
                      </td>
                      <td className="px-4 py-3 text-right text-[#B8B0A8] tabular-nums">
                        {(m.lifetime_points_earned ?? 0).toLocaleString("es-SV")}
                      </td>
                      <td className="px-4 py-3 text-right text-[#B8B0A8] tabular-nums">{m.total_orders ?? 0}</td>
                      <td className="px-4 py-3 text-right text-[#B8B0A8] tabular-nums">{money(m.total_spent)}</td>
                      <td className="px-4 py-3 text-[#6B6560]">{fmtDate(m.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5 text-[#FF8C42] text-xs font-semibold">
                          <Gift className="w-3.5 h-3.5" /> Canjear
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((m) => {
              const tier = TIERS[m.loyalty_tier ?? "bronze"] ?? TIERS.bronze;
              return (
                <button
                  key={m.id}
                  onClick={() => openDrawer(m)}
                  className="w-full text-left bg-[#252320] border border-[#3D3936] p-4 hover:border-[#FF6B35]/50 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[#FFF8F0] font-medium">{fullName(m)}</p>
                    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 ${tier.cls}`}>
                      {tier.label}
                    </span>
                  </div>
                  <p className="text-[#6B6560] text-xs mt-0.5">{m.email || m.phone || "—"}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div>
                      <p className="text-[#FF6B35] font-semibold tabular-nums">
                        {(m.loyalty_points_balance ?? 0).toLocaleString("es-SV")}
                      </p>
                      <p className="text-[10px] text-[#6B6560] uppercase">Puntos</p>
                    </div>
                    <div>
                      <p className="text-[#B8B0A8] tabular-nums">{m.total_orders ?? 0}</p>
                      <p className="text-[10px] text-[#6B6560] uppercase">Pedidos</p>
                    </div>
                    <div>
                      <p className="text-[#B8B0A8] tabular-nums">{money(m.total_spent)}</p>
                      <p className="text-[10px] text-[#6B6560] uppercase">Gastado</p>
                    </div>
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[#FF8C42] text-xs font-semibold">
                    <Gift className="w-3.5 h-3.5" /> Canjear puntos
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Counter drawer ──────────────────────────────────── */}
      {openMemberId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={closeDrawer} />
          <div className="relative w-full max-w-md h-full overflow-y-auto bg-[#1F1D1A] border-l border-[#3D3936] p-5">
            <div className="flex items-start justify-between gap-3 mb-5">
              <h2 className="text-lg font-bold text-[#FFF8F0] flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#FF6B35]" /> Canje de puntos
              </h2>
              <button
                onClick={closeDrawer}
                className="p-2 text-[#B8B0A8] border border-[#3D3936] hover:bg-[#3D3936] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {drawerLoading ? (
              <div className="p-10 text-center">
                <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin mx-auto" />
              </div>
            ) : drawerError ? (
              <div className="bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
                {drawerError}
              </div>
            ) : drawer ? (
              <>
                {/* Member summary */}
                <div className="bg-[#252320] border border-[#3D3936] p-4 mb-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[#FFF8F0] font-semibold">{fullName(drawer.customer)}</p>
                    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 ${drawerTier.cls}`}>
                      {drawerTier.label}
                    </span>
                  </div>
                  <p className="text-[#6B6560] text-xs mt-0.5">
                    {drawer.customer.email || drawer.customer.phone || "—"}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-[#FF6B35] tabular-nums">
                    {(drawer.customer.loyalty_points_balance ?? 0).toLocaleString("es-SV")}
                    <span className="text-sm font-medium text-[#6B6560] ml-2">puntos disponibles</span>
                  </p>
                </div>

                {/* Rewards */}
                <h3 className="text-sm font-semibold text-[#FFF8F0] mb-2">Recompensas</h3>
                {drawer.rewards.length === 0 ? (
                  <p className="text-sm text-[#6B6560] mb-5">
                    No hay recompensas activas. Créalas en Premios y Puntos.
                  </p>
                ) : (
                  <div className="space-y-2 mb-6">
                    {drawer.rewards.map((r) => {
                      const busy = busyRewardId === r.id;
                      const confirming = confirmRewardId === r.id;
                      return (
                        <div
                          key={r.id}
                          className={`border p-3 ${
                            r.eligible ? "bg-[#252320] border-[#3D3936]" : "bg-[#252320]/50 border-[#3D3936]/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className={`text-sm font-medium ${r.eligible ? "text-[#FFF8F0]" : "text-[#6B6560]"}`}>
                                {r.name_es || r.name}
                              </p>
                              <p className="text-xs text-[#FF8C42] tabular-nums">
                                {r.points_required.toLocaleString("es-SV")} pts
                                {!r.eligible && r.reason && (
                                  <span className="text-[#6B6560]"> · {r.reason}</span>
                                )}
                              </p>
                            </div>
                            {r.eligible &&
                              (confirming ? (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => redeem(r)}
                                    disabled={busy}
                                    className="bg-[#FF6B35] hover:bg-[#E85D04] text-white px-3 py-1.5 text-xs font-bold transition disabled:opacity-50"
                                  >
                                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirmar"}
                                  </button>
                                  <button
                                    onClick={() => setConfirmRewardId(null)}
                                    disabled={busy}
                                    className="border border-[#3D3936] text-[#B8B0A8] px-2.5 py-1.5 text-xs transition hover:bg-[#3D3936]"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmRewardId(r.id)}
                                  className="shrink-0 border border-[#FF6B35]/60 text-[#FF8C42] hover:bg-[#FF6B35] hover:text-white px-3 py-1.5 text-xs font-semibold transition"
                                >
                                  Canjear
                                </button>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Manual adjustment (admin) */}
                <h3 className="text-sm font-semibold text-[#FFF8F0] mb-2">Ajuste manual (admin)</h3>
                <div className="bg-[#252320] border border-[#3D3936] p-3 mb-6 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={adjPoints}
                      onChange={(e) => setAdjPoints(e.target.value)}
                      placeholder="Puntos"
                      className="w-28 bg-[#1F1D1A] border border-[#3D3936] px-3 py-2 text-[#FFF8F0] text-sm focus:outline-none focus:border-[#FF6B35]"
                    />
                    <input
                      value={adjReason}
                      onChange={(e) => setAdjReason(e.target.value)}
                      placeholder="Motivo (ej. cortesía, corrección)"
                      className="flex-1 bg-[#1F1D1A] border border-[#3D3936] px-3 py-2 text-[#FFF8F0] text-sm focus:outline-none focus:border-[#FF6B35]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => adjust(1)}
                      disabled={adjBusy}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-[#4CAF50]/40 text-[#8FD694] hover:bg-[#4CAF50]/15 px-3 py-2 text-xs font-semibold transition disabled:opacity-50"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Agregar
                    </button>
                    <button
                      onClick={() => adjust(-1)}
                      disabled={adjBusy}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-red-500/40 text-red-300 hover:bg-red-500/15 px-3 py-2 text-xs font-semibold transition disabled:opacity-50"
                    >
                      <MinusCircle className="w-3.5 h-3.5" /> Descontar
                    </button>
                  </div>
                </div>

                {/* Movements */}
                <h3 className="text-sm font-semibold text-[#FFF8F0] mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#6B6560]" /> Movimientos recientes
                </h3>
                {drawer.transactions.length === 0 ? (
                  <p className="text-sm text-[#6B6560]">Sin movimientos todavía.</p>
                ) : (
                  <div className="space-y-1.5">
                    {drawer.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-3 bg-[#252320] border border-[#3D3936] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-[#B8B0A8] truncate">
                            {tx.description || tx.transaction_type}
                          </p>
                          <p className="text-[10px] text-[#6B6560]">{fmtDateTime(tx.created_at)}</p>
                        </div>
                        <p
                          className={`shrink-0 text-sm font-semibold tabular-nums ${
                            tx.points >= 0 ? "text-[#8FD694]" : "text-red-300"
                          }`}
                        >
                          {tx.points >= 0 ? "+" : ""}
                          {tx.points.toLocaleString("es-SV")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
