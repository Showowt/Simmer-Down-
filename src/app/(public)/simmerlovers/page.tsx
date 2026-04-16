"use client";

import { motion } from "framer-motion";
import {
  Gift,
  Zap,
  Award,
  Users,
  ArrowRight,
  Sparkles,
  Crown,
  Flame,
  Percent,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToastStore } from "@/components/Toast";

// ─────────────────────────────────────────────
// Real production schema types
// ─────────────────────────────────────────────
type Tier = "bronze" | "silver" | "gold" | "platinum";

interface Customer {
  id: string;
  auth_user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  loyalty_tier: Tier;
  loyalty_points_balance: number;
  lifetime_points_earned: number;
  total_orders: number;
  total_spent: number;
  first_order_at: string | null;
  created_at: string;
}

interface TierConfig {
  tier: Tier;
  display_name: string;
  display_name_es: string | null;
  min_lifetime_points: number;
  points_multiplier: number;
  perks: string[];
  perks_es: string[] | null;
  color_hex: string;
}

interface LoyaltyReward {
  id: string;
  name: string;
  name_es: string | null;
  description: string | null;
  description_es: string | null;
  points_required: number;
  reward_type: string;
  discount_percent: number | null;
  discount_amount: number | null;
  min_tier_required: Tier;
  is_active: boolean;
  image_url: string | null;
  display_order: number;
}

