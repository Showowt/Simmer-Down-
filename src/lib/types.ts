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
  order_number?: string
  customer_id?: string
  location_id?: string
  customer_name: string
  customer_phone: string
  customer_email?: string | null
  delivery_address?: string | null
  is_delivery: boolean
  order_type?: 'delivery' | 'pickup'
  items?: CartItem[]
  items_json?: CartItem[] | null
  items_description?: string | null
  subtotal: number
  delivery_fee: number
  discount?: number
  total: number
  payment_method?: string
  payment_status?: 'pending' | 'paid' | 'refunded'
  status: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
  notes?: string | null
  pickup_scheduled_at?: string | null
  estimated_ready_at?: string | null
  delivered_at?: string | null
  created_at: string
  updated_at?: string
}

export interface Profile {
  id: string
  email: string
  role: 'admin' | 'staff'
  created_at: string
}

export interface Location {
  id: string
  name: string
  address: string
  phone?: string
  hours_weekday?: string
  hours_saturday?: string
  hours_sunday?: string
  delivery_available: boolean
  status: 'active' | 'inactive'
  lat?: number
  lng?: number
  created_at: string
}

export interface Customer {
  id: string
  phone: string
  name?: string
  email?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

export interface Event {
  id: string
  title: string
  description: string | null
  date: string
  time: string
  location: string | null
  image_url: string | null
  category: string
  price: string | null
  featured: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  reason: string
  message: string
  status: 'new' | 'read' | 'responded' | 'archived'
  notes: string | null
  created_at: string
}
