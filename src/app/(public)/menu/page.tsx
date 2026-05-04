"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Check,
  Flame,
  Search,
  X,
  Info,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/components/Toast";
import { useAnimaStore } from "@/store/anima";
import {
  MENU,
  LOCATIONS,
  CATEGORIES,
  LocationId,
  MenuItem,
  getMenuByLocation,
  getMenuByCategory,
  getBestSellers,
  searchMenu,
  getVegetarianItems,
  getSeafoodItems,
  getItemPrice,
  formatPrice,
} from "@/data/simmer-menu";
import {
  getItemIngredients,
  formatIngredientsResponse,
  getAllergenWarning,
  formatPriceWithSizes,
  enrichMenuItem,
  IntelligentMenuItem,
} from "@/lib/menu-intelligence";
import { useI18n, translations } from "@/lib/i18n";

// NOTE: categories and dietaryFilters arrays moved inside MenuPage for i18n access.
// Static icon map kept at module level for MenuItemCard fallback.
const categoryIcons: Record<string, string> = {
  all: "🍽️",
  entradas: "🥟",
  ensaladas: "🥗",
  pastas: "🍝",
  pizzas: "🍕",
  "pizzas-especiales": "⭐",
  "platos-fuertes": "🥩",
  mariscos: "🦐",
  "bebidas-frias": "🍹",
  "bebidas-calientes": "☕",
  postres: "🍰",
  cervezas: "🍺",
  "menu-infantil": "👶",
};

// Allergen icons
const allergenIcons: Record<string, { icon: string; label: string }> = {
  gluten: { icon: "🌾", label: "Gluten" },
  dairy: { icon: "🥛", label: "Lácteos" },
  shellfish: { icon: "🦐", label: "Mariscos" },
  fish: { icon: "🐟", label: "Pescado" },
  eggs: { icon: "🥚", label: "Huevos" },
  nuts: { icon: "🥜", label: "Frutos Secos" },
  sesame: { icon: "⚪", label: "Sésamo" },
};

// Dietary tag icons
const tagIcons: Record<string, { icon: string; label: string }> = {
  "🌱 veg": { icon: "🌱", label: "Vegetariano" },
  "🌿 vegan": { icon: "🌿", label: "Vegano" },
  "🌾 GF": { icon: "🌾", label: "Sin Gluten" },
  "🌶️ spicy": { icon: "🌶️", label: "Picante" },
  "🦐 seafood": { icon: "🦐", label: "Mariscos" },
  "🔥 signature": { icon: "🔥", label: "Firma" },
  "🔥 premium": { icon: "💎", label: "Premium" },
  "⭐ #1": { icon: "⭐", label: "#1 Favorito" },
  "👶 kids": { icon: "👶", label: "Niños" },
  "📅 weekend": { icon: "📅", label: "Fin de Semana" },
  "🍺 local": { icon: "🍺", label: "Local" },
  "🍺 import": { icon: "🌎", label: "Importada" },
  "🍺 craft": { icon: "🔥", label: "Artesanal" },
};

