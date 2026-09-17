/**
 * Admin loyalty config API
 *   GET   /api/admin/loyalty/config   → { welcomePoints, pointsPerDollar }
 *   PATCH /api/admin/loyalty/config   { welcomePoints?, pointsPerDollar? }
 *
 * Backed by the settings key/value table:
 *   loyalty_welcome_points   — signup bonus (read by handle_new_auth_user)
 *   loyalty_points_per_dollar — base earn rate
 *
 * Auth: logged-in user whose profile role is 'admin'. Writes via service client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import logger from "@/lib/logger";

const WELCOME_KEY = "loyalty_welcome_points";
const PER_DOLLAR_KEY = "loyalty_points_per_dollar";

const PatchSchema = z
  .object({
    welcomePoints: z.number().int().min(0).max(100000).optional(),
    pointsPerDollar: z.number().min(0).max(1000).optional(),
  })
  .refine((d) => d.welcomePoints !== undefined || d.pointsPerDollar !== undefined, {
    message: "Nada que actualizar",
  });

async function requireAdmin(): Promise<
  { ok: true; email: string } | { ok: false; res: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      res: NextResponse.json(
        { data: null, error: "unauthorized", message: "No autenticado" },
        { status: 401 },
      ),
    };
  }
  const { data: profile } = await supabase
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
  return { ok: true, email: user.email || "admin" };
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const service = createServiceClient();
    const { data, error } = await service
      .from("settings")
      .select("key, value")
      .in("key", [WELCOME_KEY, PER_DOLLAR_KEY]);

    if (error) {
      logger.error("[AdminLoyaltyConfig] read failed", error);
      return NextResponse.json(
        { data: null, error: "db_error", message: "Error al cargar" },
        { status: 500 },
      );
    }

    const map = new Map((data ?? []).map((r) => [r.key as string, r.value]));
    return NextResponse.json({
      data: {
        welcomePoints: toNumber(map.get(WELCOME_KEY), 50),
        pointsPerDollar: toNumber(map.get(PER_DOLLAR_KEY), 1),
      },
      error: null,
    });
  } catch (err) {
    logger.error("[AdminLoyaltyConfig] GET error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const parsed = PatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: "invalid_body", message: "Datos inválidos" },
        { status: 400 },
      );
    }

    const service = createServiceClient();
    const updates: Array<{ key: string; value: number }> = [];
    if (parsed.data.welcomePoints !== undefined) {
      updates.push({ key: WELCOME_KEY, value: parsed.data.welcomePoints });
    }
    if (parsed.data.pointsPerDollar !== undefined) {
      updates.push({ key: PER_DOLLAR_KEY, value: parsed.data.pointsPerDollar });
    }

    for (const u of updates) {
      const { error } = await service
        .from("settings")
        .upsert({ key: u.key, value: u.value }, { onConflict: "key" });
      if (error) {
        logger.error("[AdminLoyaltyConfig] upsert failed", error);
        return NextResponse.json(
          { data: null, error: "db_error", message: "Error al guardar" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ data: { ok: true }, error: null, message: "Guardado" });
  } catch (err) {
    logger.error("[AdminLoyaltyConfig] PATCH error", err);
    return NextResponse.json(
      { data: null, error: "internal", message: "Error interno" },
      { status: 500 },
    );
  }
}
