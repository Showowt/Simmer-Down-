'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, Flame, Leaf, Star } from 'lucide-react'
import MenuCard from '@/components/MenuCard'
import { MenuItem } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const categories = [
  { id: 'all', name: 'All', icon: '🍽️' },
  { id: 'pizza', name: 'Pizzas', icon: '🍕' },
  { id: 'sides', name: 'Sides', icon: '🍟' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
]

const demoItems: MenuItem[] = [
  {
    id: '1',
    name: 'The Salvadoreño',
    description: 'Local chorizo, queso fresco, jalapeños, cilantro, our signature crust',
    price: 18.99,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Margherita',
    description: 'Fresh mozzarella, San Marzano tomatoes, basil, extra virgin olive oil',
    price: 14.99,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Pepperoni',
    description: 'Classic pepperoni with mozzarella and our house tomato sauce',
    price: 15.99,
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Truffle Mushroom',
    description: 'Wild mushrooms, truffle oil, fontina cheese, fresh arugula',
    price: 22.99,
    image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Spicy Diavola',
    description: 'Spicy salami, Calabrian chilis, honey drizzle, mozzarella',
    price: 19.99,
    image_url: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'BBQ Chicken',
    description: 'Grilled chicken, red onion, cilantro, tangy BBQ sauce',
    price: 17.99,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Veggie Supreme',
    description: 'Bell peppers, mushrooms, onions, olives, tomatoes, spinach',
    price: 16.99,
    image_url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=600',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Meat Lovers',
    description: 'Pepperoni, sausage, bacon, ham, ground beef',
    price: 21.99,
    image_url: 'https://images.unsplash.com/photo-1458642849426-cfb724f15ef7?w=600',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '9',
    name: 'Garlic Breadsticks',
    description: 'Fresh baked with garlic butter and parmesan, marinara on the side',
    price: 7.99,
    image_url: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600',
    category: 'sides',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '10',
    name: 'Buffalo Wings',
    description: '8 crispy wings tossed in buffalo sauce, served with ranch',
    price: 12.99,
    image_url: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600',
    category: 'sides',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '11',
    name: 'Caesar Salad',
    description: 'Romaine, parmesan, house-made croutons, caesar dressing',
    price: 9.99,
    image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600',
    category: 'sides',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '12',
    name: 'Mozzarella Sticks',
    description: 'Crispy breaded mozzarella served with marinara sauce',
    price: 8.99,
    image_url: null,
    category: 'sides',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '13',
    name: 'Craft Lemonade',
    description: 'Fresh-squeezed with a hint of mint',
    price: 4.99,
    image_url: null,
    category: 'drinks',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '14',
    name: 'Coca-Cola',
    description: 'Classic Coca-Cola, ice cold',
    price: 2.99,
    image_url: null,
    category: 'drinks',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '15',
    name: 'Horchata',
    description: 'Traditional Salvadoran rice drink with cinnamon',
    price: 4.49,
    image_url: null,
    category: 'drinks',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '16',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, vanilla ice cream',
    price: 8.99,
    image_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600',
    category: 'desserts',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '17',
    name: 'Tiramisu',
    description: 'Classic Italian tiramisu with espresso and mascarpone',
    price: 7.99,
    image_url: null,
    category: 'desserts',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '18',
    name: 'Nutella Pizza',
    description: 'Sweet pizza dough with Nutella, strawberries, powdered sugar',
    price: 11.99,
    image_url: null,
    category: 'desserts',
    available: true,
    created_at: new Date().toISOString(),
  },
]

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(demoItems)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
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
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-zinc-950 pt-24">
      {/* Hero */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-orange-400 font-semibold uppercase tracking-wider text-sm mb-4 block">
              What&apos;s Cooking
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              Our Menu
            </h1>
            <p className="text-xl text-zinc-400">
              Handcrafted pizzas baked in our wood-fired oven.
              Fresh ingredients, bold flavors.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-8 sticky top-16 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 py-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full font-medium transition whitespace-nowrap',
                    activeCategory === cat.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  )}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-zinc-800" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-zinc-800 rounded w-3/4" />
                    <div className="h-4 bg-zinc-800 rounded w-full" />
                    <div className="h-4 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory + searchQuery}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <MenuCard item={item} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {filteredItems.length === 0 && !loading && (
            <div className="text-center py-16">
              <p className="text-zinc-500 text-lg">No items found</p>
              <button
                onClick={() => {
                  setActiveCategory('all')
                  setSearchQuery('')
                }}
                className="mt-4 text-orange-400 hover:text-orange-300 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Info Banner */}
      <section className="py-12 bg-zinc-900/50 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Wood-Fired</h3>
                <p className="text-zinc-500 text-sm">Baked at 900°F for perfection</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Fresh Daily</h3>
                <p className="text-zinc-500 text-sm">Local ingredients, always fresh</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">SimmerLovers</h3>
                <p className="text-zinc-500 text-sm">Earn points on every order</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
