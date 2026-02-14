"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  UtensilsCrossed,
  Tag,
  MapPin,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/lib/types";
import Link from "next/link";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // Set up realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.log("Demo mode - no orders");
    } finally {
      setLoading(false);
    }
  };

  const todayOrders = orders.filter((o) => {
    const today = new Date().toDateString();
    return new Date(o.created_at).toDateString() === today;
  });

  // Handle both total and total_amount for schema compatibility
  const getOrderTotal = (order: Order) =>
    order.total ||
    (order as unknown as { total_amount?: number }).total_amount ||
    0;

  const todayRevenue = todayOrders.reduce(
    (sum, o) => sum + getOrderTotal(o),
    0,
  );
  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "in_progress",
  );
  const avgOrderValue =
    orders.length > 0
      ? orders.reduce((sum, o) => sum + getOrderTotal(o), 0) / orders.length
      : 0;

  const stats = [
    {
      label: "Ingresos Hoy",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      bgColor: "bg-[#4CAF50]/10",
      iconColor: "text-[#4CAF50]",
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Pedidos Hoy",
      value: todayOrders.length,
      icon: ShoppingBag,
      bgColor: "bg-[#FF6B35]/10",
      iconColor: "text-[#FF6B35]",
      trend: "+5%",
      trendUp: true,
    },
    {
      label: "Pedidos Pendientes",
      value: pendingOrders.length,
      icon: Clock,
      bgColor: "bg-[#FFB800]/10",
      iconColor: "text-[#FFB800]",
      trend: pendingOrders.length > 0 ? "Activos" : "Ninguno",
      trendUp: null,
    },
    {
      label: "Ticket Promedio",
      value: `$${avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      bgColor: "bg-[#FF6B35]/10",
      iconColor: "text-[#FF6B35]",
      trend: "+8%",
      trendUp: true,
    },
  ];

  const recentOrders = orders.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20";
      case "in_progress":
        return "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20";
      case "ready":
        return "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20";
      case "delivered":
      case "completed":
        return "bg-[#6B6560]/10 text-[#6B6560] border-[#6B6560]/20";
      case "cancelled":
        return "bg-[#C73E1D]/10 text-[#C73E1D] border-[#C73E1D]/20";
      default:
        return "bg-[#6B6560]/10 text-[#6B6560] border-[#6B6560]/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "in_progress":
        return "En Preparación";
      case "ready":
        return "Listo";
      case "delivered":
        return "Entregado";
      case "completed":
        return "Completado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  // Handle both is_delivery and order_type for schema compatibility
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
            Bienvenido. Aquí está lo que sucede hoy.
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
          href="/admin/specials"
          className="bg-[#252320] border border-[#3D3936] p-4 hover:border-[#FF6B35] transition group"
        >
          <div className="w-10 h-10 bg-[#FFB800]/10 flex items-center justify-center mb-3">
            <Tag className="w-5 h-5 text-[#FFB800]" />
          </div>
          <p className="font-medium text-[#FFF8F0] group-hover:text-[#FF6B35] transition">
            Promociones
          </p>
          <p className="text-xs text-[#6B6560] mt-1">
            Crear ofertas especiales
          </p>
        </Link>
        <Link
          href="/admin/locations"
          className="bg-[#252320] border border-[#3D3936] p-4 hover:border-[#FF6B35] transition group"
        >
          <div className="w-10 h-10 bg-[#4CAF50]/10 flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5 text-[#4CAF50]" />
          </div>
          <p className="font-medium text-[#FFF8F0] group-hover:text-[#FF6B35] transition">
            Ubicaciones
          </p>
          <p className="text-xs text-[#6B6560] mt-1">Gestionar locales</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                {stat.trendUp !== null && (
                  <span
                    className={`flex items-center text-sm ${stat.trendUp ? "text-[#4CAF50]" : "text-[#C73E1D]"}`}
                  >
                    {stat.trendUp ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.trend}
                  </span>
                )}
                {stat.trendUp === null && (
                  <span className="text-xs text-[#6B6560] bg-[#3D3936] px-2 py-1">
                    {stat.trend}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-[#FFF8F0]">
                  {stat.value}
                </p>
                <p className="text-sm text-[#6B6560]">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-[#252320] border border-[#3D3936]">
        <div className="p-6 border-b border-[#3D3936] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#FFF8F0]">
            Pedidos Recientes
          </h2>
          <span className="text-sm text-[#6B6560]">
            {orders.length} pedidos totales
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
          </div>
        ) : recentOrders.length === 0 ? (
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
                {recentOrders.map((order) => (
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
                    <td className="px-6 py-4 font-medium text-[#FFF8F0]">
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
