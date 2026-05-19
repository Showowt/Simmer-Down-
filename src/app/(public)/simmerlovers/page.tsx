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
import { useI18n, translations } from "@/lib/i18n";

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

const perkIconsData = [
  { icon: Gift, title_es: "Recompensas de Cumpleaños", title_en: "Birthday Rewards" },
  { icon: Zap, title_es: "Ofertas Flash Exclusivas", title_en: "Exclusive Flash Offers" },
  { icon: Sparkles, title_es: "Acceso Anticipado al Menú", title_en: "Early Menu Access" },
  { icon: Users, title_es: "Invitaciones a Eventos VIP", title_en: "VIP Event Invitations" },
  { icon: Percent, title_es: "Descuentos de Miembro", title_en: "Member Discounts" },
  { icon: Calendar, title_es: "Pickup Prioritario", title_en: "Priority Pickup" },
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
  const { t, locale } = useI18n();
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
    <div className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 lg:pb-0">
      <Hero signedIn={!!customer} t={t} locale={locale} />

      {customer ? (
        <MemberDashboard
          customer={customer}
          tierConfigs={tierConfigs}
          rewards={rewards}
          transactions={transactions}
          t={t}
          locale={locale}
          onUpdate={(next, tx) => {
            setCustomer(next);
            if (tx) setTransactions([tx, ...transactions]);
          }}
        />
      ) : (
        <GuestView tierConfigs={tierConfigs} rewards={rewards} t={t} locale={locale} />
      )}

      <PerksSection t={t} locale={locale} />
      <CallToAction signedIn={!!customer} t={t} locale={locale} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────
function Hero({ signedIn, t, locale }: { signedIn: boolean; t: (obj: { es: string; en: string }) => string; locale: string }) {
  return (
    <section className="relative pt-4 pb-16 md:pb-24 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/heroes/homepage-pizzas.jpg"
          alt="Simmer Lovers"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-[#0A0A0A]/90 to-[#0A0A0A]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-[#1A1A1A] border border-white/10 text-[#FBBF24] px-4 py-1.5 text-sm uppercase tracking-wider mb-6"
        >
          <Flame className="w-4 h-4" />
          {t(translations.loyalty.loyaltyProgram)}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-3xl md:text-4xl text-white mb-6 leading-tight tracking-tight"
        >
          Simmer <span className="text-[#FBBF24]">Lovers</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-8"
        >
          {t(translations.loyalty.tagline)}
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
              className="bg-[#E85D04] hover:bg-[#C2410C] text-white px-8 py-4 font-semibold flex items-center gap-2 transition min-h-[56px]"
            >
              {t(translations.loyalty.joinFree)}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="text-white hover:text-[#E85D04] transition px-4 py-3"
            >
              {t(translations.loyalty.alreadyMember)}
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
  t,
  locale,
}: {
  tierConfigs: TierConfig[];
  rewards: LoyaltyReward[];
  t: (obj: { es: string; en: string }) => string;
  locale: string;
}) {
  return (
    <>
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl text-white mb-4">
              {t(translations.loyalty.howItWorks)}
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              {t(translations.loyalty.howItWorksDesc)}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { n: "1", title: t(translations.loyalty.step1), desc: t(translations.loyalty.step1Desc) },
              { n: "2", title: t(translations.loyalty.step2), desc: t(translations.loyalty.step2Desc) },
              { n: "3", title: t(translations.loyalty.step3), desc: t(translations.loyalty.step3Desc) },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#1A1A1A] border border-white/10 p-8"
              >
                <div className="text-[#FBBF24] font-display text-5xl mb-4">{step.n}</div>
                <h3 className="text-white text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-white/60">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TierLadder tierConfigs={tierConfigs} t={t} locale={locale} />

      <RewardsGrid rewards={rewards} currentPoints={0} canRedeem={false} t={t} locale={locale} />
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
  t,
  locale,
  onUpdate,
}: {
  customer: Customer;
  tierConfigs: TierConfig[];
  rewards: LoyaltyReward[];
  transactions: LoyaltyTransaction[];
  t: (obj: { es: string; en: string }) => string;
  locale: string;
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
      const diff = reward.points_required - customer.loyalty_points_balance;
      addToast(
        locale === 'es'
          ? `Necesitas ${diff} puntos más`
          : `You need ${diff} more points`,
        "error",
      );
      return;
    }
    if (!canRedeemTier(reward.min_tier_required)) {
      addToast(
        locale === 'es'
          ? `Esta recompensa requiere tier ${reward.min_tier_required}`
          : `This reward requires ${reward.min_tier_required} tier`,
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
      const rewardName = locale === 'es' ? (reward.name_es || reward.name) : reward.name;
      addToast(
        locale === 'es'
          ? `¡Canjeaste ${rewardName}! Muestra este recibo en tu próxima visita.`
          : `You redeemed ${rewardName}! Show this receipt on your next visit.`,
        "success",
      );
    } catch (err) {
      console.error("Redeem failed:", err);
      addToast(
        locale === 'es' ? "No se pudo canjear. Intenta de nuevo." : "Could not redeem. Please try again.",
        "error",
      );
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
          className="bg-gradient-to-br from-[#111111] via-[#1A1A1A] to-[#111111] border border-[#E85D04]/30 p-8 md:p-12 mb-12 relative overflow-hidden"
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
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  {t(translations.loyalty.tier)}
                </p>
                <p
                  className="font-display text-2xl capitalize"
                  style={{ color: currentTier.color_hex }}
                >
                  {locale === 'es' ? (currentTier.display_name_es || currentTier.display_name) : currentTier.display_name}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {currentTier.points_multiplier}× {t(translations.loyalty.points)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">
                {locale === 'es' ? 'Hola' : 'Hello'}, {customer.first_name || "Simmer Lover"}
              </p>
              <p className="font-display text-5xl md:text-6xl text-white mb-1">
                {customer.loyalty_points_balance.toLocaleString(locale === 'es' ? "es-SV" : "en-US")}
              </p>
              <p className="text-white/60 text-sm">{t(translations.loyalty.availablePoints)}</p>
              {nextTier && (
                <div className="mt-4 max-w-md">
                  <div className="flex justify-between text-xs text-white/40 mb-1.5">
                    <span>{t(translations.loyalty.nextTier)} <span className="text-white capitalize">{locale === 'es' ? (nextTier.display_name_es || nextTier.display_name) : nextTier.display_name}</span></span>
                    <span>{pointsToNext.toLocaleString(locale === 'es' ? "es-SV" : "en-US")} {t(translations.loyalty.points)}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 overflow-hidden">
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
              <Stat label={t(translations.loyalty.orders)} value={customer.total_orders} />
              <Stat
                label={t(translations.loyalty.spent)}
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
          t={t}
          locale={locale}
        />

        {transactions.length > 0 && <TransactionHistory transactions={transactions} t={t} locale={locale} />}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-[#0A0A0A]/50 px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">
        {label}
      </p>
      <p className="text-white text-lg font-semibold">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Tier ladder
// ─────────────────────────────────────────────
function TierLadder({ tierConfigs, t, locale }: { tierConfigs: TierConfig[]; t: (obj: { es: string; en: string }) => string; locale: string }) {
  return (
    <section className="py-16 md:py-20 px-6 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-white mb-4">
            {t(translations.loyalty.tiers)}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {t(translations.loyalty.tiersDesc)}
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
                className="bg-[#1A1A1A] border border-white/10 p-6 flex flex-col"
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
                  {locale === 'es' ? (tier.display_name_es || tier.display_name) : tier.display_name}
                </h3>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-4">
                  {tier.min_lifetime_points === 0
                    ? t(translations.loyalty.onJoin)
                    : `${t(translations.loyalty.from)} ${tier.min_lifetime_points.toLocaleString(locale === 'es' ? "es-SV" : "en-US")} ${t(translations.loyalty.points)}`}
                </p>

                <div className="text-[#FBBF24] font-semibold text-sm mb-4">
                  {tier.points_multiplier}× {t(translations.loyalty.pointsPerOrder)}
                </div>

                <ul className="space-y-2 text-sm text-white/60 flex-1">
                  {(locale === 'es' ? (tier.perks_es || tier.perks) : tier.perks.length > 0 ? tier.perks : (tier.perks_es || [])).map((perk, j) => (
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
  t,
  locale,
}: {
  rewards: LoyaltyReward[];
  currentPoints: number;
  canRedeem: boolean;
  onRedeem?: (reward: LoyaltyReward) => void;
  redeemingId?: string | null;
  canRedeemTier?: (tier: Tier) => boolean;
  t: (obj: { es: string; en: string }) => string;
  locale: string;
}) {
  return (
    <section className="py-12 md:py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl text-white mb-2">
              {t(translations.loyalty.rewards)}
            </h2>
            <p className="text-white/60">
              {canRedeem
                ? t(translations.loyalty.redeemNow)
                : t(translations.loyalty.awaitingYou)}
            </p>
          </div>
          {canRedeem && (
            <div className="bg-[#E85D04]/10 border border-[#E85D04]/30 px-4 py-2 text-sm">
              <span className="text-white/40">{t(translations.loyalty.balance)}</span>{" "}
              <span className="text-[#E85D04] font-bold">
                {currentPoints.toLocaleString(locale === 'es' ? "es-SV" : "en-US")} pts
              </span>
            </div>
          )}
        </div>

        {rewards.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-white/10 p-12 text-center">
            <p className="text-white/60">
              {locale === 'es' ? "Pronto agregamos más recompensas." : "More rewards coming soon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward, i) => {
              const affordable = canRedeem && currentPoints >= reward.points_required;
              const tierLocked =
                canRedeem && canRedeemTier && !canRedeemTier(reward.min_tier_required);
              const isRedeeming = redeemingId === reward.id;
              const rewardName = locale === 'es' ? (reward.name_es || reward.name) : reward.name;
              const rewardDesc = locale === 'es' ? (reward.description_es || reward.description) : (reward.description || reward.description_es);

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className={`bg-[#1A1A1A] border overflow-hidden transition-all ${
                    affordable && !tierLocked
                      ? "border-[#E85D04]/40 hover:border-[#E85D04]"
                      : "border-white/10"
                  }`}
                >
                  <div className="relative aspect-[16/10] bg-[#111111] overflow-hidden">
                    {reward.image_url ? (
                      <Image
                        src={reward.image_url}
                        alt={rewardName}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className={`object-cover transition-opacity ${
                          tierLocked ? "opacity-40" : "opacity-100"
                        }`}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Gift className="w-12 h-12 text-white/10" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-[#0A0A0A]/90 backdrop-blur-sm px-3 py-1 text-sm font-bold text-[#E85D04]">
                      {reward.points_required.toLocaleString(locale === 'es' ? "es-SV" : "en-US")} pts
                    </div>
                    {tierLocked && (
                      <div className="absolute top-3 right-3 bg-[#0A0A0A]/90 backdrop-blur-sm p-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#FBBF24]" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-display text-xl text-white mb-1">
                      {rewardName}
                    </h3>
                    <p className="text-sm text-white/60 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {rewardDesc || "\u00a0"}
                    </p>

                    {reward.min_tier_required !== "bronze" && (
                      <p className="text-xs text-[#FBBF24] mb-3 capitalize">
                        {t(translations.loyalty.tier)} {reward.min_tier_required}+
                      </p>
                    )}

                    {canRedeem ? (
                      <button
                        onClick={() => onRedeem?.(reward)}
                        disabled={!affordable || tierLocked || isRedeeming}
                        className={`w-full py-3 font-semibold transition min-h-[48px] flex items-center justify-center gap-2 ${
                          affordable && !tierLocked
                            ? "bg-[#E85D04] hover:bg-[#C2410C] text-white"
                            : "bg-white/10 text-white/40 cursor-not-allowed"
                        }`}
                      >
                        {isRedeeming ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : tierLocked ? (
                          t(translations.loyalty.tierRequired)
                        ) : affordable ? (
                          t(translations.loyalty.redeem)
                        ) : (
                          `${t(translations.loyalty.remaining)} ${(reward.points_required - currentPoints).toLocaleString(locale === 'es' ? "es-SV" : "en-US")} pts`
                        )}
                      </button>
                    ) : (
                      <Link
                        href="/auth/signup?loyalty=1"
                        className="w-full block text-center bg-white/10 hover:bg-[#E85D04] text-white py-3 font-semibold transition min-h-[48px]"
                      >
                        {t(translations.loyalty.joinToRedeem)}
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
  t,
  locale,
}: {
  transactions: LoyaltyTransaction[];
  t: (obj: { es: string; en: string }) => string;
  locale: string;
}) {
  const label = (type: string) => {
    switch (type) {
      case "earn":
      case "earned":
        return { text: t(translations.loyalty.earned), color: "text-[#4CAF50]" };
      case "redeem":
      case "redeemed":
        return { text: t(translations.loyalty.redeemed), color: "text-[#E85D04]" };
      case "bonus":
      case "birthday_bonus":
      case "tier_bonus":
      case "referral_bonus":
        return { text: t(translations.loyalty.bonus), color: "text-[#FBBF24]" };
      case "adjustment":
      case "adjusted":
        return { text: t(translations.loyalty.adjusted), color: "text-white/60" };
      case "expired":
      case "expiration":
        return { text: t(translations.loyalty.expired), color: "text-white/40" };
      default:
        return { text: type, color: "text-white/60" };
    }
  };

  const dateLocale = locale === 'es' ? "es-SV" : "en-US";

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-white mb-6 flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-[#E85D04]" />
        {t(translations.loyalty.pointsHistory)}
      </h2>
      <div className="bg-[#1A1A1A] border border-white/10 overflow-hidden">
        <div className="divide-y divide-white/10">
          {transactions.map((tx) => {
            const l = label(tx.transaction_type);
            const positive = tx.points >= 0;
            return (
              <div
                key={tx.id}
                className="p-4 md:p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-xs uppercase tracking-wider ${l.color}`}
                      >
                        {l.text}
                      </span>
                      <span className="text-xs text-white/40">
                        {new Date(tx.created_at).toLocaleDateString(dateLocale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-white text-sm truncate">
                      {tx.description || "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-mono font-semibold ${
                      positive ? "text-[#4CAF50]" : "text-[#E85D04]"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {tx.points.toLocaleString(dateLocale)}
                  </p>
                  <p className="text-xs text-white/40">
                    {t(translations.loyalty.balanceAfter)} {tx.balance_after.toLocaleString(dateLocale)}
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
function PerksSection({ t, locale }: { t: (obj: { es: string; en: string }) => string; locale: string }) {
  return (
    <section className="py-16 md:py-20 px-6 border-t border-white/10 bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-white mb-4">
            {t(translations.loyalty.benefitsThatCount)}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {t(translations.loyalty.benefitsDesc)}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {perkIconsData.map((p, i) => {
            const Icon = p.icon;
            const title = locale === 'es' ? p.title_es : p.title_en;
            return (
              <motion.div
                key={p.title_es}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-[#0A0A0A] border border-white/10 p-5 md:p-6 flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-[#E85D04]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#E85D04]" />
                </div>
                <h3 className="text-white font-semibold text-sm md:text-base pt-1">
                  {title}
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
function CallToAction({ signedIn, t, locale }: { signedIn: boolean; t: (obj: { es: string; en: string }) => string; locale: string }) {
  return (
    <section className="py-28 md:py-32 px-6 bg-[#1A1A1A] border-t border-white/10/30">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Flame className="w-12 h-12 text-[#FBBF24] mx-auto mb-6" />
          <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
            {signedIn
              ? (locale === 'es' ? "Tu próxima noche ya está generando puntos" : "Your next night is already earning points")
              : (locale === 'es' ? "La pizza también premia la lealtad" : "Pizza also rewards loyalty")}
          </h2>
          <p className="text-white/60 text-xl mb-10">
            {signedIn
              ? (locale === 'es' ? "Pedí, canjeá, volvé. Repetí." : "Order, redeem, return. Repeat.")
              : (locale === 'es' ? "30 segundos para crear tu cuenta. El resto de tu vida para canjear." : "30 seconds to create your account. A lifetime to redeem.")}
          </p>
          <Link
            href={signedIn ? "/menu" : "/auth/signup?loyalty=1"}
            className="inline-flex items-center gap-2 bg-white text-[#0A0A0A] hover:bg-white px-10 py-5 text-xl font-semibold transition min-h-[56px]"
          >
            {signedIn ? (locale === 'es' ? "Ir al menú" : "Go to menu") : t(translations.loyalty.joinFree)}
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
    <div className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 lg:pb-0 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-16 bg-[#1A1A1A] w-1/2 mx-auto" />
          <div className="h-6 bg-[#1A1A1A] w-2/3 mx-auto" />
          <div className="h-40 bg-[#1A1A1A] mt-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-[#1A1A1A]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
