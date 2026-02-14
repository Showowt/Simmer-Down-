"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check, Flame, Sparkles, Search, X } from "lucide-react";
import { MenuItem } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/components/Toast";
import { useAnimaStore } from "@/store/anima";

const categories = [
  { id: "all", name: "Todos" },
  { id: "entradas", name: "Entradas" },
  { id: "ensaladas", name: "Ensaladas" },
  { id: "pastas", name: "Pastas" },
  { id: "pizzas", name: "Pizzas" },
  { id: "platos-fuertes", name: "Platos Fuertes" },
  { id: "bebidas", name: "Bebidas" },
  { id: "postres", name: "Postres" },
  { id: "cervezas", name: "Cervezas" },
];

// Extended menu item type with dietary tags
interface ExtendedMenuItem extends MenuItem {
  size?: string;
  tags?: string[];
}

const demoItems: ExtendedMenuItem[] = [
  // ENTRADAS
  {
    id: "leche-de-tigra",
    name: "Leche de Tigra",
    description:
      "Pescado / Leche de Tigra / Camote Glaseado / Elotitos / Cebolla Morada / Cilantro / Jugo de Limón / Tajadas de Plátano.",
    price: 13.99,
    image_url:
      "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&q=80",
    category: "entradas",
    available: true,
    created_at: new Date().toISOString(),
    tags: ["seafood"],
  },
  {
    id: "ceviche-tropical",
    name: "Ceviche Tropical",
    description:
      "Pescado / Salsa Tropical / Cebolla Morada / Piña / Cilantro / Tajadas de Plátano.",
    price: 13.99,
    image_url:
      "https://images.unsplash.com/photo-1582361171586-2cb89fa27951?w=600&q=80",
    category: "entradas",
    available: true,
    created_at: new Date().toISOString(),
    tags: ["seafood"],
  },
  {
    id: "molcajete-coulotte",
    name: "Molcajete Coulotte",
    description:
      "Carne Coulotte / Salsa Aguacate / Mix de Cebolla / Jalapeño / Cebollín Ají / Tuétano / Tortilla.",
    price: 13.99,
    image_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
    category: "entradas",
    available: true,
    created_at: new Date().toISOString(),
    tags: ["spicy"],
  },
  // ENSALADAS
  {
    id: "ensalada-gambas",
    name: "Ensalada Gambas",
    description:
      "Camarones a la plancha, lechugas, tomates cherrys, zanahoria, pepino, aguacate, elote dulce; servida con crotones y aderezo rosa.",
    price: 9.99,
    image_url:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",
    category: "ensaladas",
    available: true,
    created_at: new Date().toISOString(),
    tags: ["seafood"],
  },
  {
    id: "ensalada-impecable",
    name: "Ensalada Impecable",
    description:
      "Lechuga fresca, trozos de pechuga de pollo a la plancha, manzana verde, zanahoria fresca, elote dulce, aguacate, tocino, almendras.",
    price: 9.99,
    image_url:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80",
    category: "ensaladas",
    available: true,
    created_at: new Date().toISOString(),
  },
  // PASTAS
  {
    id: "fettuccine-mar-tierra",
    name: "Fettuccine Mar y Tierra",
    description:
      "Pasta fettuccine bañada en salsa Alfredo con una deliciosa fusión de mariscos y pollo.",
    price: 9.99,
    image_url:
      "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80",
    category: "pastas",
    available: true,
    created_at: new Date().toISOString(),
    tags: ["seafood"],
  },
  {
    id: "lasagna-bolognesa",
    name: "Lasagna Bolognesa",
    description:
      "Tradicional combinación de pasta rellena de salsa Bolognesa y un mix de quesos mozzarella y queso crema.",
    price: 9.99,
    image_url:
      "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80",
    category: "pastas",
    available: true,
    created_at: new Date().toISOString(),
  },
  // PIZZAS
  {
    id: "pizza-maradona",
    name: "Pizza Maradona",
    description:
      "¡El tributo a una leyenda! Chorizo argentino nivel D10S, pimientos verdes, cebolla y nuestro especial chimichurri.",
    price: 5.75,
    image_url:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    category: "pizzas",
    available: true,
    created_at: new Date().toISOString(),
    size: "Personal",
    tags: ["spicy"],
  },
  {
    id: "pizza-margherita",
    name: "Pizza Margherita",
    description: "Tomates cherrys marinados y albahaca fresca.",
    price: 5.75,
    image_url:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
    category: "pizzas",
    available: true,
    created_at: new Date().toISOString(),
    size: "Personal",
    tags: ["vegetarian"],
  },
  {
    id: "pizza-loroka",
    name: "Pizza La Loroka",
    description: "Así de simple: loroco, tocino y pepperoni.",
    price: 5.75,
    image_url:
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80",
    category: "pizzas",
    available: true,
    created_at: new Date().toISOString(),
    size: "Personal",
  },
  {
    id: "pizza-ghiottone",
    name: "Pizza Ghiottone",
    description:
      "Pepperoni, cebolla, tomate, salami, jamón, chorizo, aceitunas negras y hongos naturales.",
    price: 8.25,
    image_url:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
    category: "pizzas",
    available: true,
    created_at: new Date().toISOString(),
    size: "Personal",
  },
  // PLATOS FUERTES
  {
    id: "terramar-maitre",
    name: "Terramar al Maître",
    description:
      "Combinación de lomito de res y camarones jumbo; acompañado de rondeles de papa, vegetales y coronado con nuestra mantequilla Maître.",
    price: 22.5,
    image_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
    category: "platos-fuertes",
    available: true,
    created_at: new Date().toISOString(),
    tags: ["seafood"],
  },
  {
    id: "hamburguesa-casanova",
    name: "Hamburguesa Casanova",
    description:
      "Doble carne 100% res, fusión de tocino, hongos y cebolla morada, cubierta de queso mozzarella derretido; acompañado de papas francesas.",
    price: 12.5,
    image_url:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
    category: "platos-fuertes",
    available: true,
    created_at: new Date().toISOString(),
  },
  // BEBIDAS
  {
    id: "frozen-positive-vibration",
    name: "Frozen Positive Vibration",
    description: "Frozen tricolor: kiwi, mango y fresa.",
    price: 3.75,
    image_url: null,
    category: "bebidas",
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "limonada-hierba-buena",
    name: "Limonada Hierba Buena",
    description: "Limonada fresca con hierba buena.",
    price: 3.25,
    image_url: null,
    category: "bebidas",
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "horchata",
    name: "Horchata",
    description: "Refresco de horchata tradicional.",
    price: 2.95,
    image_url: null,
    category: "bebidas",
    available: true,
    created_at: new Date().toISOString(),
  },
  // POSTRES
  {
    id: "brownie-helado",
    name: "Brownie con Helado",
    description:
      "Brownie caliente con helado de vainilla, salsa de chocolate y almendras.",
    price: 3.99,
    image_url:
      "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80",
    category: "postres",
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "panna-cotta",
    name: "Panna Cotta",
    description: "Clásica panna cotta italiana con frutos rojos.",
    price: 3.99,
    image_url:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
    category: "postres",
    available: true,
    created_at: new Date().toISOString(),
  },
  // CERVEZAS
  {
    id: "cerveza-puente-quemado",
    name: "Puente Quemado",
    description: "Cerveza artesanal Santaneca.",
    price: 5.0,
    image_url: null,
    category: "cervezas",
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "cerveza-corona",
    name: "Corona",
    description: "Cerveza mexicana importada.",
    price: 3.5,
    image_url: null,
    category: "cervezas",
    available: true,
    created_at: new Date().toISOString(),
  },
];

