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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ad_variants: {
        Row: {
          ad_content: Json
          ad_type: string
          created_at: string
          id: string
          is_active: boolean
          performance_metrics: Json | null
          template_id: string
          updated_at: string
          variant_name: string
        }
        Insert: {
          ad_content: Json
          ad_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          performance_metrics?: Json | null
          template_id: string
          updated_at?: string
          variant_name: string
        }
        Update: {
          ad_content?: Json
          ad_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          performance_metrics?: Json | null
          template_id?: string
          updated_at?: string
          variant_name?: string
        }
        Relationships: []
      }
      addon_features: {
        Row: {
          addon_id: string
          created_at: string
          feature_text: string
          id: string
          sort_order: number
        }
        Insert: {
          addon_id: string
          created_at?: string
          feature_text: string
          id?: string
          sort_order?: number
        }
        Update: {
          addon_id?: string
          created_at?: string
          feature_text?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "addon_features_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
        ]
      }
      addons: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          price_text: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          name: string
          price_text: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          price_text?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          consultant_id: string
          created_at: string
          id: string
          task_category: string
          title: string
          updated_at: string
        }
        Insert: {
          consultant_id: string
          created_at?: string
          id?: string
          task_category: string
          title: string
          updated_at?: string
        }
        Update: {
          consultant_id?: string
          created_at?: string
          id?: string
          task_category?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          buyer_completed: boolean | null
          consultant_completed: boolean | null
          consultant_id: string
          created_at: string
          id: string
          notes: string | null
          points_spent: number
          scheduled_at: string | null
          service_id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_completed?: boolean | null
          consultant_completed?: boolean | null
          consultant_id: string
          created_at?: string
          id?: string
          notes?: string | null
          points_spent: number
          scheduled_at?: string | null
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_completed?: boolean | null
          consultant_completed?: boolean | null
          consultant_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          points_spent?: number
          scheduled_at?: string | null
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bookings_consultant_id"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_service_id"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_notes: {
        Row: {
          content: string
          context: string | null
          created_at: string
          id: string
          project: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          context?: string | null
          created_at?: string
          id?: string
          project?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          context?: string | null
          created_at?: string
          id?: string
          project?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brain_tasks: {
        Row: {
          context: string | null
          created_at: string
          due: string | null
          id: string
          priority: string | null
          project: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          due?: string | null
          id?: string
          priority?: string | null
          project?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          due?: string | null
          id?: string
          priority?: string | null
          project?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_access_rules: {
        Row: {
          campaign_type: string | null
          created_at: string
          id: string
          is_active: boolean
          max_budget: number | null
          min_budget: number | null
          required_completed_campaigns: number | null
          required_user_tier: string | null
          rule_name: string
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          campaign_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          max_budget?: number | null
          min_budget?: number | null
          required_completed_campaigns?: number | null
          required_user_tier?: string | null
          rule_name: string
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          campaign_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          max_budget?: number | null
          min_budget?: number | null
          required_completed_campaigns?: number | null
          required_user_tier?: string | null
          rule_name?: string
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      campaign_analytics: {
        Row: {
          ad_variant_id: string | null
          campaign_id: string
          clicks: number | null
          conversions: number | null
          cost_spent: number | null
          created_at: string
          date: string
          id: string
          impressions: number | null
          leads_generated: number | null
          template_id: string | null
        }
        Insert: {
          ad_variant_id?: string | null
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          cost_spent?: number | null
          created_at?: string
          date: string
          id?: string
          impressions?: number | null
          leads_generated?: number | null
          template_id?: string | null
        }
        Update: {
          ad_variant_id?: string | null
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          cost_spent?: number | null
          created_at?: string
          date?: string
          id?: string
          impressions?: number | null
          leads_generated?: number | null
          template_id?: string | null
        }
        Relationships: []
      }
      campaign_invitations: {
        Row: {
          accepted_at: string | null
          admin_id: string
          budget_amount: number
          campaign_config: Json
          campaign_id: string | null
          created_at: string
          expires_at: string
          id: string
          invitation_token: string
          is_public: boolean
          status: string
          target_user_id: string
          template_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          admin_id: string
          budget_amount: number
          campaign_config: Json
          campaign_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          is_public?: boolean
          status?: string
          target_user_id: string
          template_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          admin_id?: string
          budget_amount?: number
          campaign_config?: Json
          campaign_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          is_public?: boolean
          status?: string
          target_user_id?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_participants: {
        Row: {
          billing_cycle_day: number | null
          billing_status: string | null
          budget_contribution: number
          campaign_id: string
          consultant_name: string
          conversions: number | null
          id: string
          joined_at: string
          last_billed_date: string | null
          leads_received: number | null
          monthly_budget: number | null
          next_billing_date: string | null
          notes: string | null
          proration_enabled: boolean
          revenue_generated: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle_day?: number | null
          billing_status?: string | null
          budget_contribution: number
          campaign_id: string
          consultant_name: string
          conversions?: number | null
          id?: string
          joined_at?: string
          last_billed_date?: string | null
          leads_received?: number | null
          monthly_budget?: number | null
          next_billing_date?: string | null
          notes?: string | null
          proration_enabled?: boolean
          revenue_generated?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle_day?: number | null
          billing_status?: string | null
          budget_contribution?: number
          campaign_id?: string
          consultant_name?: string
          conversions?: number | null
          id?: string
          joined_at?: string
          last_billed_date?: string | null
          leads_received?: number | null
          monthly_budget?: number | null
          next_billing_date?: string | null
          notes?: string | null
          proration_enabled?: boolean
          revenue_generated?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lead_gen_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_templates: {
        Row: {
          campaign_angle: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          target_audience: string
          template_config: Json
          updated_at: string
        }
        Insert: {
          campaign_angle: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          target_audience: string
          template_config: Json
          updated_at?: string
        }
        Update: {
          campaign_angle?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          target_audience?: string
          template_config?: Json
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      consultants: {
        Row: {
          auto_reply_enabled: boolean | null
          auto_reply_message: string | null
          bio: string | null
          calendar_link: string | null
          cold_calling_rate: number | null
          created_at: string
          expertise_areas: string[] | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          lead_gen_rate: number | null
          service_specialties: string[] | null
          tier: Database["public"]["Enums"]["consultant_tier"]
          updated_at: string
          user_id: string
          va_support_rate: number | null
        }
        Insert: {
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          bio?: string | null
          calendar_link?: string | null
          cold_calling_rate?: number | null
          created_at?: string
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          lead_gen_rate?: number | null
          service_specialties?: string[] | null
          tier?: Database["public"]["Enums"]["consultant_tier"]
          updated_at?: string
          user_id: string
          va_support_rate?: number | null
        }
        Update: {
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          bio?: string | null
          calendar_link?: string | null
          cold_calling_rate?: number | null
          created_at?: string
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          lead_gen_rate?: number | null
          service_specialties?: string[] | null
          tier?: Database["public"]["Enums"]["consultant_tier"]
          updated_at?: string
          user_id?: string
          va_support_rate?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string | null
          manual_archive: boolean | null
          seller_id: string
          service_id: string
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          manual_archive?: boolean | null
          seller_id: string
          service_id: string
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          manual_archive?: boolean | null
          seller_id?: string
          service_id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversations_service_id"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_invitations: {
        Row: {
          accepted_at: string | null
          couple_name: string
          created_at: string
          expires_at: string
          id: string
          invitation_code: string
          invitee_email: string
          inviter_id: string
          location_city: string | null
          location_country: string | null
          status: string | null
          theme_color: string | null
        }
        Insert: {
          accepted_at?: string | null
          couple_name: string
          created_at?: string
          expires_at?: string
          id?: string
          invitation_code?: string
          invitee_email: string
          inviter_id: string
          location_city?: string | null
          location_country?: string | null
          status?: string | null
          theme_color?: string | null
        }
        Update: {
          accepted_at?: string | null
          couple_name?: string
          created_at?: string
          expires_at?: string
          id?: string
          invitation_code?: string
          invitee_email?: string
          inviter_id?: string
          location_city?: string | null
          location_country?: string | null
          status?: string | null
          theme_color?: string | null
        }
        Relationships: []
      }
      couples: {
        Row: {
          anniversary_date: string | null
          couple_name: string
          created_at: string
          custom_hero_image_url: string | null
          id: string
          is_active: boolean | null
          location_city: string | null
          location_country: string | null
          partner1_id: string | null
          partner2_id: string | null
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          anniversary_date?: string | null
          couple_name: string
          created_at?: string
          custom_hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          location_city?: string | null
          location_country?: string | null
          partner1_id?: string | null
          partner2_id?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          anniversary_date?: string | null
          couple_name?: string
          created_at?: string
          custom_hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          location_city?: string | null
          location_country?: string | null
          partner1_id?: string | null
          partner2_id?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_gpt_links: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      flexi_credits_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string | null
          id: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_points_transactions_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_gen_campaigns: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          total_budget: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
          total_budget: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          total_budget?: number
          updated_at?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          couple_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          image_url: string | null
          is_favorite: boolean | null
          location: string | null
          rating: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          couple_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean | null
          location?: string | null
          rating?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          couple_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean | null
          location?: string | null
          rating?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      memory_album_items: {
        Row: {
          added_at: string
          album_id: string
          id: string
          memory_id: string
        }
        Insert: {
          added_at?: string
          album_id: string
          id?: string
          memory_id: string
        }
        Update: {
          added_at?: string
          album_id?: string
          id?: string
          memory_id?: string
        }
        Relationships: []
      }
      memory_albums: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message_text: string
          message_type: Database["public"]["Enums"]["message_type"]
          read_at: string | null
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message_text: string
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message_text?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_conversation_id"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_billing_transactions: {
        Row: {
          amount: number
          billing_date: string
          campaign_id: string
          created_at: string
          id: string
          participant_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_date: string
          campaign_id: string
          created_at?: string
          id?: string
          participant_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_date?: string
          campaign_id?: string
          created_at?: string
          id?: string
          participant_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          addon_details: Json | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string | null
          id: string
          order_number: string
          package_details: Json | null
          payment_method: string | null
          sales_user_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          addon_details?: Json | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_name?: string | null
          id?: string
          order_number?: string
          package_details?: Json | null
          payment_method?: string | null
          sales_user_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          addon_details?: Json | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string | null
          id?: string
          order_number?: string
          package_details?: Json | null
          payment_method?: string | null
          sales_user_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_sales_user_id_fkey"
            columns: ["sales_user_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      package_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      package_features: {
        Row: {
          created_at: string
          feature_text: string
          id: string
          package_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          feature_text: string
          id?: string
          package_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          feature_text?: string
          id?: string
          package_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_features_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          category_id: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          original_price: number | null
          period: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          original_price?: number | null
          period?: string
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          original_price?: number | null
          period?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "package_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string
          id: string
          is_default: boolean | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          couple_id: string | null
          created_at: string
          email: string
          flexi_credits_balance: number
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          partner_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          couple_id?: string | null
          created_at?: string
          email: string
          flexi_credits_balance?: number
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          partner_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          couple_id?: string | null
          created_at?: string
          email?: string
          flexi_credits_balance?: number
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          partner_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          accepted_at: string | null
          addon_details: Json | null
          created_at: string
          created_by: string
          currency: string
          customer_email: string
          customer_name: string | null
          customer_user_id: string | null
          description: string | null
          id: string
          package_details: Json
          sent_at: string | null
          status: string
          title: string
          total_amount: number
          updated_at: string
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          addon_details?: Json | null
          created_at?: string
          created_by: string
          currency?: string
          customer_email: string
          customer_name?: string | null
          customer_user_id?: string | null
          description?: string | null
          id?: string
          package_details: Json
          sent_at?: string | null
          status?: string
          title: string
          total_amount: number
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          addon_details?: Json | null
          created_at?: string
          created_by?: string
          currency?: string
          customer_email?: string
          customer_name?: string | null
          customer_user_id?: string | null
          description?: string | null
          id?: string
          package_details?: Json
          sent_at?: string | null
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviews_booking_id"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          customer_user_id: string
          id: string
          is_active: boolean
          sales_user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          customer_user_id: string
          id?: string
          is_active?: boolean
          sales_user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          customer_user_id?: string
          id?: string
          is_active?: boolean
          sales_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_assignments_customer_user_id_fkey"
            columns: ["customer_user_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_assignments_sales_user_id_fkey"
            columns: ["sales_user_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          consultant_id: string
          created_at: string
          description: string
          duration_minutes: number | null
          excludes: Json | null
          features: Json | null
          id: string
          image_url: string | null
          includes: Json | null
          is_active: boolean
          price: number
          service_tier: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          consultant_id: string
          created_at?: string
          description: string
          duration_minutes?: number | null
          excludes?: Json | null
          features?: Json | null
          id?: string
          image_url?: string | null
          includes?: Json | null
          is_active?: boolean
          price: number
          service_tier?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          consultant_id?: string
          created_at?: string
          description?: string
          duration_minutes?: number | null
          excludes?: Json | null
          features?: Json | null
          id?: string
          image_url?: string | null
          includes?: Json | null
          is_active?: boolean
          price?: number
          service_tier?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_services_category_id"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_consultant_id"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
        ]
      }
      singapore_events: {
        Row: {
          category: string
          created_at: string
          description: string | null
          end_date: string | null
          event_date: string
          external_url: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          location: string | null
          price_info: string | null
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          price_info?: string | null
          source: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          price_info?: string | null
          source?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          credits_per_month: number | null
          email: string
          id: string
          plan_name: string | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          credits_per_month?: number | null
          email: string
          id?: string
          plan_name?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          credits_per_month?: number | null
          email?: string
          id?: string
          plan_name?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          position: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_campaign_permissions: {
        Row: {
          campaign_type: string
          can_manage: boolean
          can_participate: boolean
          can_view: boolean
          created_at: string
          created_by: string | null
          geographic_restrictions: string[] | null
          id: string
          max_budget: number | null
          min_budget: number | null
          target_audience: string
          time_restrictions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_type?: string
          can_manage?: boolean
          can_participate?: boolean
          can_view?: boolean
          created_at?: string
          created_by?: string | null
          geographic_restrictions?: string[] | null
          id?: string
          max_budget?: number | null
          min_budget?: number | null
          target_audience?: string
          time_restrictions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_type?: string
          can_manage?: boolean
          can_participate?: boolean
          can_view?: boolean
          created_at?: string
          created_by?: string | null
          geographic_restrictions?: string[] | null
          id?: string
          max_budget?: number | null
          min_budget?: number | null
          target_audience?: string
          time_restrictions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_group_memberships: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          category: Database["public"]["Enums"]["wishlist_category"]
          committed_at: string | null
          committed_by: string | null
          completed_date: string | null
          couple_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_cost: number | null
          id: string
          intended_for: string | null
          is_private: boolean
          location: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["item_status"]
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["wishlist_category"]
          committed_at?: string | null
          committed_by?: string | null
          completed_date?: string | null
          couple_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          intended_for?: string | null
          is_private?: boolean
          location?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["item_status"]
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["wishlist_category"]
          committed_at?: string | null
          committed_by?: string | null
          completed_date?: string | null
          couple_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          intended_for?: string | null
          is_private?: boolean
          location?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["item_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      upcoming_flexi_charges: {
        Row: {
          amount: number | null
          billing_status: string | null
          campaign_id: string | null
          campaign_name: string | null
          consultant_name: string | null
          days_until_charge: number | null
          due_date: string | null
          is_overdue: boolean | null
          participant_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lead_gen_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_user_profile_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_role: {
        Args: { check_user_id: string }
        Returns: string
      }
      increment_flexi_credits_balance: {
        Args: { credits_to_add: number; user_id: string }
        Returns: undefined
      }
      my_upcoming_flexi_charges: {
        Args: Record<PropertyKey, never>
        Returns: {
          amount: number
          billing_status: string
          campaign_id: string
          campaign_name: string
          consultant_name: string
          days_until_charge: number
          due_date: string
          is_overdue: boolean
          participant_id: string
        }[]
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      consultant_tier: "bronze" | "silver" | "gold" | "platinum"
      conversation_status:
        | "active"
        | "archived"
        | "closed"
        | "waiting_acceptance"
      item_status: "pending" | "completed" | "in_progress"
      message_type: "text" | "system_notification"
      priority_level: "low" | "medium" | "high"
      service_type:
        | "consulting"
        | "cold_calling"
        | "va_support"
        | "lead_generation"
        | "other"
      transaction_type:
        | "purchase"
        | "refund"
        | "admin_credit"
        | "initial_credit"
        | "earning"
      user_role: "user" | "consultant" | "admin" | "sales" | "master_admin"
      wishlist_category:
        | "things_to_do"
        | "places_to_go"
        | "food_to_try"
        | "things_to_buy"
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
      approval_status: ["pending", "approved", "rejected"],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      consultant_tier: ["bronze", "silver", "gold", "platinum"],
      conversation_status: [
        "active",
        "archived",
        "closed",
        "waiting_acceptance",
      ],
      item_status: ["pending", "completed", "in_progress"],
      message_type: ["text", "system_notification"],
      priority_level: ["low", "medium", "high"],
      service_type: [
        "consulting",
        "cold_calling",
        "va_support",
        "lead_generation",
        "other",
      ],
      transaction_type: [
        "purchase",
        "refund",
        "admin_credit",
        "initial_credit",
        "earning",
      ],
      user_role: ["user", "consultant", "admin", "sales", "master_admin"],
      wishlist_category: [
        "things_to_do",
        "places_to_go",
        "food_to_try",
        "things_to_buy",
      ],
    },
  },
} as const