interface LoyaltyTransaction {
  id: string;
  transaction_type: string;
  points: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

const TIER_ORDER: Tier[] = ["bronze", "silver", "gold", "platinum"];

// Icons per tier
const tierIcon: Record<Tier, React.ComponentType<{ className?: string }>> = {
  bronze: Flame,
  silver: Sparkles,
  gold: Award,
  platinum: Crown,
};

const perkIcons = [
  { icon: Gift, title: "Recompensas de Cumpleaños" },
  { icon: Zap, title: "Ofertas Flash Exclusivas" },
  { icon: Sparkles, title: "Acceso Anticipado al Menú" },
  { icon: Users, title: "Invitaciones a Eventos VIP" },
  { icon: Percent, title: "Descuentos de Miembro" },
  { icon: Calendar, title: "Pickup Prioritario" },
];

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ─────────────────────────────────────────────
// SSR fallback data (visible until live data hydrates)
// Matches the seeded DB so what you see here is what you see after hydration.
// ─────────────────────────────────────────────
const FALLBACK_TIERS: TierConfig[] = [
  {
    tier: "bronze",
    display_name: "Bronze",
    display_name_es: "Bronce",
    min_lifetime_points: 0,
    points_multiplier: 1.0,
    perks: [],
    perks_es: ["1 punto por cada $1", "Recompensa de cumpleaños", "Ofertas exclusivas"],
    color_hex: "#8B6F3A",
  },
  {
    tier: "silver",
    display_name: "Silver",
    display_name_es: "Plata",
    min_lifetime_points: 500,
    points_multiplier: 1.25,
    perks: [],
    perks_es: ["1.25x puntos", "Delivery gratis", "Acceso anticipado al menú"],
    color_hex: "#B8B0A8",
  },
  {
    tier: "gold",
    display_name: "Gold",
    display_name_es: "Oro",
    min_lifetime_points: 1500,
    points_multiplier: 1.5,
    perks: [],
    perks_es: ["1.5x puntos", "Pickup prioritario", "Toppings premium gratis", "Invitación mensual a degustación"],
    color_hex: "#C9A84C",
  },
  {
    tier: "platinum",
    display_name: "Platinum",
    display_name_es: "Platino",
    min_lifetime_points: 5000,
    points_multiplier: 2.0,
    perks: [],
    perks_es: ["2x puntos", "Eventos VIP", "Merch exclusivo", "Reservas prioritarias", "Pizza de cumpleaños cortesía"],
    color_hex: "#E5E4E2",
  },
];

const FALLBACK_REWARDS: LoyaltyReward[] = [
  { id: "fb-1", name: "Free Drink", name_es: "Bebida Gratis", description: null, description_es: "Cualquier bebida del menú", points_required: 100, reward_type: "free_item", discount_percent: null, discount_amount: null, min_tier_required: "bronze", is_active: true, image_url: "/images/menu/frozen-positive.jpg", display_order: 1 },
  { id: "fb-2", name: "Free Side", name_es: "Acompañamiento Gratis", description: null, description_es: "Pan de ajo, papas o aros de cebolla", points_required: 250, reward_type: "free_item", discount_percent: null, discount_amount: null, min_tier_required: "bronze", is_active: true, image_url: "/images/menu/entradas-cheese-balls.jpg", display_order: 2 },
  { id: "fb-3", name: "Free Dessert", name_es: "Postre Gratis", description: null, description_es: "Brownie, panna cotta o tiramisú", points_required: 300, reward_type: "free_item", discount_percent: null, discount_amount: null, min_tier_required: "bronze", is_active: true, image_url: "/images/menu/brownie-helado.jpg", display_order: 3 },
  { id: "fb-4", name: "10% Off", name_es: "10% de Descuento", description: null, description_es: "10% de descuento en tu próximo pedido", points_required: 400, reward_type: "percent_discount", discount_percent: 10, discount_amount: null, min_tier_required: "bronze", is_active: true, image_url: "/images/menu/pizzas-hero.jpg", display_order: 4 },
  { id: "fb-5", name: "Free Personal Pizza", name_es: "Pizza Personal Gratis", description: null, description_es: "Pizza personal de cualquier sabor del menú regular", points_required: 500, reward_type: "free_item", discount_percent: null, discount_amount: null, min_tier_required: "bronze", is_active: true, image_url: "/images/menu/pizza-maradona.jpg", display_order: 5 },
  { id: "fb-6", name: "$15 Off", name_es: "$15 de Descuento", description: null, description_es: "$15 de descuento en pedidos de $40+", points_required: 750, reward_type: "fixed_discount", discount_percent: null, discount_amount: 15, min_tier_required: "silver", is_active: true, image_url: "/images/menu/terramar-maitre.jpg", display_order: 6 },
  { id: "fb-7", name: "Free Large Pizza", name_es: "Pizza Grande Gratis", description: null, description_es: "Pizza grande de cualquier sabor signature", points_required: 1000, reward_type: "free_item", discount_percent: null, discount_amount: null, min_tier_required: "silver", is_active: true, image_url: "/images/menu/pizza-memoravel.jpg", display_order: 7 },
  { id: "fb-8", name: "Pizza Party", name_es: "Pizza Party (4 Pizzas Grandes)", description: null, description_es: "Cuatro pizzas grandes + 4 bebidas", points_required: 2000, reward_type: "free_item", discount_percent: null, discount_amount: null, min_tier_required: "gold", is_active: true, image_url: "/images/heroes/homepage-pizzas.jpg", display_order: 8 },
];

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function SimmerLoversPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tierConfigs, setTierConfigs] = useState<TierConfig[]>(FALLBACK_TIERS);
  const [rewards, setRewards] = useState<LoyaltyReward[]>(FALLBACK_REWARDS);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  // Render guest view on SSR. Replaced with live data post-hydration.
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      // Everyone gets tier config + rewards (public RLS).
      const [tiersRes, rewardsRes] = await Promise.all([
        supabase
          .from("loyalty_tier_config")
          .select("*")
          .order("min_lifetime_points", { ascending: true }),
        supabase
          .from("loyalty_rewards")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
      ]);

      if (tiersRes.data) setTierConfigs(tiersRes.data as TierConfig[]);
      if (rewardsRes.data) setRewards(rewardsRes.data as LoyaltyReward[]);

      // If logged in, load customer + transaction history.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: customerRow } = await supabase
          .from("customers")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (customerRow) {
          setCustomer(customerRow as Customer);
          const { data: txs } = await supabase
            .from("loyalty_transactions")
            .select("*")
            .eq("customer_id", customerRow.id)
            .order("created_at", { ascending: false })
            .limit(25);
          if (txs) setTransactions(txs as LoyaltyTransaction[]);
        }
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <LoyaltyLoading />;
  }

  return (
    <div className="min-h-screen bg-[#2D2A26]">
      <Hero signedIn={!!customer} />

      {customer ? (
        <MemberDashboard
          customer={customer}
          tierConfigs={tierConfigs}
          rewards={rewards}
          transactions={transactions}
          onUpdate={(next, tx) => {
            setCustomer(next);
            if (tx) setTransactions([tx, ...transactions]);
          }}
        />
      ) : (
        <GuestView tierConfigs={tierConfigs} rewards={rewards} />
      )}

      <PerksSection />
      <CallToAction signedIn={!!customer} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────
function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative pt-32 pb-16 md:pb-24 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/heroes/homepage-pizzas.jpg"
          alt="Simmer Lovers"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2D2A26]/70 via-[#2D2A26]/90 to-[#2D2A26]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35] px-4 py-1.5 text-sm uppercase tracking-wider mb-6"
        >
          <Flame className="w-4 h-4" />
          Programa de Lealtad
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-5xl md:text-7xl text-[#FFF8F0] mb-6 leading-tight"
        >
          Simmer <span className="text-[#FF6B35]">Lovers</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-[#B8B0A8] max-w-2xl mx-auto mb-8"
        >
          Puntos por cada pedido. Recompensas que se sienten. Una tribu que come bien.
        </motion.p>

        {!signedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/signup?loyalty=1"
              className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 font-semibold flex items-center gap-2 transition min-h-[56px]"
            >
              Unirme gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="text-[#FFF8F0] hover:text-[#FF6B35] transition px-4 py-3"
            >
              Ya soy miembro · Ingresar
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Guest view: show tiers + rewards, drive signup
// ─────────────────────────────────────────────
function GuestView({
  tierConfigs,
  rewards,
}: {
  tierConfigs: TierConfig[];
  rewards: LoyaltyReward[];
}) {
  return (
    <>
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] mb-4">
              Cómo funciona
            </h2>
            <p className="text-[#B8B0A8] max-w-2xl mx-auto">
              Gana puntos en cada pedido. Sube de tier con tu historial. Canjea
              por platos, descuentos y experiencias reales.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { n: "1", title: "Unite", desc: "Creá tu cuenta en 30 segundos. Gratis, para siempre." },
              { n: "2", title: "Pedí", desc: "Ganás 1+ puntos por cada USD que gastás (multiplicador por tier)." },
              { n: "3", title: "Canjeá", desc: "Bebidas gratis, pizzas, pizza-parties y eventos VIP." },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#252320] border border-[#3D3936] p-8"
              >
                <div className="text-[#FF6B35] font-display text-5xl mb-4">{step.n}</div>
                <h3 className="text-[#FFF8F0] text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-[#B8B0A8]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TierLadder tierConfigs={tierConfigs} />

      <RewardsGrid rewards={rewards} currentPoints={0} canRedeem={false} />
    </>
  );
}

// ─────────────────────────────────────────────
// Member dashboard (logged in)
// ─────────────────────────────────────────────
function MemberDashboard({
  customer,
  tierConfigs,
  rewards,
  transactions,
  onUpdate,
}: {
  customer: Customer;
  tierConfigs: TierConfig[];
  rewards: LoyaltyReward[];
  transactions: LoyaltyTransaction[];
  onUpdate: (customer: Customer, newTx: LoyaltyTransaction | null) => void;
}) {
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const addToast = useToastStore((s) => s.addToast);
  const supabase = createClient();

  const currentTier =
    tierConfigs.find((t) => t.tier === customer.loyalty_tier) ??
    tierConfigs[0];
  const nextTier = tierConfigs.find(
    (t) => t.min_lifetime_points > customer.lifetime_points_earned,
  );
  const progress = nextTier
    ? Math.min(
        100,
        ((customer.lifetime_points_earned - currentTier.min_lifetime_points) /
          (nextTier.min_lifetime_points - currentTier.min_lifetime_points)) *
          100,
      )
    : 100;
  const pointsToNext = nextTier
    ? nextTier.min_lifetime_points - customer.lifetime_points_earned
    : 0;

  const canRedeemTier = (minTier: Tier) =>
    TIER_ORDER.indexOf(customer.loyalty_tier) >= TIER_ORDER.indexOf(minTier);

  const handleRedeem = async (reward: LoyaltyReward) => {
    if (customer.loyalty_points_balance < reward.points_required) {
      addToast(
        `Necesitas ${reward.points_required - customer.loyalty_points_balance} puntos más`,
        "error",
      );
      return;
    }
    if (!canRedeemTier(reward.min_tier_required)) {
      addToast(
        `Esta recompensa requiere tier ${reward.min_tier_required}`,
        "error",
      );
      return;
    }

    setRedeeming(reward.id);
    try {
      const newBalance =
        customer.loyalty_points_balance - reward.points_required;

      // Deduct points on customers row
      const { error: custErr } = await supabase
        .from("customers")
        .update({ loyalty_points_balance: newBalance })
        .eq("id", customer.id);
      if (custErr) throw custErr;

      // Log redemption transaction
      const { data: tx, error: txErr } = await supabase
        .from("loyalty_transactions")
        .insert({
          customer_id: customer.id,
          transaction_type: "redeem",
          points: -reward.points_required,
          balance_after: newBalance,
          reward_id: reward.id,
          description: reward.name_es || reward.name,
        })
        .select()
        .single();
      if (txErr) throw txErr;

      onUpdate(
        { ...customer, loyalty_points_balance: newBalance },
        tx as LoyaltyTransaction,
      );
      addToast(
        `¡Canjeaste ${reward.name_es || reward.name}! Muestra este recibo en tu próxima visita.`,
        "success",
      );
    } catch (err) {
      console.error("Redeem failed:", err);
      addToast("No se pudo canjear. Intenta de nuevo.", "error");
    } finally {
      setRedeeming(null);
    }
  };

  const TierIcon = tierIcon[customer.loyalty_tier];

  return (
    <section className="py-12 md:py-16 px-6 -mt-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Member card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1F1D1A] via-[#252320] to-[#1F1D1A] border border-[#FF6B35]/30 p-8 md:p-12 mb-12 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(circle at 80% 20%, ${currentTier.color_hex} 0%, transparent 60%)`,
            }}
          />
          <div className="relative grid md:grid-cols-[auto_1fr_auto] gap-8 items-center">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 flex items-center justify-center"
                style={{
                  backgroundColor: `${currentTier.color_hex}22`,
                  color: currentTier.color_hex,
                }}
              >
                <TierIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[#6B6560] text-xs uppercase tracking-wider mb-1">
                  Tier
                </p>
                <p
                  className="font-display text-2xl capitalize"
                  style={{ color: currentTier.color_hex }}
                >
                  {currentTier.display_name_es || currentTier.display_name}
                </p>
                <p className="text-xs text-[#6B6560] mt-1">
                  {currentTier.points_multiplier}× puntos
                </p>
              </div>
            </div>

            <div>
              <p className="text-[#6B6560] text-xs uppercase tracking-wider mb-1">
                Hola, {customer.first_name || "Simmer Lover"}
              </p>
              <p className="font-display text-5xl md:text-6xl text-[#FFF8F0] mb-1">
                {customer.loyalty_points_balance.toLocaleString("es-SV")}
              </p>
              <p className="text-[#B8B0A8] text-sm">puntos disponibles</p>
              {nextTier && (
                <div className="mt-4 max-w-md">
                  <div className="flex justify-between text-xs text-[#6B6560] mb-1.5">
                    <span>Próximo tier: <span className="text-[#FFF8F0] capitalize">{nextTier.display_name_es || nextTier.display_name}</span></span>
                    <span>{pointsToNext.toLocaleString("es-SV")} puntos</span>
                  </div>
                  <div className="h-1.5 bg-[#3D3936] overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: currentTier.color_hex,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-3 text-sm">
              <Stat label="Pedidos" value={customer.total_orders} />
              <Stat
                label="Gastado"
                value={`$${Number(customer.total_spent ?? 0).toFixed(2)}`}
              />
            </div>
          </div>
        </motion.div>

        <RewardsGrid
          rewards={rewards}
          currentPoints={customer.loyalty_points_balance}
          canRedeem={true}
          onRedeem={handleRedeem}
          redeemingId={redeeming}
          canRedeemTier={canRedeemTier}
        />

        {transactions.length > 0 && <TransactionHistory transactions={transactions} />}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-[#2D2A26]/50 px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-[#6B6560] mb-0.5">
        {label}
      </p>
      <p className="text-[#FFF8F0] text-lg font-semibold">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Tier ladder
// ─────────────────────────────────────────────
function TierLadder({ tierConfigs }: { tierConfigs: TierConfig[] }) {
  return (
    <section className="py-16 md:py-20 px-6 border-t border-[#3D3936]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] mb-4">
            4 Tiers. Cada uno con su fuego.
          </h2>
          <p className="text-[#B8B0A8] max-w-2xl mx-auto">
            Subís de tier por puntos acumulados de por vida. Una vez que llegás,
            no bajás.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tierConfigs.map((tier, i) => {
            const Icon = tierIcon[tier.tier];
            return (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-[#252320] border border-[#3D3936] p-6 flex flex-col"
                style={{ borderTop: `3px solid ${tier.color_hex}` }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: `${tier.color_hex}22`,
                    color: tier.color_hex,
                  }}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <h3
                  className="font-display text-2xl capitalize mb-1"
                  style={{ color: tier.color_hex }}
                >
                  {tier.display_name_es || tier.display_name}
                </h3>
                <p className="text-xs text-[#6B6560] uppercase tracking-wider mb-4">
                  {tier.min_lifetime_points === 0
                    ? "Al unirte"
                    : `Desde ${tier.min_lifetime_points.toLocaleString("es-SV")} puntos`}
                </p>

                <div className="text-[#FF6B35] font-semibold text-sm mb-4">
                  {tier.points_multiplier}× puntos en cada pedido
                </div>

                <ul className="space-y-2 text-sm text-[#B8B0A8] flex-1">
                  {(tier.perks_es || tier.perks).map((perk, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: tier.color_hex }}
                      />
                      {perk}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Rewards grid — works for guest AND member
// ─────────────────────────────────────────────
function RewardsGrid({
  rewards,
  currentPoints,
  canRedeem,
  onRedeem,
  redeemingId,
  canRedeemTier,
}: {
  rewards: LoyaltyReward[];
  currentPoints: number;
  canRedeem: boolean;
  onRedeem?: (reward: LoyaltyReward) => void;
  redeemingId?: string | null;
  canRedeemTier?: (tier: Tier) => boolean;
}) {
  return (
    <section className="py-12 md:py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] mb-2">
              Recompensas
            </h2>
            <p className="text-[#B8B0A8]">
              {canRedeem
                ? "Canjeá ahora o ahorrá para las grandes."
                : "Todo esto te espera cuando te unís."}
            </p>
          </div>
          {canRedeem && (
            <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 px-4 py-2 text-sm">
              <span className="text-[#6B6560]">Balance:</span>{" "}
              <span className="text-[#FF6B35] font-bold">
                {currentPoints.toLocaleString("es-SV")} pts
              </span>
            </div>
          )}
        </div>

        {rewards.length === 0 ? (
          <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
            <p className="text-[#B8B0A8]">Pronto agregamos más recompensas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward, i) => {
              const affordable = canRedeem && currentPoints >= reward.points_required;
              const tierLocked =
                canRedeem && canRedeemTier && !canRedeemTier(reward.min_tier_required);
              const isRedeeming = redeemingId === reward.id;

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className={`bg-[#252320] border overflow-hidden transition-all ${
                    affordable && !tierLocked
                      ? "border-[#FF6B35]/40 hover:border-[#FF6B35]"
                      : "border-[#3D3936]"
                  }`}
                >
                  <div className="relative aspect-[16/10] bg-[#1F1D1A] overflow-hidden">
                    {reward.image_url ? (
                      <Image
                        src={reward.image_url}
                        alt={reward.name_es || reward.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className={`object-cover transition-opacity ${
                          tierLocked ? "opacity-40" : "opacity-100"
                        }`}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Gift className="w-12 h-12 text-[#3D3936]" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-[#2D2A26]/90 backdrop-blur-sm px-3 py-1 text-sm font-bold text-[#FF6B35]">
                      {reward.points_required.toLocaleString("es-SV")} pts
                    </div>
                    {tierLocked && (
                      <div className="absolute top-3 right-3 bg-[#2D2A26]/90 backdrop-blur-sm p-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#C9A84C]" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-display text-xl text-[#FFF8F0] mb-1">
                      {reward.name_es || reward.name}
                    </h3>
                    <p className="text-sm text-[#B8B0A8] mb-4 line-clamp-2 min-h-[2.5rem]">
                      {reward.description_es || reward.description || "\u00a0"}
                    </p>

                    {reward.min_tier_required !== "bronze" && (
                      <p className="text-xs text-[#C9A84C] mb-3 capitalize">
                        Tier {reward.min_tier_required}+
                      </p>
                    )}

                    {canRedeem ? (
                      <button
                        onClick={() => onRedeem?.(reward)}
                        disabled={!affordable || tierLocked || isRedeeming}
                        className={`w-full py-3 font-semibold transition min-h-[48px] flex items-center justify-center gap-2 ${
                          affordable && !tierLocked
                            ? "bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
                            : "bg-[#3D3936] text-[#6B6560] cursor-not-allowed"
                        }`}
                      >
                        {isRedeeming ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : tierLocked ? (
                          "Tier requerido"
                        ) : affordable ? (
                          "Canjear"
                        ) : (
                          `Faltan ${(reward.points_required - currentPoints).toLocaleString("es-SV")} pts`
                        )}
                      </button>
                    ) : (
                      <Link
                        href="/auth/signup?loyalty=1"
                        className="w-full block text-center bg-[#3D3936] hover:bg-[#FF6B35] text-[#FFF8F0] py-3 font-semibold transition min-h-[48px]"
                      >
                        Unirme para canjear
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Transaction history (member only)
// ─────────────────────────────────────────────
function TransactionHistory({
  transactions,
}: {
  transactions: LoyaltyTransaction[];
}) {
  const label = (type: string) => {
    switch (type) {
      case "earn":
      case "earned":
        return { text: "Ganado", color: "text-[#4CAF50]" };
      case "redeem":
      case "redeemed":
        return { text: "Canjeado", color: "text-[#FF6B35]" };
      case "bonus":
      case "birthday_bonus":
      case "tier_bonus":
      case "referral_bonus":
        return { text: "Bono", color: "text-[#C9A84C]" };
      case "adjustment":
      case "adjusted":
        return { text: "Ajuste", color: "text-[#B8B0A8]" };
      case "expired":
      case "expiration":
        return { text: "Expirado", color: "text-[#6B6560]" };
      default:
        return { text: type, color: "text-[#B8B0A8]" };
    }
  };

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-[#FFF8F0] mb-6 flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-[#FF6B35]" />
        Historial de puntos
      </h2>
      <div className="bg-[#252320] border border-[#3D3936] overflow-hidden">
        <div className="divide-y divide-[#3D3936]">
          {transactions.map((tx) => {
            const l = label(tx.transaction_type);
            const positive = tx.points >= 0;
            return (
              <div
                key={tx.id}
                className="p-4 md:p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Clock className="w-4 h-4 text-[#6B6560] flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-xs uppercase tracking-wider ${l.color}`}
                      >
                        {l.text}
                      </span>
                      <span className="text-xs text-[#6B6560]">
                        {new Date(tx.created_at).toLocaleDateString("es-SV", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-[#FFF8F0] text-sm truncate">
                      {tx.description || "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-mono font-semibold ${
                      positive ? "text-[#4CAF50]" : "text-[#FF6B35]"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {tx.points.toLocaleString("es-SV")}
                  </p>
                  <p className="text-xs text-[#6B6560]">
                    saldo {tx.balance_after.toLocaleString("es-SV")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Perks strip
// ─────────────────────────────────────────────
function PerksSection() {
  return (
    <section className="py-16 md:py-20 px-6 border-t border-[#3D3936] bg-[#252320]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-[#FFF8F0] mb-4">
            Beneficios que sí se sienten
          </h2>
          <p className="text-[#B8B0A8] max-w-2xl mx-auto">
            No es un cupón perdido en un email. Es acceso, servicio y noches que
            no se repiten.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {perkIcons.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-[#2D2A26] border border-[#3D3936] p-5 md:p-6 flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#FF6B35]" />
                </div>
                <h3 className="text-[#FFF8F0] font-semibold text-sm md:text-base pt-1">
                  {p.title}
                </h3>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Bottom CTA
// ─────────────────────────────────────────────
function CallToAction({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="py-20 md:py-28 px-6 bg-gradient-to-br from-[#FF6B35] to-[#E55A2B]">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Flame className="w-12 h-12 text-white mx-auto mb-6" />
          <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
            {signedIn
              ? "Tu próxima noche ya está pagando puntos"
              : "La pizza también premia la lealtad"}
          </h2>
          <p className="text-white/90 text-xl mb-10">
            {signedIn
              ? "Pedí, canjeá, volvé. Repetí."
              : "30 segundos para crear tu cuenta. El resto de tu vida para canjear."}
          </p>
          <Link
            href={signedIn ? "/menu" : "/auth/signup?loyalty=1"}
            className="inline-flex items-center gap-2 bg-[#2D2A26] hover:bg-[#1F1D1A] text-white px-10 py-5 text-xl font-semibold transition min-h-[56px]"
          >
            {signedIn ? "Ir al menú" : "Unirme gratis"}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────
function LoyaltyLoading() {
  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-16 bg-[#252320] w-1/2 mx-auto" />
          <div className="h-6 bg-[#252320] w-2/3 mx-auto" />
          <div className="h-40 bg-[#252320] mt-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-[#252320]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
