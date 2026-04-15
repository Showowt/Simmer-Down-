export interface MenuItem {
  id: string;
  name: string;
  name_es?: string;
  description: string;
  description_es?: string;
  price: number;
  price_grand?: number; // For pizzas with two sizes
  image_url: string | null;
  category: string; // Flexible to support all category types
  subcategory?: string | null;
  tags?: string[];
  available: boolean;
  availability_note?: string | null;
  created_at: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

/**
 * Production schema: payment state lives in the `payments` table.
 * Orders carry only: order_source, external_order_id, external_payload.
 */
export type PaymentMethod =
  | "card"
  | "cash"
  | "transfer"
  | "other"
  | "powertranz"
  | "uber_eats"
  | "doordash"
  | "pedidos_ya"
  | "hugo";

export type PaymentStatusDb =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | "cancelled";

/** UI-friendly payment status (collapsed from the DB enum). */
export type PaymentStatusUi =
  | "pending"
  | "processing_3ds"
  | "paid"
  | "failed"
  | "refunded"
  | "voided";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled"
  | "refunded"
  // Legacy values — retained so existing admin UI type-checks.
  // Live DB uses the canonical enum above; these will evaluate to false
  // against real order.status values.
  | "in_progress"
  | "delivered";

export type OrderType = "dine_in" | "pickup" | "takeout" | "delivery";

export type OrderSourceProvider =
  | "website"
  | "whatsapp"
  | "admin"
  | "phone"
  | "uber_eats"
  | "doordash"
  | "pedidos_ya"
  | "hugo";

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency?: string | null;
  payment_method: PaymentMethod;
  status: PaymentStatusDb;
  card_brand?: string | null;
  card_last_four?: string | null;
  authorization_code?: string | null;
  powertranz_transaction_id?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
  refunded_at?: string | null;
  failure_reason?: string | null;
  error_code?: string | null;
  initiated_at?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number?: string;
  customer_id?: string | null;
  location_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_address_line1?: string | null;
  delivery_address_line2?: string | null;
  delivery_city?: string | null;
  delivery_instructions?: string | null;
  order_type?: OrderType;
  status: OrderStatus;
  subtotal: number;
  tax_amount?: number | null;
  delivery_fee?: number | null;
  discount_amount?: number | null;
  tip_amount?: number | null;
  total_amount: number;
  customer_notes?: string | null;
  internal_notes?: string | null;
  order_source?: OrderSourceProvider | string | null;
  external_order_id?: string | null;
  external_payload?: unknown;
  placed_at?: string | null;
  confirmed_at?: string | null;
  estimated_ready_at?: string | null;
  ready_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  // Optional joined payment row (populated by queries that select payments(*)).
  payments?: Payment[] | Payment | null;
  // ─── Legacy compatibility (old schema; still referenced by existing UI) ───
  // These fields do not exist in the production DB but the UI falls back
  // to them safely. New code should prefer the canonical fields above.
  is_delivery?: boolean;
  delivery_address?: string | null;
  total?: number;
  notes?: string | null;
  items?: CartItem[];
  items_json?: CartItem[] | unknown;
  items_description?: string | null;
  payment_status?: PaymentStatusUi | string;
  payment_method?: string;
  card_brand?: string | null;
  card_last4?: string | null;
  authorization_code?: string | null;
  payment_error_message?: string | null;
  source_provider?: OrderSourceProvider | string | null;
  processor_transaction_id?: string | null;
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
