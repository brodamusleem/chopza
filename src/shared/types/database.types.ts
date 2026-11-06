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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string
          customer_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          menu_item_id: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          menu_item_id: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          menu_item_id?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      app_notifications: {
        Row: {
          body: string
          created_at: string
          data: Json
          id: string
          notification_type: string
          order_id: string | null
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json
          id?: string
          notification_type: string
          order_id?: string | null
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          notification_type?: string
          order_id?: string | null
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: []
      }
      delivery_notification_outbox: {
        Row: {
          attempts: number
          created_at: string
          id: string
          locked_at: string | null
          last_error: string | null
          notification_type: string
          payload: Json
          recipient_email: string
          recipient_id: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          locked_at?: string | null
          last_error?: string | null
          notification_type: string
          payload?: Json
          recipient_email: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          locked_at?: string | null
          last_error?: string | null
          notification_type?: string
          payload?: Json
          recipient_email?: string
          recipient_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cart_group_id: string
          created_at: string
          current_lat: number | null
          current_lng: number | null
          customer_id: string
          delivery_address: string
          delivery_fee: number
          delivery_latitude: number | null
          delivery_longitude: number | null
          id: string
          location_updated_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          rider_id: string | null
          rider_assigned_at: string | null
          rider_accepted_at: string | null
          rider_search_alerted_at: string | null
          vendor_response_alerted_at: string | null
          vendor_response_started_at: string | null
          service_fee: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          cart_group_id?: string
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          customer_id: string
          delivery_address: string
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          id?: string
          location_updated_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          rider_id?: string | null
          rider_assigned_at?: string | null
          rider_accepted_at?: string | null
          rider_search_alerted_at?: string | null
          vendor_response_alerted_at?: string | null
          vendor_response_started_at?: string | null
          service_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          cart_group_id?: string
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          customer_id?: string
          delivery_address?: string
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          id?: string
          location_updated_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          rider_id?: string | null
          rider_assigned_at?: string | null
          rider_accepted_at?: string | null
          rider_search_alerted_at?: string | null
          vendor_response_alerted_at?: string | null
          vendor_response_started_at?: string | null
          service_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          cart_group_id: string
          created_at: string
          currency: string
          customer_id: string
          id: string
          paid_at: string | null
          provider: string
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          cart_group_id: string
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          paid_at?: string | null
          provider?: string
          reference: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          cart_group_id?: string
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          paid_at?: string | null
          provider?: string
          reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          app_name: string
          base_delivery_fee: number
          id: number
          logo_url: string | null
          maintenance_message: string
          maintenance_mode: boolean
          min_order_amount: number
          service_fee_percentage: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          app_name?: string
          base_delivery_fee?: number
          id?: number
          logo_url?: string | null
          maintenance_message?: string
          maintenance_mode?: boolean
          min_order_amount?: number
          service_fee_percentage?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          app_name?: string
          base_delivery_fee?: number
          id?: number
          logo_url?: string | null
          maintenance_message?: string
          maintenance_mode?: boolean
          min_order_amount?: number
          service_fee_percentage?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notification_preferences: Json
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          notification_preferences?: Json
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notification_preferences?: Json
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      riders: {
        Row: {
          created_at: string
          id: string
          is_online: boolean
          owner_id: string
          plate_number: string | null
          status: Database["public"]["Enums"]["rider_status"]
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean
          owner_id: string
          plate_number?: string | null
          status?: Database["public"]["Enums"]["rider_status"]
          vehicle_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean
          owner_id?: string
          plate_number?: string | null
          status?: Database["public"]["Enums"]["rider_status"]
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "riders_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string
          cover_url: string | null
          created_at: string
          cuisine: string | null
          description: string | null
          id: string
          is_open: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          service_area_id: string | null
          status: Database["public"]["Enums"]["vendor_status"]
        }
        Insert: {
          address: string
          cover_url?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          id?: string
          is_open?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          service_area_id?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
        }
        Update: {
          address?: string
          cover_url?: string | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          id?: string
          is_open?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          service_area_id?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
        }
        Relationships: [
          {
            foreignKeyName: "vendors_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_delivery: { Args: { target_order_id: string }; Returns: undefined }
      claim_delivery: { Args: { target_order_id: string }; Returns: undefined }
      claim_delivery_notifications: {
        Args: { batch_size?: number }
        Returns: Database['public']['Tables']['delivery_notification_outbox']['Row'][]
      }
      decline_delivery: { Args: { target_order_id: string }; Returns: undefined }
      dispatch_unassigned_ready_orders: { Args: never; Returns: number }
      create_checkout: {
        Args: {
          p_delivery_address: string
          p_delivery_lat: number
          p_delivery_lng: number
          p_items: Json
        }
        Returns: {
          out_cart_group_id: string
          out_total: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      admin_reassign_order: { Args: { target_order_id: string; target_vendor_id: string }; Returns: undefined }
      get_vendor_rider_options: {
        Args: { target_vendor_id: string }
        Returns: {
          rider_id: string
          rider_owner_id: string
          full_name: string
          is_online: boolean
          assigned_to_vendor: boolean
        }[]
      }
      process_expired_rider_assignments: { Args: never; Returns: number }
      process_dispatch_timeouts: { Args: never; Returns: number }
      resubmit_rider_application: {
        Args: { target_rider_id: string }
        Returns: undefined
      }
      resubmit_vendor_application: {
        Args: { target_vendor_id: string }
        Returns: undefined
      }
      set_vendor_riders: {
        Args: { target_vendor_id: string; target_rider_ids: string[] }
        Returns: undefined
      }
    }
    Enums: {
      order_status:
        | "pending"
        | "accepted"
        | "preparing"
        | "ready_for_pickup"
        | "rider_assigned"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "cancelled"
      payment_status:
        | "unpaid"
        | "paid"
        | "failed"
        | "refund_pending"
        | "refunded"
      rider_status: "pending" | "approved" | "rejected" | "suspended"
      user_role: "customer" | "vendor" | "rider" | "admin"
      vendor_status: "pending" | "approved" | "suspended" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      order_status: [
        "pending",
        "accepted",
        "preparing",
        "ready_for_pickup",
        "rider_assigned",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      payment_status: [
        "unpaid",
        "paid",
        "failed",
        "refund_pending",
        "refunded",
      ],
      rider_status: ["pending", "approved", "rejected", "suspended"],
      user_role: ["customer", "vendor", "rider", "admin"],
      vendor_status: ["pending", "approved", "suspended", "rejected"],
    },
  },
} as const
