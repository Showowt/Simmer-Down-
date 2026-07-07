"use client";

/**
 * Client hook: fetch the menu image override map once and merge it over
 * static item images. Fails silent — static images remain the fallback.
 */

import { useEffect, useState } from "react";
import type { MenuImageOverrides } from "@/lib/menu-images";

let cached: MenuImageOverrides | null = null;

export function useMenuImageOverrides(): MenuImageOverrides {
  const [overrides, setOverrides] = useState<MenuImageOverrides>(cached || {});

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    fetch("/api/menu/images")
      .then((r) => (r.ok ? r.json() : { overrides: {} }))
      .then((data: { overrides: MenuImageOverrides }) => {
        cached = data.overrides || {};
        if (!cancelled) setOverrides(cached);
      })
      .catch((err) => {
        console.error("[useMenuImageOverrides]", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return overrides;
}

/** Effective image for an item: uploaded override wins over static. */
export function resolveItemImage(
  item: { id: string; image?: string },
  overrides: MenuImageOverrides,
): string | undefined {
  return overrides[item.id] || item.image;
}
