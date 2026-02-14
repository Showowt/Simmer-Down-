"use client";

import { motion } from "framer-motion";
import {
  Heart,
  Star,
  Gift,
  Zap,
  Award,
  Users,
  ArrowRight,
  Check,
  Sparkles,
  Crown,
  Flame,
  Pizza,
  Percent,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToastStore } from "@/components/Toast";

// Types
interface LoyaltyData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  loyalty_tier: "starter" | "flame" | "inferno";
  total_orders: number;
  total_spent: number;
  birthday: string | null;
  created_at: string;
}

interface PointsTransaction {
  id: string;
  points: number;
  type: "earned" | "redeemed" | "bonus";
  description: string;
  created_at: string;
}

interface Reward {
  id: string;
  points: number;
  reward: string;
  icon: string;
  description: string;
  available: boolean;
}

// Constants
const tiers = [
  {
    name: "Starter",
    key: "starter",
    minPoints: 0,
    maxPoints: 499,
    multiplier: 1,
    color: "bg-[#6B6560]",
    textColor: "text-[#6B6560]",
    benefits: [
      "1 punto por cada $1 gastado",
      "Recompensa de cumpleaños",
      "Ofertas exclusivas para miembros",
    ],
  },
  {
    name: "Flame",
    key: "flame",
    minPoints: 500,
    maxPoints: 1499,
    multiplier: 1.5,
    color: "bg-[#FF6B35]",
    textColor: "text-[#FF6B35]",
    benefits: [
      "1.5 puntos por cada $1 gastado",
      "Delivery gratis",
      "Acceso anticipado al menú",
      "Puntos dobles en cumpleaños",
    ],
  },
  {
    name: "Inferno",
    key: "inferno",
    minPoints: 1500,
    maxPoints: Infinity,
    multiplier: 2,
    color: "bg-[#E55A2B]",
    textColor: "text-[#E55A2B]",
    benefits: [
      "2 puntos por cada $1 gastado",
      "Toppings premium gratis",
      "Acceso a eventos VIP",
      "Merch exclusivo",
      "Reservaciones prioritarias",
    ],
  },
];

const rewards: Reward[] = [
  {
    id: "1",
    points: 100,
    reward: "Bebida Gratis",
    icon: "🥤",
    description: "Cualquier bebida del menú",
    available: true,
  },
  {
    id: "2",
    points: 250,
    reward: "Acompañamiento Gratis",
    icon: "🍟",
    description: "Papas, aros de cebolla o pan de ajo",
    available: true,
  },
  {
    id: "3",
    points: 500,
    reward: "Pizza Mediana Gratis",
    icon: "🍕",
    description: "Pizza mediana de cualquier sabor",
    available: true,
  },
  {
    id: "4",
    points: 750,
    reward: "$15 de Descuento",
    icon: "💰",
    description: "Descuento en tu próxima compra",
    available: true,
  },
  {
    id: "5",
    points: 1000,
    reward: "Pizza Grande Gratis",
    icon: "🍕",
    description: "Pizza grande de cualquier sabor",
    available: true,
  },
  {
    id: "6",
    points: 1500,
    reward: "Pizza Party (4 Pizzas)",
    icon: "🎉",
    description: "4 pizzas grandes + bebidas",
    available: true,
  },
];

const perks = [
  {
    icon: Gift,
    title: "Recompensas de Cumpleaños",
    description:
      "Pizza gratis durante tu mes de cumpleaños, ¡más puntos dobles toda la semana!",
  },
  {
    icon: Zap,
    title: "Ofertas Flash",
    description:
      "Ventas flash exclusivas para miembros y recompensas sorpresa.",
  },
  {
    icon: Star,
    title: "Acceso Anticipado",
    description:
      "Sé el primero en probar nuevos items del menú antes que nadie.",
  },
  {
    icon: Users,
    title: "Eventos VIP",
    description:
      "Invitaciones a eventos exclusivos de degustación y pizza parties.",
  },
  {
    icon: Percent,
    title: "Descuentos de Miembro",
    description:
      "Precios especiales en items selectos todos los días de la semana.",
  },
  {
    icon: Calendar,
    title: "Salta la Fila",
    description: "Pickup prioritario y reservaciones en todas las ubicaciones.",
  },
];

// Create Supabase client
const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
};

