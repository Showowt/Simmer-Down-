"use client";

/**
 * Admin → Panel · "Segmentación de ventas"
 *
 * Owner-requested (Oct 2026) segmented view of all commerce over a date range:
 * revenue + counts by CHANNEL (recoger / delivery / en-mesa / boletos /
 * habitaciones) and by LOCATION. Read-only. Backed by GET /api/admin/segments.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  Truck,
  UtensilsCrossed,
  Ticket,
  BedDouble,
  Layers,
  Loader2,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";

interface Cell {
  orders: number;
  revenue: number;
}
interface LocationRow {
  key: string;
  name: string;
  channels: Record<string, Cell>;
  total: Cell;
}
interface SegmentsData {
  success: boolean;
  range: { from: string; to: string; days: number };
  channels: Record<string, Cell>;
  activeChannels: string[];
  totals: Cell;
  byLocation: LocationRow[];
}

const CHANNEL_META: Record<
  string,
  { label: string; unit: string; color: string; Icon: LucideIcon }
> = {
  pickup: { label: "Recoger", unit: "pedidos", color: "#4CAF50", Icon: ShoppingBag },
  delivery: { label: "Delivery", unit: "pedidos", color: "#FF6B35", Icon: Truck },
  dine_in: { label: "En mesa", unit: "pedidos", color: "#B8B0A8", Icon: UtensilsCrossed },
  takeout: { label: "Para llevar", unit: "pedidos", color: "#B8B0A8", Icon: ShoppingBag },
  otro: { label: "Otro", unit: "pedidos", color: "#6B6560", Icon: ShoppingBag },
  tickets: { label: "Boletos", unit: "boletos", color: "#FBBF24", Icon: Ticket },
  rooms: { label: "Habitaciones", unit: "reservas", color: "#A78BFA", Icon: BedDouble },
};

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function daysAgo(n: number): string {
  return localDayKey(new Date(Date.now() - n * 86_400_000));
}

const PRESETS: { id: string; label: string; from: () => string; to: () => string }[] = [
  { id: "today", label: "Hoy", from: () => daysAgo(0), to: () => daysAgo(0) },
  { id: "7", label: "7 días", from: () => daysAgo(6), to: () => daysAgo(0) },
  { id: "30", label: "30 días", from: () => daysAgo(29), to: () => daysAgo(0) },
  { id: "90", label: "90 días", from: () => daysAgo(89), to: () => daysAgo(0) },
];

const inputCls =
  "bg-[#1F1D1A] border border-[#3D3936] px-2.5 py-1.5 text-[#FFF8F0] text-sm focus:outline-none focus:border-[#FF6B35] [color-scheme:dark]";

export default function SegmentBreakdown() {
  const [from, setFrom] = useState(() => daysAgo(89));
  const [to, setTo] = useState(() => daysAgo(0));
  const [data, setData] = useState<SegmentsData | null>(null);
  const [loading, setLoading] = useState(true);

  const activePreset = useMemo(
    () => PRESETS.find((p) => p.from() === from && p.to() === to)?.id ?? null,
    [from, to],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/segments?from=${from}&to=${to}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as SegmentsData;
      if (res.ok && json.success) setData(json);
    } catch {
      // keep last render
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const channelList = data?.activeChannels ?? ["pickup", "delivery", "tickets", "rooms"];
  const maxLocTotal = Math.max(1, ...(data?.byLocation.map((l) => l.total.revenue) ?? [1]));

  return (
    <div className="bg-[#252320] border border-[#3D3936] mb-6">
      {/* Header + range controls */}
      <div className="p-5 border-b border-[#3D3936]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#FF6B35]" />
            <h2 className="text-lg font-semibold text-[#FFF8F0]">Segmentación de ventas</h2>
            {loading && <Loader2 className="w-4 h-4 text-[#6B6560] animate-spin" />}
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-[#1F1D1A] border border-[#3D3936] hover:border-[#FF6B35]/50 text-[#B8B0A8] px-3 py-1.5 text-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </button>
        </div>
        <p className="text-sm text-[#6B6560] mt-1">
          Pedidos (recoger / delivery), boletos y habitaciones por canal y por ubicación.
        </p>

        <div className="flex items-center gap-2 flex-wrap mt-4">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setFrom(p.from());
                setTo(p.to());
              }}
              className={`px-3 py-1.5 text-sm border transition ${
                activePreset === p.id
                  ? "bg-[#FF6B35] border-[#FF6B35] text-white"
                  : "bg-[#1F1D1A] border-[#3D3936] text-[#B8B0A8] hover:border-[#FF6B35]/50"
              }`}
            >
              {p.label}
            </button>
          ))}
          <span className="w-px h-6 bg-[#3D3936] mx-1" />
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className={inputCls}
          />
          <span className="text-[#6B6560] text-sm">→</span>
          <input
            type="date"
            value={to}
            min={from}
            max={daysAgo(0)}
            onChange={(e) => setTo(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Channel summary tiles */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {channelList.map((c) => {
            const meta = CHANNEL_META[c];
            const cell = data?.channels[c] ?? { orders: 0, revenue: 0 };
            if (!meta) return null;
            const Icon = meta.Icon;
            return (
              <div key={c} className="bg-[#1F1D1A] border border-[#3D3936] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                  <span className="text-sm text-[#B8B0A8]">{meta.label}</span>
                </div>
                <p className="text-xl font-bold text-[#FFF8F0] tabular-nums">
                  {money(cell.revenue)}
                </p>
                <p className="text-xs text-[#6B6560] mt-0.5 tabular-nums">
                  {cell.orders} {meta.unit}
                </p>
              </div>
            );
          })}
          <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-sm text-[#FF8C42]">Total</span>
            </div>
            <p className="text-xl font-bold text-[#FFF8F0] tabular-nums">
              {money(data?.totals.revenue ?? 0)}
            </p>
            <p className="text-xs text-[#6B6560] mt-0.5 tabular-nums">
              {data?.totals.orders ?? 0} transacciones
            </p>
          </div>
        </div>

        {/* Location × channel matrix */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[#6B6560] border-b border-[#3D3936]">
                <th className="py-2 pr-4 font-medium">Ubicación</th>
                {channelList.map((c) => (
                  <th key={c} className="py-2 px-3 font-medium text-right whitespace-nowrap">
                    {CHANNEL_META[c]?.label ?? c}
                  </th>
                ))}
                <th className="py-2 pl-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(data?.byLocation ?? []).map((loc) => {
                const dim = loc.total.orders === 0;
                return (
                  <tr
                    key={loc.key}
                    className={`border-b border-[#3D3936] last:border-0 ${dim ? "opacity-40" : ""}`}
                  >
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-[#FFF8F0]">{loc.name}</div>
                      <div className="h-1 mt-1 bg-[#3D3936] max-w-[120px]">
                        <div
                          className="h-full bg-[#FF6B35]"
                          style={{ width: `${(loc.total.revenue / maxLocTotal) * 100}%` }}
                        />
                      </div>
                    </td>
                    {channelList.map((c) => {
                      const cell = loc.channels[c] ?? { orders: 0, revenue: 0 };
                      return (
                        <td key={c} className="py-2.5 px-3 text-right tabular-nums">
                          {cell.orders === 0 ? (
                            <span className="text-[#3D3936]">—</span>
                          ) : (
                            <>
                              <div className="text-[#FFF8F0]">{money(cell.revenue)}</div>
                              <div className="text-[11px] text-[#6B6560]">{cell.orders}</div>
                            </>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 pl-3 text-right tabular-nums">
                      <div className="font-semibold text-[#FFF8F0]">{money(loc.total.revenue)}</div>
                      <div className="text-[11px] text-[#6B6560]">{loc.total.orders}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#3D3936] font-semibold">
                <td className="py-2.5 pr-4 text-[#B8B0A8]">Total</td>
                {channelList.map((c) => {
                  const cell = data?.channels[c] ?? { orders: 0, revenue: 0 };
                  return (
                    <td key={c} className="py-2.5 px-3 text-right tabular-nums text-[#FFF8F0]">
                      {cell.revenue === 0 ? (
                        <span className="text-[#3D3936]">—</span>
                      ) : (
                        money(cell.revenue)
                      )}
                    </td>
                  );
                })}
                <td className="py-2.5 pl-3 text-right tabular-nums text-[#FF8C42]">
                  {money(data?.totals.revenue ?? 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-[11px] text-[#6B6560] mt-3">
          Habitaciones: reservas registradas (el pago se cobra al llegar). Ventas aceptadas
          únicamente; pedidos pendientes y cancelados no se cuentan.
        </p>
      </div>
    </div>
  );
}
