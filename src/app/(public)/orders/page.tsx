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
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/lib/types";
import Link from "next/link";
import dynamic from "next/dynamic";

const Confetti = dynamic(() => import("@/components/Confetti"), { ssr: false });

const statusSteps = [
  { id: "pending", label: "Recibido", icon: Clock },
  { id: "in_progress", label: "Preparando", icon: ChefHat },
  { id: "ready", label: "Listo", icon: Package },
  { id: "delivered", label: "Entregado", icon: Truck },
];

function OrderTracker() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const orderNumber = searchParams.get("number");
  const isDemo = searchParams.get("demo");

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

  const fetchOrder = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (err) {
      setError("Pedido no encontrado");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      fetchOrder(searchId.trim());
    }
  };

  const currentStepIndex = order
    ? statusSteps.findIndex((s) => s.id === order.status)
    : -1;

  // Get items from either items_json or items
  const getOrderItems = (order: Order) => {
    if (order.items_json && Array.isArray(order.items_json)) {
      return order.items_json;
    }
    if (order.items && Array.isArray(order.items)) {
      return order.items;
    }
    return [];
  };

  // Demo success state
  if (isDemo && !order) {
    return (
      <div className="min-h-screen bg-[#2D2A26] pt-32">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-24 h-24 bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-[#4CAF50]" />
            </div>
            <h1 className="text-3xl font-bold text-[#FFF8F0] mb-4">
              ¡Pedido Realizado!
            </h1>
            <p className="text-[#B8B0A8] mb-8">
              Gracias por tu pedido. ¡Comenzaremos a preparar tu pizza de
              inmediato!
            </p>
            <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/20 p-6 text-left mb-8">
              <p className="text-sm text-[#FF6B35]">
                <strong>Modo Demo:</strong> Este es un pedido de demostración.
                Tu pedido ha sido registrado en el sistema.
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-6 py-4 font-semibold transition min-h-[56px]"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Menú
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-[#FFF8F0] mb-2">
            Rastrea Tu Pedido
          </h1>
          <p className="text-[#6B6560] mb-8">
            Ingresa tu ID de pedido o número para ver el estado
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <label htmlFor="order-search" className="sr-only">
                  ID del pedido
                </label>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                <input
                  id="order-search"
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Ingresa tu ID de pedido"
                  className="w-full pl-12 pr-4 py-3 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                />
              </div>
              <button
                type="submit"
                className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-6 py-3 font-semibold transition min-h-[48px]"
              >
                Buscar
              </button>
            </div>
          </form>
        </motion.div>

        {loading && (
          <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
            <p className="text-[#6B6560] mt-4">Cargando pedido...</p>
          </div>
        )}

        {error && (
          <div className="bg-[#C73E1D]/10 border border-[#C73E1D]/20 p-6 text-center">
            <p className="text-[#C73E1D]">{error}</p>
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
                className="bg-gradient-to-r from-[#4CAF50]/20 to-[#FF6B35]/20 border border-[#4CAF50]/30 p-8 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                  className="w-20 h-20 bg-[#4CAF50]/20 flex items-center justify-center mx-auto mb-4"
                >
                  <PartyPopper className="w-10 h-10 text-[#4CAF50]" />
                </motion.div>
                <h2 className="text-2xl font-bold text-[#FFF8F0] mb-2">
                  ¡Pedido Realizado!
                </h2>
                <p className="text-[#B8B0A8]">
                  Tu pedido #{order.order_number || order.id.slice(0, 8)} está
                  en camino
                </p>
                <p className="text-[#FF6B35] font-medium mt-2">
                  Tiempo estimado: 30-45 minutos
                </p>
              </motion.div>
            ) : (
              <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/20 p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#4CAF50]/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-[#4CAF50]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#FFF8F0]">
                    ¡Pedido Confirmado!
                  </h2>
                  <p className="text-[#B8B0A8] text-sm">
                    Pedido #{order.order_number || order.id.slice(0, 8)}
                  </p>
                </div>
              </div>
            )}

            {/* Order Status */}
            <div className="bg-[#252320] border border-[#3D3936] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-[#6B6560]">Estado</p>
                  <p className="font-medium text-[#FFF8F0] capitalize">
                    {order.status.replace("_", " ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#6B6560]">Tiempo Estimado</p>
                  <p className="font-medium text-[#FFF8F0]">30-45 min</p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-1 bg-[#3D3936]">
                  <div
                    className="h-full bg-[#FF6B35] transition-all duration-500"
                    style={{
                      width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="relative flex justify-between">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                      <div key={step.id} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 flex items-center justify-center transition ${
                            isActive
                              ? "bg-[#FF6B35] text-white"
                              : "bg-[#3D3936] text-[#6B6560]"
                          } ${isCurrent ? "ring-4 ring-[#FF6B35]/20" : ""}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-xs mt-2 ${
                            isActive
                              ? "text-[#FFF8F0] font-medium"
                              : "text-[#6B6560]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-[#252320] border border-[#3D3936] p-6">
              <h2 className="font-semibold text-[#FFF8F0] mb-4">
                Detalles del Pedido
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">Cliente</span>
                  <span className="text-[#FFF8F0]">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">Teléfono</span>
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="text-[#FF6B35] hover:underline"
                  >
                    {order.customer_phone}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">Tipo</span>
                  <span className="text-[#FFF8F0]">
                    {order.order_type === "delivery" || order.is_delivery
                      ? "Delivery"
                      : "Para recoger"}
                  </span>
                </div>
                {order.delivery_address && (
                  <div className="flex justify-between">
                    <span className="text-[#6B6560]">Dirección</span>
                    <span className="text-[#FFF8F0] text-right max-w-[200px]">
                      {order.delivery_address}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-[#3D3936] mt-4 pt-4">
                <h3 className="font-medium text-[#FFF8F0] mb-3">Artículos</h3>
                {getOrderItems(order).length > 0 ? (
                  getOrderItems(order).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-[#B8B0A8]">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-[#FFF8F0]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : order.items_description ? (
                  <p className="text-[#B8B0A8] text-sm">
                    {order.items_description}
                  </p>
                ) : (
                  <p className="text-[#6B6560] text-sm">
                    Sin datos de artículos
                  </p>
                )}
                <div className="border-t border-[#3D3936] mt-3 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6560]">Subtotal</span>
                    <span className="text-[#FFF8F0]">
                      ${(order.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6560]">Envío</span>
                    <span className="text-[#FFF8F0]">
                      ${(order.delivery_fee || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span className="text-[#FFF8F0]">Total</span>
                    <span className="text-white">
                      ${(order.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Link
                  href="/menu"
                  className="flex-1 bg-[#3D3936] hover:bg-[#4A4642] text-[#FFF8F0] py-4 font-medium text-center transition min-h-[56px] flex items-center justify-center"
                >
                  Volver al Menú
                </Link>
                <a
                  href="tel:+50322637890"
                  className="flex-1 bg-[#3D3936] hover:bg-[#4A4642] text-[#FFF8F0] py-4 font-medium text-center transition flex items-center justify-center gap-2 min-h-[56px]"
                >
                  <Phone className="w-5 h-5" />
                  Llamar
                </a>
              </div>
              <a
                href={`https://wa.me/50378901234?text=${encodeURIComponent(`Hola! Quisiera información sobre mi orden #${order.order_number || order.id.slice(0, 8)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white py-4 font-medium text-center transition flex items-center justify-center gap-2 min-h-[56px]"
              >
                <MessageCircle className="w-5 h-5" />
                Chat por WhatsApp
              </a>
            </div>
          </motion.div>
        )}

        {!order && !loading && !error && !isDemo && (
          <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
            <Search className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
            <p className="text-[#6B6560]">
              Ingresa tu ID de pedido para rastrearlo
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
        <div className="min-h-screen bg-[#2D2A26] pt-32">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-[#3D3936] w-1/3" />
              <div className="h-12 bg-[#3D3936]" />
            </div>
          </div>
        </div>
      }
    >
      <OrderTracker />
    </Suspense>
  );
}
