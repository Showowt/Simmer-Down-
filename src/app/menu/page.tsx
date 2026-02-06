'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, Flame, Sparkles } from 'lucide-react'
import { MenuItem } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart'
import { useToastStore } from '@/components/Toast'
import { useAnimaStore } from '@/store/anima'

const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'pizza', name: 'Pizzas' },
  { id: 'sides', name: 'Acompañamientos' },
  { id: 'drinks', name: 'Bebidas' },
  { id: 'desserts', name: 'Postres' },
]

// Extended menu item type with dietary tags
interface ExtendedMenuItem extends MenuItem {
  size?: string
  tags?: string[]
}

const demoItems: ExtendedMenuItem[] = [
  {
    id: '1',
    name: 'The Salvadoreño',
    description: 'Chorizo artesanal salvadoreño, queso fresco, jalapeños encurtidos, cilantro fresco',
    price: 18.99,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
    size: '12"',
    tags: ['spicy'],
  },
  {
    id: '2',
    name: 'Margherita DOP',
    description: 'Tomate San Marzano, mozzarella di bufala, albahaca fresca, aceite de oliva',
    price: 16.99,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
    size: '12"',
    tags: ['vegetarian'],
  },
  {
    id: '3',
    name: 'Pepperoni Clásica',
    description: 'Pepperoni artesanal, mozzarella, salsa de tomate de la casa',
    price: 15.99,
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
    size: '12"',
  },
  {
    id: '4',
    name: 'Truffle Mushroom',
    description: 'Mix de hongos silvestres, aceite de trufa negra, queso fontina, arúgula baby',
    price: 22.99,
    image_url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
    size: '12"',
    tags: ['vegetarian'],
  },
  {
    id: '5',
    name: 'Spicy Diavola',
    description: 'Salami picante, chiles calabreses, miel de abeja, base de tomate',
    price: 19.99,
    image_url: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&q=80',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
    size: '12"',
    tags: ['spicy'],
  },
  {
    id: '6',
    name: 'BBQ Chicken',
    description: 'Pollo a la parrilla, cebolla morada, cilantro, salsa BBQ artesanal',
    price: 17.99,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
    size: '12"',
  },
  {
    id: '7',
    name: 'Palitos de Ajo',
    description: 'Recién horneados con mantequilla de ajo y parmesano rallado',
    price: 7.99,
    image_url: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600&q=80',
    category: 'sides',
    available: true,
    created_at: new Date().toISOString(),
    tags: ['vegetarian'],
  },
  {
    id: '8',
    name: 'Ensalada César',
    description: 'Lechuga romana, parmesano, crutones, aderezo césar de la casa',
    price: 9.99,
    image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80',
    category: 'sides',
    available: true,
    created_at: new Date().toISOString(),
    tags: ['vegetarian', 'gluten-free'],
  },
  {
    id: '9',
    name: 'Limonada Artesanal',
    description: 'Limón recién exprimido con hierba buena',
    price: 4.99,
    image_url: null,
    category: 'drinks',
    available: true,
    created_at: new Date().toISOString(),
    size: '16oz',
    tags: ['vegan', 'gluten-free'],
  },
  {
    id: '10',
    name: 'Horchata de la Casa',
    description: 'Bebida tradicional salvadoreña de arroz con canela',
    price: 4.49,
    image_url: null,
    category: 'drinks',
    available: true,
    created_at: new Date().toISOString(),
    size: '16oz',
    tags: ['vegan', 'gluten-free'],
  },
  {
    id: '11',
    name: 'Volcán de Chocolate',
    description: 'Pastel tibio de chocolate con centro fundido',
    price: 8.99,
    image_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80',
    category: 'desserts',
    available: true,
    created_at: new Date().toISOString(),
    tags: ['vegetarian'],
  },
  {
    id: '12',
    name: 'Tiramisú',
    description: 'Clásico italiano con espresso y mascarpone',
    price: 7.99,
    image_url: null,
    category: 'desserts',
    available: true,
    created_at: new Date().toISOString(),
    tags: ['vegetarian'],
  },
]

// Dietary tag icons
const tagIcons: Record<string, { icon: string; label: string }> = {
  vegetarian: { icon: '🌱', label: 'Vegetariano' },
  vegan: { icon: '🌿', label: 'Vegano' },
  'gluten-free': { icon: '🌾', label: 'Sin Gluten' },
  spicy: { icon: '🌶️', label: 'Picante' },
}

