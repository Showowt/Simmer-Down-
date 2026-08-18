"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, Search, RefreshCw, AlertCircle, Users, Star } from "lucide-react";

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

export default function AdminSimmerLoversPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<{ total: number; pointsOutstanding: number }>({
    total: 0,
    pointsOutstanding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [fullName(m), m.email ?? "", m.phone ?? ""].join(" ").toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0] flex items-center gap-2">
            <Flame className="w-6 h-6 text-[#FF6B35]" /> SimmerLovers
          </h1>
          <p className="text-[#6B6560]">Miembros del programa de lealtad</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2.5 text-[#B8B0A8] border border-[#3D3936] hover:bg-[#3D3936] transition"
          title="Recargar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

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
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const tier = TIERS[m.loyalty_tier ?? "bronze"] ?? TIERS.bronze;
                  return (
                    <tr key={m.id} className="border-b border-[#3D3936]/60 last:border-0">
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
                <div key={m.id} className="bg-[#252320] border border-[#3D3936] p-4">
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
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
