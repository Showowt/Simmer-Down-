// ═══════════════════════════════════════════════════════════════════════════
// SIMMER DOWN - MASTER MENU TYPES
// TypeScript definitions for intelligent menu system
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type AllergenTag =
  | "gluten"
  | "dairy"
  | "shellfish"
  | "fish"
  | "eggs"
  | "nuts"
  | "peanuts"
  | "soy"
  | "sesame"
  | "celery"
  | "mustard"
  | "sulfites";

export type DietaryTag =
  | "vegetarian"
  | "vegan"
  | "gluten_free"
  | "spicy"
  | "contains_alcohol"
  | "raw"
  | "halal"
  | "kosher";

export type IngredientType =
  | "protein"
  | "cheese"
  | "vegetable"
  | "sauce"
  | "topping"
  | "base"
  | "garnish"
  | "beverage"
  | "dessert";

export type PairingType = "beverage" | "dessert" | "side" | "combo";

export type LocationCode =
  | "santa-ana"
  | "san-benito"
  | "lago-coatepeque"
  | "la-majada";

export type Brand = "simmer-down" | "simmer-garden";

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION
// ─────────────────────────────────────────────────────────────────────────────

export interface Location {
  id: string;
  code: LocationCode;
  name_es: string;
  name_en: string;
  brand: Brand;
  tagline_es: string;
  tagline_en: string;
  address?: string;
  city?: string;
  country: string;
  phone?: string;
  whatsapp: string;
  whatsapp_full?: string;
  email?: string;
  lat?: number;
  lng?: number;
  timezone: string;
  is_active: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  dine_in_enabled: boolean;
  hours?: Record<string, { open: string; close: string }>;
  features: string[];
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY
// ─────────────────────────────────────────────────────────────────────────────

export interface MenuCategory {
  id: string;
  code: string;
  name_es: string;
  name_en: string;
  description_es?: string;
  description_en?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  note_es?: string;
  note_en?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// INGREDIENT
// ─────────────────────────────────────────────────────────────────────────────

export interface Ingredient {
  id: string;
  code: string;
  name_es: string;
  name_en: string;
  allergens: AllergenTag[];
  dietary_tags: DietaryTag[];
  ingredient_type?: IngredientType;
  flavor_profile?: string[];
  is_common: boolean;
  description_es?: string;
  description_en?: string;
  is_active: boolean;
}

export interface MenuItemIngredient {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
  is_primary: boolean;
  is_base: boolean;
  is_topping: boolean;
  is_garnish: boolean;
  is_removable: boolean;
  is_substitutable: boolean;
  extra_charge?: number;
  display_order: number;
  quantity_description?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MENU ITEM
// ─────────────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  code: string;
  name_es: string;
  name_en: string;
  description_es: string;
  description_en: string;
  category_id?: string;
  category_code: string;
  category?: MenuCategory;
  price_personal?: number;
  price_regular: number;
  dietary_tags: DietaryTag[];
  allergen_summary: AllergenTag[];
  image_url?: string;
  display_order: number;
  is_best_seller: boolean;
  is_signature: boolean;
  is_new: boolean;
  is_seasonal: boolean;
  is_spicy: boolean;
  spice_level: number;
  is_active: boolean;
  available_all_day: boolean;
  available_start_time?: string;
  available_end_time?: string;
  available_days: number[];
  pairs_well_with?: string[];
  upsell_category?: string;
  prep_time_minutes?: number;
  calories?: number;
  ingredients?: MenuItemIngredient[];
  created_at: string;
  updated_at: string;
}

// Extended menu item with computed/joined fields
export interface MenuItemFull extends MenuItem {
  // Price after location overrides
  effective_price_personal?: number;
  effective_price_regular: number;

  // Formatted for display
  formatted_price: string;

  // Full ingredient list with allergen details
  ingredients_full: {
    name_es: string;
    name_en: string;
    is_primary: boolean;
    allergens: AllergenTag[];
    is_removable: boolean;
  }[];

