/**
 * GET /api/menu/images — public map of menu image overrides.
 * Response: { overrides: { [itemId]: imageUrl } }
 * Cached at the edge for 60s so photo updates go live within a minute.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAllowedImageUrl } from "@/lib/menu-images";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("menu_image_overrides")
      .select("item_id, image_url");

    if (error) {
      logger.error("[MenuImages] Failed to load overrides", error);
      return NextResponse.json({ overrides: {} }, { status: 200 });
    }

    const overrides: Record<string, string> = {};
    for (const row of data || []) {
      if (row.item_id && row.image_url && isAllowedImageUrl(row.image_url)) {
        overrides[row.item_id] = row.image_url;
      }
    }

    return NextResponse.json(
      { overrides },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    logger.error("[MenuImages] Unexpected error", err);
    return NextResponse.json({ overrides: {} }, { status: 200 });
  }
}
