export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
        Relationships: [
          {
            foreignKeyName: "ad_variants_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "bookings_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_ad_variant_id_fkey"
            columns: ["ad_variant_id"]
            isOneToOne: false
            referencedRelation: "ad_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lead_gen_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_analytics_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
        ]
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
          next_billing_date: string | null
          notes: string | null
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
          next_billing_date?: string | null
          notes?: string | null
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
          next_billing_date?: string | null
          notes?: string | null
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
          created_at: string
          expertise_areas: string[] | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          tier: Database["public"]["Enums"]["consultant_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          bio?: string | null
          calendar_link?: string | null
          created_at?: string
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          tier?: Database["public"]["Enums"]["consultant_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_reply_enabled?: boolean | null
          auto_reply_message?: string | null
          bio?: string | null
          calendar_link?: string | null
          created_at?: string
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          tier?: Database["public"]["Enums"]["consultant_tier"]
          updated_at?: string
          user_id?: string
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
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
          user_id: string | null
        }
        Insert: {
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
          user_id?: string | null
        }
        Update: {
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
          user_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "memory_album_items_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "memory_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_album_items_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
        Relationships: [
          {
            foreignKeyName: "monthly_billing_transactions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "campaign_participants"
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
      points_transactions: {
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
            foreignKeyName: "points_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          points_balance: number
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
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          points_balance?: number
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
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          points_balance?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
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
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          consultant_id: string
          created_at?: string
          description: string
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          consultant_id?: string
          created_at?: string
          description?: string
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_consultant_id_fkey"
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
          completed_date: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          location: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["item_status"]
          target_date: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["wishlist_category"]
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["item_status"]
          target_date?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["wishlist_category"]
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["item_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_points_balance: {
        Args: { user_id: string; points_to_add: number }
        Returns: undefined
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
      transaction_type:
        | "purchase"
        | "refund"
        | "admin_credit"
        | "initial_credit"
        | "earning"
      user_role: "user" | "consultant" | "admin"
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
      transaction_type: [
        "purchase",
        "refund",
        "admin_credit",
        "initial_credit",
        "earning",
      ],
      user_role: ["user", "consultant", "admin"],
      wishlist_category: [
        "things_to_do",
        "places_to_go",
        "food_to_try",
        "things_to_buy",
      ],
    },
  },
} as const
