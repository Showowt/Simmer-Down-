"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  UtensilsCrossed,
  Calendar,
  MapPin,
  Settings,
  Flame,
  Gift,
  Ticket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/lib/types";
import Link from "next/link";

const EMBER = "#E85D04";

interface DashboardData {
  today: {
    revenue: number;
    orders: number;
    avgTicket: number;
    pending: number;
    promoOrders: number;
    promoDiscount: number;
  };
  deltas: {
    revenueVsYesterday: number;
    revenueVsLastWeek: number;
    ordersVsLastWeek: number;
  };
  week: Array<{ day: string; revenue: number; orders: number }>;
  week7: { revenue: number; orders: number; avgTicket: number };
  hourlyToday: Array<{ orders: number; revenue: number }>;
  byLocation: Array<{ id: string; name: string; orders: number; revenue: number }>;
  topItems: Array<{ name: string; qty: number; revenue: number }>;
  loyalty: { members: number; pointsToday: number; points7d: number };
  tickets?: {
    today: { revenue: number; count: number };
    week: { revenue: number; count: number };
  };
}

/** Real WoW delta vs the same weekday last week. Baseline 0 → no chip. */
function deltaPct(current: number, baseline: number): number | null {
  if (baseline <= 0) return null;
  return ((current - baseline) / baseline) * 100;
}

const DAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