// Dietary tag icons
const tagIcons: Record<string, { icon: string; label: string }> = {
  vegetarian: { icon: "🌱", label: "Vegetariano" },
  vegan: { icon: "🌿", label: "Vegano" },
  "gluten-free": { icon: "🌾", label: "Sin Gluten" },
  spicy: { icon: "🌶️", label: "Picante" },
};

function MenuItemCard({ item }: { item: ExtendedMenuItem }) {
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);
  const addFavoriteItem = useAnimaStore((state) => state.addFavoriteItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(item);
    addToast(`${item.name} agregado al carrito`, "success");
    addFavoriteItem(item.name); // Track for ANIMA memory
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group">
      {/* Image */}
      <div className="aspect-square bg-[#252320] overflow-hidden mb-4 relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6B6560]">
            <span className="text-5xl">
              {item.category === "drinks"
                ? "🥤"
                : item.category === "desserts"
                  ? "🍰"
                  : "🍕"}
            </span>
          </div>
        )}

        {/* Dietary tags overlay */}
        {item.tags && item.tags.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-1">
            {item.tags.map(
              (tag) =>
                tagIcons[tag] && (
                  <span
                    key={tag}
                    className="bg-[#2D2A26]/80 px-2 py-1 text-xs text-[#FFF8F0] flex items-center gap-1"
                    title={tagIcons[tag].label}
                  >
                    {tagIcons[tag].icon}
                  </span>
                ),
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg text-[#FFF8F0]">{item.name}</h3>
            {item.size && (
              <span className="text-xs text-[#6B6560] bg-[#3D3936] px-2 py-0.5">
                {item.size}
              </span>
            )}
          </div>
          <p className="text-sm text-[#B8B0A8] line-clamp-2">
            {item.description}
          </p>
        </div>
        <span className="text-white text-lg font-bold whitespace-nowrap">
          ${item.price.toFixed(2)}
        </span>
      </div>

      {/* Add Button - 56px minimum touch target */}
      <button
        onClick={handleAdd}
        disabled={!item.available}
        className={`mt-4 w-full min-h-[56px] py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          added
            ? "bg-[#4CAF50] text-white"
            : "bg-[#3D3936] text-[#FFF8F0] hover:bg-[#FF6B35] active:scale-[0.98]"
        } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D2A26]`}
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
            Agregar al Pedido
          </>
        )}
      </button>
    </div>
  );
}

