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
      ctr_queue: {
        Row: {
          created_at: string
          ctr_reference: string | null
          customer_id: string
          customer_name: string | null
          filed_at: string | null
          goaml_xml: string | null
          id: string
          report_date: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          total_cash_ngn: number
          transaction_count: number
          transaction_ids: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          ctr_reference?: string | null
          customer_id: string
          customer_name?: string | null
          filed_at?: string | null
          goaml_xml?: string | null
          id?: string
          report_date: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          total_cash_ngn: number
          transaction_count?: number
          transaction_ids?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          ctr_reference?: string | null
          customer_id?: string
          customer_name?: string | null
          filed_at?: string | null
          goaml_xml?: string | null
          id?: string
          report_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          total_cash_ngn?: number
          transaction_count?: number
          transaction_ids?: Json
          updated_at?: string
        }
        Relationships: []
      }
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
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
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          created_at: string
          customer_id: string
          document_name: string
          document_type: string
          expiry_date: string | null
          file_size_bytes: number | null
          id: string
          is_current: boolean
          kyc_tier_at_upload: string | null
          storage_path: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          document_name: string
          document_type: string
          expiry_date?: string | null
          file_size_bytes?: number | null
          id?: string
          is_current?: boolean
          kyc_tier_at_upload?: string | null
          storage_path: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          file_size_bytes?: number | null
          id?: string
          is_current?: boolean
          kyc_tier_at_upload?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      kyc_verification_vectors: {
        Row: {
          api_endpoint: string | null
          cost_per_check_usd: number | null
          created_at: string
          id: string
          is_mandatory_tier_1: boolean
          is_mandatory_tier_2: boolean
          jurisdiction_code: string
          provider_name: string | null
          tier_2_upgrade_required: boolean
          updated_at: string
          vector_name: string
          vector_type: string
        }
        Insert: {
          api_endpoint?: string | null
          cost_per_check_usd?: number | null
          created_at?: string
          id?: string
          is_mandatory_tier_1?: boolean
          is_mandatory_tier_2?: boolean
          jurisdiction_code: string
          provider_name?: string | null
          tier_2_upgrade_required?: boolean
          updated_at?: string
          vector_name: string
          vector_type: string
        }
        Update: {
          api_endpoint?: string | null
          cost_per_check_usd?: number | null
          created_at?: string
          id?: string
          is_mandatory_tier_1?: boolean
          is_mandatory_tier_2?: boolean
          jurisdiction_code?: string
          provider_name?: string | null
          tier_2_upgrade_required?: boolean
          updated_at?: string
          vector_name?: string
          vector_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_verification_vectors_jurisdiction_code_fkey"
            columns: ["jurisdiction_code"]
            isOneToOne: false
            referencedRelation: "regulatory_jurisdictions"
            referencedColumns: ["jurisdiction_code"]
          },
        ]
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
      regulatory_jurisdictions: {
        Row: {
          base_currency: string
          created_at: string
          fiu_name: string
          id: string
          is_active: boolean
          jurisdiction_code: string
          jurisdiction_name: string
          regulator_name: string
          updated_at: string
        }
        Insert: {
          base_currency: string
          created_at?: string
          fiu_name: string
          id?: string
          is_active?: boolean
          jurisdiction_code: string
          jurisdiction_name: string
          regulator_name: string
          updated_at?: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          fiu_name?: string
          id?: string
          is_active?: boolean
          jurisdiction_code?: string
          jurisdiction_name?: string
          regulator_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      regulatory_report_formats: {
        Row: {
          created_at: string
          format_standard: string
          id: string
          jurisdiction_code: string
          max_file_size_mb: number | null
          report_type: string
          requires_digital_signature: boolean
          schema_version: string | null
          submission_endpoint: string | null
          test_endpoint: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          format_standard: string
          id?: string
          jurisdiction_code: string
          max_file_size_mb?: number | null
          report_type: string
          requires_digital_signature?: boolean
          schema_version?: string | null
          submission_endpoint?: string | null
          test_endpoint?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          format_standard?: string
          id?: string
          jurisdiction_code?: string
          max_file_size_mb?: number | null
          report_type?: string
          requires_digital_signature?: boolean
          schema_version?: string | null
          submission_endpoint?: string | null
          test_endpoint?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_report_formats_jurisdiction_code_fkey"
            columns: ["jurisdiction_code"]
            isOneToOne: false
            referencedRelation: "regulatory_jurisdictions"
            referencedColumns: ["jurisdiction_code"]
          },
        ]
      }
      regulatory_thresholds: {
        Row: {
          amount_local_currency: number
          amount_usd_equivalent: number | null
          cbn_circular_reference: string | null
          created_at: string
          id: string
          jurisdiction_code: string
          notes: string | null
          reporting_window_hours: number | null
          review_date: string | null
          threshold_type: string
          updated_at: string
        }
        Insert: {
          amount_local_currency: number
          amount_usd_equivalent?: number | null
          cbn_circular_reference?: string | null
          created_at?: string
          id?: string
          jurisdiction_code: string
          notes?: string | null
          reporting_window_hours?: number | null
          review_date?: string | null
          threshold_type: string
          updated_at?: string
        }
        Update: {
          amount_local_currency?: number
          amount_usd_equivalent?: number | null
          cbn_circular_reference?: string | null
          created_at?: string
          id?: string
          jurisdiction_code?: string
          notes?: string | null
          reporting_window_hours?: number | null
          review_date?: string | null
          threshold_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_thresholds_jurisdiction_code_fkey"
            columns: ["jurisdiction_code"]
            isOneToOne: false
            referencedRelation: "regulatory_jurisdictions"
            referencedColumns: ["jurisdiction_code"]
          },
        ]
      }
      roadmap_lead_counter: {
        Row: {
          count: number
          id: boolean
          updated_at: string
        }
        Insert: {
          count?: number
          id?: boolean
          updated_at?: string
        }
        Update: {
          count?: number
          id?: boolean
          updated_at?: string
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
      sanctions_entities: {
        Row: {
          aliases: Json | null
          created_at: string
          date_of_birth: string | null
          entity_name: string
          entity_type: string | null
          id: string
          is_active: boolean
          last_updated: string
          list_date: string | null
          nationality: string | null
          raw_data: Json | null
          reason: string | null
          source: string
          source_ref: string | null
          updated_at: string
        }
        Insert: {
          aliases?: Json | null
          created_at?: string
          date_of_birth?: string | null
          entity_name: string
          entity_type?: string | null
          id?: string
          is_active?: boolean
          last_updated?: string
          list_date?: string | null
          nationality?: string | null
          raw_data?: Json | null
          reason?: string | null
          source: string
          source_ref?: string | null
          updated_at?: string
        }
        Update: {
          aliases?: Json | null
          created_at?: string
          date_of_birth?: string | null
          entity_name?: string
          entity_type?: string | null
          id?: string
          is_active?: boolean
          last_updated?: string
          list_date?: string | null
          nationality?: string | null
          raw_data?: Json | null
          reason?: string | null
          source?: string
          source_ref?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sanctions_meta: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_refreshed_at: string | null
          list_name: string
          record_count: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_refreshed_at?: string | null
          list_name: string
          record_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_refreshed_at?: string | null
          list_name?: string
          record_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      demo_slot_availability: {
        Row: {
          slot_datetime: string | null
          status: string | null
        }
        Insert: {
          slot_datetime?: string | null
          status?: string | null
        }
        Update: {
          slot_datetime?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      screen_entity: {
        Args: { search_name: string; threshold?: number }
        Returns: {
          aliases: Json
          entity_name: string
          entity_type: string
          id: string
          list_date: string
          nationality: string
          reason: string
          score: number
          source: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
