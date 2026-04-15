"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Check,
  Flame,
  Sparkles,
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

// Categories with icons
const categories = [
  { id: "all", name: "Todos", icon: "🍽️" },
  { id: "entradas", name: "Entradas", icon: "🥟" },
  { id: "ensaladas", name: "Ensaladas", icon: "🥗" },
  { id: "pastas", name: "Pastas", icon: "🍝" },
  { id: "pizzas", name: "Pizzas", icon: "🍕" },
  { id: "pizzas-especiales", name: "Especiales", icon: "⭐" },
  { id: "platos-fuertes", name: "Platos Fuertes", icon: "🥩" },
  { id: "mariscos", name: "Mariscos", icon: "🦐" },
  { id: "bebidas-frias", name: "Bebidas", icon: "🍹" },
  { id: "bebidas-calientes", name: "Café", icon: "☕" },
  { id: "postres", name: "Postres", icon: "🍰" },
  { id: "cervezas", name: "Cervezas", icon: "🍺" },
  { id: "menu-infantil", name: "Niños", icon: "👶" },
];

// Dietary filters
const dietaryFilters = [
  { id: "all", name: "Todos", icon: "🍽️" },
  { id: "vegetarian", name: "Vegetariano", icon: "🌱" },
  { id: "seafood", name: "Mariscos", icon: "🦐" },
  { id: "spicy", name: "Picante", icon: "🌶️" },
  { id: "bestseller", name: "Favoritos", icon: "⭐" },
];

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
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-[#B8B0A8] mb-6">{item.description}</p>

        {/* Ingredients */}
        {ingredients && (
          <div className="mb-6">
            <h4 className="text-[#FF6B35] font-semibold mb-3 flex items-center gap-2">
              <span>🍽️</span> Ingredientes
            </h4>
            <ul className="space-y-2">
              {ingredients.ingredients.map((ing, i) => (
                <li key={i} className="text-[#B8B0A8] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#FF6B35]" />
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
              <span className="font-semibold">Alérgenos</span>
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
            <span className="font-semibold">Favorito de los clientes</span>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-3 font-semibold transition-colors min-h-[56px]"
        >
          Cerrar
        </button>
      </motion.div>
    </motion.div>
  );
}

// Menu Item Card with ingredients support
function MenuItemCard({
  item,
  locationId,
  onShowIngredients,
}: {
  item: MenuItem;
  locationId?: LocationId;
  onShowIngredients: (item: MenuItem) => void;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);
  const addFavoriteItem = useAnimaStore((state) => state.addFavoriteItem);
  const [added, setAdded] = useState(false);

  const price = getItemPrice(item, locationId);
  const ingredients = getItemIngredients(item.id, "es");

  const handleAdd = () => {
    addItem({
      id: item.id,
      name: item.name,
      description: item.description,
      price: price,
      image_url: null,
      category: item.category,
      available: true,
      created_at: new Date().toISOString(),
    });
    addToast(`${item.name} agregado al carrito`, "success");
    addFavoriteItem(item.name);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group">
      {/* Image or category-icon fallback */}
      <div className="aspect-square bg-[#252320] overflow-hidden mb-4 relative flex items-center justify-center">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="text-6xl opacity-30">
            {categories.find((c) => c.id === item.category)?.icon || "🍽️"}
          </span>
        )}
        {item.image && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/60 via-transparent to-transparent pointer-events-none" />
        )}

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
                Personal
              </span>
            )}
          </div>
          <p className="text-sm text-[#B8B0A8] line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>

      {/* Price - WCAG compliant white text */}
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

      {/* Add Button - 56px minimum touch target */}
      <button
        onClick={handleAdd}
        className={`w-full min-h-[56px] py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          added
            ? "bg-[#4CAF50] text-white"
            : "bg-[#3D3936] text-[#FFF8F0] hover:bg-[#FF6B35] active:scale-[0.98]"
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D2A26]`}
        aria-label={`Agregar ${item.name} al carrito`}
      >
        {added ? (
          <>
            <Check className="w-4 h-4" />
            Agregado
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Agregar
          </>
        )}
      </button>
    </div>
  );
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeDietary, setActiveDietary] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<
    LocationId | undefined
  >(undefined);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { setIsOpen } = useAnimaStore();

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
    <div className="min-h-screen bg-[#2D2A26] pt-20">
      {/* Header */}
      <section className="py-16 border-b border-[#3D3936] relative overflow-hidden">
        <div className="absolute inset-0 bg-oven-warmth opacity-30" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="font-handwritten text-xl text-[#FF6B35] mb-2">
                Desde el horno
              </p>
              <h1 className="font-display text-4xl md:text-5xl text-[#FFF8F0] tracking-tight mb-4">
                Nuestro Menú
              </h1>
              <p className="text-lg text-[#B8B0A8] max-w-xl">
                Pizzas artesanales, mariscos frescos, pastas de la casa y más.
                {selectedLocation && (
                  <span className="block mt-1 text-[#FF6B35]">
                    📍 {LOCATIONS[selectedLocation].name}
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
                  aria-label="Seleccionar ubicación"
                >
                  <option value="">Todas las ubicaciones</option>
                  {Object.values(LOCATIONS).map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560] pointer-events-none" />
              </div>
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center gap-2 bg-[#252320] hover:bg-[#FF6B35] border border-[#3D3936] hover:border-[#FF6B35] px-5 py-3 transition-all group min-h-[48px]"
              >
                <Sparkles className="w-5 h-5 text-[#FF6B35] group-hover:text-white transition-colors" />
                <span className="text-[#FFF8F0] font-medium">
                  Ayúdame a elegir
                </span>
              </button>
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
                placeholder="Buscar pizzas, mariscos, carnes..."
                className="w-full pl-12 pr-12 py-3 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                aria-label="Buscar en el menú"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#FFF8F0] transition-colors p-1"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Dietary Filters */}
          <div className="py-3 border-b border-[#3D3936] flex gap-2 overflow-x-auto scrollbar-hide">
            {dietaryFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveDietary(filter.id)}
                className={`px-4 py-2 min-h-[44px] text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeDietary === filter.id
                    ? "bg-[#FF6B35] text-white"
                    : "text-[#B8B0A8] hover:text-[#FFF8F0] bg-[#252320] hover:bg-[#3D3936]"
                }`}
              >
                <span>{filter.icon}</span>
                {filter.name}
              </button>
            ))}
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 min-h-[44px] text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] ${
                  activeCategory === cat.id
                    ? "bg-[#FF6B35] text-white"
                    : "text-[#B8B0A8] hover:text-[#FFF8F0] hover:bg-[#3D3936]"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Results count */}
          <p className="text-[#6B6560] mb-8">
            {filteredItems.length} productos encontrados
            {searchQuery && ` para "${searchQuery}"`}
          </p>

          {/* Grouped by category */}
          {Object.entries(groupedItems).map(([categoryId, items]) => {
            const category = CATEGORIES[categoryId as keyof typeof CATEGORIES];
            const categoryInfo = categories.find((c) => c.id === categoryId);

            return (
              <div key={categoryId} className="mb-16">
                {activeCategory === "all" && (
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3D3936]">
                    <span className="text-2xl">{categoryInfo?.icon}</span>
                    <h2 className="font-display text-2xl text-[#FFF8F0]">
                      {category || categoryInfo?.name}
                    </h2>
                    <span className="text-[#6B6560] text-sm">
                      ({items.length})
                    </span>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <MenuItemCard
                        item={item}
                        locationId={selectedLocation}
                        onShowIngredients={setSelectedItem}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            );
          })}

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-[#3D3936] mx-auto mb-4" />
              <p className="text-[#B8B0A8] mb-2">
                {searchQuery
                  ? `No se encontraron resultados para "${searchQuery}"`
                  : "No se encontraron productos con estos filtros"}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                  setActiveDietary("all");
                }}
                className="text-[#FF6B35] hover:underline font-medium"
              >
                Limpiar filtros
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

      {/* ANIMA Help Banner */}
      <section className="py-12 bg-[#252320] border-t border-[#3D3936]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame className="w-6 h-6 text-[#FF6B35]" />
            <span className="font-handwritten text-xl text-[#FF6B35]">
              ¿Necesitas ayuda?
            </span>
          </div>
          <p className="text-[#B8B0A8] mb-6">
            Pregúntame sobre ingredientes, alérgenos, o déjame recomendarte
            según tus gustos.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 font-semibold transition-all min-h-[56px]"
          >
            Hablar con Sophia
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
