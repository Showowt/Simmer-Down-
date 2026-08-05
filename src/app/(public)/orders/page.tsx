"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  ChefHat,
  Package,
  Truck,
  Search,
  Phone,
  ArrowLeft,
  MessageCircle,
  PartyPopper,
} from "lucide-react";
import { Order } from "@/lib/types";
import { orderStatusLabel } from "@/lib/order-status";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import dynamic from "next/dynamic";

const Confetti = dynamic(() => import("@/components/Confetti"), { ssr: false });

// Steps mirror the REAL order_status lifecycle (the old ids "in_progress" /
// "delivered" don't exist in the enum, so the tracker never advanced).
const DELIVERY_STEPS = [
  { id: "pending", label: { es: "Recibido", en: "Received" }, icon: Clock },
  { id: "confirmed", label: { es: "Confirmado", en: "Confirmed" }, icon: CheckCircle },
  { id: "preparing", label: { es: "Preparando", en: "Preparing" }, icon: ChefHat },
  { id: "out_for_delivery", label: { es: "En Camino", en: "On the Way" }, icon: Truck },
  { id: "completed", label: { es: "Entregado", en: "Delivered" }, icon: Package },
];

const PICKUP_STEPS = [
  { id: "pending", label: { es: "Recibido", en: "Received" }, icon: Clock },
  { id: "confirmed", label: { es: "Confirmado", en: "Confirmed" }, icon: CheckCircle },
  { id: "preparing", label: { es: "Preparando", en: "Preparing" }, icon: ChefHat },
  { id: "ready", label: { es: "Listo", en: "Ready" }, icon: Package },
  { id: "completed", label: { es: "Completado", en: "Completed" }, icon: CheckCircle },
];

const ACTIVE_STATUSES = new Set([
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
]);

function stepsFor(orderType: string | undefined) {
  return orderType === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
}

function stepIndexFor(steps: typeof DELIVERY_STEPS, status: string): number {
  const direct = steps.findIndex((s) => s.id === status);
  if (direct >= 0) return direct;
  // "ready" on a delivery order sits between preparing and out_for_delivery
  if (status === "ready") return steps.findIndex((s) => s.id === "preparing");
  return 0;
}

