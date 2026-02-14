// SIMMER DOWN - DATABASE TYPES
// Auto-generated TypeScript types for Supabase schema
// Version: 2.0.0
// Generated: 2026-02-14

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          loyalty_points: number;
          loyalty_tier: "bronze" | "silver" | "gold" | "platinum";
          role: "customer" | "staff" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          loyalty_points?: number;
          loyalty_tier?: "bronze" | "silver" | "gold" | "platinum";
          role?: "customer" | "staff" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          loyalty_points?: number;
          loyalty_tier?: "bronze" | "silver" | "gold" | "platinum";
          role?: "customer" | "staff" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          category: "pizza" | "sides" | "drinks" | "desserts";
          size: string | null;
          tags: string[] | null;
          available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          category: "pizza" | "sides" | "drinks" | "desserts";
          size?: string | null;
          tags?: string[] | null;
          available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          category?: "pizza" | "sides" | "drinks" | "desserts";
          size?: string | null;
          tags?: string[] | null;
          available?: boolean;
          created_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          address: string;
          phone: string | null;
          hours_weekday: string | null;
          hours_weekend: string | null;
          lat: number | null;
          lng: number | null;
          is_open: boolean;
          delivery_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          phone?: string | null;
          hours_weekday?: string | null;
          hours_weekend?: string | null;
          lat?: number | null;
          lng?: number | null;
          is_open?: boolean;
          delivery_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          phone?: string | null;
          hours_weekday?: string | null;
          hours_weekend?: string | null;
          lat?: number | null;
          lng?: number | null;
          is_open?: boolean;
          delivery_available?: boolean;
          created_at?: string;
        };
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          reason: string;
          message: string;
          status: "new" | "read" | "responded" | "archived";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          reason: string;
          message: string;
          status?: "new" | "read" | "responded" | "archived";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          reason?: string;
          message?: string;
          status?: "new" | "read" | "responded" | "archived";
          notes?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string | null;
          customer_id: string | null;
          location_id: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          delivery_address: string | null;
          is_delivery: boolean;
          items_json: Json;
          items_description: string | null;
          subtotal: number;
          delivery_fee: number;
          discount: number;
          total: number;
          payment_method: string;
          payment_status: "pending" | "paid" | "refunded";
          status:
            | "pending"
            | "in_progress"
            | "ready"
            | "delivered"
            | "cancelled";
          notes: string | null;
          estimated_ready_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string | null;
          customer_id?: string | null;
          location_id?: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          delivery_address?: string | null;
          is_delivery?: boolean;
          items_json: Json;
          items_description?: string | null;
          subtotal: number;
          delivery_fee?: number;
          discount?: number;
          total: number;
          payment_method?: string;
          payment_status?: "pending" | "paid" | "refunded";
          status?:
            | "pending"
            | "in_progress"
            | "ready"
            | "delivered"
            | "cancelled";
          notes?: string | null;
          estimated_ready_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string | null;
          customer_id?: string | null;
          location_id?: string | null;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          delivery_address?: string | null;
          is_delivery?: boolean;
          items_json?: Json;
          items_description?: string | null;
          subtotal?: number;
          delivery_fee?: number;
          discount?: number;
          total?: number;
          payment_method?: string;
          payment_status?: "pending" | "paid" | "refunded";
          status?:
            | "pending"
            | "in_progress"
            | "ready"
            | "delivered"
            | "cancelled";
          notes?: string | null;
          estimated_ready_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          end_date: string | null;
          location_id: string | null;
          location_name: string | null;
          capacity: number | null;
          registrations_count: number;
          image_url: string | null;
          category: string;
          price_amount: number | null;
          price_display: string | null;
          is_featured: boolean;
          is_active: boolean;
          is_recurring: boolean;
          recurrence_rule: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          end_date?: string | null;
          location_id?: string | null;
          location_name?: string | null;
          capacity?: number | null;
          registrations_count?: number;
          image_url?: string | null;
          category?: string;
          price_amount?: number | null;
          price_display?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          end_date?: string | null;
          location_id?: string | null;
          location_name?: string | null;
          capacity?: number | null;
          registrations_count?: number;
          image_url?: string | null;
          category?: string;
          price_amount?: number | null;
          price_display?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_registrations: {
        Row: {
          id: string;
          event_id: string;
          customer_name: string;
          customer_email: string | null;
          customer_phone: string;
          party_size: number;
          status: "confirmed" | "cancelled" | "waitlist" | "attended";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          customer_name: string;
          customer_email?: string | null;
          customer_phone: string;
          party_size?: number;
          status?: "confirmed" | "cancelled" | "waitlist" | "attended";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          customer_name?: string;
          customer_email?: string | null;
          customer_phone?: string;
          party_size?: number;
          status?: "confirmed" | "cancelled" | "waitlist" | "attended";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      specials: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          discount_type: "percentage" | "fixed" | "combo" | "bogo" | null;
          discount_value: number | null;
          discount_percentage: number | null;
          original_price: number | null;
          special_price: number | null;
          menu_item_id: string | null;
          start_date: string | null;
          end_date: string | null;
          day_of_week: number[] | null;
          start_time: string | null;
          end_time: string | null;
          is_featured: boolean;
          is_active: boolean;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          discount_type?: "percentage" | "fixed" | "combo" | "bogo" | null;
          discount_value?: number | null;
          discount_percentage?: number | null;
          original_price?: number | null;
          special_price?: number | null;
          menu_item_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          day_of_week?: number[] | null;
          start_time?: string | null;
          end_time?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          discount_type?: "percentage" | "fixed" | "combo" | "bogo" | null;
          discount_value?: number | null;
          discount_percentage?: number | null;
          original_price?: number | null;
          special_price?: number | null;
          menu_item_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          day_of_week?: number[] | null;
          start_time?: string | null;
          end_time?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      operating_hours: {
        Row: {
          id: string;
          location_id: string;
          day_of_week: number;
          open_time: string | null;
          close_time: string | null;
          is_closed: boolean;
          is_24_hours: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          day_of_week: number;
          open_time?: string | null;
          close_time?: string | null;
          is_closed?: boolean;
          is_24_hours?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          day_of_week?: number;
          open_time?: string | null;
          close_time?: string | null;
          is_closed?: boolean;
          is_24_hours?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          phone: string;
          name: string | null;
          email: string | null;
          loyalty_points: number;
          loyalty_tier: "bronze" | "silver" | "gold" | "platinum";
          total_orders: number;
          total_spent: number;
          last_order_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          name?: string | null;
          email?: string | null;
          loyalty_points?: number;
          loyalty_tier?: "bronze" | "silver" | "gold" | "platinum";
          total_orders?: number;
          total_spent?: number;
          last_order_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          name?: string | null;
          email?: string | null;
          loyalty_points?: number;
          loyalty_tier?: "bronze" | "silver" | "gold" | "platinum";
          total_orders?: number;
          total_spent?: number;
          last_order_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      loyalty_tiers: {
        Row: {
          id: string;
          tier_name: "bronze" | "silver" | "gold" | "platinum";
          points_required: number;
          discount_percentage: number;
          perks: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tier_name: "bronze" | "silver" | "gold" | "platinum";
          points_required: number;
          discount_percentage?: number;
          perks?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tier_name?: "bronze" | "silver" | "gold" | "platinum";
          points_required?: number;
          discount_percentage?: number;
          perks?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenience exports for common types
export type Profile = Tables<"profiles">;
export type MenuItem = Tables<"menu_items">;
export type Location = Tables<"locations">;
export type ContactSubmission = Tables<"contact_submissions">;
export type Order = Tables<"orders">;
export type Event = Tables<"events">;
export type EventRegistration = Tables<"event_registrations">;
export type Special = Tables<"specials">;
export type OperatingHours = Tables<"operating_hours">;
export type Customer = Tables<"customers">;
export type LoyaltyTier = Tables<"loyalty_tiers">;