// Loyalty Dashboard Component (for logged-in users)
function LoyaltyDashboard({
  loyaltyData,
  transactions,
}: {
  loyaltyData: LoyaltyData;
  transactions: PointsTransaction[];
}) {
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const addToast = useToastStore((state) => state.addToast);
  const supabase = createClient();

  const currentTier =
    tiers.find((t) => t.key === loyaltyData.loyalty_tier) || tiers[0];
  const nextTier = tiers.find((t) => t.minPoints > loyaltyData.loyalty_points);

  const progressToNextTier = nextTier
    ? ((loyaltyData.loyalty_points - currentTier.minPoints) /
        (nextTier.minPoints - currentTier.minPoints)) *
      100
    : 100;

  const pointsToNextTier = nextTier
    ? nextTier.minPoints - loyaltyData.loyalty_points
    : 0;

  const handleRedeem = async (reward: Reward) => {
    if (loyaltyData.loyalty_points < reward.points) {
      addToast(
        `Necesitas ${reward.points - loyaltyData.loyalty_points} puntos más`,
        "error",
      );
      return;
    }

    setRedeeming(reward.id);

    try {
      // Deduct points
      const { error } = await supabase
        .from("customers")
        .update({
          loyalty_points: loyaltyData.loyalty_points - reward.points,
        })
        .eq("id", loyaltyData.id);

      if (error) throw error;

      // Log the transaction (if points_transactions table exists)
      await supabase
        .from("points_transactions")
        .insert({
          customer_id: loyaltyData.id,
          points: -reward.points,
          type: "redeemed",
          description: `Canjeado: ${reward.reward}`,
        })
        .select()
        .maybeSingle();

      addToast(
        `¡${reward.reward} canjeado! Muestra este código en tu próxima visita`,
        "success",
      );

      // Refresh page to update points
      window.location.reload();
    } catch (err) {
      console.error("Redeem error:", err);
      addToast("Error al canjear. Intenta de nuevo.", "error");
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <section className="py-12 bg-[#1F1D1A]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Main Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#252320] border border-[#FF6B35]/30 p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 ${currentTier.color}`} />
              <span className="font-handwritten text-2xl text-[#FF6B35]">
                Tu Cuenta SimmerLovers
              </span>
            </div>
            <div
              className={`px-3 py-1 ${currentTier.color} text-white text-sm font-bold`}
            >
              {currentTier.name}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-[#6B6560] text-sm mb-1">Nombre</p>
              <p className="text-[#FFF8F0] text-xl font-display">
                {loyaltyData.first_name} {loyaltyData.last_name}
              </p>
            </div>
            <div>
              <p className="text-[#6B6560] text-sm mb-1">Puntos Disponibles</p>
              <p className="text-[#FF6B35] text-3xl font-bold">
                {loyaltyData.loyalty_points.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[#6B6560] text-sm mb-1">Total de Pedidos</p>
              <p className="text-[#FFF8F0] text-xl font-display">
                {loyaltyData.total_orders}
              </p>
            </div>
            <div>
              <p className="text-[#6B6560] text-sm mb-1">Total Gastado</p>
              <p className="text-[#FFF8F0] text-xl font-display">
                ${loyaltyData.total_spent?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="border-t border-[#3D3936] pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#6B6560] text-sm">
                  Progreso a {nextTier.name}
                </span>
                <span className="text-[#FF6B35] text-sm font-bold">
                  {pointsToNextTier} puntos para subir
                </span>
              </div>
              <div className="h-3 bg-[#3D3936] overflow-hidden">
                <motion.div
                  className={`h-full ${nextTier.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressToNextTier, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-[#6B6560]">
                <span>
                  {currentTier.name} ({currentTier.minPoints} pts)
                </span>
                <span>
                  {nextTier.name} ({nextTier.minPoints} pts)
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Rewards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#252320] border border-[#3D3936] p-8 mb-8"
        >
          <h3 className="font-display text-2xl text-[#FFF8F0] mb-6 flex items-center gap-2">
            <Gift className="w-6 h-6 text-[#FF6B35]" />
            Canjea Tus Puntos
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {rewards.map((reward) => {
              const canRedeem = loyaltyData.loyalty_points >= reward.points;
              const isRedeeming = redeeming === reward.id;

              return (
                <button
                  key={reward.id}
                  onClick={() => handleRedeem(reward)}
                  disabled={!canRedeem || isRedeeming}
                  className={`p-4 text-center transition-all ${
                    canRedeem
                      ? "bg-[#2D2A26] border border-[#FF6B35]/50 hover:border-[#FF6B35] hover:bg-[#3D3936] cursor-pointer"
                      : "bg-[#2D2A26] border border-[#3D3936] opacity-50 cursor-not-allowed"
                  }`}
                >
                  <span className="text-3xl mb-2 block">{reward.icon}</span>
                  <p className="text-[#FFF8F0] font-semibold text-sm mb-1">
                    {reward.reward}
                  </p>
                  <p
                    className={`text-sm font-bold ${canRedeem ? "text-[#FF6B35]" : "text-[#6B6560]"}`}
                  >
                    {reward.points} pts
                  </p>
                  {isRedeeming && (
                    <Loader2 className="w-4 h-4 text-[#FF6B35] animate-spin mx-auto mt-2" />
                  )}
                  {canRedeem && !isRedeeming && (
                    <span className="text-xs text-[#4CAF50] mt-2 block">
                      Disponible
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Points History */}
        {transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#252320] border border-[#3D3936] p-8"
          >
            <h3 className="font-display text-2xl text-[#FFF8F0] mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#FF6B35]" />
              Historial de Puntos
            </h3>

            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-[#3D3936] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {tx.type === "earned" && (
                      <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
                    )}
                    {tx.type === "redeemed" && (
                      <Gift className="w-5 h-5 text-[#FF6B35]" />
                    )}
                    {tx.type === "bonus" && (
                      <Sparkles className="w-5 h-5 text-[#FFD700]" />
                    )}
                    <div>
                      <p className="text-[#FFF8F0]">{tx.description}</p>
                      <p className="text-xs text-[#6B6560]">
                        {new Date(tx.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${tx.points > 0 ? "text-[#4CAF50]" : "text-[#FF6B35]"}`}
                  >
                    {tx.points > 0 ? "+" : ""}
                    {tx.points} pts
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// Guest View (not logged in)
function GuestView() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-oven-warmth opacity-50" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-[#FF6B35]/10 border border-[#FF6B35]/20 px-4 py-2 mb-6">
              <Heart className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
              <span className="text-[#FF6B35] font-medium">
                Programa de Lealtad Exclusivo
              </span>
            </div>

            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Únete a la familia
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-[#FFF8F0] mb-6">
              SimmerLovers
            </h1>
            <p className="text-xl text-[#B8B0A8] mb-10 max-w-2xl mx-auto">
              Nuestro programa de lealtad que te recompensa por lo que ya amas
              hacer — disfrutar pizza increíble. Gana puntos, desbloquea
              recompensas, obtén beneficios exclusivos.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 font-bold text-lg transition-all min-h-[56px]"
              >
                Únete Gratis — Obtén 50 Puntos
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/login"
                className="flex items-center gap-2 bg-[#252320] hover:bg-[#3D3936] border border-[#3D3936] text-[#FFF8F0] px-8 py-4 font-semibold text-lg transition-all min-h-[56px]"
              >
                Ya Soy Miembro
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#252320] border-y border-[#3D3936]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Cómo Funciona
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0]">
              Gana. Canjea. Disfruta.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Users,
                title: "Regístrate Gratis",
                description:
                  "Crea tu cuenta en segundos y obtén 50 puntos de bienvenida.",
              },
              {
                step: "02",
                icon: Pizza,
                title: "Gana Puntos",
                description:
                  "Obtén 1 punto por cada $1 gastado. Más a medida que subes de nivel.",
              },
              {
                step: "03",
                icon: Gift,
                title: "Canjea Recompensas",
                description:
                  "Convierte puntos en pizza gratis, bebidas, acompañamientos y más.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-[#2D2A26] border border-[#3D3936] p-8 h-full">
                  <span className="text-6xl font-display text-[#3D3936]">
                    {item.step}
                  </span>
                  <div className="w-14 h-14 bg-[#FF6B35]/10 flex items-center justify-center my-6">
                    <item.icon className="w-7 h-7 text-[#FF6B35]" />
                  </div>
                  <h3 className="font-display text-xl text-[#FFF8F0] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[#6B6560]">{item.description}</p>
                </div>

                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-[#3D3936]">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Niveles de Miembro
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0] mb-4">
              Sube de Nivel
            </h2>
            <p className="text-[#B8B0A8] max-w-2xl mx-auto">
              Entre más ordenes, más alto subes. Cada nivel desbloquea mejores
              recompensas y multiplicadores de puntos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className={`relative overflow-hidden ${i === 2 ? "ring-2 ring-[#FF6B35]" : ""}`}
              >
                {i === 2 && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-[#FF6B35] text-white text-xs font-bold px-3 py-1 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Mejor Valor
                    </span>
                  </div>
                )}

                <div className={`h-2 ${tier.color}`} />

                <div className="bg-[#252320] border border-[#3D3936] border-t-0 p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <Flame
                      className={`w-6 h-6 ${i === 0 ? "text-[#6B6560]" : "text-[#FF6B35]"}`}
                    />
                    <h3 className="font-display text-2xl text-[#FFF8F0]">
                      {tier.name}
                    </h3>
                  </div>
                  <p className="text-[#6B6560] mb-2">
                    {tier.minPoints} -{" "}
                    {tier.maxPoints === Infinity ? "∞" : tier.maxPoints} puntos
                  </p>
                  <p className="text-[#FF6B35] text-sm font-bold mb-6">
                    {tier.multiplier}x puntos por compra
                  </p>

                  <ul className="space-y-3">
                    {tier.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-center gap-3 text-[#B8B0A8]"
                      >
                        <Check className="w-5 h-5 text-[#FF6B35] flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards Preview */}
      <section className="py-24 bg-[#252320] border-y border-[#3D3936]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Menú de Recompensas
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0]">
              Canjea Tus Puntos
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {rewards.map((reward, i) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-[#2D2A26] border border-[#3D3936] p-6 text-center hover:border-[#FF6B35]/50 transition-colors"
              >
                <span className="text-4xl mb-4 block">{reward.icon}</span>
                <p className="text-[#FFF8F0] font-semibold mb-1">
                  {reward.reward}
                </p>
                <p className="text-[#FF6B35] text-sm font-bold">
                  {reward.points} pts
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks Grid */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-handwritten text-2xl text-[#FF6B35] mb-4">
              Beneficios de Miembro
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-[#FFF8F0]">
              Más Allá de los Puntos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk, i) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#252320] border border-[#3D3936] p-6 hover:border-[#FF6B35]/30 transition-colors"
              >
                <div className="w-12 h-12 bg-[#FF6B35]/10 flex items-center justify-center mb-4">
                  <perk.icon className="w-6 h-6 text-[#FF6B35]" />
                </div>
                <h3 className="font-display text-lg text-[#FFF8F0] mb-2">
                  {perk.title}
                </h3>
                <p className="text-[#6B6560] text-sm">{perk.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#FF6B35]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-12 h-12 text-white mx-auto mb-6" />
            <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
              ¿Listo para Comenzar a Ganar?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Únete a SimmerLovers hoy y obtén 50 puntos de bono solo por
              registrarte. ¡Eso ya es la mitad del camino a una bebida gratis!
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-[#2D2A26] hover:bg-[#1F1D1A] text-white px-10 py-5 font-bold text-xl transition-all min-h-[56px]"
            >
              Únete Gratis — Obtén 50 Puntos
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}

// Main Page Component
export default function SimmerLoversPage() {
  const [loading, setLoading] = useState(true);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);

  useEffect(() => {
    async function fetchLoyaltyData() {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch customer loyalty data
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (customer) {
        setLoyaltyData(customer as LoyaltyData);

        // Try to fetch points transactions (may not exist)
        const { data: txs } = await supabase
          .from("points_transactions")
          .select("*")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (txs) {
          setTransactions(txs as PointsTransaction[]);
        }
      }

      setLoading(false);
    }

    fetchLoyaltyData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2D2A26] pt-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FF6B35] animate-spin mx-auto mb-4" />
          <p className="text-[#FFF8F0]">Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-24">
      {loyaltyData ? (
        <>
          {/* Logged in user header */}
          <section className="py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-oven-warmth opacity-30" />
            <div className="max-w-6xl mx-auto px-6 relative text-center">
              <p className="font-handwritten text-2xl text-[#FF6B35] mb-2">
                Bienvenido de vuelta
              </p>
              <h1 className="font-display text-4xl md:text-5xl text-[#FFF8F0]">
                {loyaltyData.first_name}
              </h1>
            </div>
          </section>

          <LoyaltyDashboard
            loyaltyData={loyaltyData}
            transactions={transactions}
          />

          {/* Tiers section for reference */}
          <section className="py-16 bg-[#252320] border-t border-[#3D3936]">
            <div className="max-w-6xl mx-auto px-6">
              <h2 className="font-display text-2xl text-[#FFF8F0] mb-8 text-center">
                Niveles de Miembro
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map((tier, i) => {
                  const isCurrentTier = tier.key === loyaltyData.loyalty_tier;
                  return (
                    <div
                      key={tier.name}
                      className={`p-6 border ${isCurrentTier ? "border-[#FF6B35] bg-[#FF6B35]/10" : "border-[#3D3936] bg-[#2D2A26]"}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-3 h-3 ${tier.color}`} />
                        <span className="text-[#FFF8F0] font-bold">
                          {tier.name}
                        </span>
                        {isCurrentTier && (
                          <span className="text-xs text-[#FF6B35] ml-auto">
                            Tu Nivel
                          </span>
                        )}
                      </div>
                      <p className="text-[#6B6560] text-sm mb-2">
                        {tier.minPoints} -{" "}
                        {tier.maxPoints === Infinity ? "∞" : tier.maxPoints} pts
                      </p>
                      <p className={`text-sm font-bold ${tier.textColor}`}>
                        {tier.multiplier}x puntos
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      ) : (
        <GuestView />
      )}
    </div>
  );
}
