/**
 * GET /api/menu/images — public map of menu overrides.
 * Response: {
 *   overrides: { [itemId]: imageUrl },       // photo overrides (legacy key)
 *   items:     { [itemId]: {...basics} },    // price/availability/text overrides
 * }
 * Cached at the edge for 60s so admin edits go live within a minute.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAllowedImageUrl, type MenuItemOverrides } from "@/lib/menu-images";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServiceClient();
    const [imagesRes, itemsRes] = await Promise.all([
      supabase.from("menu_image_overrides").select("item_id, image_url"),
      supabase
        .from("menu_item_overrides")
        .select(
          "item_id, price, is_available, is_featured, name_es, name_en, description_es, description_en",
        ),
    ]);

    if (imagesRes.error) {
      logger.error("[MenuImages] Failed to load image overrides", imagesRes.error);
    }
    if (itemsRes.error) {
      logger.error("[MenuImages] Failed to load item overrides", itemsRes.error);
    }

    const overrides: Record<string, string> = {};
    for (const row of imagesRes.data || []) {
      if (row.item_id && row.image_url && isAllowedImageUrl(row.image_url)) {
        overrides[row.item_id] = row.image_url;
      }
    }

    const items: MenuItemOverrides = {};
    for (const row of itemsRes.data || []) {
      if (!row.item_id) continue;
      const { item_id, ...fields } = row;
      const price = fields.price != null ? Number(fields.price) : null;
      items[item_id] = { ...fields, price };
    }

    return NextResponse.json(
      { overrides, items },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    logger.error("[MenuImages] Unexpected error", err);
    return NextResponse.json({ overrides: {}, items: {} }, { status: 200 });
  }
}
