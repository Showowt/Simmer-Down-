export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          customer_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          staff_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          customer_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          staff_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          customer_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          staff_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          message: string
          meta: Json | null
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          message: string
          meta?: Json | null
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          message?: string
          meta?: Json | null
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          customer_id: string
          id: string
          is_default: boolean | null
          label: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          birthday: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          first_order_at: string | null
          id: string
          internal_notes: string | null
          last_name: string | null
          last_order_at: string | null
          lifetime_points_earned: number | null
          loyalty_points_balance: number | null
          loyalty_tier: Database["public"]["Enums"]["loyalty_tier"] | null
          marketing_email_opt_in: boolean | null
          marketing_sms_opt_in: boolean | null
          marketing_whatsapp_opt_in: boolean | null
          phone: string | null
          preferred_language: string | null
          preferred_location_id: string | null
          referral_code: string | null
          referred_by_customer_id: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          transactional_opt_in: boolean | null
          updated_at: string | null
          whatsapp_id: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          first_order_at?: string | null
          id?: string
          internal_notes?: string | null
          last_name?: string | null
          last_order_at?: string | null
          lifetime_points_earned?: number | null
          loyalty_points_balance?: number | null
          loyalty_tier?: Database["public"]["Enums"]["loyalty_tier"] | null
          marketing_email_opt_in?: boolean | null
          marketing_sms_opt_in?: boolean | null
          marketing_whatsapp_opt_in?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          preferred_location_id?: string | null
          referral_code?: string | null
          referred_by_customer_id?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          transactional_opt_in?: boolean | null
          updated_at?: string | null
          whatsapp_id?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          first_order_at?: string | null
          id?: string
          internal_notes?: string | null
          last_name?: string | null
          last_order_at?: string | null
          lifetime_points_earned?: number | null
          loyalty_points_balance?: number | null
          loyalty_tier?: Database["public"]["Enums"]["loyalty_tier"] | null
          marketing_email_opt_in?: boolean | null
          marketing_sms_opt_in?: boolean | null
          marketing_whatsapp_opt_in?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          preferred_location_id?: string | null
          referral_code?: string | null
          referred_by_customer_id?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          transactional_opt_in?: boolean | null
          updated_at?: string | null
          whatsapp_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_preferred_location_id_fkey"
            columns: ["preferred_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_preferred_location_id_fkey"
            columns: ["preferred_location_id"]
            isOneToOne: false
            referencedRelation: "v_locations_with_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_referred_by_customer_id_fkey"
            columns: ["referred_by_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string | null
          customer_id: string | null
          event_id: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          notes: string | null
          party_size: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          event_id: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          party_size?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          event_id?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          notes?: string | null
          party_size?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          created_by_staff_id: string | null
          current_rsvps: number | null
          custom_venue: string | null
          description: string | null
          description_es: string | null
          ends_at: string | null
          has_capacity_limit: boolean | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          location_id: string | null
          max_capacity: number | null
          meta_description: string | null
          meta_title: string | null
          parent_event_id: string | null
          recurrence: Database["public"]["Enums"]["event_recurrence"] | null
          recurrence_end_date: string | null
          rsvp_deadline: string | null
          rsvp_enabled: boolean | null
          slug: string
          starts_at: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          title_es: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_staff_id?: string | null
          current_rsvps?: number | null
          custom_venue?: string | null
          description?: string | null
          description_es?: string | null
          ends_at?: string | null
          has_capacity_limit?: boolean | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          location_id?: string | null
          max_capacity?: number | null
          meta_description?: string | null
          meta_title?: string | null
          parent_event_id?: string | null
          recurrence?: Database["public"]["Enums"]["event_recurrence"] | null
          recurrence_end_date?: string | null
          rsvp_deadline?: string | null
          rsvp_enabled?: boolean | null
          slug: string
          starts_at: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          title_es?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_staff_id?: string | null
          current_rsvps?: number | null
          custom_venue?: string | null
          description?: string | null
          description_es?: string | null
          ends_at?: string | null
          has_capacity_limit?: boolean | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          location_id?: string | null
          max_capacity?: number | null
          meta_description?: string | null
          meta_title?: string | null
          parent_event_id?: string | null
          recurrence?: Database["public"]["Enums"]["event_recurrence"] | null
          recurrence_end_date?: string | null
          rsvp_deadline?: string | null
          rsvp_enabled?: boolean | null
          slug?: string
          starts_at?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          title_es?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_staff_id_fkey"
            columns: ["created_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_locations_with_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          closed_message: string | null
          country: string | null
          created_at: string | null
          delivery_enabled: boolean | null
          delivery_fee: number | null
          delivery_minimum_order: number | null
          delivery_radius_km: number | null
          email: string | null
          estimated_prep_time_minutes: number | null
          google_maps_url: string | null
          holiday_hours: Json | null
          id: string
          image_exterior_url: string | null
          image_interior_url: string | null
          image_logo_url: string | null
          is_accepting_orders: boolean | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          menu_pdf_url: string | null
          minimum_order_amount: number | null
          name: string
          operating_hours: Json
          phone: string | null
          postal_code: string | null
          region: string | null
          slug: string
          state_province: string | null
          temporarily_closed: boolean | null
          timezone: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          closed_message?: string | null
          country?: string | null
          created_at?: string | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          delivery_minimum_order?: number | null
          delivery_radius_km?: number | null
          email?: string | null
          estimated_prep_time_minutes?: number | null
          google_maps_url?: string | null
          holiday_hours?: Json | null
          id?: string
          image_exterior_url?: string | null
          image_interior_url?: string | null
          image_logo_url?: string | null
          is_accepting_orders?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          menu_pdf_url?: string | null
          minimum_order_amount?: number | null
          name: string
          operating_hours?: Json
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          slug: string
          state_province?: string | null
          temporarily_closed?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          closed_message?: string | null
          country?: string | null
          created_at?: string | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          delivery_minimum_order?: number | null
          delivery_radius_km?: number | null
          email?: string | null
          estimated_prep_time_minutes?: number | null
          google_maps_url?: string | null
          holiday_hours?: Json | null
          id?: string
          image_exterior_url?: string | null
          image_interior_url?: string | null
          image_logo_url?: string | null
          is_accepting_orders?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          menu_pdf_url?: string | null
          minimum_order_amount?: number | null
          name?: string
          operating_hours?: Json
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          slug?: string
          state_province?: string | null
          temporarily_closed?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          created_at: string | null
          current_redemptions: number | null
          description: string | null
          description_es: string | null
          discount_amount: number | null
          discount_percent: number | null
          display_order: number | null
          expires_at: string | null
          free_item_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          max_redemptions_per_customer: number | null
          max_total_redemptions: number | null
          min_order_amount: number | null
          min_tier_required: Database["public"]["Enums"]["loyalty_tier"] | null
          name: string
          name_es: string | null
          points_required: number
          reward_type: string
          starts_at: string | null
          updated_at: string | null
          valid_days: number[] | null
          valid_end_time: string | null
          valid_start_time: string | null
        }
        Insert: {
          created_at?: string | null
          current_redemptions?: number | null
          description?: string | null
          description_es?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          display_order?: number | null
          expires_at?: string | null
          free_item_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_redemptions_per_customer?: number | null
          max_total_redemptions?: number | null
          min_order_amount?: number | null
          min_tier_required?: Database["public"]["Enums"]["loyalty_tier"] | null
          name: string
          name_es?: string | null
          points_required: number
          reward_type: string
          starts_at?: string | null
          updated_at?: string | null
          valid_days?: number[] | null
          valid_end_time?: string | null
          valid_start_time?: string | null
        }
        Update: {
          created_at?: string | null
          current_redemptions?: number | null
          description?: string | null
          description_es?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          display_order?: number | null
          expires_at?: string | null
          free_item_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_redemptions_per_customer?: number | null
          max_total_redemptions?: number | null
          min_order_amount?: number | null
          min_tier_required?: Database["public"]["Enums"]["loyalty_tier"] | null
          name?: string
          name_es?: string | null
          points_required?: number
          reward_type?: string
          starts_at?: string | null
          updated_at?: string | null
          valid_days?: number[] | null
          valid_end_time?: string | null
          valid_start_time?: string | null
        }
        Relationships: []
      }
      loyalty_tier_config: {
        Row: {
          color_hex: string | null
          display_name: string
          display_name_es: string | null
          icon_url: string | null
          min_lifetime_points: number
          perks: string[] | null
          perks_es: string[] | null
          points_multiplier: number | null
          tier: Database["public"]["Enums"]["loyalty_tier"]
        }
        Insert: {
          color_hex?: string | null
          display_name: string
          display_name_es?: string | null
          icon_url?: string | null
          min_lifetime_points: number
          perks?: string[] | null
          perks_es?: string[] | null
          points_multiplier?: number | null
          tier: Database["public"]["Enums"]["loyalty_tier"]
        }
        Update: {
          color_hex?: string | null
          display_name?: string
          display_name_es?: string | null
          icon_url?: string | null
          min_lifetime_points?: number
          perks?: string[] | null
          perks_es?: string[] | null
          points_multiplier?: number | null
          tier?: Database["public"]["Enums"]["loyalty_tier"]
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          adjusted_by_staff_id: string | null
          adjustment_reason: string | null
          balance_after: number
          created_at: string | null
          customer_id: string
          description: string | null
          expires_at: string | null
          id: string
          order_id: string | null
          points: number
          reward_id: string | null
          transaction_type: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Insert: {
          adjusted_by_staff_id?: string | null
          adjustment_reason?: string | null
          balance_after: number
          created_at?: string | null
          customer_id: string
          description?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          points: number
          reward_id?: string | null
          transaction_type: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Update: {
          adjusted_by_staff_id?: string | null
          adjustment_reason?: string | null
          balance_after?: number
          created_at?: string | null
          customer_id?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string | null
          points?: number
          reward_id?: string | null
          transaction_type?: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_adjusted_by_staff_id_fkey"
            columns: ["adjusted_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          available_days: Json | null
          available_end_time: string | null
          available_start_time: string | null
          created_at: string | null
          description: string | null
          description_es: string | null
          display_order: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_es: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          available_days?: Json | null
          available_end_time?: string | null
          available_start_time?: string | null
          created_at?: string | null
          description?: string | null
          description_es?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_es?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          available_days?: Json | null
          available_end_time?: string | null
          available_start_time?: string | null
          created_at?: string | null
          description?: string | null
          description_es?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_es?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_item_location_overrides: {
        Row: {
          created_at: string | null
          id: string
          inventory_count_override: number | null
          is_86d: boolean | null
          is_available: boolean | null
          location_id: string
          menu_item_id: string
          price_override: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_count_override?: number | null
          is_86d?: boolean | null
          is_available?: boolean | null
          location_id: string
          menu_item_id: string
          price_override?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_count_override?: number | null
          is_86d?: boolean | null
          is_available?: boolean | null
          location_id?: string
          menu_item_id?: string
          price_override?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_location_overrides_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_location_overrides_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_locations_with_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_modifier_groups: {
        Row: {
          display_order: number | null
          menu_item_id: string
          modifier_group_id: string
        }
        Insert: {
          display_order?: number | null
          menu_item_id: string
          modifier_group_id: string
        }
        Update: {
          display_order?: number | null
          menu_item_id?: string
          modifier_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_modifier_groups_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_sizes: {
        Row: {
          id: string
          menu_item_id: string
          price: number
          size: string
        }
        Insert: {
          id?: string
          menu_item_id: string
          price: number
          size: string
        }
        Update: {
          id?: string
          menu_item_id?: string
          price?: number
          size?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          available: boolean | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
        }
        Insert: {
          available?: boolean | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
        }
        Update: {
          available?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      modifier_groups: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          max_selections: number | null
          min_selections: number | null
          name: string
          name_es: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          name: string
          name_es?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          name?: string
          name_es?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      modifier_options: {
        Row: {
          created_at: string | null
          display_order: number | null
          group_id: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          name_es: string | null
          price_adjustment: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          group_id: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          name_es?: string | null
          price_adjustment?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          group_id?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          name_es?: string | null
          price_adjustment?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifier_options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      modifiers: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          modifier_group_id: string
          name: string
          name_es: string | null
          position: number | null
          price_delta: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          modifier_group_id: string
          name: string
          name_es?: string | null
          position?: number | null
          price_delta?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          modifier_group_id?: string
          name?: string
          name_es?: string | null
          position?: number | null
          price_delta?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_campaigns: {
        Row: {
          body_override: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          completed_at: string | null
          created_at: string | null
          created_by_staff_id: string | null
          delivered_count: number | null
          failed_count: number | null
          id: string
          name: string
          scheduled_at: string | null
          segment_criteria: Json | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          subject_override: string | null
          template_id: string | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          body_override?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          completed_at?: string | null
          created_at?: string | null
          created_by_staff_id?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          name: string
          scheduled_at?: string | null
          segment_criteria?: Json | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          subject_override?: string | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          body_override?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          completed_at?: string | null
          created_at?: string | null
          created_by_staff_id?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          name?: string
          scheduled_at?: string | null
          segment_criteria?: Json | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          subject_override?: string | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_campaigns_created_by_staff_id_fkey"
            columns: ["created_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_template: string
          body_template_es: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          subject: string | null
          updated_at: string | null
          whatsapp_template_name: string | null
        }
        Insert: {
          body_template: string
          body_template_es?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          subject?: string | null
          updated_at?: string | null
          whatsapp_template_name?: string | null
        }
        Update: {
          body_template?: string
          body_template_es?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          subject?: string | null
          updated_at?: string | null
          whatsapp_template_name?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          campaign_id: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string | null
          customer_id: string | null
          delivered_at: string | null
          event_id: string | null
          external_message_id: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          order_id: string | null
          read_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          subject: string | null
          template_id: string | null
        }
        Insert: {
          body: string
          campaign_id?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          event_id?: string | null
          external_message_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          order_id?: string | null
          read_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject?: string | null
          template_id?: string | null
        }
        Update: {
          body?: string
          campaign_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          event_id?: string | null
          external_message_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          order_id?: string | null
          read_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_campaign_fk"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "notification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      order_counters: {
        Row: {
          last_value: number
          order_date: string
        }
        Insert: {
          last_value?: number
          order_date: string
        }
        Update: {
          last_value?: number
          order_date?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_description: string | null
          item_name: string
          line_total: number
          menu_item_id: string | null
          modifiers: Json | null
          modifiers_total: number | null
          order_id: string
          quantity: number
          special_instructions: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_description?: string | null
          item_name: string
          line_total: number
          menu_item_id?: string | null
          modifiers?: Json | null
          modifiers_total?: number | null
          order_id: string
          quantity?: number
          special_instructions?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_description?: string | null
          item_name?: string
          line_total?: number
          menu_item_id?: string | null
          modifiers?: Json | null
          modifiers_total?: number | null
          order_id?: string
          quantity?: number
          special_instructions?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_details"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_notes: string | null
          customer_phone: string | null
          delivery_address_line1: string | null
          delivery_address_line2: string | null
          delivery_city: string | null
          delivery_fee: number | null
          delivery_instructions: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          discount_amount: number | null
          discount_code: string | null
          discount_description: string | null
          estimated_ready_at: string | null
          external_order_id: string | null
          external_payload: Json | null
          handled_by_staff_id: string | null
          id: string
          internal_notes: string | null
          location_id: string
          order_number: string
          order_source: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          placed_at: string | null
          points_earned: number | null
          points_redeemed: number | null
          ready_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          tip_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          delivery_address_line1?: string | null
          delivery_address_line2?: string | null
          delivery_city?: string | null
          delivery_fee?: number | null
          delivery_instructions?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_description?: string | null
          estimated_ready_at?: string | null
          external_order_id?: string | null
          external_payload?: Json | null
          handled_by_staff_id?: string | null
          id?: string
          internal_notes?: string | null
          location_id: string
          order_number?: string
          order_source?: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          placed_at?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax_amount?: number | null
          tax_rate?: number | null
          tip_amount?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          delivery_address_line1?: string | null
          delivery_address_line2?: string | null
          delivery_city?: string | null
          delivery_fee?: number | null
          delivery_instructions?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_description?: string | null
          estimated_ready_at?: string | null
          external_order_id?: string | null
          external_payload?: Json | null
          handled_by_staff_id?: string | null
          id?: string
          internal_notes?: string | null
          location_id?: string
          order_number?: string
          order_source?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          placed_at?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          tip_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_handled_by_staff_id_fkey"
            columns: ["handled_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_locations_with_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_attempts: {
        Row: {
          created_at: string | null
          error_detail: string | null
          http_status: number | null
          id: string
          iso_response_code: string | null
          order_id: string
          payment_id: string | null
          request_payload: Json | null
          response_message: string | null
          response_payload: Json | null
          spi_token: string | null
          stage: string
          transaction_identifier: string | null
        }
        Insert: {
          created_at?: string | null
          error_detail?: string | null
          http_status?: number | null
          id?: string
          iso_response_code?: string | null
          order_id: string
          payment_id?: string | null
          request_payload?: Json | null
          response_message?: string | null
          response_payload?: Json | null
          spi_token?: string | null
          stage: string
          transaction_identifier?: string | null
        }
        Update: {
          created_at?: string | null
          error_detail?: string | null
          http_status?: number | null
          id?: string
          iso_response_code?: string | null
          order_id?: string
          payment_id?: string | null
          request_payload?: Json | null
          response_message?: string | null
          response_payload?: Json | null
          spi_token?: string | null
          stage?: string
          transaction_identifier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          authorization_code: string | null
          card_brand: string | null
          card_last_four: string | null
          created_at: string | null
          currency: string | null
          error_code: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          initiated_at: string | null
          metadata: Json | null
          order_id: string
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          powertranz_order_identifier: string | null
          powertranz_transaction_id: string | null
          processor_response: Json | null
          receipt_url: string | null
          refunded_at: string | null
          spi_token: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          authorization_code?: string | null
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string | null
          currency?: string | null
          error_code?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          initiated_at?: string | null
          metadata?: Json | null
          order_id: string
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          powertranz_order_identifier?: string | null
          powertranz_transaction_id?: string | null
          processor_response?: Json | null
          receipt_url?: string | null
          refunded_at?: string | null
          spi_token?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          authorization_code?: string | null
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string | null
          currency?: string | null
          error_code?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          initiated_at?: string | null
          metadata?: Json | null
          order_id?: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          powertranz_order_identifier?: string | null
          powertranz_transaction_id?: string | null
          processor_response?: Json | null
          receipt_url?: string | null
          refunded_at?: string | null
          spi_token?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_details"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id: string
          role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number | null
          expires_at: string | null
          first_order_only: boolean | null
          free_item_id: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          max_uses: number | null
          max_uses_per_customer: number | null
          min_order_amount: number | null
          min_tier_required: Database["public"]["Enums"]["loyalty_tier"] | null
          starts_at: string | null
          updated_at: string | null
          valid_category_ids: string[] | null
          valid_days: number[] | null
          valid_end_time: string | null
          valid_item_ids: string[] | null
          valid_location_ids: string[] | null
          valid_start_time: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value?: number | null
          expires_at?: string | null
          first_order_only?: boolean | null
          free_item_id?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_customer?: number | null
          min_order_amount?: number | null
          min_tier_required?: Database["public"]["Enums"]["loyalty_tier"] | null
          starts_at?: string | null
          updated_at?: string | null
          valid_category_ids?: string[] | null
          valid_days?: number[] | null
          valid_end_time?: string | null
          valid_item_ids?: string[] | null
          valid_location_ids?: string[] | null
          valid_start_time?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number | null
          expires_at?: string | null
          first_order_only?: boolean | null
          free_item_id?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_customer?: number | null
          min_order_amount?: number | null
          min_tier_required?: Database["public"]["Enums"]["loyalty_tier"] | null
          starts_at?: string | null
          updated_at?: string | null
          valid_category_ids?: string[] | null
          valid_days?: number[] | null
          valid_end_time?: string | null
          valid_item_ids?: string[] | null
          valid_location_ids?: string[] | null
          valid_start_time?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          qualifying_order_id: string | null
          referred_bonus_points: number | null
          referred_customer_id: string
          referred_rewarded: boolean | null
          referrer_bonus_points: number | null
          referrer_customer_id: string
          referrer_rewarded: boolean | null
          rewarded_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          qualifying_order_id?: string | null
          referred_bonus_points?: number | null
          referred_customer_id: string
          referred_rewarded?: boolean | null
          referrer_bonus_points?: number | null
          referrer_customer_id: string
          referrer_rewarded?: boolean | null
          rewarded_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          qualifying_order_id?: string | null
          referred_bonus_points?: number | null
          referred_customer_id?: string
          referred_rewarded?: boolean | null
          referrer_bonus_points?: number | null
          referrer_customer_id?: string
          referrer_rewarded?: boolean | null
          rewarded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_qualifying_order_id_fkey"
            columns: ["qualifying_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_qualifying_order_id_fkey"
            columns: ["qualifying_order_id"]
            isOneToOne: false
            referencedRelation: "v_order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_customer_id_fkey"
            columns: ["referred_customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_customer_id_fkey"
            columns: ["referrer_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by_staff_id: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by_staff_id?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by_staff_id?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_staff_id_fkey"
            columns: ["updated_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          assigned_locations: string[] | null
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["staff_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_locations?: string[] | null
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["staff_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_locations?: string[] | null
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["staff_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_locations_with_assets: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          closed_message: string | null
          country: string | null
          delivery_enabled: boolean | null
          delivery_fee: number | null
          delivery_minimum_order: number | null
          delivery_radius_km: number | null
          email: string | null
          google_maps_url: string | null
          id: string | null
          image_exterior_url: string | null
          image_exterior_url_with_fallback: string | null
          image_interior_url: string | null
          image_logo_url: string | null
          is_accepting_orders: boolean | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          menu_pdf_url: string | null
          menu_pdf_url_with_fallback: string | null
          name: string | null
          operating_hours: Json | null
          phone: string | null
          slug: string | null
          state_province: string | null
          temporarily_closed: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          closed_message?: string | null
          country?: string | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          delivery_minimum_order?: number | null
          delivery_radius_km?: number | null
          email?: string | null
          google_maps_url?: string | null
          id?: string | null
          image_exterior_url?: string | null
          image_exterior_url_with_fallback?: never
          image_interior_url?: string | null
          image_logo_url?: string | null
          is_accepting_orders?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          menu_pdf_url?: string | null
          menu_pdf_url_with_fallback?: never
          name?: string | null
          operating_hours?: Json | null
          phone?: string | null
          slug?: string | null
          state_province?: string | null
          temporarily_closed?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          closed_message?: string | null
          country?: string | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          delivery_minimum_order?: number | null
          delivery_radius_km?: number | null
          email?: string | null
          google_maps_url?: string | null
          id?: string | null
          image_exterior_url?: string | null
          image_exterior_url_with_fallback?: never
          image_interior_url?: string | null
          image_logo_url?: string | null
          is_accepting_orders?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          menu_pdf_url?: string | null
          menu_pdf_url_with_fallback?: never
          name?: string | null
          operating_hours?: Json | null
          phone?: string | null
          slug?: string | null
          state_province?: string | null
          temporarily_closed?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      v_order_details: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_notes: string | null
          customer_phone: string | null
          delivery_address_line1: string | null
          delivery_address_line2: string | null
          delivery_city: string | null
          delivery_fee: number | null
          delivery_instructions: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          discount_amount: number | null
          discount_code: string | null
          discount_description: string | null
          estimated_ready_at: string | null
          handled_by_staff_id: string | null
          id: string | null
          internal_notes: string | null
          items: Json | null
          location_id: string | null
          location_name: string | null
          order_number: string | null
          order_source: string | null
          order_type: Database["public"]["Enums"]["order_type"] | null
          placed_at: string | null
          points_earned: number | null
          points_redeemed: number | null
          ready_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          tip_amount: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_handled_by_staff_id_fkey"
            columns: ["handled_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "v_locations_with_assets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      generate_order_number_v1: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_slug: { Args: { input: string }; Returns: string }
      generate_unique_referral_code: { Args: never; Returns: string }
      get_current_customer: { Args: never; Returns: string }
      get_current_staff: { Args: never; Returns: string }
      get_current_staff_role: {
        Args: never
        Returns: Database["public"]["Enums"]["staff_role"]
      }
      get_storage_url: {
        Args: { bucket: string; file_path: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slug_with_suffix: { Args: { base: string }; Returns: string }
      slugify: { Args: { input_text: string }; Returns: string }
      staff_has_location_access: {
        Args: { location_id: string }
        Returns: boolean
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      campaign_status:
        | "draft"
        | "scheduled"
        | "sending"
        | "completed"
        | "cancelled"
        | "failed"
      event_recurrence: "none" | "daily" | "weekly" | "biweekly" | "monthly"
      loyalty_tier: "bronze" | "silver" | "gold" | "platinum"
      loyalty_transaction_type:
        | "earned"
        | "redeemed"
        | "bonus"
        | "expired"
        | "adjusted"
        | "referral"
      notification_channel: "whatsapp" | "email" | "sms" | "push"
      notification_status: "pending" | "sent" | "delivered" | "failed" | "read"
      order_source:
        | "website"
        | "mobile_app"
        | "pos"
        | "whatsapp"
        | "phone"
        | "third_party"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "completed"
        | "cancelled"
        | "refunded"
      order_type: "pickup" | "delivery" | "dine_in"
      payment_method:
        | "card"
        | "cash"
        | "transfer"
        | "other"
        | "powertranz"
        | "uber_eats"
        | "doordash"
        | "pedidos_ya"
        | "hugo"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
        | "partially_refunded"
      rsvp_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "waitlisted"
        | "no_show"
      staff_role: "owner" | "admin" | "location_manager" | "staff" | "manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      campaign_status: [
        "draft",
        "scheduled",
        "sending",
        "completed",
        "cancelled",
        "failed",
      ],
      event_recurrence: ["none", "daily", "weekly", "biweekly", "monthly"],
      loyalty_tier: ["bronze", "silver", "gold", "platinum"],
      loyalty_transaction_type: [
        "earned",
        "redeemed",
        "bonus",
        "expired",
        "adjusted",
        "referral",
      ],
      notification_channel: ["whatsapp", "email", "sms", "push"],
      notification_status: ["pending", "sent", "delivered", "failed", "read"],
      order_source: [
        "website",
        "mobile_app",
        "pos",
        "whatsapp",
        "phone",
        "third_party",
      ],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
        "completed",
        "cancelled",
        "refunded",
      ],
      order_type: ["pickup", "delivery", "dine_in"],
      payment_method: [
        "card",
        "cash",
        "transfer",
        "other",
        "powertranz",
        "uber_eats",
        "doordash",
        "pedidos_ya",
        "hugo",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      rsvp_status: [
        "pending",
        "confirmed",
        "cancelled",
        "waitlisted",
        "no_show",
      ],
      staff_role: ["owner", "admin", "location_manager", "staff", "manager"],
    },
  },
} as const
