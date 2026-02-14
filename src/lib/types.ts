export interface MenuItem {
  id: string;
  name: string;
  name_es?: string;
  description: string;
  description_es?: string;
  price: number;
  price_grand?: number; // For pizzas with two sizes
  image_url: string | null;
  category:
    | "entradas"
    | "ensaladas"
    | "pastas"
    | "pizzas"
    | "platos-fuertes"
    | "menu-infantil"
    | "bebidas"
    | "postres"
    | "cervezas"
    | "pizza"
    | "sides"
    | "drinks"
    | "desserts";
  subcategory?: string | null;
  tags?: string[];
  available: boolean;
  availability_note?: string | null;
  created_at: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  order_number?: string;
  customer_id?: string;
  location_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_address?: string | null;
  is_delivery: boolean;
  order_type?: "delivery" | "pickup";
  items?: CartItem[];
  items_json?: CartItem[] | null;
  items_description?: string | null;
  subtotal: number;
  delivery_fee: number;
  discount?: number;
  total: number;
  payment_method?: string;
  payment_status?: "pending" | "paid" | "refunded";
  status: "pending" | "in_progress" | "ready" | "delivered" | "cancelled";
  notes?: string | null;
  pickup_scheduled_at?: string | null;
  estimated_ready_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  role: "admin" | "staff";
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string;
  hours_weekday?: string;
  hours_saturday?: string;
  hours_sunday?: string;
  delivery_available: boolean;
  status: "active" | "inactive";
  lat?: number;
  lng?: number;
  created_at: string;
}

export interface Customer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  location: string | null;
  image_url: string | null;
  category: string;
  price: string | null;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  reason: string;
  message: string;
  status: "new" | "read" | "responded" | "archived";
  notes: string | null;
  created_at: string;
}

export interface Special {
  id: string;
  title: string;
  description: string | null;
  discount_type: "percentage" | "fixed" | "bundle";
  discount_value: number;
  original_price: number | null;
  special_price: number | null;
  menu_items: string[] | null;
  start_date: string;
  end_date: string | null;
  days_of_week: number[] | null;
  active: boolean;
  featured: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  min_order_amount: number;
  delivery_fee: number;
  free_delivery_threshold: number | null;
  tax_rate: number;
  currency: string;
  timezone: string;
  social_facebook: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  social_whatsapp: string | null;
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_push: boolean;
  online_ordering_enabled: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  created_at: string;
  updated_at: string;
}
