/**
 * GET /api/menu
 *
 * Public endpoint. Returns the active menu grouped by category.
 * Supports optional filtering by location_id and category slug.
 *
 * Cached via Next.js revalidation (5 minutes).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import logger from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/service";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface MenuItemResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  available: boolean;
}

interface CategoryGroup {
  category: string;
  items: MenuItemResponse[];
}

interface MenuResponse {
  success: boolean;
  categories?: CategoryGroup[];
  error?: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════

const querySchema = z.object({
  location_id: z.string().uuid().optional(),
  category: z.string().max(100).optional(),
});

// ═══════════════════════════════════════════════════════════════
// Next.js caching — revalidate every 5 minutes
// ═══════════════════════════════════════════════════════════════

export const revalidate = 300;

// ═══════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
): Promise<NextResponse<MenuResponse>> {
  const startTime = Date.now();
  const endpoint = "/api/menu";

  // Rate limiting — 60 requests per minute per IP (public browsing)
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`menu:${clientIp}`, {
    maxRequests: 60,
    windowMs: 60_000,
  });
  if (!rl.success) {
    logger.warn("Rate limit exceeded for menu", { ip: clientIp });
    return rateLimitResponse(rl) as NextResponse<MenuResponse>;
  }

  logger.api.request(endpoint, "GET", { ip: clientIp });

  try {
    // ── Parse query params ───────────────────────────────────
    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string | undefined> = {};
    const locId = searchParams.get("location_id");
    const cat = searchParams.get("category");
    if (locId) rawParams.location_id = locId;
    if (cat) rawParams.category = cat;

    const parsed = querySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          message: "Parámetros de consulta inválidos.",
        },
        { status: 400 },
      );
    }

    const { location_id, category } = parsed.data;

    const supabase = createServiceClient();

    // ── Fetch menu items ─────────────────────────────────────
    let query = supabase
      .from("menu_items")
      .select("id, name, description, price, image_url, category, available")
      .eq("available", true)
      .order("category")
      .order("name");

    if (category) {
      query = query.eq("category", category);
    }

    const { data: items, error: itemsErr } = await query;

    if (itemsErr) {
      logger.error("Failed to fetch menu items", itemsErr);
      return NextResponse.json(
        {
          success: false,
          error: "Query failed",
          message: "Error al obtener el menú.",
        },
        { status: 500 },
      );
    }

    // ── Apply location overrides if location_id provided ─────
    let finalItems = items ?? [];

    if (location_id && finalItems.length > 0) {
      const itemIds = finalItems.map((i) => i.id);

      const { data: overrides } = await supabase
        .from("menu_item_location_overrides")
        .select(
          "menu_item_id, is_available, is_86d, price_override",
        )
        .eq("location_id", location_id)
        .in("menu_item_id", itemIds);

      if (overrides && overrides.length > 0) {
        const overrideMap = new Map(
          overrides.map((o) => [o.menu_item_id, o]),
        );

        finalItems = finalItems
          .filter((item) => {
            const override = overrideMap.get(item.id);
            if (!override) return true;
            // Exclude items that are unavailable or 86'd at this location
            if (override.is_available === false || override.is_86d === true) {
              return false;
            }
            return true;
          })
          .map((item) => {
            const override = overrideMap.get(item.id);
            if (override?.price_override !== null && override?.price_override !== undefined) {
              return { ...item, price: override.price_override };
            }
            return item;
          });
      }
    }

    // ── Group by category ────────────────────────────────────
    const categoryMap = new Map<string, MenuItemResponse[]>();

    for (const item of finalItems) {
      const cat = item.category;
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        image_url: item.image_url,
        category: item.category,
        available: item.available ?? true,
      });
    }

    const categories: CategoryGroup[] = Array.from(
      categoryMap.entries(),
    ).map(([categoryName, categoryItems]) => ({
      category: categoryName,
      items: categoryItems,
    }));

    const duration = Date.now() - startTime;
    logger.api.response(endpoint, 200, duration, {
      categoryCount: categories.length,
      itemCount: finalItems.length,
    });

    return NextResponse.json({
      success: true,
      categories,
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