export default function MenuPage() {
  const [items, setItems] = useState<ExtendedMenuItem[]>(demoItems);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { setIsOpen } = useAnimaStore();

  useEffect(() => {
    async function fetchMenu() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .eq("available", true)
          .order("category", { ascending: true });

        if (error) throw error;
        // Only use DB data if we have items with valid data
        if (data && data.length > 0 && data[0].name) {
          // Merge with demo images if DB items lack images
          const itemsWithImages = data.map((item: ExtendedMenuItem) => {
            if (!item.image_url) {
              const demoItem = demoItems.find(
                (d) => d.category === item.category,
              );
              return { ...item, image_url: demoItem?.image_url || null };
            }
            return item;
          });
          setItems(itemsWithImages);
        }
        // If no data or error, keep using demoItems (initial state)
      } catch (error) {
        console.log("Using demo menu items");
        // Keep demoItems as fallback
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
                Pizzas artesanales horneadas a la leña, acompañamientos frescos
                y bebidas de la casa.
              </p>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 bg-[#252320] hover:bg-[#FF6B35] border border-[#3D3936] hover:border-[#FF6B35] px-5 py-3 transition-all group"
            >
              <Sparkles className="w-5 h-5 text-[#FF6B35] group-hover:text-white transition-colors" />
              <span className="text-[#FFF8F0] font-medium">
                Ayúdame a elegir
              </span>
            </button>
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
                placeholder="Buscar en el menu..."
                className="w-full pl-12 pr-12 py-3 bg-[#252320] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                aria-label="Buscar productos"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#FFF8F0] transition-colors"
                  aria-label="Limpiar busqueda"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          {/* Category Filters */}
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-3 min-h-[44px] text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] ${
                  activeCategory === cat.id
                    ? "bg-[#FF6B35] text-white"
                    : "text-[#B8B0A8] hover:text-[#FFF8F0] hover:bg-[#3D3936]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-[#252320] mb-4" />
                  <div className="h-4 bg-[#252320] w-3/4 mb-2" />
                  <div className="h-3 bg-[#252320] w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
            >
              {filteredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <MenuItemCard item={item} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {filteredItems.length === 0 && !loading && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-[#3D3936] mx-auto mb-4" />
              <p className="text-[#B8B0A8] mb-2">
                {searchQuery
                  ? `No se encontraron resultados para "${searchQuery}"`
                  : "No se encontraron productos en esta categoria"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[#FF6B35] hover:underline font-medium"
                >
                  Limpiar busqueda
                </button>
              )}
            </div>
          )}
        </div>
      </section>

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
            ANIMA puede recomendarte basándose en tus gustos, preferencias
            dietéticas o el mood del momento.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 font-semibold transition-all min-h-[56px]"
          >
            Hablar con ANIMA
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