// Ingredient Detail Modal
function IngredientModal({
  item,
  onClose,
  locationId,
}: {
  item: MenuItem;
  onClose: () => void;
  locationId?: LocationId;
}) {
  const { t } = useI18n();
  const ingredients = getItemIngredients(item.id, "es");
  const allergenWarning = getAllergenWarning(item, "es");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#2D2A26] border border-[#3D3936] p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-display text-xl text-[#FFF8F0]">{item.name}</h3>
            <p className="text-white font-bold text-lg mt-1">
              {formatPriceWithSizes(item, locationId)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6B6560] hover:text-[#FFF8F0] transition-colors"
            aria-label={t(translations.menu.close)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-[#B8B0A8] mb-6">{item.description}</p>

        {/* Ingredients */}
        {ingredients && (
          <div className="mb-6">
            <h4 className="text-[#C9A84C] font-semibold mb-3 flex items-center gap-2">
              <span>🍽️</span> {t(translations.menu.ingredients)}
            </h4>
            <ul className="space-y-2">
              {ingredients.ingredients.map((ing, i) => (
                <li key={i} className="text-[#B8B0A8] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#C9A84C]" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Allergen Warning */}
        {ingredients && ingredients.allergens.length > 0 && (
          <div className="bg-[#3D3936] p-4 mb-6">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">{t(translations.menu.allergens)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ingredients.allergens.map((allergen) => (
                <span
                  key={allergen}
                  className="bg-[#2D2A26] px-3 py-1 text-sm text-[#FFF8F0] flex items-center gap-1"
                >
                  {allergenIcons[allergen]?.icon || "⚠️"}
                  {allergenIcons[allergen]?.label || allergen}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="bg-[#252320] px-3 py-1 text-sm text-[#B8B0A8]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Best Seller Badge */}
        {item.bestSeller && (
          <div className="flex items-center gap-2 text-[#FF6B35] mb-4">
            <Flame className="w-5 h-5" />
            <span className="font-semibold">{t(translations.menu.customerFavorite)}</span>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-3 font-semibold transition-colors min-h-[56px]"
        >
          {t(translations.menu.close)}
        </button>
      </motion.div>
    </motion.div>
  );
}

// Shared add-to-cart logic
function useAddToCart(item: MenuItem, locationId?: LocationId) {
  const { t } = useI18n();
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);
  const addFavoriteItem = useAnimaStore((state) => state.addFavoriteItem);
  const [added, setAdded] = useState(false);

  const price = getItemPrice(item, locationId);

  const handleAdd = () => {
    addItem({
      id: item.id,
      name: item.name,
      description: item.description,
      price: price,
      image_url: item.image || null,
      category: item.category,
      available: true,
      created_at: new Date().toISOString(),
    });
    addToast(`${item.name} ${t(translations.menu.addedToCart)}`, "success");
    addFavoriteItem(item.name);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return { price, added, handleAdd };
}

// ═══════════════════════════════════════════════════════════════
// Visual Card — items WITH images (beautiful showcase)
// ═══════════════════════════════════════════════════════════════
function MenuImageCard({
  item,
  locationId,
  onShowIngredients,
}: {
  item: MenuItem;
  locationId?: LocationId;
  onShowIngredients: (item: MenuItem) => void;
}) {
  const { t } = useI18n();
  const { price, added, handleAdd } = useAddToCart(item, locationId);
  const ingredients = getItemIngredients(item.id, "es");

  return (
    <div className="group">
      {/* Image */}
      <div className="aspect-square bg-[#252320] overflow-hidden mb-4 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image!}
          alt={item.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/60 via-transparent to-transparent pointer-events-none" />

        {/* Tags overlay */}
        {item.tags && item.tags.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[calc(100%-24px)]">
            {item.tags.slice(0, 3).map((tag) => {
              const tagInfo = tagIcons[tag];
              return (
                <span
                  key={tag}
                  className="bg-[#2D2A26]/90 px-2 py-1 text-xs text-[#FFF8F0]"
                  title={tagInfo?.label || tag}
                >
                  {tagInfo?.icon || tag.split(" ")[0]}
                </span>
              );
            })}
          </div>
        )}

        {/* Best Seller badge */}
        {item.bestSeller && (
          <div className="absolute top-3 right-3 bg-[#FF6B35] px-2 py-1">
            <Flame className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Allergen indicator */}
        {ingredients && ingredients.allergens.length > 0 && (
          <button
            onClick={() => onShowIngredients(item)}
            className="absolute bottom-3 right-3 bg-[#2D2A26]/90 p-2 hover:bg-[#FF6B35] transition-colors"
            title="Ver ingredientes y alérgenos"
            aria-label="Ver ingredientes"
          >
            <Info className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex justify-between items-start gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-display text-lg text-[#FFF8F0]">{item.name}</h3>
            {item.pricePersonal && (
              <span className="text-xs text-[#6B6560] bg-[#3D3936] px-2 py-0.5">
                {t(translations.menu.personal)}
              </span>
            )}
          </div>
          <p className="text-sm text-[#B8B0A8] line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        {item.pricePersonal ? (
          <div className="flex items-center gap-2 text-white font-bold">
            <span>P: ${item.pricePersonal.toFixed(2)}</span>
            <span className="text-[#6B6560]">|</span>
            <span>G: ${price.toFixed(2)}</span>
          </div>
        ) : (
          <span className="text-white text-lg font-bold">
            ${price.toFixed(2)}
          </span>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={handleAdd}
        className={`w-full min-h-[56px] py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          added
            ? "bg-[#4CAF50] text-white"
            : "bg-[#3D3936] text-[#FFF8F0] hover:bg-[#FF6B35] active:scale-[0.98]"
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D2A26]`}
        aria-label={`${t(translations.menu.addToCart)} ${item.name}`}
      >
        {added ? (
          <>
            <Check className="w-4 h-4" />
            {t(translations.menu.added)}
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            {t(translations.menu.add)}
          </>
        )}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// List Row — items WITHOUT images (clean, elegant list)
// ═══════════════════════════════════════════════════════════════
function MenuListItem({
  item,
  locationId,
  onShowIngredients,
}: {
  item: MenuItem;
  locationId?: LocationId;
  onShowIngredients: (item: MenuItem) => void;
}) {
  const { t } = useI18n();
  const { price, added, handleAdd } = useAddToCart(item, locationId);
  const ingredients = getItemIngredients(item.id, "es");

  return (
    <div className="group flex items-center gap-4 py-4 border-b border-[#3D3936]/50 last:border-b-0 hover:bg-[#252320]/50 transition-colors px-3 -mx-3">
      {/* Left: Name + Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display text-base text-[#FFF8F0] group-hover:text-[#C9A84C] transition-colors">
            {item.name}
          </h3>
          {item.bestSeller && (
            <Flame className="w-3.5 h-3.5 text-[#FF6B35] flex-shrink-0" />
          )}
          {item.tags && item.tags.length > 0 && (
            <span className="flex gap-1">
              {item.tags.slice(0, 2).map((tag) => {
                const tagInfo = tagIcons[tag];
                return (
                  <span
                    key={tag}
                    className="text-xs"
                    title={tagInfo?.label || tag}
                  >
                    {tagInfo?.icon || tag.split(" ")[0]}
                  </span>
                );
              })}
            </span>
          )}
          {item.pricePersonal && (
            <span className="text-[10px] text-[#6B6560] bg-[#3D3936] px-1.5 py-0.5 uppercase tracking-wider">
              {t(translations.menu.personal)}
            </span>
          )}
        </div>
        <p className="text-sm text-[#6B6560] line-clamp-1 mt-0.5">
          {item.description}
        </p>
      </div>

      {/* Allergen info button */}
      {ingredients && ingredients.allergens.length > 0 && (
        <button
          onClick={() => onShowIngredients(item)}
          className="p-1.5 text-[#6B6560] hover:text-[#FF6B35] transition-colors flex-shrink-0"
          aria-label="Ver ingredientes"
        >
          <Info className="w-4 h-4" />
        </button>
      )}

      {/* Price */}
      <div className="flex-shrink-0 text-right min-w-[70px]">
        {item.pricePersonal ? (
          <div className="text-sm">
            <span className="text-white font-bold">${item.pricePersonal.toFixed(2)}</span>
            <span className="text-[#6B6560] mx-1">/</span>
            <span className="text-white font-bold">${price.toFixed(2)}</span>
          </div>
        ) : (
          <span className="text-white font-bold">${price.toFixed(2)}</span>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={handleAdd}
        className={`flex-shrink-0 min-h-[44px] min-w-[44px] w-11 h-11 flex items-center justify-center transition-all ${
          added
            ? "bg-[#4CAF50] text-white"
            : "bg-[#3D3936] text-[#FFF8F0] hover:bg-[#FF6B35] active:scale-95"
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]`}
        aria-label={`${t(translations.menu.addToCart)} ${item.name}`}
      >
        {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function MenuPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeDietary, setActiveDietary] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<
    LocationId | undefined
  >(undefined);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  // Consolidated categories + dietary filters in one row (inside component for i18n access)
  const categories = [
    { id: "all", name: t(translations.menu.all), type: "category" as const },
    { id: "entradas", name: t(translations.menu.starters), type: "category" as const },
    { id: "ensaladas", name: t(translations.menu.salads), type: "category" as const },
    { id: "pastas", name: t(translations.menu.pastas), type: "category" as const },
    { id: "pizzas", name: t(translations.menu.pizzas), type: "category" as const },
    { id: "pizzas-especiales", name: t(translations.menu.specials), type: "category" as const },
    { id: "platos-fuertes", name: t(translations.menu.mainCourse), type: "category" as const },
    { id: "mariscos", name: t(translations.menu.seafood), type: "category" as const },
    { id: "bebidas-frias", name: t(translations.menu.coldDrinks), type: "category" as const },
    { id: "bebidas-calientes", name: t(translations.menu.hotDrinks), type: "category" as const },
    { id: "postres", name: t(translations.menu.desserts), type: "category" as const },
    { id: "cervezas", name: t(translations.menu.beers), type: "category" as const },
    { id: "menu-infantil", name: t(translations.menu.kids), type: "category" as const },
    // Dietary filters appended
    { id: "vegetarian", name: t(translations.menu.vegetarian), type: "dietary" as const },
    { id: "seafood-filter", name: t(translations.menu.seafood), type: "dietary" as const },
    { id: "spicy", name: t(translations.menu.spicy), type: "dietary" as const },
    { id: "bestseller", name: t(translations.menu.favorites), type: "dietary" as const },
  ];

  // Filter menu items based on all criteria
  const filteredItems = useMemo(() => {
    let items = selectedLocation ? getMenuByLocation(selectedLocation) : MENU;

    // Category filter
    if (activeCategory !== "all") {
      items = items.filter((item) => item.category === activeCategory);
    }

    // Dietary filter
    if (activeDietary === "vegetarian") {
      items = items.filter((item) =>
        item.tags?.some((tag) => tag.includes("veg")),
      );
    } else if (activeDietary === "seafood") {
      items = items.filter((item) =>
        item.tags?.some((tag) => tag.includes("seafood")),
      );
    } else if (activeDietary === "spicy") {
      items = items.filter((item) =>
        item.tags?.some((tag) => tag.includes("spicy")),
      );
    } else if (activeDietary === "bestseller") {
      items = items.filter((item) => item.bestSeller);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query),
      );
    }

    return items;
  }, [activeCategory, activeDietary, searchQuery, selectedLocation]);

  // Group items by category for display
  const groupedItems = useMemo(() => {
    if (activeCategory !== "all") {
      return { [activeCategory]: filteredItems };
    }

    const groups: Record<string, MenuItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredItems, activeCategory]);

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32">
      {/* Header */}
      <section className="py-16 border-b border-[#3D3936] relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#6B6560] mb-2">
                {t(translations.menu.fromOven)}
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-[#FFF8F0] tracking-tight mb-4">
                {t(translations.menu.ourMenu)}
              </h1>
              <p className="text-lg text-[#B8B0A8] max-w-xl">
                {t(translations.menu.menuDesc)}
                {selectedLocation && (
                  <span className="block mt-1 text-[#FF6B35]">
                    {LOCATIONS[selectedLocation].name}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Location Selector */}
              <div className="relative">
                <select
                  value={selectedLocation || ""}
                  onChange={(e) =>
                    setSelectedLocation(
                      (e.target.value as LocationId) || undefined,
                    )
                  }
                  className="appearance-none bg-[#252320] border border-[#3D3936] text-[#FFF8F0] px-4 py-3 pr-10 min-h-[48px] focus:outline-none focus:border-[#FF6B35] cursor-pointer"
                  aria-label={t(translations.menu.selectLocation)}
                >
                  <option value="">{t(translations.menu.allLocations)}</option>
                  {Object.values(LOCATIONS).map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="sticky top-20 z-30 bg-[#2D2A26] border-b border-[#3D3936]">
        <div className="max-w-6xl mx-auto px-6">
          {/* Search Bar */}
          <div className="py-4 border-b border-[#3D3936]">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(translations.menu.searchPlaceholder)}
                className="w-full pl-12 pr-12 py-3 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#4A4540] placeholder:text-sm placeholder:tracking-wide focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                aria-label={t(translations.menu.searchMenu)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#FFF8F0] transition-colors p-1"
                  aria-label={t(translations.menu.clearSearch)}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Consolidated Filters */}
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => {
              const isDietary = cat.type === "dietary";
              const isActive = isDietary
                ? activeDietary === (cat.id === "seafood-filter" ? "seafood" : cat.id)
                : activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (isDietary) {
                      const dietaryId = cat.id === "seafood-filter" ? "seafood" : cat.id;
                      setActiveDietary(activeDietary === dietaryId ? "all" : dietaryId);
                    } else {
                      setActiveCategory(cat.id);
                      setActiveDietary("all");
                    }
                  }}
                  className={`px-4 py-2 min-h-[44px] text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] ${
                    isActive
                      ? "bg-[#FF6B35] text-white"
                      : "text-[#B8B0A8] hover:text-[#FFF8F0] hover:bg-[#3D3936]"
                  } ${isDietary && !isActive ? "border border-[#3D3936]" : ""}`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Menu Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Results count */}
          <p className="text-xs text-[#6B6560] uppercase tracking-wider mb-8">
            {filteredItems.length} {t(translations.menu.productsFound)}
            {searchQuery && ` ${t(translations.menu.for)} "${searchQuery}"`}
          </p>

          {/* Grouped by category */}
          {Object.entries(groupedItems).map(([categoryId, items]) => {
            const category = CATEGORIES[categoryId as keyof typeof CATEGORIES];
            const categoryInfo = categories.find((c) => c.id === categoryId);

            // Split items: those with images vs those without
            const withImages = items.filter((item) => item.image);
            const withoutImages = items.filter((item) => !item.image);

            return (
              <div key={categoryId} className="mb-16">
                {activeCategory === "all" && (
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3D3936]">
                    <span className="text-2xl">{categoryIcons[categoryId] || ""}</span>
                    <h2 className="font-display text-2xl text-[#FFF8F0]">
                      {category || categoryInfo?.name}
                    </h2>
                    <span className="text-[#6B6560] text-sm">
                      ({items.length})
                    </span>
                  </div>
                )}

                {/* Image Cards Grid */}
                {withImages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  >
                    {withImages.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <MenuImageCard
                          item={item}
                          locationId={selectedLocation}
                          onShowIngredients={setSelectedItem}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* List Items — no images */}
                {withoutImages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-[#252320] border border-[#3D3936] p-4 sm:p-6 ${withImages.length > 0 ? "mt-8" : ""}`}
                  >
                    {withoutImages.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <MenuListItem
                          item={item}
                          locationId={selectedLocation}
                          onShowIngredients={setSelectedItem}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-[#3D3936] mx-auto mb-4" />
              <p className="text-[#B8B0A8] mb-2">
                {searchQuery
                  ? `${t(translations.menu.noResults)} "${searchQuery}"`
                  : t(translations.menu.noProductsFilter)}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                  setActiveDietary("all");
                }}
                className="text-[#FF6B35] hover:underline font-medium"
              >
                {t(translations.menu.clearFilters)}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Ingredient Modal */}
      <AnimatePresence>
        {selectedItem && (
          <IngredientModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            locationId={selectedLocation}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
