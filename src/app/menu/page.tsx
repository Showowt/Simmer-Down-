'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check } from 'lucide-react'
import { MenuItem } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart'

const categories = [
  { id: 'all', name: 'All' },
  { id: 'pizza', name: 'Pizzas' },
  { id: 'sides', name: 'Sides' },
  { id: 'drinks', name: 'Drinks' },
  { id: 'desserts', name: 'Desserts' },
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
    description: 'Local chorizo, queso fresco, jalapeños, cilantro',
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
    name: 'Margherita',
    description: 'San Marzano tomatoes, fresh mozzarella, basil',
    price: 14.99,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
    size: '12"',
    tags: ['vegetarian'],
  },
  {
    id: '3',
    name: 'Pepperoni',
    description: 'Classic pepperoni, mozzarella, house tomato sauce',
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
    description: 'Wild mushrooms, truffle oil, fontina, arugula',
    price: 22.99,
    image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&q=80',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
    size: '12"',
    tags: ['vegetarian'],
  },
  {
    id: '5',
    name: 'Spicy Diavola',
    description: 'Spicy salami, Calabrian chilis, honey drizzle',
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
    description: 'Grilled chicken, red onion, cilantro, BBQ sauce',
    price: 17.99,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
    size: '12"',
  },
  {
    id: '7',
    name: 'Garlic Breadsticks',
    description: 'Fresh baked with garlic butter and parmesan',
    price: 7.99,
    image_url: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600&q=80',
    category: 'sides',
    available: true,
    created_at: new Date().toISOString(),
    tags: ['vegetarian'],
  },
  {
    id: '8',
    name: 'Caesar Salad',
    description: 'Romaine, parmesan, croutons, caesar dressing',
    price: 9.99,
    image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80',
    category: 'sides',
    available: true,
    created_at: new Date().toISOString(),
    tags: ['vegetarian', 'gluten-free'],
  },
  {
    id: '9',
    name: 'Craft Lemonade',
    description: 'Fresh-squeezed with mint',
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
    name: 'Horchata',
    description: 'Traditional Salvadoran rice drink',
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
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center',
    price: 8.99,
    image_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80',
    category: 'desserts',
    available: true,
    created_at: new Date().toISOString(),
    tags: ['vegetarian'],
  },
  {
    id: '12',
    name: 'Tiramisu',
    description: 'Classic Italian with espresso and mascarpone',
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
  vegetarian: { icon: '🌱', label: 'Vegetarian' },
  vegan: { icon: '🌿', label: 'Vegan' },
  'gluten-free': { icon: '🌾', label: 'Gluten-Free' },
  spicy: { icon: '🌶️', label: 'Spicy' },
}

function MenuItemCard({ item }: { item: ExtendedMenuItem }) {
  const addItem = useCartStore((state) => state.addItem)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="group">
      {/* Image */}
      <div className="aspect-square bg-zinc-900 overflow-hidden mb-4 relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
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
                  className="bg-black/70 backdrop-blur-sm px-2 py-1 text-xs text-white flex items-center gap-1"
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
            <h3 className="font-medium text-white">{item.name}</h3>
            {item.size && (
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5">
                {item.size}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 line-clamp-2">{item.description}</p>
        </div>
        <span className="text-white font-semibold whitespace-nowrap">
          ${item.price.toFixed(2)}
        </span>
      </div>

      {/* Add Button */}
      <button
        onClick={handleAdd}
        disabled={!item.available}
        className={`mt-4 w-full py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          added
            ? 'bg-green-600 text-white'
            : 'bg-zinc-900 text-white hover:bg-orange-500 active:scale-[0.98]'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={`Add ${item.name} to cart`}
      >
        {added ? (
          <>
            <Check className="w-4 h-4" />
            Added to Cart
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Add to Cart
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

  useEffect(() => {
    async function fetchMenu() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('category', { ascending: true })

        if (error) throw error
        if (data && data.length > 0) {
          setItems(data)
        }
      } catch (error) {
        console.log('Using demo menu items')
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
    <div className="min-h-screen bg-zinc-950 pt-20">
      {/* Header */}
      <section className="py-16 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Menu
          </h1>
          <p className="text-lg text-zinc-400">
            Wood-fired pizzas, fresh sides, and house-made drinks.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-20 z-30 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 py-4 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
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
                  <div className="aspect-square bg-zinc-900 mb-4" />
                  <div className="h-4 bg-zinc-900 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-900 rounded w-1/2" />
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
              <p className="text-zinc-500">No items found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
