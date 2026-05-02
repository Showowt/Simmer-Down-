/**
 * POST /api/loyalty/redeem
 *
 * Authenticated endpoint. Redeems a loyalty reward for the current user.
 * Validates: reward is active, customer has enough points, meets tier
 * requirement, and hasn't exceeded per-customer redemption limits.
 *
 * Uses service client to bypass RLS for the multi-step transaction
 * (deduct points + insert transaction + increment redemption count).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";
import {
  formatZodErrors,
  validationErrorResponse,
} from "@/lib/validation";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface RedeemResponse {
  success: boolean;
  reward_name?: string;
  points_deducted?: number;
  new_balance?: number;
  error?: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════
// Validation Schema
// ═══════════════════════════════════════════════════════════════

const redeemSchema = z.object({
  reward_id: z.string().uuid("reward_id debe ser un UUID válido"),
});

// ═══════════════════════════════════════════════════════════════
// Tier ordering for min_tier_required comparison
// ═══════════════════════════════════════════════════════════════

const TIER_ORDER: Record<string, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

function meetsMinTier(
  customerTier: string | null,
  requiredTier: string | null,
): boolean {
  if (!requiredTier) return true;
  if (!customerTier) return false;
  return (TIER_ORDER[customerTier] ?? 0) >= (TIER_ORDER[requiredTier] ?? 0);
}

// ═══════════════════════════════════════════════════════════════
// Auth helper
// ═══════════════════════════════════════════════════════════════

async function getAuthUser(): Promise<{ id: string } | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id } : null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
): Promise<NextResponse<RedeemResponse>> {
  const startTime = Date.now();
  const endpoint = "/api/loyalty/redeem";

  // Rate limiting — 10 redemptions per minute per IP
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`loyalty_redeem:${clientIp}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (!rl.success) {
    logger.warn("Rate limit exceeded for loyalty redeem", { ip: clientIp });
    return rateLimitResponse(rl) as NextResponse<RedeemResponse>;
  }

  logger.api.request(endpoint, "POST", { ip: clientIp });

  try {
    // ── Auth ──────────────────────────────────────────────────
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Debes iniciar sesión para canjear recompensas.",
        },
        { status: 401 },
      );
    }

    // ── Validate input ───────────────────────────────────────
    const body = await request.json();
    const parseResult = redeemSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = formatZodErrors(parseResult.error);
      return validationErrorResponse(errors) as NextResponse<RedeemResponse>;
    }

    const { reward_id } = parseResult.data;
    const supabase = createServiceClient();

    // ── Look up customer ─────────────────────────────────────
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("id, loyalty_points_balance, loyalty_tier")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (custErr || !customer) {
      logger.error("Customer lookup failed for loyalty redeem", custErr, {
        authUserId: user.id,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found",
          message: "No se encontró tu perfil de cliente. Contacta soporte.",
        },
        { status: 404 },
      );
    }

    // ── Look up reward ───────────────────────────────────────
    const { data: reward, error: rewardErr } = await supabase
      .from("loyalty_rewards")
      .select(
        "id, name, name_es, points_required, reward_type, is_active, min_tier_required, max_redemptions_per_customer, max_total_redemptions, current_redemptions",
      )
      .eq("id", reward_id)
      .maybeSingle();

    if (rewardErr || !reward) {
      return NextResponse.json(
        {
          success: false,
          error: "Reward not found",
          message: "Recompensa no encontrada o ya no está disponible.",
        },
        { status: 404 },
      );
    }

    // ── Validate reward eligibility ──────────────────────────

    // 1. Active check
    if (!reward.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "Reward inactive",
          message: "Esta recompensa ya no está activa.",
        },
        { status: 400 },
      );
    }

    // 2. Points check
    const currentBalance = customer.loyalty_points_balance ?? 0;
    if (currentBalance < reward.points_required) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient points",
          message: `No tienes suficientes puntos. Necesitas ${reward.points_required} y tienes ${currentBalance}.`,
        },
        { status: 400 },
      );
    }

    // 3. Tier check
    if (!meetsMinTier(customer.loyalty_tier, reward.min_tier_required)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tier requirement not met",
          message: `Esta recompensa requiere nivel ${reward.min_tier_required}. Tu nivel actual es ${customer.loyalty_tier ?? "bronze"}.`,
        },
        { status: 400 },
      );
    }

    // 4. Global redemption cap
    if (
      reward.max_total_redemptions !== null &&
      (reward.current_redemptions ?? 0) >= reward.max_total_redemptions
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Reward sold out",
          message:
            "Esta recompensa ya alcanzó el límite máximo de canjes.",
        },
        { status: 400 },
      );
    }

    // 5. Per-customer redemption cap
    if (reward.max_redemptions_per_customer !== null) {
      const { count } = await supabase
        .from("loyalty_transactions")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customer.id)
        .eq("reward_id", reward.id)
        .eq("transaction_type", "redeemed");

      if ((count ?? 0) >= reward.max_redemptions_per_customer) {
        return NextResponse.json(
          {
            success: false,
            error: "Per-customer limit reached",
            message:
              "Ya alcanzaste el límite de canjes para esta recompensa.",
          },
          { status: 400 },
        );
      }
    }

    // ── Execute redemption ───────────────────────────────────

    const pointsToDeduct = reward.points_required;
    const newBalance = currentBalance - pointsToDeduct;

    // Deduct points from customer
    const { error: updateErr } = await supabase
      .from("customers")
      .update({ loyalty_points_balance: newBalance })
      .eq("id", customer.id);

    if (updateErr) {
      logger.error("Failed to deduct loyalty points", updateErr, {
        customerId: customer.id,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Redemption failed",
          message:
            "Error al procesar el canje. Por favor intenta de nuevo.",
        },
        { status: 500 },
      );
    }

    // Insert loyalty transaction (negative points for redemption)
    const { error: txnErr } = await supabase
      .from("loyalty_transactions")
      .insert({
        customer_id: customer.id,
        transaction_type: "redeemed" as const,
        points: -pointsToDeduct,
        balance_after: newBalance,
        reward_id: reward.id,
        description: `Canje: ${reward.name_es ?? reward.name}`,
      });

    if (txnErr) {
      logger.error("Failed to insert loyalty transaction", txnErr, {
        customerId: customer.id,
        rewardId: reward.id,
      });
      // Points already deducted — log but don't fail the response.
      // The customer got their reward, the ledger entry is the one missing.
    }

    // Increment global redemption counter
    const { error: incrErr } = await supabase
      .from("loyalty_rewards")
      .update({
        current_redemptions: (reward.current_redemptions ?? 0) + 1,
      })
      .eq("id", reward.id);

    if (incrErr) {
      logger.warn("Failed to increment reward redemption counter", {
        rewardId: reward.id,
        error: incrErr.message,
      });
    }

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, {
      customerId: customer.id,
      rewardId: reward.id,
    });

    return NextResponse.json({
      success: true,
      reward_name: reward.name_es ?? reward.name,
      points_deducted: pointsToDeduct,
      new_balance: newBalance,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.api.error(endpoint, error, { duration });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message:
          "Error interno del servidor. Por favor intenta de nuevo.",
      },
      { status: 500 },
    );
  }
}
