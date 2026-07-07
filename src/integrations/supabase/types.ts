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
      demo_requests: {
        Row: {
          contact_name: string
          created_at: string
          email: string | null
          focus_areas: string | null
          id: string
          institution_name: string
          institution_type: string | null
          message: string | null
          preferred_date: string | null
          role: string | null
          slot_datetime: string | null
          source: string
          whatsapp: string | null
        }
        Insert: {
          contact_name: string
          created_at?: string
          email?: string | null
          focus_areas?: string | null
          id?: string
          institution_name: string
          institution_type?: string | null
          message?: string | null
          preferred_date?: string | null
          role?: string | null
          slot_datetime?: string | null
          source?: string
          whatsapp?: string | null
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string | null
          focus_areas?: string | null
          id?: string
          institution_name?: string
          institution_type?: string | null
          message?: string | null
          preferred_date?: string | null
          role?: string | null
          slot_datetime?: string | null
          source?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      demo_slots: {
        Row: {
          booked_by_request_id: string | null
          created_at: string
          id: string
          slot_datetime: string
          status: string
          updated_at: string
        }
        Insert: {
          booked_by_request_id?: string | null
          created_at?: string
          id?: string
          slot_datetime: string
          status?: string
          updated_at?: string
        }
        Update: {
          booked_by_request_id?: string | null
          created_at?: string
          id?: string
          slot_datetime?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_slots_booked_by_request_id_fkey"
            columns: ["booked_by_request_id"]
            isOneToOne: false
            referencedRelation: "demo_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string
          email: string | null
          email_step: number | null
          event_type: string
          id: string
          ip: string | null
          metadata: Json | null
          sequence_id: string | null
          url: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_step?: number | null
          event_type: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          sequence_id?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          email_step?: number | null
          event_type?: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          sequence_id?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          bounced_at: string | null
          contact_name: string
          created_at: string
          deadline: string
          demo_booked: boolean
          email: string
          email_1_sent_at: string | null
          email_2_sent_at: string | null
          email_3_sent_at: string | null
          email_4_sent_at: string | null
          email_5_sent_at: string | null
          id: string
          institution_name: string
          institution_type: string | null
          last_error: string | null
          lead_id: string | null
          ref_number: string
          tracking_token: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          bounced_at?: string | null
          contact_name: string
          created_at?: string
          deadline?: string
          demo_booked?: boolean
          email: string
          email_1_sent_at?: string | null
          email_2_sent_at?: string | null
          email_3_sent_at?: string | null
          email_4_sent_at?: string | null
          email_5_sent_at?: string | null
          id?: string
          institution_name: string
          institution_type?: string | null
          last_error?: string | null
          lead_id?: string | null
          ref_number: string
          tracking_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          bounced_at?: string | null
          contact_name?: string
          created_at?: string
          deadline?: string
          demo_booked?: boolean
          email?: string
          email_1_sent_at?: string | null
          email_2_sent_at?: string | null
          email_3_sent_at?: string | null
          email_4_sent_at?: string | null
          email_5_sent_at?: string | null
          id?: string
          institution_name?: string
          institution_type?: string | null
          last_error?: string | null
          lead_id?: string | null
          ref_number?: string
          tracking_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      landing_page_clicks: {
        Row: {
          created_at: string
          event: string
          id: string
          page_path: string | null
          referrer: string | null
          source: string
        }
        Insert: {
          created_at?: string
          event?: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          source: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          source?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          compliance_timeline: string | null
          created_at: string
          current_setup: string | null
          email: string
          full_name: string | null
          id: string
          institution_name: string | null
          institution_type: string | null
          ndpr_consent: boolean | null
          phone: string | null
          source: string | null
        }
        Insert: {
          compliance_timeline?: string | null
          created_at?: string
          current_setup?: string | null
          email: string
          full_name?: string | null
          id?: string
          institution_name?: string | null
          institution_type?: string | null
          ndpr_consent?: boolean | null
          phone?: string | null
          source?: string | null
        }
        Update: {
          compliance_timeline?: string | null
          created_at?: string
          current_setup?: string | null
          email?: string
          full_name?: string | null
          id?: string
          institution_name?: string | null
          institution_type?: string | null
          ndpr_consent?: boolean | null
          phone?: string | null
          source?: string | null
        }
        Relationships: []
      }
      page_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          path: string | null
          session_id: string | null
          source: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          path?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          path?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      roadmap_leads: {
        Row: {
          aml_setup: string
          contact_name: string
          created_at: string
          email: string
          id: string
          institution_name: string
          institution_type: string
          phone: string | null
          roadmap_text: string | null
          source: string
          title: string
          volume: string
        }
        Insert: {
          aml_setup: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          institution_name: string
          institution_type: string
          phone?: string | null
          roadmap_text?: string | null
          source?: string
          title: string
          volume: string
        }
        Update: {
          aml_setup?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          institution_name?: string
          institution_type?: string
          phone?: string | null
          roadmap_text?: string | null
          source?: string
          title?: string
          volume?: string
        }
        Relationships: []
      }
      transaction_queue: {
        Row: {
          account_number: string
          amount: number
          channel: string
          counterparty_account: string | null
          counterparty_bank_code: string | null
          created_at: string
          currency: string
          direction: string
          id: string
          narration: string | null
          raw_payload: Json | null
          status: string
          transaction_datetime: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          account_number: string
          amount: number
          channel: string
          counterparty_account?: string | null
          counterparty_bank_code?: string | null
          created_at?: string
          currency: string
          direction: string
          id?: string
          narration?: string | null
          raw_payload?: Json | null
          status?: string
          transaction_datetime: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          amount?: number
          channel?: string
          counterparty_account?: string | null
          counterparty_bank_code?: string | null
          created_at?: string
          currency?: string
          direction?: string
          id?: string
          narration?: string | null
          raw_payload?: Json | null
          status?: string
          transaction_datetime?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      whatsapp_sequences: {
        Row: {
          contact_name: string
          created_at: string
          deadline: string
          demo_booked: boolean
          email: string | null
          id: string
          institution_name: string
          institution_type: string | null
          last_error: string | null
          lead_id: string | null
          message_1_sent_at: string | null
          message_2_sent_at: string | null
          message_3_sent_at: string | null
          phone: string
          ref_number: string
          updated_at: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          deadline?: string
          demo_booked?: boolean
          email?: string | null
          id?: string
          institution_name: string
          institution_type?: string | null
          last_error?: string | null
          lead_id?: string | null
          message_1_sent_at?: string | null
          message_2_sent_at?: string | null
          message_3_sent_at?: string | null
          phone: string
          ref_number: string
          updated_at?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          deadline?: string
          demo_booked?: boolean
          email?: string | null
          id?: string
          institution_name?: string
          institution_type?: string | null
          last_error?: string | null
          lead_id?: string | null
          message_1_sent_at?: string | null
          message_2_sent_at?: string | null
          message_3_sent_at?: string | null
          phone?: string
          ref_number?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
