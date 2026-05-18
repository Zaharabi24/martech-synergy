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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_errors: {
        Row: {
          company_id: string | null
          created_at: string
          endpoint: string | null
          error_message: string | null
          id: string
          payload: Json | null
          platform: Database["public"]["Enums"]["platform_kind"] | null
          status_code: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          platform?: Database["public"]["Enums"]["platform_kind"] | null
          status_code?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          platform?: Database["public"]["Enums"]["platform_kind"] | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_errors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_identity: {
        Row: {
          brand_goal: string | null
          business_location: string | null
          company_id: string
          created_at: string
          id: string
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          brand_goal?: string | null
          business_location?: string | null
          company_id: string
          created_at?: string
          id?: string
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          brand_goal?: string | null
          business_location?: string | null
          company_id?: string
          created_at?: string
          id?: string
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_identity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          demo_mode: boolean
          employee_size: string | null
          id: string
          industry: string | null
          name: string
          owner_id: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          demo_mode?: boolean
          employee_size?: string | null
          id?: string
          industry?: string | null
          name: string
          owner_id: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          demo_mode?: boolean
          employee_size?: string | null
          id?: string
          industry?: string | null
          name?: string
          owner_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_sources: {
        Row: {
          company_id: string
          created_at: string
          external_account_id: string | null
          external_account_label: string | null
          id: string
          last_error: string | null
          last_synced_at: string | null
          metadata: Json
          platform: Database["public"]["Enums"]["platform_kind"]
          scopes: string[] | null
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          external_account_id?: string | null
          external_account_label?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          metadata?: Json
          platform: Database["public"]["Enums"]["platform_kind"]
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          external_account_id?: string | null
          external_account_label?: string | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          metadata?: Json
          platform?: Database["public"]["Enums"]["platform_kind"]
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          company_id: string
          duration_ms: number | null
          finished_at: string | null
          id: string
          message: string | null
          platform: Database["public"]["Enums"]["platform_kind"]
          source_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          company_id: string
          duration_ms?: number | null
          finished_at?: string | null
          id?: string
          message?: string | null
          platform: Database["public"]["Enums"]["platform_kind"]
          source_id?: string | null
          started_at?: string
          status: string
        }
        Update: {
          company_id?: string
          duration_ms?: number | null
          finished_at?: string | null
          id?: string
          message?: string | null
          platform?: Database["public"]["Enums"]["platform_kind"]
          source_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "connected_sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      connection_status:
        | "not_connected"
        | "connecting"
        | "connected"
        | "syncing"
        | "permission_expired"
        | "api_error"
      platform_kind:
        | "website"
        | "google_analytics"
        | "google_search_console"
        | "facebook"
        | "instagram"
        | "tiktok"
        | "linkedin"
        | "youtube"
        | "google_business"
        | "twitter"
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
      connection_status: [
        "not_connected",
        "connecting",
        "connected",
        "syncing",
        "permission_expired",
        "api_error",
      ],
      platform_kind: [
        "website",
        "google_analytics",
        "google_search_console",
        "facebook",
        "instagram",
        "tiktok",
        "linkedin",
        "youtube",
        "google_business",
        "twitter",
      ],
    },
  },
} as const
