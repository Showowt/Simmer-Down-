/**
 * Staff loyalty counter — "¿de dónde descuento los puntos?" (Martin, Nov 2026)
 *
 *   GET   /api/admin/loyalty/canje?customer_id=… → member + rewards (with
 *         eligibility computed) + last movements, for the redemption drawer.
 *   POST  /api/admin/loyalty/canje → redeem a reward FOR a customer at the
 *         counter: deduct points, ledger entry (adjusted_by_staff_id = staff),
 *         bump the reward counter. Same guards as the self-serve redeem.
 *   PATCH /api/admin/loyalty/canje → manual ± points adjustment with reason.
 *
 * Auth: GET/POST require active `staff` row (cashiers run the counter);
 * PATCH requires profiles.role='admin' (arbitrary balance edits are owner-only).
 * Writes via service client — customers RLS is self-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const TIER_ORDER: Record<string, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

function meetsMinTier(customerTier: string | null, requiredTier: string | null): boolean {
  if (!requiredTier) return true;
  if (!customerTier) return false;
  return (TIER_ORDER[customerTier] ?? 0) >= (TIER_ORDER[requiredTier] ?? 0);
}

async function getSessionUser(): Promise<{ id: string } | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id } : null;
  } catch {
    return null;
  }
}

async function requireStaffUser(): Promise<
  { ok: true; userId: string } | { ok: false; res: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      res: NextResponse.json(
        { data: null, error: "unauthorized", message: "No autenticado" },
        { status: 401 },
      ),
    };
  }
  const service = createServiceClient();
  const { data: staff } = await service
    .from("staff")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!staff) {
    return {
      ok: false,
      res: NextResponse.json(
        { data: null, error: "forbidden", message: "Requiere personal activo" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, userId: user.id };
}

async function requireAdminUser(): Promise<
  { ok: true; userId: string } | { ok: false; res: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      res: NextResponse.json(
        { data: null, error: "unauthorized", message: "No autenticado" },
        { status: 401 },
      ),
    };
  }
  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return {
      ok: false,
      res: NextResponse.json(
        { data: null, error: "forbidden", message: "Requiere rol admin" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, userId: user.id };
}

// ── GET: member detail for the redemption drawer ─────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireStaffUser();
    if (!auth.ok) return auth.res;

    const customerId = request.nextUrl.searchParams.get("customer_id");
    if (!customerId || !z.string().uuid().safeParse(customerId).success) {
      return NextResponse.json(
        { data: null, error: "invalid_customer", message: "customer_id inválido" },
        { status: 400 },
      );
    }

    const service = createServiceClient();
    const [custRes, rewardsRes, txRes] = await Promise.all([
      service
        .from("customers")
        .select(
          "id, first_name, last_name, email, phone, loyalty_tier, loyalty_points_balance, lifetime_points_earned",
        )
        .eq("id", customerId)
        .maybeSingle(),
      service
        .from("loyalty_rewards")
        .select(
          "id, name, name_es, points_required, reward_type, discount_percent, discount_amount, min_tier_required, max_total_redemptions, current_redemptions, is_active",
        )
        .eq("is_active", true)
        .order("points_required", { ascending: true }),
      service
        .from("loyalty_transactions")
        .select("id, transaction_type, points, balance_after, description, created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

    if (custRes.error || !custRes.data) {
      return NextResponse.json(
        { data: null, error: "not_found", message: "Miembro no encontrado" },
        { status: 404 },
      );
    }

    const customer = custRes.data;
    const balance = customer.loyalty_points_balance ?? 0;
    const rewards = (rewardsRes.data ?? []).map((r) => {
      const soldOut =
        r.max_total_redemptions !== null &&
        (r.current_redemptions ?? 0) >= r.max_total_redemptions;
      const tierOk = meetsMinTier(customer.loyalty_tier, r.min_tier_required);
      const pointsOk = balance >= r.points_required;
      return {
        ...r,
        eligible: !soldOut && tierOk && pointsOk,
        reason: soldOut
          ? "Agotada"
          : !tierOk
            ? `Requiere nivel ${r.min_tier_required}`
            : !pointsOk
              ? `Faltan ${r.points_required - balance} puntos`
              : null,
      };
    });

    return NextResponse.json({
      data: { customer, rewards, transactions: txRes.data ?? [] },
      error: null,
    });
  } catch (err) {
    logger.error("[LoyaltyCanje] GET error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}

// ── POST: counter redemption ─────────────────────────────────────

const RedeemSchema = z.object({
  customer_id: z.string().uuid(),
  reward_id: z.string().uuid(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireStaffUser();
    if (!auth.ok) return auth.res;

    const parsed = RedeemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "invalid_body", message: "Datos inválidos" },
        { status: 400 },
      );
    }
    const { customer_id, reward_id } = parsed.data;
    const service = createServiceClient();

    const [custRes, rewardRes] = await Promise.all([
      service
        .from("customers")
        .select("id, first_name, last_name, loyalty_points_balance, loyalty_tier")
        .eq("id", customer_id)
        .maybeSingle(),
      service
        .from("loyalty_rewards")
        .select(
          "id, name, name_es, points_required, is_active, min_tier_required, max_redemptions_per_customer, max_total_redemptions, current_redemptions",
        )
        .eq("id", reward_id)
        .maybeSingle(),
    ]);

    const customer = custRes.data;
    const reward = rewardRes.data;
    if (!customer) {
      return NextResponse.json(
        { data: null, error: "not_found", message: "Miembro no encontrado" },
        { status: 404 },
      );
    }
    if (!reward || !reward.is_active) {
      return NextResponse.json(
        { data: null, error: "reward_inactive", message: "Recompensa no disponible" },
        { status: 400 },
      );
    }

    const balance = customer.loyalty_points_balance ?? 0;
    if (balance < reward.points_required) {
      return NextResponse.json(
        {
          data: null,
          error: "insufficient_points",
          message: `Puntos insuficientes: tiene ${balance}, necesita ${reward.points_required}.`,
        },
        { status: 400 },
      );
    }
    if (!meetsMinTier(customer.loyalty_tier, reward.min_tier_required)) {
      return NextResponse.json(
        {
          data: null,
          error: "tier_not_met",
          message: `Requiere nivel ${reward.min_tier_required}; el miembro es ${customer.loyalty_tier ?? "bronze"}.`,
        },
        { status: 400 },
      );
    }
    if (
      reward.max_total_redemptions !== null &&
      (reward.current_redemptions ?? 0) >= reward.max_total_redemptions
    ) {
      return NextResponse.json(
        { data: null, error: "sold_out", message: "Recompensa agotada (límite global)." },
        { status: 400 },
      );
    }
    if (reward.max_redemptions_per_customer !== null) {
      const { count } = await service
        .from("loyalty_transactions")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customer.id)
        .eq("reward_id", reward.id)
        .eq("transaction_type", "redeemed");
      if ((count ?? 0) >= reward.max_redemptions_per_customer) {
        return NextResponse.json(
          {
            data: null,
            error: "per_customer_limit",
            message: "El miembro ya alcanzó el límite de canjes de esta recompensa.",
          },
          { status: 400 },
        );
      }
    }

    const newBalance = balance - reward.points_required;
    const { error: updErr } = await service
      .from("customers")
      .update({ loyalty_points_balance: newBalance })
      .eq("id", customer.id);
    if (updErr) {
      logger.error("[LoyaltyCanje] deduct failed", updErr, { customerId: customer.id });
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al descontar puntos" },
        { status: 500 },
      );
    }

    const { error: txErr } = await service.from("loyalty_transactions").insert({
      customer_id: customer.id,
      transaction_type: "redeemed",
      points: -reward.points_required,
      balance_after: newBalance,
      reward_id: reward.id,
      description: `Canje en mostrador: ${reward.name_es ?? reward.name}`,
      adjusted_by_staff_id: auth.userId,
    });
    if (txErr) {
      // Points already deducted — the member got the reward; only the ledger row is missing.
      logger.error("[LoyaltyCanje] ledger insert failed", txErr, { customerId: customer.id });
    }

    await service
      .from("loyalty_rewards")
      .update({ current_redemptions: (reward.current_redemptions ?? 0) + 1 })
      .eq("id", reward.id);

    return NextResponse.json({
      data: {
        reward_name: reward.name_es ?? reward.name,
        points_deducted: reward.points_required,
        new_balance: newBalance,
      },
      error: null,
      message: `Canjeado: ${reward.name_es ?? reward.name} (−${reward.points_required} pts)`,
    });
  } catch (err) {
    logger.error("[LoyaltyCanje] POST error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}

// ── PUT: dine-in earning — credit points for an in-venue ticket ──
// The accrual trigger only fires on web orders; Simmer Down is a dine-in
// business, so the counter needs an earning path too. Mirrors the SQL
// award fn: floor(amount × points_per_dollar × tier_multiplier), lifetime
// counts toward tier, tiers never downgrade.

const EarnSchema = z.object({
  customer_id: z.string().uuid(),
  amount: z.number().min(0.01).max(10000),
});

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireStaffUser();
    if (!auth.ok) return auth.res;

    const parsed = EarnSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "invalid_body", message: "Monto inválido" },
        { status: 400 },
      );
    }
    const { customer_id, amount } = parsed.data;
    const service = createServiceClient();

    const [custRes, rateRes, tiersRes] = await Promise.all([
      service
        .from("customers")
        .select("id, loyalty_points_balance, lifetime_points_earned, loyalty_tier")
        .eq("id", customer_id)
        .maybeSingle(),
      service.from("settings").select("value").eq("key", "loyalty_points_per_dollar").maybeSingle(),
      service.from("loyalty_tier_config").select("tier, points_multiplier, min_lifetime_points"),
    ]);

    const customer = custRes.data;
    if (!customer) {
      return NextResponse.json(
        { data: null, error: "not_found", message: "Miembro no encontrado" },
        { status: 404 },
      );
    }

    const rate = Number(rateRes.data?.value) || 1;
    const tiers = tiersRes.data ?? [];
    const multiplier =
      Number(tiers.find((t) => t.tier === customer.loyalty_tier)?.points_multiplier) || 1;
    const points = Math.floor(amount * rate * multiplier);
    if (points <= 0) {
      return NextResponse.json(
        {
          data: null,
          error: "zero_points",
          message: "El monto no genera puntos con la tasa actual.",
        },
        { status: 400 },
      );
    }

    const newBalance = (customer.loyalty_points_balance ?? 0) + points;
    const newLifetime = (customer.lifetime_points_earned ?? 0) + points;
    const qualifying = tiers
      .filter((t) => Number(t.min_lifetime_points ?? 0) <= newLifetime)
      .sort((a, b) => Number(b.min_lifetime_points ?? 0) - Number(a.min_lifetime_points ?? 0))[0]?.tier as
      | string
      | undefined;
    const currentOrder = TIER_ORDER[customer.loyalty_tier ?? "bronze"] ?? 0;
    const newTier =
      qualifying && (TIER_ORDER[qualifying] ?? 0) > currentOrder
        ? qualifying
        : customer.loyalty_tier ?? "bronze";

    const { error: updErr } = await service
      .from("customers")
      .update({
        loyalty_points_balance: newBalance,
        lifetime_points_earned: newLifetime,
        loyalty_tier: newTier,
      })
      .eq("id", customer.id);
    if (updErr) {
      logger.error("[LoyaltyCanje] earn failed", updErr, { customerId: customer.id });
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al acreditar puntos" },
        { status: 500 },
      );
    }

    const { error: txErr } = await service.from("loyalty_transactions").insert({
      customer_id: customer.id,
      transaction_type: "earned",
      points,
      balance_after: newBalance,
      description: `Consumo en sucursal: $${amount.toFixed(2)}`,
      adjusted_by_staff_id: auth.userId,
    });
    if (txErr) {
      logger.error("[LoyaltyCanje] earn ledger failed", txErr, { customerId: customer.id });
    }

    return NextResponse.json({
      data: { points_awarded: points, new_balance: newBalance, tier: newTier },
      error: null,
      message: `+${points} pts por consumo de $${amount.toFixed(2)}${
        newTier !== (customer.loyalty_tier ?? "bronze") ? ` — ¡subió a ${newTier}!` : ""
      }`,
    });
  } catch (err) {
    logger.error("[LoyaltyCanje] PUT error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}

// ── PATCH: manual ± adjustment (admin only) ──────────────────────

const AdjustSchema = z.object({
  customer_id: z.string().uuid(),
  points: z.number().int().min(-100000).max(100000).refine((n) => n !== 0, {
    message: "Los puntos no pueden ser 0",
  }),
  reason: z.string().min(3).max(300),
});

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.res;

    const parsed = AdjustSchema.safeParse(await request.json());
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos inválidos";
      return NextResponse.json(
        { data: null, error: "invalid_body", message: msg },
        { status: 400 },
      );
    }
    const { customer_id, points, reason } = parsed.data;
    const service = createServiceClient();

    const { data: customer } = await service
      .from("customers")
      .select("id, loyalty_points_balance")
      .eq("id", customer_id)
      .maybeSingle();
    if (!customer) {
      return NextResponse.json(
        { data: null, error: "not_found", message: "Miembro no encontrado" },
        { status: 404 },
      );
    }

    const balance = customer.loyalty_points_balance ?? 0;
    const newBalance = balance + points;
    if (newBalance < 0) {
      return NextResponse.json(
        {
          data: null,
          error: "negative_balance",
          message: `No se puede dejar el saldo negativo (tiene ${balance} puntos).`,
        },
        { status: 400 },
      );
    }

    const { error: updErr } = await service
      .from("customers")
      .update({ loyalty_points_balance: newBalance })
      .eq("id", customer.id);
    if (updErr) {
      logger.error("[LoyaltyCanje] adjust failed", updErr, { customerId: customer.id });
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al ajustar puntos" },
        { status: 500 },
      );
    }

    const { error: txErr } = await service.from("loyalty_transactions").insert({
      customer_id: customer.id,
      transaction_type: "adjustment",
      points,
      balance_after: newBalance,
      description: `Ajuste manual: ${reason}`,
      adjusted_by_staff_id: auth.userId,
      adjustment_reason: reason,
    });
    if (txErr) {
      logger.error("[LoyaltyCanje] adjust ledger failed", txErr, { customerId: customer.id });
    }

    return NextResponse.json({
      data: { new_balance: newBalance },
      error: null,
      message: `Ajuste aplicado (${points > 0 ? "+" : ""}${points} pts)`,
    });
  } catch (err) {
    logger.error("[LoyaltyCanje] PATCH error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}
