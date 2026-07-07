"use client";

/**
 * Client hooks: fetch the menu override maps (photos + price/availability/text)
 * once and merge them over static items. Fails silent — static data remains
 * the fallback.
 */

import { useEffect, useState } from "react";
import type { MenuItem } from "@/lib/data";
import {
  applyItemOverride,
  type MenuImageOverrides,
  type MenuItemOverrides,
  type MenuOverridesPayload,
} from "@/lib/menu-images";

let cached: MenuOverridesPayload | null = null;

const EMPTY: MenuOverridesPayload = { overrides: {}, items: {} };

export function useMenuOverrides(): MenuOverridesPayload {
  const [payload, setPayload] = useState<MenuOverridesPayload>(cached || EMPTY);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    fetch("/api/menu/images")
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((data: Partial<MenuOverridesPayload>) => {
        cached = {
          overrides: data.overrides || {},
          items: data.items || {},
        };
        if (!cancelled) setPayload(cached);
      })
      .catch((err) => {
        console.error("[useMenuOverrides]", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return payload;
}

/** Back-compat: image-only map. */
export function useMenuImageOverrides(): MenuImageOverrides {
  return useMenuOverrides().overrides;
}

/** Merge photo + basics overrides over a static item. */
export function mergeMenuItem(
  item: MenuItem,
  payload: MenuOverridesPayload,
): MenuItem {
  return applyItemOverride(item, payload.items, payload.overrides);
}

/** Effective image for an item: uploaded override wins over static. */
export function resolveItemImage(
  item: { id: string; image?: string },
  overrides: MenuImageOverrides,
): string | undefined {
  return overrides[item.id] || item.image;
}