function OrderTracker() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const orderNumber = searchParams.get("number");
  const isDemo = searchParams.get("demo");
  const isWhatsAppSent = searchParams.get("whatsapp") === "sent";
  const { t } = useI18n();

  const [order, setOrder] = useState<Order | null>(null);
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isNewOrder, setIsNewOrder] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
      // Check if this is a new order (just placed)
      if (orderNumber) {
        setIsNewOrder(true);
        setShowConfetti(true);
        // Stop confetti after animation
        setTimeout(() => setShowConfetti(false), 4000);
      }
    }
  }, [orderId, orderNumber]);

  // Fetches through the sanitized public API — the direct anon Supabase query
  // this replaced was blocked by RLS, so tracking never worked for customers.
  const fetchOrder = async (id: string, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        signal: controller.signal,
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        if (silent) return; // keep showing the last good state
        setError(
          res.status === 404 || res.status === 400
            ? "Pedido no encontrado. Verifica tu ID e intenta de nuevo. / Order not found. Check your ID and try again."
            : "Error al buscar tu pedido. Intenta de nuevo. / Error searching for your order. Try again.",
        );
        setOrder(null);
        return;
      }

      setOrder(json.data as unknown as Order);
      setOrderItems(json.data.items ?? []);
    } catch {
      if (silent) return;
      setError(
        "La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo. / Request timed out. Check your connection and try again.",
      );
      setOrder(null);
    } finally {
      clearTimeout(timer);
      if (!silent) setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      fetchOrder(searchId.trim());
    }
  };

  const steps = stepsFor(order?.order_type as string | undefined);
  const isCancelled =
    order?.status === "cancelled" || order?.status === "refunded";
  const currentStepIndex =
    order && !isCancelled ? stepIndexFor(steps, order.status) : -1;

  // Live tracking: silently re-fetch while the order is in an active state.
  useEffect(() => {
    if (!order || !ACTIVE_STATUSES.has(order.status)) return;
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchOrder(order.id, true);
      }
    }, 15000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, order?.status]);

  // Order items from the order_items join or legacy fields
  const [orderItems, setOrderItems] = useState<Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>>([]);

  // Get items from either fetched order_items, items_json, or items
  const getOrderItems = (ord: Order) => {
    if (orderItems.length > 0) {
      return orderItems.map((oi) => ({
        name: oi.item_name,
        quantity: oi.quantity,
        price: oi.unit_price,
      }));
    }
    if (ord.items_json && Array.isArray(ord.items_json)) {
      return ord.items_json;
    }
    if (ord.items && Array.isArray(ord.items)) {
      return ord.items;
    }
    return [];
  };

  // WhatsApp order sent confirmation
  if (isWhatsAppSent && !order) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-32">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-24 h-24 bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-12 h-12 text-[#25D366]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              {t({ es: "¡Pedido Enviado!", en: "Order Sent!" })}
            </h1>
            <p className="text-white/60 mb-2">
              {t({
                es: "Tu pedido fue enviado por WhatsApp a la sucursal.",
                en: "Your order was sent via WhatsApp to the location.",
              })}
            </p>
            <p className="text-white/40 text-sm mb-8">
              {t({
                es: "Ellos confirmarán tu pedido y te darán un tiempo estimado de preparación.",
                en: "They will confirm your order and give you an estimated preparation time.",
              })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/carta"
                className="inline-flex items-center justify-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-6 py-4 font-semibold transition min-h-[56px]"
              >
                {t({ es: "Volver al Menú", en: "Back to Menu" })}
              </Link>
              <a
                href="https://wa.me/50376804434"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-6 py-4 font-semibold transition min-h-[56px]"
              >
                <MessageCircle className="w-5 h-5" />
                {t({ es: "Abrir WhatsApp", en: "Open WhatsApp" })}
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Demo success state
  if (isDemo && !order) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-32">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-24 h-24 bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-[#4CAF50]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              {t({ es: "¡Pedido Realizado!", en: "Order Placed!" })}
            </h1>
            <p className="text-white/60 mb-8">
              {t({
                es: "Gracias por tu pedido. ¡Comenzaremos a preparar tu pizza de inmediato!",
                en: "Thank you for your order. We'll start preparing your pizza right away!",
              })}
            </p>
            <div className="bg-[#FBBF24]/10 border border-[#FBBF24]/20 p-6 text-left mb-8">
              <p className="text-sm text-[#E85D04]">
                <strong>{t({ es: "Modo Demo:", en: "Demo Mode:" })}</strong>{" "}
                {t({
                  es: "Este es un pedido de demostración. Tu pedido ha sido registrado en el sistema.",
                  en: "This is a demo order. Your order has been registered in the system.",
                })}
              </p>
            </div>
            <Link
              href="/carta"
              className="inline-flex items-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-6 py-4 font-semibold transition min-h-[56px]"
            >
              <ArrowLeft className="w-5 h-5" />
              {t({ es: "Volver al Menú", en: "Back to Menu" })}
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            {t({ es: "Rastrea Tu Pedido", en: "Track Your Order" })}
          </h1>
          <p className="text-white/40 mb-8">
            {t({
              es: "Ingresa tu ID de pedido o número para ver el estado",
              en: "Enter your order ID or number to see the status",
            })}
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <label htmlFor="order-search" className="sr-only">
                  {t({ es: "ID del pedido", en: "Order ID" })}
                </label>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="order-search"
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder={t({ es: "Ingresa tu ID de pedido", en: "Enter your order ID" })}
                  className="w-full pl-12 pr-4 py-3 bg-[#1A1A1A] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E85D04] transition min-h-[48px]"
                />
              </div>
              <button
                type="submit"
                className="bg-[#E85D04] hover:bg-[#C2410C] text-white px-6 py-3 font-semibold transition min-h-[48px]"
              >
                {t({ es: "Buscar", en: "Search" })}
              </button>
            </div>
          </form>
        </motion.div>

        {loading && (
          <div className="bg-[#1A1A1A] border border-white/10 p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#E85D04] border-t-transparent mx-auto" />
            <p className="text-white/40 mt-4">{t({ es: "Cargando pedido...", en: "Loading order..." })}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Confetti for new orders */}
            <Confetti active={showConfetti} duration={4000} />

            {/* Success Header - Extra celebratory for new orders */}
            {isNewOrder ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="bg-gradient-to-r from-[#4CAF50]/20 to-[#E85D04]/20 border border-[#4CAF50]/30 p-8 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                  className="w-20 h-20 bg-[#4CAF50]/20 flex items-center justify-center mx-auto mb-4"
                >
                  <PartyPopper className="w-10 h-10 text-[#4CAF50]" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {t({ es: "¡Pedido Realizado!", en: "Order Placed!" })}
                </h2>
                <p className="text-white/60">
                  {t({
                    es: `Tu pedido #${order.order_number || order.id.slice(0, 8)} está en camino`,
                    en: `Your order #${order.order_number || order.id.slice(0, 8)} is on its way`,
                  })}
                </p>
                <p className="text-[#E85D04] font-medium mt-2">
                  {t({ es: "Tiempo estimado: 30-45 minutos", en: "Estimated time: 30-45 minutes" })}
                </p>
              </motion.div>
            ) : (
              <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/20 p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#4CAF50]/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-[#4CAF50]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {t({ es: "¡Pedido Confirmado!", en: "Order Confirmed!" })}
                  </h2>
                  <p className="text-white/60 text-sm">
                    {t({ es: "Pedido", en: "Order" })} #{order.order_number || order.id.slice(0, 8)}
                  </p>
                </div>
              </div>
            )}

            {/* Order Status */}
            <div className="bg-[#1A1A1A] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-white/40">{t({ es: "Estado", en: "Status" })}</p>
                  <p className="font-medium text-white">
                    {orderStatusLabel(order.status)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/40">{t({ es: "Tiempo Estimado", en: "Estimated Time" })}</p>
                  <p className="font-medium text-white">30-45 min</p>
                </div>
              </div>

              {/* Progress Steps */}
              {isCancelled ? (
                <div className="border border-[#C73E1D]/30 bg-[#C73E1D]/10 p-4 text-center">
                  <p className="font-medium text-[#FF6B6B]">
                    {t({
                      es: order?.status === "refunded" ? "Pedido reembolsado" : "Pedido cancelado",
                      en: order?.status === "refunded" ? "Order refunded" : "Order cancelled",
                    })}
                  </p>
                  <p className="text-sm text-white/50 mt-1">
                    {t({
                      es: "Si tienes dudas, escríbenos por WhatsApp al +503 7680-4434.",
                      en: "Questions? Message us on WhatsApp at +503 7680-4434.",
                    })}
                  </p>
                </div>
              ) : (
              <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-1 bg-white/10">
                  <div
                    className="h-full bg-[#E85D04] transition-all duration-500"
                    style={{
                      width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="relative flex justify-between">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                      <div key={step.id} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 flex items-center justify-center transition ${
                            isActive
                              ? "bg-[#E85D04] text-white"
                              : "bg-white/10 text-white/40"
                          } ${isCurrent ? "ring-4 ring-[#E85D04]/20" : ""}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-xs mt-2 ${
                            isActive
                              ? "text-white font-medium"
                              : "text-white/40"
                          }`}
                        >
                          {t(step.label)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}
            </div>

            {/* Order Details */}
            <div className="bg-[#1A1A1A] border border-white/10 p-6">
              <h2 className="font-semibold text-white mb-4">
                {t({ es: "Detalles del Pedido", en: "Order Details" })}
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">{t({ es: "Cliente", en: "Customer" })}</span>
                  <span className="text-white">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">{t({ es: "Teléfono", en: "Phone" })}</span>
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="text-[#E85D04] hover:underline"
                  >
                    {order.customer_phone}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">{t({ es: "Tipo", en: "Type" })}</span>
                  <span className="text-white">
                    {order.order_type === "delivery" || order.is_delivery
                      ? "Delivery"
                      : t({ es: "Para recoger", en: "Pickup" })}
                  </span>
                </div>
                {(order.delivery_address_line1 || order.delivery_address) && (
                  <div className="flex justify-between">
                    <span className="text-white/40">{t({ es: "Dirección", en: "Address" })}</span>
                    <span className="text-white text-right max-w-[200px]">
                      {order.delivery_address_line1 || order.delivery_address}
                      {order.delivery_city && `, ${order.delivery_city}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 mt-4 pt-4">
                <h3 className="font-medium text-white mb-3">{t({ es: "Artículos", en: "Items" })}</h3>
                {getOrderItems(order).length > 0 ? (
                  getOrderItems(order).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-white/60">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : order.items_description ? (
                  <p className="text-white/60 text-sm">
                    {order.items_description}
                  </p>
                ) : (
                  <p className="text-white/40 text-sm">
                    {t({ es: "Sin datos de artículos", en: "No item data available" })}
                  </p>
                )}
                <div className="border-t border-white/10 mt-3 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Subtotal</span>
                    <span className="text-white">
                      ${(order.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">{t({ es: "Envío", en: "Delivery" })}</span>
                    <span className="text-white">
                      ${(order.delivery_fee || 0).toFixed(2)}
                    </span>
                  </div>
                  {(order.discount_amount != null && order.discount_amount > 0) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">{t({ es: "Descuento", en: "Discount" })}</span>
                      <span className="text-green-400">
                        -${order.discount_amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span className="text-white">Total</span>
                    <span className="text-white">
                      ${(order.total_amount || order.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {(order.payment_status || order.card_last4) && (
              <div className="bg-[#1A1A1A] border border-white/10 p-6">
                <h2 className="font-semibold text-white mb-4">{t({ es: "Pago", en: "Payment" })}</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">{t({ es: "Estado", en: "Status" })}</span>
                    <span
                      className={`font-medium ${
                        order.payment_status === "paid"
                          ? "text-[#4CAF50]"
                          : order.payment_status === "failed" ||
                              order.payment_status === "voided"
                            ? "text-red-500"
                            : "text-[#FBBF24]"
                      }`}
                    >
                      {order.payment_status === "paid"
                        ? t({ es: "Pagado", en: "Paid" })
                        : order.payment_status === "failed"
                          ? t({ es: "Fallido", en: "Failed" })
                          : order.payment_status === "voided"
                            ? t({ es: "Anulado", en: "Voided" })
                            : order.payment_status === "refunded"
                              ? t({ es: "Reembolsado", en: "Refunded" })
                              : order.payment_status === "processing_3ds"
                                ? t({ es: "Autenticando", en: "Authenticating" })
                                : t({ es: "Pendiente", en: "Pending" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">{t({ es: "Método", en: "Method" })}</span>
                    <span className="text-white capitalize">
                      {order.payment_method === "card"
                        ? t({ es: "Tarjeta", en: "Card" })
                        : order.payment_method === "cash"
                          ? t({ es: "Efectivo", en: "Cash" })
                          : order.payment_method || "\u2014"}
                    </span>
                  </div>
                  {order.card_brand && order.card_last4 && (
                    <div className="flex justify-between">
                      <span className="text-white/40">{t({ es: "Tarjeta", en: "Card" })}</span>
                      <span className="text-white">
                        {order.card_brand} ···· {order.card_last4}
                      </span>
                    </div>
                  )}
                  {order.authorization_code && (
                    <div className="flex justify-between">
                      <span className="text-white/40">{t({ es: "Autorización", en: "Authorization" })}</span>
                      <span className="text-white font-mono text-xs">
                        {order.authorization_code}
                      </span>
                    </div>
                  )}
                  {order.payment_error_message &&
                    order.payment_status === "failed" && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 text-white text-xs">
                        {order.payment_error_message}
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Link
                  href="/carta"
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 font-medium text-center transition min-h-[56px] flex items-center justify-center"
                >
                  {t({ es: "Volver al Menú", en: "Back to Menu" })}
                </Link>
                <a
                  href="tel:+50322637890"
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 font-medium text-center transition flex items-center justify-center gap-2 min-h-[56px]"
                >
                  <Phone className="w-5 h-5" />
                  {t({ es: "Llamar", en: "Call" })}
                </a>
              </div>
              <a
                href={`https://wa.me/50376804434?text=${encodeURIComponent(`Hola! Quisiera información sobre mi orden #${order.order_number || order.id.slice(0, 8)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white py-4 font-medium text-center transition flex items-center justify-center gap-2 min-h-[56px]"
              >
                <MessageCircle className="w-5 h-5" />
                {t({ es: "Chat por WhatsApp", en: "Chat on WhatsApp" })}
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🍕 *Simmer Down* — Pedido #${order.order_number || order.id.slice(0, 8)}\nSeguimiento: https://simmerdownsv.com/orders?id=${order.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 py-4 font-medium text-center transition flex items-center justify-center gap-2 min-h-[56px]"
              >
                <MessageCircle className="w-5 h-5" />
                {t({ es: "Guardar comprobante en WhatsApp", en: "Save receipt to WhatsApp" })}
              </a>
            </div>
          </motion.div>
        )}

        {!order && !loading && !error && !isDemo && (
          <div className="bg-[#1A1A1A] border border-white/10 p-12 text-center">
            <Search className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/40">
              {t({ es: "Ingresa tu ID de pedido para rastrearlo", en: "Enter your order ID to track it" })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] pt-32">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-white/10 w-1/3" />
              <div className="h-12 bg-white/10" />
            </div>
          </div>
        </div>
      }
    >
      <OrderTracker />
    </Suspense>
  );
}