function MenuItemCard({ item }: { item: ExtendedMenuItem }) {
  const addItem = useCartStore((state) => state.addItem)
  const addToast = useToastStore((state) => state.addToast)
  const addFavoriteItem = useAnimaStore((state) => state.addFavoriteItem)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem(item)
    addToast(`${item.name} agregado al carrito`, 'success')
    addFavoriteItem(item.name) // Track for ANIMA memory
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

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
              {item.category === 'drinks' ? '🥤' : item.category === 'desserts' ? '🍰' : '🍕'}
            </span>
          </div>
        )}

        {/* Dietary tags overlay */}
        {item.tags && item.tags.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-1">
            {item.tags.map((tag) => (
              tagIcons[tag] && (
                <span
                  key={tag}
                  className="bg-[#2D2A26]/80 px-2 py-1 text-xs text-[#FFF8F0] flex items-center gap-1"
                  title={tagIcons[tag].label}
                >
                  {tagIcons[tag].icon}
                </span>
              )
            ))}
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
          <p className="text-sm text-[#B8B0A8] line-clamp-2">{item.description}</p>
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
            ? 'bg-[#4CAF50] text-white'
            : 'bg-[#3D3936] text-[#FFF8F0] hover:bg-[#FF6B35] active:scale-[0.98]'
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
  )
}

export default function MenuPage() {
  const [items, setItems] = useState<ExtendedMenuItem[]>(demoItems)
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const { setIsOpen } = useAnimaStore()

  useEffect(() => {
    async function fetchMenu() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('available', true)
          .order('category', { ascending: true })

        if (error) throw error
        // Only use DB data if we have items with valid data
        if (data && data.length > 0 && data[0].name) {
          // Merge with demo images if DB items lack images
          const itemsWithImages = data.map((item: ExtendedMenuItem) => {
            if (!item.image_url) {
              const demoItem = demoItems.find(d => d.category === item.category)
              return { ...item, image_url: demoItem?.image_url || null }
            }
            return item
          })
          setItems(itemsWithImages)
        }
        // If no data or error, keep using demoItems (initial state)
      } catch (error) {
        console.log('Using demo menu items')
        // Keep demoItems as fallback
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [])

  const filteredItems = items.filter((item) => {
    return activeCategory === 'all' || item.category === activeCategory
  })

  return (
    <div className="min-h-screen bg-[#2D2A26] pt-20">
      {/* Header */}
      <section className="py-16 border-b border-[#3D3936] relative overflow-hidden">
        <div className="absolute inset-0 bg-oven-warmth opacity-30" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="font-handwritten text-xl text-[#FF6B35] mb-2">Desde el horno</p>
              <h1 className="font-display text-4xl md:text-5xl text-[#FFF8F0] tracking-tight mb-4">
                Nuestro Menú
              </h1>
              <p className="text-lg text-[#B8B0A8] max-w-xl">
                Pizzas artesanales horneadas a la leña, acompañamientos frescos y bebidas de la casa.
              </p>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 bg-[#252320] hover:bg-[#FF6B35] border border-[#3D3936] hover:border-[#FF6B35] px-5 py-3 transition-all group"
            >
              <Sparkles className="w-5 h-5 text-[#FF6B35] group-hover:text-white transition-colors" />
              <span className="text-[#FFF8F0] font-medium">Ayúdame a elegir</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-20 z-30 bg-[#2D2A26] border-b border-[#3D3936]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-3 min-h-[44px] text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] ${
                  activeCategory === cat.id
                    ? 'bg-[#FF6B35] text-white'
                    : 'text-[#B8B0A8] hover:text-[#FFF8F0] hover:bg-[#3D3936]'
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
              <p className="text-[#6B6560]">No se encontraron productos en esta categoría</p>
            </div>
          )}
        </div>
      </section>

      {/* ANIMA Help Banner */}
      <section className="py-12 bg-[#252320] border-t border-[#3D3936]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame className="w-6 h-6 text-[#FF6B35]" />
            <span className="font-handwritten text-xl text-[#FF6B35]">¿Necesitas ayuda?</span>
          </div>
          <p className="text-[#B8B0A8] mb-6">
            ANIMA puede recomendarte basándose en tus gustos, preferencias dietéticas o el mood del momento.
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
  )
}