  // Availability at specific location
  is_available_at_location: boolean;
  is_featured_at_location: boolean;
  location_notes_es?: string;
  location_notes_en?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION OVERRIDE
// ─────────────────────────────────────────────────────────────────────────────

export interface LocationMenuOverride {
  id: string;
  location_id: string;
  menu_item_id: string;
  price_personal_override?: number;
  price_regular_override?: number;
  is_available: boolean;
  is_featured: boolean;
  special_notes_es?: string;
  special_notes_en?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPSELL PAIRING
// ─────────────────────────────────────────────────────────────────────────────

export interface UpsellPairing {
  id: string;
  primary_item_id: string;
  paired_item_id: string;
  pairing_type: PairingType;
  pairing_strength: number;
  combo_discount_percent?: number;
  combo_name_es?: string;
  combo_name_en?: string;
  suggestion_es?: string;
  suggestion_en?: string;
  is_active: boolean;
  paired_item?: MenuItem;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHATBOT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ChatbotIntent =
  | "greeting"
  | "menu"
  | "recommend"
  | "category"
  | "search"
  | "ingredients"
  | "allergens"
  | "price"
  | "vegetarian"
  | "seafood"
  | "spicy"
  | "delivery"
  | "location"
  | "hours"
  | "bestseller"
  | "upsell"
  | "thanks"
  | "bye"
  | "help"
  | "unknown";

export interface ChatbotMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  intent?: ChatbotIntent;
  suggested_items?: MenuItemFull[];
  upsell_suggestions?: UpsellSuggestion[];
  allergen_warnings?: AllergenWarning[];
}

export interface UpsellSuggestion {
  item: MenuItemFull;
  pairing_type: PairingType;
  suggestion_es: string;
  suggestion_en: string;
  combo_discount_percent?: number;
}

export interface AllergenWarning {
  allergen: AllergenTag;
  message_es: string;
  message_en: string;
  items: string[]; // item codes that contain this allergen
}

export interface ChatbotResponse {
  success: boolean;
  intent: ChatbotIntent;
  message: string;
  suggested_items: MenuItemFull[];
  upsell_suggestions?: UpsellSuggestion[];
  allergen_warnings?: AllergenWarning[];
  location?: Location;
  locations?: Location[];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function formatPrice(
  item: MenuItem,
  locationOverride?: LocationMenuOverride,
): string {
  const priceRegular =
    locationOverride?.price_regular_override ?? item.price_regular;
  const pricePersonal =
    locationOverride?.price_personal_override ?? item.price_personal;

  if (pricePersonal) {
    return `Personal $${pricePersonal.toFixed(2)} | Grande $${priceRegular.toFixed(2)}`;
  }
  return `$${priceRegular.toFixed(2)}`;
}

export function getAllergenEmoji(allergen: AllergenTag): string {
  const emojis: Record<AllergenTag, string> = {
    gluten: "🌾",
    dairy: "🥛",
    shellfish: "🦐",
    fish: "🐟",
    eggs: "🥚",
    nuts: "🥜",
    peanuts: "🥜",
    soy: "🫘",
    sesame: "⚪",
    celery: "🥬",
    mustard: "🟡",
    sulfites: "🍷",
  };
  return emojis[allergen] || "⚠️";
}

export function getDietaryEmoji(tag: DietaryTag): string {
  const emojis: Record<DietaryTag, string> = {
    vegetarian: "🌱",
    vegan: "🌿",
    gluten_free: "🌾",
    spicy: "🌶️",
    contains_alcohol: "🍷",
    raw: "🐟",
    halal: "☪️",
    kosher: "✡️",
  };
  return emojis[tag] || "";
}

export function getAllergenLabel(
  allergen: AllergenTag,
  lang: "es" | "en" = "es",
): string {
  const labels: Record<AllergenTag, { es: string; en: string }> = {
    gluten: { es: "Gluten", en: "Gluten" },
    dairy: { es: "Lácteos", en: "Dairy" },
    shellfish: { es: "Mariscos", en: "Shellfish" },
    fish: { es: "Pescado", en: "Fish" },
    eggs: { es: "Huevos", en: "Eggs" },
    nuts: { es: "Frutos Secos", en: "Tree Nuts" },
    peanuts: { es: "Maní", en: "Peanuts" },
    soy: { es: "Soya", en: "Soy" },
    sesame: { es: "Sésamo", en: "Sesame" },
    celery: { es: "Apio", en: "Celery" },
    mustard: { es: "Mostaza", en: "Mustard" },
    sulfites: { es: "Sulfitos", en: "Sulfites" },
  };
  return labels[allergen]?.[lang] || allergen;
}

export function hasAllergen(item: MenuItem, allergen: AllergenTag): boolean {
  return item.allergen_summary.includes(allergen);
}

export function isVegetarian(item: MenuItem): boolean {
  return item.dietary_tags.includes("vegetarian");
}

export function isVegan(item: MenuItem): boolean {
  return item.dietary_tags.includes("vegan");
}

export function isGlutenFree(item: MenuItem): boolean {
  return (
    item.dietary_tags.includes("gluten_free") ||
    !item.allergen_summary.includes("gluten")
  );
}

export function isSpicy(item: MenuItem): boolean {
  return item.is_spicy || item.dietary_tags.includes("spicy");
}
