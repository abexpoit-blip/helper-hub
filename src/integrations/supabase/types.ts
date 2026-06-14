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
      campaign_runs: {
        Row: {
          account_id: string | null
          campaign_id: string
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          max_retries: number
          next_retry_at: string | null
          result: Json | null
          retry_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["run_status"]
          user_id: string
        }
        Insert: {
          account_id?: string | null
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          result?: Json | null
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          user_id: string
        }
        Update: {
          account_id?: string | null
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          result?: Json | null
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_runs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fb_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_runs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          max_retries: number
          name: string
          payload: Json
          posts_per_hour: number
          randomize_seconds: number
          retry_backoff_seconds: number
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          total_done: number
          total_failed: number
          total_targets: number
          type: Database["public"]["Enums"]["campaign_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          max_retries?: number
          name: string
          payload?: Json
          posts_per_hour?: number
          randomize_seconds?: number
          retry_backoff_seconds?: number
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          total_done?: number
          total_failed?: number
          total_targets?: number
          type: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          max_retries?: number
          name?: string
          payload?: Json
          posts_per_hour?: number
          randomize_seconds?: number
          retry_backoff_seconds?: number
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          total_done?: number
          total_failed?: number
          total_targets?: number
          type?: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fb_accounts: {
        Row: {
          cookies_ciphertext: string | null
          cookies_iv: string | null
          created_at: string
          id: string
          imax_profile_id: string | null
          label: string
          last_error: string | null
          last_sync_at: string | null
          proxy_id: string | null
          region: string | null
          status: Database["public"]["Enums"]["account_status"]
          token_ciphertext: string | null
          token_iv: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          cookies_ciphertext?: string | null
          cookies_iv?: string | null
          created_at?: string
          id?: string
          imax_profile_id?: string | null
          label: string
          last_error?: string | null
          last_sync_at?: string | null
          proxy_id?: string | null
          region?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          token_ciphertext?: string | null
          token_iv?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          cookies_ciphertext?: string | null
          cookies_iv?: string | null
          created_at?: string
          id?: string
          imax_profile_id?: string | null
          label?: string
          last_error?: string | null
          last_sync_at?: string | null
          proxy_id?: string | null
          region?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          token_ciphertext?: string | null
          token_iv?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_accounts_proxy_id_fkey"
            columns: ["proxy_id"]
            isOneToOne: false
            referencedRelation: "proxies"
            referencedColumns: ["id"]
          },
        ]
      }
      imax_config: {
        Row: {
          api_endpoint: string
          api_token_ciphertext: string | null
          api_token_iv: string | null
          created_at: string
          footprint: Json
          last_test_at: string | null
          last_test_message: string | null
          last_test_ok: boolean | null
          max_concurrent_profiles: number
          sync_interval_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          api_endpoint?: string
          api_token_ciphertext?: string | null
          api_token_iv?: string | null
          created_at?: string
          footprint?: Json
          last_test_at?: string | null
          last_test_message?: string | null
          last_test_ok?: boolean | null
          max_concurrent_profiles?: number
          sync_interval_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          api_endpoint?: string
          api_token_ciphertext?: string | null
          api_token_iv?: string | null
          created_at?: string
          footprint?: Json
          last_test_at?: string | null
          last_test_message?: string | null
          last_test_ok?: boolean | null
          max_concurrent_profiles?: number
          sync_interval_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linker_config: {
        Row: {
          api_key_ciphertext: string | null
          api_key_iv: string | null
          base_endpoint: string | null
          created_at: string
          default_tag: string | null
          domains: string[]
          spintax_template: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_ciphertext?: string | null
          api_key_iv?: string | null
          base_endpoint?: string | null
          created_at?: string
          default_tag?: string | null
          domains?: string[]
          spintax_template?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_ciphertext?: string | null
          api_key_iv?: string | null
          base_endpoint?: string | null
          created_at?: string
          default_tag?: string | null
          domains?: string[]
          spintax_template?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      metric_events: {
        Row: {
          account_id: string | null
          campaign_id: string | null
          created_at: string
          id: number
          meta: Json | null
          type: Database["public"]["Enums"]["metric_type"]
          user_id: string
          value: number
        }
        Insert: {
          account_id?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: number
          meta?: Json | null
          type: Database["public"]["Enums"]["metric_type"]
          user_id: string
          value?: number
        }
        Update: {
          account_id?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: number
          meta?: Json | null
          type?: Database["public"]["Enums"]["metric_type"]
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fb_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          license_tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          license_tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          license_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      proxies: {
        Row: {
          created_at: string
          id: string
          ip: string
          is_active: boolean
          label: string | null
          last_check_at: string | null
          password_ciphertext: string | null
          password_iv: string | null
          port: number
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip: string
          is_active?: boolean
          label?: string | null
          last_check_at?: string | null
          password_ciphertext?: string | null
          password_iv?: string | null
          port: number
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string
          is_active?: boolean
          label?: string | null
          last_check_at?: string | null
          password_ciphertext?: string | null
          password_iv?: string | null
          port?: number
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      run_logs: {
        Row: {
          account_id: string | null
          campaign_id: string | null
          created_at: string
          id: number
          level: Database["public"]["Enums"]["log_level"]
          message: string
          meta: Json | null
          run_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: number
          level?: Database["public"]["Enums"]["log_level"]
          message: string
          meta?: Json | null
          run_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: number
          level?: Database["public"]["Enums"]["log_level"]
          message?: string
          meta?: Json | null
          run_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fb_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_logs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "campaign_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "active" | "flagged" | "disconnected"
      app_role: "admin" | "user"
      campaign_status:
        | "draft"
        | "scheduled"
        | "running"
        | "paused"
        | "completed"
        | "failed"
        | "cancelled"
      campaign_type: "post" | "comment" | "reaction"
      log_level: "info" | "success" | "warning" | "error"
      metric_type: "post" | "video_rendered" | "click" | "success" | "fail"
      run_status:
        | "queued"
        | "running"
        | "success"
        | "failed"
        | "skipped"
        | "paused"
        | "cancelled"
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
      account_status: ["active", "flagged", "disconnected"],
      app_role: ["admin", "user"],
      campaign_status: [
        "draft",
        "scheduled",
        "running",
        "paused",
        "completed",
        "failed",
        "cancelled",
      ],
      campaign_type: ["post", "comment", "reaction"],
      log_level: ["info", "success", "warning", "error"],
      metric_type: ["post", "video_rendered", "click", "success", "fail"],
      run_status: [
        "queued",
        "running",
        "success",
        "failed",
        "skipped",
        "paused",
        "cancelled",
      ],
    },
  },
} as const