function dayLetter(dayStr: string): string {
  // dayStr is an SV-local YYYY-MM-DD; noon UTC avoids date shift
  return DAY_LETTERS[new Date(`${dayStr}T12:00:00Z`).getUTCDay()];
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const supabase = createClient();
      const [dashRes, ordersRes] = await Promise.all([
        fetch("/api/admin/dashboard").then((r) => (r.ok ? r.json() : null)),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      if (dashRes?.success) setDash(dashRes);
      setOrders(ordersRes?.data || []);
    } catch {
      // keep whatever rendered last
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const supabase = createClient();
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const t = dash?.today;
  const revenueWoW = t ? deltaPct(t.revenue, dash!.deltas.revenueVsLastWeek) : null;
  const ordersWoW = t ? deltaPct(t.orders, dash!.deltas.ordersVsLastWeek) : null;

  const stats = [
    {
      label: "Ingresos Hoy",
      value: t ? `$${t.revenue.toFixed(2)}` : "—",
      icon: DollarSign,
      bgColor: "bg-[#4CAF50]/10",
      iconColor: "text-[#4CAF50]",
      delta: revenueWoW,
      deltaTitle: "vs mismo día semana pasada",
    },
    {
      label: "Pedidos Hoy",
      value: t ? t.orders : "—",
      icon: ShoppingBag,
      bgColor: "bg-[#FF6B35]/10",
      iconColor: "text-[#FF6B35]",
      delta: ordersWoW,
      deltaTitle: "vs mismo día semana pasada",
    },
    {
      label: "Ticket Promedio Hoy",
      value: t ? `$${t.avgTicket.toFixed(2)}` : "—",
      icon: TrendingUp,
      bgColor: "bg-[#FF6B35]/10",
      iconColor: "text-[#FF6B35]",
      delta: null,
      deltaTitle: "",
    },
    {
      label: "Pendientes de Confirmar",
      value: t ? t.pending : "—",
      icon: Clock,
      bgColor: "bg-[#FFB800]/10",
      iconColor: "text-[#FFB800]",
      delta: null,
      deltaTitle: "",
      badge: t && t.pending > 0 ? "Requieren acción" : undefined,
    },
  ];

  const maxWeekRevenue = Math.max(1, ...(dash?.week.map((d) => d.revenue) ?? [1]));
  const bestWeekDay = dash?.week.reduce(
    (best, d) => (d.revenue > best.revenue ? d : best),
    { day: "", revenue: -1, orders: 0 },
  );
  // Service window: 8am–11pm keeps the hourly chart readable
  const hours = dash?.hourlyToday.slice(8, 23) ?? [];
  const maxHourOrders = Math.max(1, ...hours.map((h) => h.orders));
  const maxLocRevenue = Math.max(1, ...(dash?.byLocation.map((l) => l.revenue) ?? [1]));
  const maxItemQty = Math.max(1, ...(dash?.topItems.map((i) => i.qty) ?? [1]));

  const getOrderTotal = (order: Order) =>
    order.total ||
    (order as unknown as { total_amount?: number }).total_amount ||
    0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20";
      case "confirmed":
      case "preparing":
        return "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20";
      case "ready":
        return "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20";
      case "out_for_delivery":
        return "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20";
      case "delivered":
      case "completed":
        return "bg-[#6B6560]/10 text-[#6B6560] border-[#6B6560]/20";
      case "cancelled":
      case "refunded":
        return "bg-[#C73E1D]/10 text-[#C73E1D] border-[#C73E1D]/20";
      default:
        return "bg-[#6B6560]/10 text-[#6B6560] border-[#6B6560]/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "confirmed":
        return "Confirmado";
      case "preparing":
        return "En Preparación";
      case "ready":
        return "Listo";
      case "out_for_delivery":
        return "En Camino";
      case "delivered":
        return "Entregado";
      case "completed":
        return "Completado";
      case "cancelled":
        return "Cancelado";
      case "refunded":
        return "Reembolsado";
      default:
        return status;
    }
  };

  const isDeliveryOrder = (order: Order) => {
    if ("order_type" in order)
      return (
        (order as unknown as { order_type?: string }).order_type === "delivery"
      );
    return order.is_delivery;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0]">
            Panel de Control
          </h1>
          <p className="text-[#6B6560]">
            Bienvenido. Aquí está lo que sucede hoy en las 5 ubicaciones.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-4 py-2 font-medium transition"
        >
          Ver Todos los Pedidos
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Link
          href="/admin/menu"
          className="bg-[#252320] border border-[#3D3936] p-4 hover:border-[#FF6B35] transition group"
        >
          <div className="w-10 h-10 bg-[#FF6B35]/10 flex items-center justify-center mb-3">
            <UtensilsCrossed className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <p className="font-medium text-[#FFF8F0] group-hover:text-[#FF6B35] transition">
            Editar Menú
          </p>
          <p className="text-xs text-[#6B6560] mt-1">
            Agregar o modificar items
          </p>
        </Link>
        <Link
          href="/admin/events"
          className="bg-[#252320] border border-[#3D3936] p-4 hover:border-[#FF6B35] transition group"
        >
          <div className="w-10 h-10 bg-[#FFB800]/10 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-[#FFB800]" />
          </div>
          <p className="font-medium text-[#FFF8F0] group-hover:text-[#FF6B35] transition">
            Eventos
          </p>
          <p className="text-xs text-[#6B6560] mt-1">Gestionar Simmermanía</p>
        </Link>
        <Link
          href="/admin/specials"
          className="bg-[#252320] border border-[#3D3936] p-4 hover:border-[#FF6B35] transition group"
        >
          <div className="w-10 h-10 bg-[#4CAF50]/10 flex items-center justify-center mb-3">
            <Gift className="w-5 h-5 text-[#4CAF50]" />
          </div>
          <p className="font-medium text-[#FFF8F0] group-hover:text-[#FF6B35] transition">
            Especiales
          </p>
          <p className="text-xs text-[#6B6560] mt-1">Promos y 2x1</p>
        </Link>
        <Link
          href="/admin/settings"
          className="bg-[#252320] border border-[#3D3936] p-4 hover:border-[#FF6B35] transition group"
        >
          <div className="w-10 h-10 bg-[#6B6560]/20 flex items-center justify-center mb-3">
            <Settings className="w-5 h-5 text-[#B8B0A8]" />
          </div>
          <p className="font-medium text-[#FFF8F0] group-hover:text-[#FF6B35] transition">
            Configuración
          </p>
          <p className="text-xs text-[#6B6560] mt-1">Ajustes del sistema</p>
        </Link>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#252320] border border-[#3D3936] p-6"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 ${stat.bgColor} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                {stat.delta !== null && stat.delta !== undefined && (
                  <span
                    title={stat.deltaTitle}
                    className={`flex items-center text-sm ${stat.delta >= 0 ? "text-[#4CAF50]" : "text-[#C73E1D]"}`}
                  >
                    {stat.delta >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(stat.delta).toFixed(0)}%
                  </span>
                )}
                {stat.badge && (
                  <span className="text-xs text-[#FFB800] bg-[#FFB800]/10 px-2 py-1">
                    {stat.badge}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-[#FFF8F0] tabular-nums">
                  {stat.value}
                </p>
                <p className="text-sm text-[#6B6560]">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Week + SimmerLovers + Promo tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#252320] border border-[#3D3936] p-5">
          <p className="text-sm text-[#6B6560] mb-1">Últimos 7 días</p>
          <p className="text-xl font-bold text-[#FFF8F0] tabular-nums">
            ${dash ? dash.week7.revenue.toFixed(2) : "—"}
          </p>
          <p className="text-xs text-[#6B6560] mt-1">
            {dash ? `${dash.week7.orders} pedidos · ticket $${dash.week7.avgTicket.toFixed(2)}` : ""}
          </p>
        </div>
        <div className="bg-[#252320] border border-[#3D3936] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="w-4 h-4 text-[#FBBF24]" />
            <p className="text-sm text-[#6B6560]">Boletos (7 días)</p>
          </div>
          <p className="text-xl font-bold text-[#FFF8F0] tabular-nums">
            ${dash?.tickets ? dash.tickets.week.revenue.toFixed(2) : "0.00"}
          </p>
          <p className="text-xs text-[#6B6560] mt-1">
            {dash?.tickets
              ? `${dash.tickets.week.count} boletos · ${dash.tickets.today.count} hoy`
              : "Sin ventas de boletos"}
          </p>
        </div>
        <div className="bg-[#252320] border border-[#3D3936] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-[#E85D04]" />
            <p className="text-sm text-[#6B6560]">SimmerLovers</p>
          </div>
          <p className="text-xl font-bold text-[#FFF8F0] tabular-nums">
            {dash ? dash.loyalty.members : "—"}{" "}
            <span className="text-sm font-normal text-[#6B6560]">miembros</span>
          </p>
          <p className="text-xs text-[#6B6560] mt-1">
            {dash
              ? `+${dash.loyalty.pointsToday} pts hoy · +${dash.loyalty.points7d} pts esta semana`
              : ""}
          </p>
        </div>
        <div className="bg-[#252320] border border-[#3D3936] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-[#4CAF50]" />
            <p className="text-sm text-[#6B6560]">Promos Hoy</p>
          </div>
          <p className="text-xl font-bold text-[#FFF8F0] tabular-nums">
            {t ? t.promoOrders : "—"}{" "}
            <span className="text-sm font-normal text-[#6B6560]">pedidos con promo</span>
          </p>
          <p className="text-xs text-[#6B6560] mt-1">
            {t ? `$${t.promoDiscount.toFixed(2)} en descuentos aplicados` : ""}
          </p>
        </div>
      </div>

      {/* Charts row: 7-day revenue + hourly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#252320] border border-[#3D3936] p-6">
          <h2 className="text-sm font-semibold text-[#FFF8F0] mb-4">
            Ingresos — últimos 7 días
          </h2>
          <div className="flex items-end gap-2 h-36">
            {(dash?.week ?? []).map((d) => (
              <div
                key={d.day}
                className="flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0"
                title={`${d.day}: $${d.revenue.toFixed(2)} · ${d.orders} pedidos`}
              >
                <span className="text-[10px] h-[14px] text-[#B8B0A8] tabular-nums">
                  {d.day === bestWeekDay?.day && d.revenue > 0
                    ? `$${d.revenue.toFixed(0)}`
                    : ""}
                </span>
                <div className="w-full max-w-[36px] flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-[4px] transition-all hover:opacity-80"
                    style={{
                      height: `${Math.max(d.revenue > 0 ? 4 : 1, (d.revenue / maxWeekRevenue) * 100)}%`,
                      backgroundColor: d.revenue > 0 ? EMBER : "#3D3936",
                    }}
                  />
                </div>
                <span className="text-[10px] text-[#6B6560]">
                  {dayLetter(d.day)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#252320] border border-[#3D3936] p-6">
          <h2 className="text-sm font-semibold text-[#FFF8F0] mb-4">
            Pedidos por hora — hoy
          </h2>
          <div className="flex items-end gap-[2px] h-36">
            {hours.map((h, i) => {
              const hour = i + 8;
              return (
                <div
                  key={hour}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0"
                  title={`${hour}:00 — ${h.orders} pedidos · $${h.revenue.toFixed(2)}`}
                >
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-[4px] transition-all hover:opacity-80"
                      style={{
                        height: `${Math.max(h.orders > 0 ? 6 : 1, (h.orders / maxHourOrders) * 100)}%`,
                        backgroundColor: h.orders > 0 ? EMBER : "#3D3936",
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-[#6B6560]">
                    {hour % 4 === 0 ? `${hour}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* By location + top items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#252320] border border-[#3D3936] p-6">
          <h2 className="text-sm font-semibold text-[#FFF8F0] mb-4">
            Por ubicación — hoy
          </h2>
          {!dash || dash.byLocation.length === 0 ? (
            <p className="text-sm text-[#6B6560] py-6 text-center">
              Sin pedidos aceptados todavía hoy
            </p>
          ) : (
            <div className="space-y-3">
              {dash.byLocation.map((loc) => (
                <div key={loc.id} title={`${loc.name}: $${loc.revenue.toFixed(2)} · ${loc.orders} pedidos`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#FFF8F0]">{loc.name}</span>
                    <span className="text-[#B8B0A8] tabular-nums">
                      ${loc.revenue.toFixed(2)}
                      <span className="text-[#6B6560]"> · {loc.orders}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-[#3D3936] rounded-[2px] overflow-hidden">
                    <div
                      className="h-full rounded-[2px]"
                      style={{
                        width: `${(loc.revenue / maxLocRevenue) * 100}%`,
                        backgroundColor: EMBER,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-[#252320] border border-[#3D3936] p-6">
          <h2 className="text-sm font-semibold text-[#FFF8F0] mb-4">
            Más vendidos — últimos 7 días
          </h2>
          {!dash || dash.topItems.length === 0 ? (
            <p className="text-sm text-[#6B6560] py-6 text-center">
              Aún no hay ventas esta semana
            </p>
          ) : (
            <div className="space-y-3">
              {dash.topItems.map((item) => (
                <div key={item.name} title={`${item.name}: ${item.qty} vendidos · $${item.revenue.toFixed(2)}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#FFF8F0] truncate pr-2">{item.name}</span>
                    <span className="text-[#B8B0A8] tabular-nums shrink-0">
                      {item.qty}
                      <span className="text-[#6B6560]"> · ${item.revenue.toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-[#3D3936] rounded-[2px] overflow-hidden">
                    <div
                      className="h-full rounded-[2px]"
                      style={{
                        width: `${(item.qty / maxItemQty) * 100}%`,
                        backgroundColor: EMBER,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[#252320] border border-[#3D3936]">
        <div className="p-6 border-b border-[#3D3936] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#FFF8F0]">
            Pedidos Recientes
          </h2>
          <Link href="/admin/orders" className="text-sm text-[#FF6B35] hover:underline">
            Ver todos →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#3D3936] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-[#6B6560]" />
            </div>
            <p className="text-[#B8B0A8] font-medium">No hay pedidos aún</p>
            <p className="text-sm text-[#6B6560] mt-1">
              Los pedidos aparecerán aquí cuando los clientes ordenen
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-[#6B6560] border-b border-[#3D3936]">
                  <th className="px-6 py-4 font-medium">Pedido</th>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Tipo</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Hora</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#3D3936] last:border-0 hover:bg-[#3D3936]/50 transition"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-[#B8B0A8]">
                        #{order.order_number || order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#FFF8F0]">
                          {order.customer_name}
                        </p>
                        <p className="text-sm text-[#6B6560]">
                          {order.customer_phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm ${isDeliveryOrder(order) ? "text-[#FF6B35]" : "text-[#4CAF50]"}`}
                      >
                        {isDeliveryOrder(order) ? "Delivery" : "Recoger"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#FFF8F0] tabular-nums">
                      ${getOrderTotal(order).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium capitalize border ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6560]">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
