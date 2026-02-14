"use client";

import { useEffect, useState, useRef } from "react";
import {
  RefreshCw,
  Eye,
  X,
  Phone,
  MapPin,
  FileText,
  Clock,
  Printer,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Ban,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/lib/types";

const statusOptions = [
  "pending",
  "in_progress",
  "ready",
  "delivered",
  "cancelled",
] as const;
type OrderStatus = (typeof statusOptions)[number];

const ITEMS_PER_PAGE = 15;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel("orders")
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.log("Demo mode");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    orderId: string,
    status: string,
    reason?: string,
  ) => {
    try {
      const supabase = createClient();
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "cancelled" && reason) {
        updateData.notes = reason;
      }

      if (status === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      setOrders(
        orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: status as Order["status"],
                ...(reason ? { notes: reason } : {}),
              }
            : o,
        ),
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: status as Order["status"],
        });
      }
    } catch (err) {
      console.error("Failed to update status");
    }
  };

  const handleCancel = () => {
    if (orderToCancel && cancelReason.trim()) {
      updateStatus(orderToCancel.id, "cancelled", cancelReason);
      setShowCancelModal(false);
      setCancelReason("");
      setOrderToCancel(null);
    }
  };

  const openCancelModal = (order: Order) => {
    setOrderToCancel(order);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const printOrder = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const items = order.items_json || [];
    const itemsHtml = Array.isArray(items)
      ? items
          .map(
            (item: { name: string; quantity: number; price: number }) =>
              `<tr>
            <td style="padding: 4px 0;">${item.quantity}x ${item.name}</td>
            <td style="padding: 4px 0; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
          </tr>`,
          )
          .join("")
      : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido #${order.order_number || order.id.slice(0, 8)}</title>
        <style>
          body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
          h1 { font-size: 18px; text-align: center; margin-bottom: 10px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          .total { font-weight: bold; font-size: 16px; }
          .meta { font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>SIMMER DOWN</h1>
        <p style="text-align: center; margin: 0;">Pedido #${order.order_number || order.id.slice(0, 8)}</p>
        <p style="text-align: center; font-size: 12px; color: #666;">
          ${new Date(order.created_at).toLocaleString("es")}
        </p>
        <div class="divider"></div>
        <p><strong>${order.customer_name}</strong></p>
        <p class="meta">${order.customer_phone}</p>
        ${order.is_delivery && order.delivery_address ? `<p class="meta">${order.delivery_address}</p>` : ""}
        <p class="meta">${order.is_delivery ? "DELIVERY" : "PARA RECOGER"}</p>
        <div class="divider"></div>
        <table>
          ${itemsHtml}
        </table>
        <div class="divider"></div>
        <table>
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right;">$${(order.subtotal || 0).toFixed(2)}</td>
          </tr>
          ${
            order.is_delivery
              ? `
          <tr>
            <td>Delivery:</td>
            <td style="text-align: right;">$${(order.delivery_fee || 0).toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          <tr class="total">
            <td>TOTAL:</td>
            <td style="text-align: right;">$${(order.total || 0).toFixed(2)}</td>
          </tr>
        </table>
        ${
          order.notes
            ? `
        <div class="divider"></div>
        <p class="meta"><strong>Notas:</strong> ${order.notes}</p>
        `
            : ""
        }
        <div class="divider"></div>
        <p style="text-align: center; font-size: 10px;">Gracias por tu pedido!</p>
        <script>window.print(); window.close();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtering logic
  const filteredOrders = orders.filter((o) => {
    // Status filter
    if (filter !== "all" && o.status !== filter) return false;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesName = o.customer_name.toLowerCase().includes(searchLower);
      const matchesPhone = o.customer_phone.includes(search);
      const matchesOrder = (o.order_number || o.id)
        .toLowerCase()
        .includes(searchLower);
      if (!matchesName && !matchesPhone && !matchesOrder) return false;
    }

    // Date range filter
    if (dateFrom) {
      const orderDate = new Date(o.created_at).setHours(0, 0, 0, 0);
      const fromDate = new Date(dateFrom).setHours(0, 0, 0, 0);
      if (orderDate < fromDate) return false;
    }
    if (dateTo) {
      const orderDate = new Date(o.created_at).setHours(23, 59, 59, 999);
      const toDate = new Date(dateTo).setHours(23, 59, 59, 999);
      if (orderDate > toDate) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filter, search, dateFrom, dateTo]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20";
      case "in_progress":
        return "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20";
      case "ready":
        return "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20";
      case "delivered":
        return "bg-[#6B6560]/10 text-[#6B6560] border-[#6B6560]/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-[#6B6560]/10 text-[#6B6560] border-[#6B6560]/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "in_progress":
        return "En Preparacion";
      case "ready":
        return "Listo";
      case "delivered":
        return "Entregado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  // Stats
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const inProgressCount = orders.filter(
    (o) => o.status === "in_progress",
  ).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0]">Pedidos</h1>
          <p className="text-[#6B6560]">
            {filteredOrders.length} pedidos
            {pendingCount > 0 && (
              <span className="ml-2 text-[#FFB800]">
                ({pendingCount} pendientes)
              </span>
            )}
            {inProgressCount > 0 && (
              <span className="ml-2 text-[#FF6B35]">
                ({inProgressCount} en preparacion)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 bg-[#252320] border border-[#3D3936] hover:bg-[#3D3936] transition text-[#6B6560]"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#252320] border border-[#3D3936] p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, telefono o pedido..."
              className="w-full pl-10 pr-4 py-2 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] px-4 py-2 focus:border-[#FF6B35] focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)} (
                {orders.filter((o) => o.status === status).length})
              </option>
            ))}
          </select>

          {/* Date From */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(search || filter !== "all" || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSearch("");
              setFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
            className="mt-4 text-sm text-[#FF6B35] hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <p className="text-[#6B6560]">No hay pedidos aun</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <p className="text-[#6B6560]">
            No se encontraron pedidos con los filtros aplicados
          </p>
        </div>
      ) : (
        <>
          <div className="bg-[#252320] border border-[#3D3936] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-[#6B6560] border-b border-[#3D3936]">
                    <th className="px-6 py-4 font-medium">Pedido</th>
                    <th className="px-6 py-4 font-medium">Cliente</th>
                    <th className="px-6 py-4 font-medium">Tipo</th>
                    <th className="px-6 py-4 font-medium">Total</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                    <th className="px-6 py-4 font-medium">Fecha</th>
                    <th className="px-6 py-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[#3D3936] hover:bg-[#3D3936]/50 transition"
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
                          className={`text-sm font-medium ${order.is_delivery ? "text-[#FF6B35]" : "text-[#4CAF50]"}`}
                        >
                          {order.is_delivery ? "Delivery" : "Recoger"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        ${(order.total || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => {
                            if (e.target.value === "cancelled") {
                              openCancelModal(order);
                            } else {
                              updateStatus(order.id, e.target.value);
                            }
                          }}
                          className={`text-sm font-medium px-3 py-1.5 border cursor-pointer ${getStatusColor(order.status)} bg-transparent`}
                        >
                          {statusOptions.map((status) => (
                            <option
                              key={status}
                              value={status}
                              className="bg-[#252320] text-white"
                            >
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6B6560]">
                        <div>
                          {new Date(order.created_at).toLocaleDateString("es", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-xs">
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 hover:bg-[#3D3936] transition"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-[#6B6560]" />
                          </button>
                          <button
                            onClick={() => printOrder(order)}
                            className="p-2 hover:bg-[#3D3936] transition"
                            title="Imprimir ticket"
                          >
                            <Printer className="w-4 h-4 text-[#6B6560]" />
                          </button>
                          {order.status !== "cancelled" &&
                            order.status !== "delivered" && (
                              <button
                                onClick={() => openCancelModal(order)}
                                className="p-2 hover:bg-red-500/10 transition"
                                title="Cancelar pedido"
                              >
                                <Ban className="w-4 h-4 text-red-400" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-[#6B6560]">
                Mostrando {(page - 1) * ITEMS_PER_PAGE + 1} -{" "}
                {Math.min(page * ITEMS_PER_PAGE, filteredOrders.length)} de{" "}
                {filteredOrders.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 bg-[#252320] border border-[#3D3936] disabled:opacity-50 hover:bg-[#3D3936] transition"
                >
                  <ChevronLeft className="w-4 h-4 text-[#6B6560]" />
                </button>
                <span className="text-sm text-[#B8B0A8] px-3">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 bg-[#252320] border border-[#3D3936] disabled:opacity-50 hover:bg-[#3D3936] transition"
                >
                  <ChevronRight className="w-4 h-4 text-[#6B6560]" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252320] border border-[#3D3936] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3D3936] flex items-center justify-between sticky top-0 bg-[#252320]">
              <div>
                <h2 className="text-lg font-semibold text-[#FFF8F0]">
                  Detalle del Pedido
                </h2>
                <p className="text-sm text-[#6B6560] font-mono">
                  #{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printOrder(selectedOrder)}
                  className="p-2 hover:bg-[#3D3936] transition"
                  title="Imprimir"
                >
                  <Printer className="w-5 h-5 text-[#6B6560]" />
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-[#3D3936]"
                >
                  <X className="w-5 h-5 text-[#6B6560]" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6" ref={printRef}>
              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#6B6560]">Cliente</h3>
                <div className="bg-[#1F1D1A] p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FF6B35]/10 flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-medium text-[#FFF8F0]">
                        {selectedOrder.customer_name}
                      </p>
                      <p className="text-sm text-[#6B6560]">
                        {selectedOrder.is_delivery ? "Delivery" : "Recoger"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[#B8B0A8]">
                    <Phone className="w-4 h-4 text-[#6B6560]" />
                    <a
                      href={`tel:${selectedOrder.customer_phone}`}
                      className="hover:text-[#FF6B35]"
                    >
                      {selectedOrder.customer_phone}
                    </a>
                  </div>
                  {selectedOrder.delivery_address && (
                    <div className="flex items-start gap-2 text-[#B8B0A8]">
                      <MapPin className="w-4 h-4 text-[#6B6560] mt-0.5" />
                      <span>{selectedOrder.delivery_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#6B6560]">Items</h3>
                <div className="bg-[#1F1D1A] p-4 space-y-3">
                  {selectedOrder.items_json ? (
                    Array.isArray(selectedOrder.items_json) ? (
                      selectedOrder.items_json.map(
                        (
                          item: {
                            name: string;
                            quantity: number;
                            price: number;
                          },
                          i: number,
                        ) => (
                          <div
                            key={i}
                            className="flex justify-between text-[#B8B0A8]"
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <p className="text-[#6B6560]">
                        Error en formato de items
                      </p>
                    )
                  ) : selectedOrder.items_description ? (
                    <p className="text-[#B8B0A8]">
                      {selectedOrder.items_description}
                    </p>
                  ) : (
                    <p className="text-[#6B6560]">Sin datos de items</p>
                  )}
                  <div className="border-t border-[#3D3936] pt-3 mt-3 space-y-1">
                    <div className="flex justify-between text-sm text-[#6B6560]">
                      <span>Subtotal</span>
                      <span>${(selectedOrder.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#6B6560]">
                      <span>Delivery</span>
                      <span>
                        ${(selectedOrder.delivery_fee || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-[#FFF8F0] pt-2">
                      <span>Total</span>
                      <span className="text-[#FF6B35]">
                        ${(selectedOrder.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#6B6560] flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notas
                  </h3>
                  <div className="bg-[#FFB800]/10 border border-[#FFB800]/20 p-4">
                    <p className="text-[#FFB800] text-sm">
                      {selectedOrder.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#6B6560]">
                  Actualizar Estado
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {statusOptions
                    .filter((s) => s !== "cancelled")
                    .map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(selectedOrder.id, status)}
                        className={`px-3 py-2 text-sm font-medium transition ${
                          selectedOrder.status === status
                            ? "bg-[#FF6B35] text-white"
                            : "bg-[#1F1D1A] text-[#6B6560] hover:bg-[#3D3936] hover:text-[#FFF8F0]"
                        }`}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                </div>
                {selectedOrder.status !== "cancelled" &&
                  selectedOrder.status !== "delivered" && (
                    <button
                      onClick={() => openCancelModal(selectedOrder)}
                      className="w-full py-2 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
                    >
                      Cancelar Pedido
                    </button>
                  )}
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-[#6B6560]">
                <Clock className="w-3 h-3" />
                Pedido realizado{" "}
                {new Date(selectedOrder.created_at).toLocaleString("es")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && orderToCancel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#252320] border border-[#3D3936] w-full max-w-md">
            <div className="p-6 border-b border-[#3D3936] flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#FFF8F0]">
                  Cancelar Pedido
                </h2>
                <p className="text-sm text-[#6B6560]">
                  #{orderToCancel.order_number || orderToCancel.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[#B8B0A8]">
                ¿Seguro que deseas cancelar el pedido de{" "}
                <strong>{orderToCancel.customer_name}</strong>?
              </p>
              <div>
                <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
                  Razon de cancelacion *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Ej: Cliente solicito cancelar, producto agotado..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#3D3936] flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setOrderToCancel(null);
                }}
                className="px-4 py-2 text-[#B8B0A8] hover:bg-[#3D3936] transition"
              >
                Volver
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim()}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 font-medium transition"
              >
                Confirmar Cancelacion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
