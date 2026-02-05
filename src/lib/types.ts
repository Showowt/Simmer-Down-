export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  category: 'pizza' | 'sides' | 'drinks' | 'desserts'
  available: boolean
  created_at: string
}

export interface CartItem extends MenuItem {
  quantity: number
}

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  delivery_address: string | null
  order_type: 'delivery' | 'pickup'
  items: CartItem[]
  subtotal: number
  delivery_fee: number
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  role: 'admin' | 'staff'
  created_at: string
}
