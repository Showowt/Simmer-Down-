/**
 * Menu image overrides — bridge between uploaded photos (Supabase storage)
 * and the static MENU_ITEMS catalog in src/lib/data.ts.
 *
 * Overrides live in the `menu_image_overrides` table keyed by the static
 * item id (e.g. 'casanova-burger'). The public menu merges an override
 * over the static `image` field when present.
 */

import { MENU_ITEMS, type MenuItem } from "@/lib/data";

export type MenuImageOverrides = Record<string, string>;

/** Editable "basics" for a menu item — all fields optional (null = keep static). */
export interface MenuItemOverride {
  price?: number | null;
  is_available?: boolean | null;
  is_featured?: boolean | null;
  name_es?: string | null;
  name_en?: string | null;
  description_es?: string | null;
  description_en?: string | null;
}

export type MenuItemOverrides = Record<string, MenuItemOverride>;

export interface MenuOverridesPayload {
  overrides: MenuImageOverrides; // images (legacy key, kept for compat)
  items: MenuItemOverrides;
}

/** Apply an item's override + image override over the static definition. */
export function applyItemOverride(
  item: MenuItem,
  itemOverrides: MenuItemOverrides,
  imageOverrides: MenuImageOverrides,
): MenuItem {
  const o = itemOverrides[item.id];
  const img = imageOverrides[item.id];
  if (!o && !img) return item;
  return {
    ...item,
    ...(img ? { image: img } : {}),
    ...(o?.price != null ? { basePrice: o.price } : {}),
    ...(o?.is_available != null ? { isAvailable: o.is_available } : {}),
    ...(o?.is_featured != null ? { isFeatured: o.is_featured } : {}),
    ...(o?.name_es ? { nameEs: o.name_es } : {}),
    ...(o?.name_en ? { name: o.name_en } : {}),
    ...(o?.description_es ? { descriptionEs: o.description_es } : {}),
    ...(o?.description_en ? { description: o.description_en } : {}),
  };
}

/** Strip accents + lowercase for forgiving name matching. */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ItemMatch {
  id: string;
  nameEs: string;
}

/**
 * Match a free-text query (Telegram caption, admin search) to a menu item.
 * Returns all candidates so callers can disambiguate.
 */
export function matchMenuItems(query: string): ItemMatch[] {
  const q = normalizeName(query);
  if (!q) return [];

  // Exact id match wins outright
  const byId = MENU_ITEMS.find((i) => i.id === query.trim().toLowerCase());
  if (byId) return [{ id: byId.id, nameEs: byId.nameEs }];

  const matches = MENU_ITEMS.filter((i) => {
    const es = normalizeName(i.nameEs);
    const en = normalizeName(i.name);
    return (
      es === q ||
      en === q ||
      es.includes(q) ||
      en.includes(q) ||
      i.id.replace(/-/g, " ").includes(q)
    );
  });

  return matches.map((i) => ({ id: i.id, nameEs: i.nameEs }));
}

/** Only accept URLs we control: our Supabase storage or local /images paths. */
export function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("/images/")) return true;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) return false;
  return url.startsWith(`${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/`);
}
