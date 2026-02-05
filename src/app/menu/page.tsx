'use client'

import { useEffect, useState } from 'react'
import MenuCard from '@/components/MenuCard'
import { MenuItem } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const categories = [
  { id: 'all', name: 'All' },
  { id: 'pizza', name: 'Pizzas' },
  { id: 'sides', name: 'Sides' },
  { id: 'drinks', name: 'Drinks' },
  { id: 'desserts', name: 'Desserts' },
]

// Demo menu items (used when Supabase not connected)
const demoItems: MenuItem[] = [
  {
    id: '1',
    name: 'Margherita',
    description: 'Fresh mozzarella, tomatoes, basil, olive oil on our signature crust',
    price: 12.99,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Pepperoni',
    description: 'Classic pepperoni with mozzarella and our house tomato sauce',
    price: 14.99,
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'BBQ Chicken',
    description: 'Grilled chicken, red onion, cilantro, BBQ sauce, mozzarella',
    price: 16.99,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Hawaiian',
    description: 'Ham, pineapple, mozzarella cheese with tomato sauce',
    price: 15.99,
    image_url: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=500',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Supreme',
    description: 'Pepperoni, sausage, bell peppers, onions, mushrooms, olives',
    price: 18.99,
    image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500',
    category: 'pizza',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Garlic Breadsticks',
    description: 'Fresh baked with garlic butter and parmesan, served with marinara',
    price: 6.99,
    image_url: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500',
    category: 'sides',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Chicken Wings',
    description: 'Crispy wings with your choice of buffalo, BBQ, or garlic parmesan',
    price: 11.99,
    image_url: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=500',
    category: 'sides',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Coca-Cola',
    description: 'Classic refreshing Coca-Cola, ice cold',
    price: 2.49,
    image_url: null,
    category: 'drinks',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '9',
    name: 'Sprite',
    description: 'Crisp, refreshing lemon-lime soda',
    price: 2.49,
    image_url: null,
    category: 'drinks',
    available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '10',
    name: 'Chocolate Brownie',
    description: 'Warm fudgy brownie served with vanilla ice cream',
    price: 7.99,
    image_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500',
    category: 'desserts',
    available: true,
    created_at: new Date().toISOString(),
  },
]

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(demoItems)
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

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter((item) => item.category === activeCategory)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Menu</h1>
        <p className="text-xl text-gray-500">Fresh ingredients, made with love</p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-2 rounded-full font-medium transition ${
              activeCategory === cat.id
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No items found in this category</p>
        </div>
      )}
    </div>
  )
}
