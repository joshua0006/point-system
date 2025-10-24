

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'sales',
    'user',
    'consultant',
    'master_admin'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."approval_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."approval_status" OWNER TO "postgres";


CREATE TYPE "public"."booking_status" AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE TYPE "public"."consultant_tier" AS ENUM (
    'bronze',
    'silver',
    'gold',
    'platinum'
);


ALTER TYPE "public"."consultant_tier" OWNER TO "postgres";


CREATE TYPE "public"."conversation_status" AS ENUM (
    'active',
    'archived',
    'closed',
    'waiting_acceptance'
);


ALTER TYPE "public"."conversation_status" OWNER TO "postgres";


CREATE TYPE "public"."item_status" AS ENUM (
    'pending',
    'completed',
    'in_progress'
);


ALTER TYPE "public"."item_status" OWNER TO "postgres";


CREATE TYPE "public"."message_type" AS ENUM (
    'text',
    'system_notification'
);


ALTER TYPE "public"."message_type" OWNER TO "postgres";


CREATE TYPE "public"."priority_level" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


CREATE TYPE "public"."service_type" AS ENUM (
    'consulting',
    'cold_calling',
    'va_support',
    'lead_generation',
    'other'
);


ALTER TYPE "public"."service_type" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'purchase',
    'refund',
    'admin_credit',
    'initial_credit',
    'earning',
    'admin_deduction',
    'admin_recurring_deduction'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'user',
    'consultant',
    'admin',
    'sales',
    'master_admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."wishlist_category" AS ENUM (
    'things_to_do',
    'places_to_go',
    'food_to_try',
    'things_to_buy'
);


ALTER TYPE "public"."wishlist_category" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_create_proposal"("creator_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_accounts
    WHERE user_id = auth.uid()
      AND id = creator_id
      AND role = ANY (ARRAY['admin'::user_role, 'sales'::user_role])
      AND is_active = true
  );
$$;


ALTER FUNCTION "public"."can_create_proposal"("creator_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_profile_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role::text FROM public.profiles WHERE user_id::text = (auth.uid())::text LIMIT 1;
$$;


ALTER FUNCTION "public"."current_user_profile_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  order_num TEXT;
BEGIN
  order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  RETURN order_num;
END;
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_stats"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user is admin
  IF NOT (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text])) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Get stats
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_consultants', (SELECT COUNT(*) FROM consultants WHERE is_active = true),
    'active_services', (SELECT COUNT(*) FROM services WHERE is_active = true),
    'active_bookings', (SELECT COUNT(*) FROM bookings WHERE status IN ('pending', 'confirmed'))
  ) INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_admin_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_category_id"("category_slug" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  cat_id UUID;
BEGIN
  SELECT id INTO cat_id FROM package_categories WHERE slug = category_slug LIMIT 1;
  RETURN cat_id;
END;
$$;


ALTER FUNCTION "public"."get_category_id"("category_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("check_user_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role::text FROM public.user_accounts WHERE user_id = check_user_id AND is_active = true;
$$;


ALTER FUNCTION "public"."get_user_role"("check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_roles"("_user_id" "uuid") RETURNS SETOF "public"."app_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;


ALTER FUNCTION "public"."get_user_roles"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Log the new user creation attempt
  RAISE NOTICE 'Creating profile for new user: % (%)', NEW.email, NEW.id;

  -- Attempt to insert the new profile with all required fields
  BEGIN
    INSERT INTO public.profiles (
      user_id,
      email,
      full_name,
      role,
      flexi_credits_balance,
      approval_status
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'user'::user_role,
      0,
      'pending'::approval_status
    );

    RAISE NOTICE 'Profile created successfully for user: %', NEW.email;

  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'Profile already exists for user: %', NEW.email;
    WHEN OTHERS THEN
      -- Log the error details
      RAISE EXCEPTION 'Failed to create profile for user % (%): % - %',
        NEW.email, NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Creates a profile for new users with all required fields. Updated to fix profile missing errors.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user_account"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_accounts (user_id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'user'::public.user_role)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") IS 'Security definer function to safely check user roles without exposing RLS recursion issues.';



CREATE OR REPLACE FUNCTION "public"."increment_flexi_credits_balance"("user_id" "uuid", "credits_to_add" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id uuid := user_id;
  v_credits numeric := round(credits_to_add::numeric, 1);
BEGIN
  UPDATE public.profiles AS p
  SET 
    flexi_credits_balance = round(COALESCE(p.flexi_credits_balance, 0)::numeric + v_credits, 1),
    updated_at = now()
  WHERE p.user_id::text = v_user_id::text;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', v_user_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."increment_flexi_credits_balance"("user_id" "uuid", "credits_to_add" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_package_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  log_description TEXT;
  action_type TEXT;
  v_user_id uuid;
BEGIN
  -- Use auth.uid() if available, otherwise use a system UUID for migrations
  v_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF TG_OP = 'INSERT' THEN
    log_description := 'Created package: ' || NEW.name;
    action_type := 'package_created';
  ELSIF TG_OP = 'UPDATE' THEN
    log_description := 'Updated package: ' || NEW.name;
    action_type := 'package_updated';
  ELSIF TG_OP = 'DELETE' THEN
    log_description := 'Deleted package: ' || OLD.name;
    action_type := 'package_deleted';
  END IF;

  INSERT INTO public.activity_logs (
    user_id,
    action_type,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    v_user_id,
    action_type,
    'package',
    COALESCE(NEW.id, OLD.id),
    log_description,
    jsonb_build_object(
      'package_name', COALESCE(NEW.name, OLD.name),
      'price', COALESCE(NEW.price, OLD.price),
      'operation', TG_OP
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_package_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_proposal_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  log_description TEXT;
  action_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    log_description := 'Created proposal: ' || NEW.title;
    action_type := 'proposal_created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      log_description := 'Changed proposal status: ' || NEW.title || ' to ' || NEW.status;
      action_type := 'proposal_status_changed';
    ELSE
      log_description := 'Updated proposal: ' || NEW.title;
      action_type := 'proposal_updated';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    log_description := 'Deleted proposal: ' || OLD.title;
    action_type := 'proposal_deleted';
  END IF;

  INSERT INTO public.activity_logs (
    user_id,
    action_type,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    COALESCE(NEW.created_by, OLD.created_by),
    action_type,
    'proposal',
    COALESCE(NEW.id, OLD.id),
    log_description,
    jsonb_build_object(
      'proposal_title', COALESCE(NEW.title, OLD.title),
      'customer_email', COALESCE(NEW.customer_email, OLD.customer_email),
      'status', COALESCE(NEW.status, OLD.status),
      'operation', TG_OP
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_proposal_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_upcoming_flexi_charges"() RETURNS TABLE("consultant_name" "text", "amount" integer, "due_date" "date", "billing_status" "text", "campaign_name" "text", "campaign_id" "uuid", "participant_id" "uuid", "days_until_charge" integer, "is_overdue" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    ufc.consultant_name,
    ufc.amount,
    ufc.due_date,
    ufc.billing_status,
    ufc.campaign_name,
    ufc.campaign_id,
    ufc.participant_id,
    ufc.days_until_charge,
    ufc.is_overdue
  FROM upcoming_flexi_charges ufc
  WHERE ufc.user_id = auth.uid()
  ORDER BY ufc.due_date ASC NULLS LAST, ufc.amount DESC;
$$;


ALTER FUNCTION "public"."my_upcoming_flexi_charges"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."round_credits_to_one_decimal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_TABLE_NAME = 'flexi_credits_transactions' THEN
    NEW.amount := round(COALESCE(NEW.amount, 0)::numeric, 1);
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    NEW.flexi_credits_balance := round(COALESCE(NEW.flexi_credits_balance, 0)::numeric, 1);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."round_credits_to_one_decimal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_consultant_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_consultant_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "variant_name" "text" NOT NULL,
    "ad_type" "text" NOT NULL,
    "ad_content" "jsonb" NOT NULL,
    "performance_metrics" "jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ad_variants_ad_type_check" CHECK (("ad_type" = ANY (ARRAY['educational'::"text", 'urgency'::"text", 'benefit'::"text", 'problem_solution'::"text"])))
);


ALTER TABLE "public"."ad_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."addon_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "addon_id" "uuid" NOT NULL,
    "feature_text" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."addon_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."addons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price_text" "text" NOT NULL,
    "description" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."addons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_recurring_deductions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "reason" "text" NOT NULL,
    "day_of_month" integer NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_by" "text" NOT NULL,
    "next_billing_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_recurring_deductions_day_of_month_check" CHECK ((("day_of_month" >= 1) AND ("day_of_month" <= 28))),
    CONSTRAINT "admin_recurring_deductions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."admin_recurring_deductions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_service_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "service_type" "text" NOT NULL,
    "service_level" "text" NOT NULL,
    "monthly_cost" integer NOT NULL,
    "assigned_by" "uuid" NOT NULL,
    "assignment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "next_billing_date" "date" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "campaign_template_id" "uuid",
    "target_audience" "text",
    "campaign_type" "text" DEFAULT 'facebook_ads'::"text",
    "campaign_duration_months" integer DEFAULT 1,
    "campaign_status" "text" DEFAULT 'pending'::"text",
    "campaign_launched_at" timestamp with time zone,
    "campaign_id" "uuid",
    CONSTRAINT "admin_service_assignments_service_type_check" CHECK (("service_type" = ANY (ARRAY['va_support'::"text", 'cold_calling'::"text"]))),
    CONSTRAINT "admin_service_assignments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."admin_service_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_service_billing_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "service_type" "text" NOT NULL,
    "service_level" "text" NOT NULL,
    "amount" integer NOT NULL,
    "billing_date" "date" NOT NULL,
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    CONSTRAINT "admin_service_billing_transactions_status_check" CHECK (("status" = ANY (ARRAY['completed'::"text", 'failed'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."admin_service_billing_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "full_name" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "consultant_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "task_category" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."awarded_credits_unlocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "awarded_credit_id" "uuid" NOT NULL,
    "topup_transaction_id" "uuid" NOT NULL,
    "amount_unlocked" numeric NOT NULL,
    "topup_amount_used" numeric NOT NULL,
    "unlock_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "awarded_credits_unlocks_amount_unlocked_check" CHECK (("amount_unlocked" > (0)::numeric)),
    CONSTRAINT "awarded_credits_unlocks_topup_amount_used_check" CHECK (("topup_amount_used" > (0)::numeric))
);


ALTER TABLE "public"."awarded_credits_unlocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."awarded_flexi_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "locked_amount" numeric DEFAULT 0 NOT NULL,
    "unlocked_amount" numeric DEFAULT 0 NOT NULL,
    "awarded_by" "text" NOT NULL,
    "awarded_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "awarded_flexi_credits_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "awarded_flexi_credits_locked_amount_check" CHECK (("locked_amount" >= (0)::numeric)),
    CONSTRAINT "awarded_flexi_credits_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'fully_unlocked'::"text"]))),
    CONSTRAINT "awarded_flexi_credits_unlocked_amount_check" CHECK (("unlocked_amount" >= (0)::numeric)),
    CONSTRAINT "valid_amounts" CHECK ((("locked_amount" + "unlocked_amount") = "amount"))
);


ALTER TABLE "public"."awarded_flexi_credits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "service_id" "uuid" NOT NULL,
    "consultant_id" "uuid" NOT NULL,
    "status" "public"."booking_status" DEFAULT 'pending'::"public"."booking_status" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "notes" "text",
    "points_spent" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "buyer_completed" boolean DEFAULT false,
    "consultant_completed" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."bookings" REPLICA IDENTITY FULL;


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brain_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "project" "text",
    "tags" "text"[],
    "context" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."brain_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brain_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "due" timestamp with time zone,
    "priority" "text",
    "project" "text",
    "tags" "text"[],
    "status" "text",
    "context" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."brain_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_access_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_name" "text" NOT NULL,
    "target_audience" "text",
    "campaign_type" "text",
    "required_user_tier" "text",
    "required_completed_campaigns" integer DEFAULT 0,
    "min_budget" integer,
    "max_budget" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."campaign_access_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "ad_variant_id" "uuid",
    "date" "date" NOT NULL,
    "impressions" integer DEFAULT 0,
    "clicks" integer DEFAULT 0,
    "conversions" integer DEFAULT 0,
    "cost_spent" integer DEFAULT 0,
    "leads_generated" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."campaign_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "target_user_id" "uuid" NOT NULL,
    "template_id" "uuid" NOT NULL,
    "campaign_config" "jsonb" NOT NULL,
    "budget_amount" integer NOT NULL,
    "invitation_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "campaign_id" "uuid",
    "is_public" boolean DEFAULT false NOT NULL,
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."campaign_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "consultant_name" "text" NOT NULL,
    "budget_contribution" integer NOT NULL,
    "leads_received" integer DEFAULT 0,
    "conversions" integer DEFAULT 0,
    "revenue_generated" integer DEFAULT 0,
    "notes" "text",
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "next_billing_date" "date",
    "billing_status" "text" DEFAULT 'active'::"text",
    "last_billed_date" "date",
    "billing_cycle_day" integer DEFAULT 1,
    "proration_enabled" boolean DEFAULT false NOT NULL,
    "monthly_budget" integer
);

ALTER TABLE ONLY "public"."campaign_participants" REPLICA IDENTITY FULL;


ALTER TABLE "public"."campaign_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "target_audience" "text" NOT NULL,
    "campaign_angle" "text" NOT NULL,
    "template_config" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaign_templates_target_audience_check" CHECK (("target_audience" = ANY (ARRAY['nsf'::"text", 'general'::"text", 'seniors'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."campaign_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."case_studies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "client" "text" NOT NULL,
    "industry" "text" NOT NULL,
    "budget" "text" NOT NULL,
    "duration" "text" NOT NULL,
    "services" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "challenge" "text" NOT NULL,
    "solution" "text" NOT NULL,
    "results" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "testimonial" "jsonb",
    "featured" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "image_url" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."case_studies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consultants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tier" "public"."consultant_tier" DEFAULT 'bronze'::"public"."consultant_tier" NOT NULL,
    "bio" "text",
    "expertise_areas" "text"[],
    "hourly_rate" integer,
    "calendar_link" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "auto_reply_enabled" boolean DEFAULT false,
    "auto_reply_message" "text",
    "service_specialties" "text"[] DEFAULT ARRAY[]::"text"[],
    "cold_calling_rate" integer,
    "va_support_rate" integer,
    "lead_gen_rate" integer
);

ALTER TABLE ONLY "public"."consultants" REPLICA IDENTITY FULL;


ALTER TABLE "public"."consultants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "status" "public"."conversation_status" DEFAULT 'active'::"public"."conversation_status" NOT NULL,
    "last_message_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "manual_archive" boolean DEFAULT false,
    "archived_by" "uuid",
    "archived_at" timestamp with time zone
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couple_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inviter_id" "text" NOT NULL,
    "invitee_email" "text" NOT NULL,
    "invitation_code" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "couple_name" "text" NOT NULL,
    "location_city" "text" DEFAULT 'New York'::"text",
    "location_country" "text" DEFAULT 'United States'::"text",
    "theme_color" "text" DEFAULT 'romantic'::"text",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    CONSTRAINT "couple_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'expired'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."couple_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couples" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner1_id" "text",
    "partner2_id" "text",
    "couple_name" "text" NOT NULL,
    "location_city" "text" DEFAULT 'New York'::"text",
    "location_country" "text" DEFAULT 'United States'::"text",
    "anniversary_date" "date",
    "theme_color" "text" DEFAULT 'romantic'::"text",
    "custom_hero_image_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."couples" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_gpt_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "url" "text" NOT NULL,
    "description" "text",
    "icon_name" "text" DEFAULT 'Bot'::"text",
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."custom_gpt_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flexi_credits_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "amount" numeric(12,1) NOT NULL,
    "description" "text",
    "booking_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."flexi_credits_transactions" REPLICA IDENTITY FULL;


ALTER TABLE "public"."flexi_credits_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_gen_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "total_budget" integer NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lead_gen_campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'closed'::"text", 'completed'::"text"])))
);

ALTER TABLE ONLY "public"."lead_gen_campaigns" REPLICA IDENTITY FULL;


ALTER TABLE "public"."lead_gen_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "location" "text",
    "image_url" "text",
    "date" "date" NOT NULL,
    "rating" integer,
    "tags" "text"[],
    "is_favorite" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "couple_id" "uuid",
    CONSTRAINT "memories_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."memories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memory_album_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "memory_id" "uuid" NOT NULL,
    "album_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."memory_album_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memory_albums" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "cover_image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."memory_albums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "message_text" "text" NOT NULL,
    "message_type" "public"."message_type" DEFAULT 'text'::"public"."message_type" NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monthly_billing_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "billing_date" "date" NOT NULL,
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."monthly_billing_transactions" REPLICA IDENTITY FULL;


ALTER TABLE "public"."monthly_billing_transactions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."order_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."order_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "customer_email" "text" NOT NULL,
    "customer_name" "text",
    "order_number" "text" DEFAULT "public"."generate_order_number"() NOT NULL,
    "total_amount" integer NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payment_method" "text",
    "stripe_session_id" "text",
    "stripe_payment_intent_id" "text",
    "package_details" "jsonb",
    "addon_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sales_user_id" "uuid"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."package_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "parent_category_id" "uuid"
);


ALTER TABLE "public"."package_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."package_feature_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "package_feature_id" "uuid" NOT NULL,
    "item_text" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."package_feature_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."package_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "package_id" "uuid" NOT NULL,
    "feature_text" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."package_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "original_price" integer,
    "price" integer,
    "period" "text" DEFAULT 'month'::"text" NOT NULL,
    "description" "text" NOT NULL,
    "is_popular" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_custom" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_payment_method_id" "text" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "card_brand" "text",
    "card_last4" "text",
    "card_exp_month" integer,
    "card_exp_year" integer,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portfolio_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "client_name" "text",
    "project_type" "text" NOT NULL,
    "image_url" "text",
    "results_metrics" "jsonb",
    "tags" "text"[],
    "featured" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."portfolio_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role" NOT NULL,
    "flexi_credits_balance" numeric(12,1) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bio" "text",
    "approval_status" "public"."approval_status" DEFAULT 'pending'::"public"."approval_status" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "couple_id" "uuid",
    "partner_name" "text",
    "onboarding_completed" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."profiles" REPLICA IDENTITY FULL;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "customer_email" "text" NOT NULL,
    "customer_name" "text",
    "customer_user_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "package_details" "jsonb" NOT NULL,
    "addon_details" "jsonb",
    "total_amount" integer NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "valid_until" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "viewed_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "share_token" "uuid" DEFAULT "gen_random_uuid"(),
    "proposal_content" "jsonb"
);


ALTER TABLE "public"."proposals" OWNER TO "postgres";


COMMENT ON COLUMN "public"."proposals"."proposal_content" IS 'Stores the complete proposal sections including summary, objectives, scope, timeline, etc.';



CREATE TABLE IF NOT EXISTS "public"."reimbursement_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "merchant" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "description" "text",
    "receipt_urls" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reimbursement_requests_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "reimbursement_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."reimbursement_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "reviewee_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);

ALTER TABLE ONLY "public"."reviews" REPLICA IDENTITY FULL;


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_user_id" "uuid" NOT NULL,
    "customer_user_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_by" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "status" "text" DEFAULT 'lead'::"text" NOT NULL,
    "notes" "text",
    CONSTRAINT "sales_assignments_status_check" CHECK (("status" = ANY (ARRAY['lead'::"text", 'prospect'::"text", 'active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."sales_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "consultant_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "price" integer NOT NULL,
    "duration_minutes" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "image_url" "text",
    "service_type" "public"."service_type" DEFAULT 'consulting'::"public"."service_type",
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "includes" "jsonb" DEFAULT '[]'::"jsonb",
    "excludes" "jsonb" DEFAULT '[]'::"jsonb",
    "service_tier" "text" DEFAULT 'standard'::"text"
);

ALTER TABLE ONLY "public"."services" REPLICA IDENTITY FULL;


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."singapore_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "event_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "location" "text",
    "category" "text" NOT NULL,
    "image_url" "text",
    "source" "text" NOT NULL,
    "external_url" "text",
    "price_info" "text",
    "is_featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."singapore_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "stripe_customer_id" "text",
    "subscribed" boolean DEFAULT false NOT NULL,
    "subscription_tier" "text",
    "subscription_end" timestamp with time zone,
    "plan_name" "text",
    "credits_per_month" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscribers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."upcoming_flexi_charges" AS
 SELECT "cp"."user_id",
    "cp"."consultant_name",
    "cp"."monthly_budget" AS "amount",
    "cp"."next_billing_date" AS "due_date",
    "cp"."billing_status",
    "lgc"."name" AS "campaign_name",
    "cp"."campaign_id",
    "cp"."id" AS "participant_id",
        CASE
            WHEN ("cp"."next_billing_date" IS NULL) THEN NULL::integer
            WHEN ("cp"."next_billing_date" <= CURRENT_DATE) THEN 0
            ELSE ("cp"."next_billing_date" - CURRENT_DATE)
        END AS "days_until_charge",
        CASE
            WHEN ("cp"."next_billing_date" IS NULL) THEN false
            ELSE ("cp"."next_billing_date" <= CURRENT_DATE)
        END AS "is_overdue"
   FROM ("public"."campaign_participants" "cp"
     LEFT JOIN "public"."lead_gen_campaigns" "lgc" ON (("cp"."campaign_id" = "lgc"."id")))
  WHERE (("cp"."billing_status" = 'active'::"text") AND ("cp"."monthly_budget" IS NOT NULL) AND ("cp"."monthly_budget" > 0) AND ("cp"."next_billing_date" IS NOT NULL));


ALTER VIEW "public"."upcoming_flexi_charges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "avatar_url" "text",
    "phone" "text",
    "company" "text",
    "position" "text",
    "has_completed_tutorial" boolean DEFAULT false
);


ALTER TABLE "public"."user_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_campaign_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "can_view" boolean DEFAULT true NOT NULL,
    "can_participate" boolean DEFAULT true NOT NULL,
    "can_manage" boolean DEFAULT false NOT NULL,
    "min_budget" integer,
    "max_budget" integer,
    "geographic_restrictions" "text"[],
    "time_restrictions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "target_audience" "text" DEFAULT 'general'::"text" NOT NULL,
    "campaign_type" "text" DEFAULT 'lead_generation'::"text" NOT NULL
);


ALTER TABLE "public"."user_campaign_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_group_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "group_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_by" "uuid"
);


ALTER TABLE "public"."user_group_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role" NOT NULL,
    "full_name" "text",
    "invited_by" "uuid",
    "invitation_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "user_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."user_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_roles" IS 'Secure role storage table. Roles must be checked using has_role() function to prevent privilege escalation attacks.';



CREATE TABLE IF NOT EXISTS "public"."wishlist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "public"."wishlist_category" NOT NULL,
    "status" "public"."item_status" DEFAULT 'pending'::"public"."item_status" NOT NULL,
    "priority" "public"."priority_level" DEFAULT 'medium'::"public"."priority_level" NOT NULL,
    "notes" "text",
    "location" "text",
    "estimated_cost" integer,
    "target_date" "date",
    "completed_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "couple_id" "uuid",
    "created_by" "text",
    "intended_for" "text",
    "is_private" boolean DEFAULT false NOT NULL,
    "committed_by" "text",
    "committed_at" timestamp with time zone
);


ALTER TABLE "public"."wishlist_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ad_variants"
    ADD CONSTRAINT "ad_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."addon_features"
    ADD CONSTRAINT "addon_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."addons"
    ADD CONSTRAINT "addons_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."addons"
    ADD CONSTRAINT "addons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_recurring_deductions"
    ADD CONSTRAINT "admin_recurring_deductions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_service_assignments"
    ADD CONSTRAINT "admin_service_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_service_assignments"
    ADD CONSTRAINT "admin_service_assignments_user_id_service_type_key" UNIQUE ("user_id", "service_type");



ALTER TABLE ONLY "public"."admin_service_billing_transactions"
    ADD CONSTRAINT "admin_service_billing_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."awarded_credits_unlocks"
    ADD CONSTRAINT "awarded_credits_unlocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."awarded_credits_unlocks"
    ADD CONSTRAINT "awarded_credits_unlocks_topup_transaction_id_awarded_credit_key" UNIQUE ("topup_transaction_id", "awarded_credit_id");



ALTER TABLE ONLY "public"."awarded_flexi_credits"
    ADD CONSTRAINT "awarded_flexi_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brain_notes"
    ADD CONSTRAINT "brain_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brain_tasks"
    ADD CONSTRAINT "brain_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_access_rules"
    ADD CONSTRAINT "campaign_access_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_analytics"
    ADD CONSTRAINT "campaign_analytics_campaign_id_ad_variant_id_date_key" UNIQUE ("campaign_id", "ad_variant_id", "date");



ALTER TABLE ONLY "public"."campaign_analytics"
    ADD CONSTRAINT "campaign_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_invitations"
    ADD CONSTRAINT "campaign_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_participants"
    ADD CONSTRAINT "campaign_participants_campaign_id_user_id_key" UNIQUE ("campaign_id", "user_id");



ALTER TABLE ONLY "public"."campaign_participants"
    ADD CONSTRAINT "campaign_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_templates"
    ADD CONSTRAINT "campaign_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."case_studies"
    ADD CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultants"
    ADD CONSTRAINT "consultants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultants"
    ADD CONSTRAINT "consultants_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couple_invitations"
    ADD CONSTRAINT "couple_invitations_invitation_code_key" UNIQUE ("invitation_code");



ALTER TABLE ONLY "public"."couple_invitations"
    ADD CONSTRAINT "couple_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couples"
    ADD CONSTRAINT "couples_partner1_id_partner2_id_key" UNIQUE ("partner1_id", "partner2_id");



ALTER TABLE ONLY "public"."couples"
    ADD CONSTRAINT "couples_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_gpt_links"
    ADD CONSTRAINT "custom_gpt_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_gen_campaigns"
    ADD CONSTRAINT "lead_gen_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memories"
    ADD CONSTRAINT "memories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memory_album_items"
    ADD CONSTRAINT "memory_album_items_memory_id_album_id_key" UNIQUE ("memory_id", "album_id");



ALTER TABLE ONLY "public"."memory_album_items"
    ADD CONSTRAINT "memory_album_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memory_albums"
    ADD CONSTRAINT "memory_albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_billing_transactions"
    ADD CONSTRAINT "monthly_billing_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."package_categories"
    ADD CONSTRAINT "package_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."package_categories"
    ADD CONSTRAINT "package_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."package_categories"
    ADD CONSTRAINT "package_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."package_feature_items"
    ADD CONSTRAINT "package_feature_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."package_features"
    ADD CONSTRAINT "package_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flexi_credits_transactions"
    ADD CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portfolio_items"
    ADD CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reimbursement_requests"
    ADD CONSTRAINT "reimbursement_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_assignments"
    ADD CONSTRAINT "sales_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_assignments"
    ADD CONSTRAINT "sales_assignments_sales_user_id_customer_user_id_key" UNIQUE ("sales_user_id", "customer_user_id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."singapore_events"
    ADD CONSTRAINT "singapore_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_accounts"
    ADD CONSTRAINT "user_accounts_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_accounts"
    ADD CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_accounts"
    ADD CONSTRAINT "user_accounts_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_campaign_permissions"
    ADD CONSTRAINT "user_campaign_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_campaign_permissions"
    ADD CONSTRAINT "user_campaign_permissions_user_id_target_audience_campaign_type" UNIQUE ("user_id", "target_audience", "campaign_type");



ALTER TABLE ONLY "public"."user_group_memberships"
    ADD CONSTRAINT "user_group_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_group_memberships"
    ADD CONSTRAINT "user_group_memberships_user_id_group_id_key" UNIQUE ("user_id", "group_id");



ALTER TABLE ONLY "public"."user_groups"
    ADD CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_email_status_key" UNIQUE ("email", "status");



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_logs_created_at" ON "public"."activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activity_logs_entity" ON "public"."activity_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_activity_logs_user_id" ON "public"."activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_admin_service_assignments_campaign_id" ON "public"."admin_service_assignments" USING "btree" ("campaign_id");



CREATE INDEX "idx_admin_service_assignments_campaign_template" ON "public"."admin_service_assignments" USING "btree" ("campaign_template_id");



CREATE INDEX "idx_ai_conversations_consultant_id" ON "public"."ai_conversations" USING "btree" ("consultant_id");



CREATE INDEX "idx_ai_conversations_created_at" ON "public"."ai_conversations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ai_messages_conversation_id" ON "public"."ai_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_ai_messages_created_at" ON "public"."ai_messages" USING "btree" ("created_at");



CREATE INDEX "idx_awarded_credits_expires_at" ON "public"."awarded_flexi_credits" USING "btree" ("expires_at");



CREATE INDEX "idx_awarded_credits_status" ON "public"."awarded_flexi_credits" USING "btree" ("status");



CREATE INDEX "idx_awarded_credits_user_id" ON "public"."awarded_flexi_credits" USING "btree" ("user_id");



CREATE INDEX "idx_brain_notes_project" ON "public"."brain_notes" USING "btree" ("project");



CREATE INDEX "idx_brain_notes_user_id" ON "public"."brain_notes" USING "btree" ("user_id");



CREATE INDEX "idx_brain_tasks_project" ON "public"."brain_tasks" USING "btree" ("project");



CREATE INDEX "idx_brain_tasks_status" ON "public"."brain_tasks" USING "btree" ("status");



CREATE INDEX "idx_brain_tasks_user_id" ON "public"."brain_tasks" USING "btree" ("user_id");



CREATE INDEX "idx_campaign_invitations_status" ON "public"."campaign_invitations" USING "btree" ("status");



CREATE INDEX "idx_campaign_invitations_target_user" ON "public"."campaign_invitations" USING "btree" ("target_user_id");



CREATE INDEX "idx_campaign_invitations_token" ON "public"."campaign_invitations" USING "btree" ("invitation_token");



CREATE INDEX "idx_campaign_participants_campaign_id" ON "public"."campaign_participants" USING "btree" ("campaign_id");



CREATE INDEX "idx_conversations_buyer_id" ON "public"."conversations" USING "btree" ("buyer_id");



CREATE INDEX "idx_conversations_seller_id" ON "public"."conversations" USING "btree" ("seller_id");



CREATE INDEX "idx_conversations_service_id" ON "public"."conversations" USING "btree" ("service_id");



CREATE INDEX "idx_feature_items_feature_id" ON "public"."package_feature_items" USING "btree" ("package_feature_id");



CREATE INDEX "idx_feature_items_sort_order" ON "public"."package_feature_items" USING "btree" ("sort_order");



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_package_categories_parent" ON "public"."package_categories" USING "btree" ("parent_category_id");



CREATE UNIQUE INDEX "idx_payment_methods_default_per_user" ON "public"."payment_methods" USING "btree" ("user_id") WHERE ("is_default" = true);



CREATE INDEX "idx_recurring_deductions_next_billing" ON "public"."admin_recurring_deductions" USING "btree" ("next_billing_date") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_recurring_deductions_user_status" ON "public"."admin_recurring_deductions" USING "btree" ("user_id", "status");



CREATE INDEX "idx_singapore_events_category" ON "public"."singapore_events" USING "btree" ("category");



CREATE INDEX "idx_singapore_events_date" ON "public"."singapore_events" USING "btree" ("event_date");



CREATE INDEX "idx_subscribers_email" ON "public"."subscribers" USING "btree" ("email");



CREATE INDEX "idx_subscribers_user_id" ON "public"."subscribers" USING "btree" ("user_id");



CREATE INDEX "idx_unlocks_awarded_credit_id" ON "public"."awarded_credits_unlocks" USING "btree" ("awarded_credit_id");



CREATE INDEX "idx_unlocks_user_id" ON "public"."awarded_credits_unlocks" USING "btree" ("user_id");



CREATE INDEX "idx_user_accounts_tutorial" ON "public"."user_accounts" USING "btree" ("user_id", "has_completed_tutorial");



CREATE INDEX "idx_user_invitations_email" ON "public"."user_invitations" USING "btree" ("email");



CREATE INDEX "idx_user_invitations_status" ON "public"."user_invitations" USING "btree" ("status");



CREATE INDEX "idx_user_invitations_token" ON "public"."user_invitations" USING "btree" ("invitation_token");



CREATE INDEX "idx_wishlist_items_couple" ON "public"."wishlist_items" USING "btree" ("couple_id");



CREATE INDEX "idx_wishlist_items_created_by" ON "public"."wishlist_items" USING "btree" ("created_by");



CREATE INDEX "idx_wishlist_items_intended_for" ON "public"."wishlist_items" USING "btree" ("intended_for");



CREATE UNIQUE INDEX "portfolio_items_slug_idx" ON "public"."portfolio_items" USING "btree" ("slug");



CREATE UNIQUE INDEX "proposals_share_token_idx" ON "public"."proposals" USING "btree" ("share_token");



CREATE UNIQUE INDEX "ux_brain_notes_user_title_project" ON "public"."brain_notes" USING "btree" ("user_id", "title", "project");



CREATE UNIQUE INDEX "ux_brain_tasks_user_title_project" ON "public"."brain_tasks" USING "btree" ("user_id", "title", "project");



CREATE OR REPLACE TRIGGER "trg_round_flexi_credits_transactions" BEFORE INSERT OR UPDATE ON "public"."flexi_credits_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."round_credits_to_one_decimal"();



CREATE OR REPLACE TRIGGER "trg_round_profiles_flexi_credits_balance" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."round_credits_to_one_decimal"();



CREATE OR REPLACE TRIGGER "trigger_log_package_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."packages" FOR EACH ROW EXECUTE FUNCTION "public"."log_package_change"();



CREATE OR REPLACE TRIGGER "trigger_log_proposal_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."proposals" FOR EACH ROW EXECUTE FUNCTION "public"."log_proposal_change"();



CREATE OR REPLACE TRIGGER "update_ad_variants_updated_at" BEFORE UPDATE ON "public"."ad_variants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_addons_updated_at" BEFORE UPDATE ON "public"."addons" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_admin_service_assignments_updated_at" BEFORE UPDATE ON "public"."admin_service_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_admin_users_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_conversations_updated_at" BEFORE UPDATE ON "public"."ai_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_awarded_credits_updated_at" BEFORE UPDATE ON "public"."awarded_flexi_credits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_brain_notes_updated_at" BEFORE UPDATE ON "public"."brain_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_brain_tasks_updated_at" BEFORE UPDATE ON "public"."brain_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_campaign_access_rules_updated_at" BEFORE UPDATE ON "public"."campaign_access_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_campaign_invitations_updated_at" BEFORE UPDATE ON "public"."campaign_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_campaign_participants_updated_at" BEFORE UPDATE ON "public"."campaign_participants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_campaign_templates_updated_at" BEFORE UPDATE ON "public"."campaign_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_case_studies_updated_at" BEFORE UPDATE ON "public"."case_studies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_consultants_updated_at" BEFORE UPDATE ON "public"."consultants" FOR EACH ROW EXECUTE FUNCTION "public"."update_consultant_updated_at"();



CREATE OR REPLACE TRIGGER "update_conversation_on_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_last_message"();



CREATE OR REPLACE TRIGGER "update_couples_updated_at" BEFORE UPDATE ON "public"."couples" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_custom_gpt_links_updated_at" BEFORE UPDATE ON "public"."custom_gpt_links" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_lead_gen_campaigns_updated_at" BEFORE UPDATE ON "public"."lead_gen_campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_memories_updated_at" BEFORE UPDATE ON "public"."memories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_memory_albums_updated_at" BEFORE UPDATE ON "public"."memory_albums" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_monthly_billing_transactions_updated_at" BEFORE UPDATE ON "public"."monthly_billing_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_package_categories_updated_at" BEFORE UPDATE ON "public"."package_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_package_feature_items_updated_at" BEFORE UPDATE ON "public"."package_feature_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_packages_updated_at" BEFORE UPDATE ON "public"."packages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payment_methods_updated_at" BEFORE UPDATE ON "public"."payment_methods" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_portfolio_items_updated_at" BEFORE UPDATE ON "public"."portfolio_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_proposals_updated_at" BEFORE UPDATE ON "public"."proposals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_recurring_deductions_updated_at" BEFORE UPDATE ON "public"."admin_recurring_deductions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reimbursement_requests_updated_at" BEFORE UPDATE ON "public"."reimbursement_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reviews_updated_at" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_services_updated_at" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_singapore_events_updated_at" BEFORE UPDATE ON "public"."singapore_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_accounts_updated_at" BEFORE UPDATE ON "public"."user_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_campaign_permissions_updated_at" BEFORE UPDATE ON "public"."user_campaign_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_groups_updated_at" BEFORE UPDATE ON "public"."user_groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_wishlist_items_updated_at" BEFORE UPDATE ON "public"."wishlist_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_accounts"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."addon_features"
    ADD CONSTRAINT "addon_features_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_service_assignments"
    ADD CONSTRAINT "admin_service_assignments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."lead_gen_campaigns"("id");



ALTER TABLE ONLY "public"."admin_service_assignments"
    ADD CONSTRAINT "admin_service_assignments_campaign_template_id_fkey" FOREIGN KEY ("campaign_template_id") REFERENCES "public"."campaign_templates"("id");



ALTER TABLE ONLY "public"."admin_service_billing_transactions"
    ADD CONSTRAINT "admin_service_billing_transactions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."admin_service_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."awarded_credits_unlocks"
    ADD CONSTRAINT "awarded_credits_unlocks_awarded_credit_id_fkey" FOREIGN KEY ("awarded_credit_id") REFERENCES "public"."awarded_flexi_credits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."awarded_credits_unlocks"
    ADD CONSTRAINT "awarded_credits_unlocks_topup_transaction_id_fkey" FOREIGN KEY ("topup_transaction_id") REFERENCES "public"."flexi_credits_transactions"("id");



ALTER TABLE ONLY "public"."awarded_credits_unlocks"
    ADD CONSTRAINT "awarded_credits_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."awarded_flexi_credits"
    ADD CONSTRAINT "awarded_flexi_credits_awarded_by_fkey" FOREIGN KEY ("awarded_by") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."awarded_flexi_credits"
    ADD CONSTRAINT "awarded_flexi_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_participants"
    ADD CONSTRAINT "campaign_participants_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."lead_gen_campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_gpt_links"
    ADD CONSTRAINT "custom_gpt_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "fk_bookings_consultant_id" FOREIGN KEY ("consultant_id") REFERENCES "public"."consultants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "fk_bookings_service_id" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "fk_conversations_service_id" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "fk_messages_conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flexi_credits_transactions"
    ADD CONSTRAINT "fk_points_transactions_booking_id" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "fk_reviews_booking_id" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "fk_services_category_id" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "fk_services_consultant_id" FOREIGN KEY ("consultant_id") REFERENCES "public"."consultants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_sales_user_id_fkey" FOREIGN KEY ("sales_user_id") REFERENCES "public"."user_accounts"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."package_categories"
    ADD CONSTRAINT "package_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "public"."package_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."package_feature_items"
    ADD CONSTRAINT "package_feature_items_package_feature_id_fkey" FOREIGN KEY ("package_feature_id") REFERENCES "public"."package_features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."package_features"
    ADD CONSTRAINT "package_features_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."package_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_accounts"("id");



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reimbursement_requests"
    ADD CONSTRAINT "reimbursement_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."reimbursement_requests"
    ADD CONSTRAINT "reimbursement_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_assignments"
    ADD CONSTRAINT "sales_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."user_accounts"("id");



ALTER TABLE ONLY "public"."sales_assignments"
    ADD CONSTRAINT "sales_assignments_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "public"."user_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_assignments"
    ADD CONSTRAINT "sales_assignments_sales_user_id_fkey" FOREIGN KEY ("sales_user_id") REFERENCES "public"."user_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_accounts"
    ADD CONSTRAINT "user_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_accounts"("id");



ALTER TABLE ONLY "public"."user_accounts"
    ADD CONSTRAINT "user_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins and sales can manage package categories" ON "public"."package_categories" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text", 'master_admin'::"text"]))) WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins and sales can manage package features" ON "public"."package_features" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text", 'master_admin'::"text"]))) WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins and sales can manage packages" ON "public"."packages" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text", 'master_admin'::"text"]))) WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins and sales can update orders" ON "public"."orders" FOR UPDATE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text"])));



CREATE POLICY "Admins and sales can view all activity logs" ON "public"."activity_logs" FOR SELECT TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text"])));



CREATE POLICY "Admins can delete consultants" ON "public"."consultants" FOR DELETE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can delete roles" ON "public"."user_roles" FOR DELETE TO "authenticated" USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR "public"."has_role"("auth"."uid"(), 'master_admin'::"public"."app_role")));



CREATE POLICY "Admins can delete services" ON "public"."services" FOR DELETE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can insert accounts" ON "public"."user_accounts" FOR INSERT WITH CHECK (("public"."get_user_role"("auth"."uid"()) = 'admin'::"text"));



CREATE POLICY "Admins can insert awarded credits" ON "public"."awarded_flexi_credits" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = ("auth"."uid"())::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'master_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can insert consultants" ON "public"."consultants" FOR INSERT WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can insert roles" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR "public"."has_role"("auth"."uid"(), 'master_admin'::"public"."app_role")));



CREATE POLICY "Admins can insert services" ON "public"."services" FOR INSERT WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can manage addon features" ON "public"."addon_features" USING (true) WITH CHECK (true);



CREATE POLICY "Admins can manage addons" ON "public"."addons" USING (true) WITH CHECK (true);



CREATE POLICY "Admins can manage all assignments" ON "public"."sales_assignments" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"text"));



CREATE POLICY "Admins can manage custom GPT links" ON "public"."custom_gpt_links" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = ("auth"."uid"())::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'master_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can manage invitations" ON "public"."user_invitations" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"]))) WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can manage recurring deductions" ON "public"."admin_recurring_deductions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = ("auth"."uid"())::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'master_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can manage service assignments" ON "public"."admin_service_assignments" TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"]))) WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can update all accounts" ON "public"."user_accounts" FOR UPDATE USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"text"));



CREATE POLICY "Admins can update all reimbursement requests" ON "public"."reimbursement_requests" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = ("auth"."uid"())::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'master_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can update consultants" ON "public"."consultants" FOR UPDATE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can update roles" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR "public"."has_role"("auth"."uid"(), 'master_admin'::"public"."app_role")));



CREATE POLICY "Admins can update services" ON "public"."services" FOR UPDATE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can view admin users" ON "public"."admin_users" FOR SELECT USING (true);



CREATE POLICY "Admins can view all accounts" ON "public"."user_accounts" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"text"));



CREATE POLICY "Admins can view all awarded credits" ON "public"."awarded_flexi_credits" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = ("auth"."uid"())::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'master_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can view all billing transactions" ON "public"."monthly_billing_transactions" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can view all bookings" ON "public"."bookings" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can view all campaign participants" ON "public"."campaign_participants" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can view all campaigns" ON "public"."lead_gen_campaigns" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can view all consultants" ON "public"."consultants" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can view all flexi credit transactions" ON "public"."flexi_credits_transactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = ("auth"."uid"())::"text") AND ("p"."role" = ANY (ARRAY['admin'::"public"."user_role", 'master_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can view all orders" ON "public"."orders" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"text"));



CREATE POLICY "Admins can view all reimbursement requests" ON "public"."reimbursement_requests" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = ("auth"."uid"())::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'master_admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can view all service billing transactions" ON "public"."admin_service_billing_transactions" FOR SELECT TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can view all services" ON "public"."services" FOR SELECT USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'master_admin'::"text"])));



CREATE POLICY "Admins can view all unlocks" ON "public"."awarded_credits_unlocks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = ("auth"."uid"())::"text") AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'master_admin'::"public"."user_role"]))))));



CREATE POLICY "Allow admin signup" ON "public"."admin_users" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow authenticated users to manage feature items" ON "public"."package_feature_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow couple creation" ON "public"."couples" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow invitation creation" ON "public"."couple_invitations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow profile creation" ON "public"."profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access to feature items" ON "public"."package_feature_items" FOR SELECT USING (true);



CREATE POLICY "Anyone can create orders" ON "public"."orders" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view active addons" ON "public"."addons" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active case studies" ON "public"."case_studies" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active custom GPT links" ON "public"."custom_gpt_links" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active package categories" ON "public"."package_categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active packages" ON "public"."packages" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active portfolio items" ON "public"."portfolio_items" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view addon features" ON "public"."addon_features" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."addons" "a"
  WHERE (("a"."id" = "addon_features"."addon_id") AND ("a"."is_active" = true)))));



CREATE POLICY "Anyone can view package features" ON "public"."package_features" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."packages" "p"
  WHERE (("p"."id" = "package_features"."package_id") AND ("p"."is_active" = true)))));



CREATE POLICY "Authenticated users can insert their own activity logs" ON "public"."activity_logs" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Customers can view proposals sent to them" ON "public"."proposals" FOR SELECT USING (("auth"."uid"() = "customer_user_id"));



CREATE POLICY "Customers can view their assignments" ON "public"."sales_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_accounts" "ua"
  WHERE (("ua"."user_id" = "auth"."uid"()) AND ("ua"."id" = "sales_assignments"."customer_user_id") AND ("ua"."role" = 'user'::"public"."user_role")))));



CREATE POLICY "Public access to invitations for join flow" ON "public"."couple_invitations" FOR SELECT USING (true);



CREATE POLICY "Public can delete memories" ON "public"."memories" FOR DELETE USING (true);



CREATE POLICY "Public can delete wishlist items" ON "public"."wishlist_items" FOR DELETE USING (true);



CREATE POLICY "Public can insert memories" ON "public"."memories" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can insert wishlist items" ON "public"."wishlist_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can update memories" ON "public"."memories" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Public can update wishlist items" ON "public"."wishlist_items" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Public can view active campaign templates" ON "public"."campaign_templates" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view memories" ON "public"."memories" FOR SELECT USING (true);



CREATE POLICY "Public can view proposals with valid share token" ON "public"."proposals" FOR SELECT TO "authenticated", "anon" USING (("share_token" IS NOT NULL));



CREATE POLICY "Public can view wishlist items" ON "public"."wishlist_items" FOR SELECT USING (true);



CREATE POLICY "Sales and admins can delete case studies" ON "public"."case_studies" FOR DELETE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text"])));



CREATE POLICY "Sales and admins can delete portfolio items" ON "public"."portfolio_items" FOR DELETE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text"])));



CREATE POLICY "Sales and admins can insert case studies" ON "public"."case_studies" FOR INSERT WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text"])));



CREATE POLICY "Sales and admins can insert portfolio items" ON "public"."portfolio_items" FOR INSERT WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text"])));



CREATE POLICY "Sales and admins can update case studies" ON "public"."case_studies" FOR UPDATE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text"])));



CREATE POLICY "Sales and admins can update portfolio items" ON "public"."portfolio_items" FOR UPDATE USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text"])));



CREATE POLICY "Sales can create proposals" ON "public"."proposals" FOR INSERT WITH CHECK ("public"."can_create_proposal"("created_by"));



CREATE POLICY "Sales can create their own assignments" ON "public"."sales_assignments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_accounts" "ua"
  WHERE (("ua"."user_id" = "auth"."uid"()) AND ("ua"."id" = "sales_assignments"."sales_user_id") AND ("ua"."role" = ANY (ARRAY['admin'::"public"."user_role", 'sales'::"public"."user_role"])) AND ("ua"."is_active" = true)))));



CREATE POLICY "Sales can deactivate their own assignments" ON "public"."sales_assignments" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_accounts" "ua"
  WHERE (("ua"."user_id" = "auth"."uid"()) AND ("ua"."id" = "sales_assignments"."sales_user_id") AND ("ua"."role" = ANY (ARRAY['admin'::"public"."user_role", 'sales'::"public"."user_role"])) AND ("ua"."is_active" = true)))));



CREATE POLICY "Sales can insert customer accounts" ON "public"."user_accounts" FOR INSERT TO "authenticated" WITH CHECK ((("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text"])) AND ("role" = 'user'::"public"."user_role")));



CREATE POLICY "Sales can update their own assignments" ON "public"."sales_assignments" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_accounts" "ua"
  WHERE (("ua"."user_id" = "auth"."uid"()) AND ("ua"."id" = "sales_assignments"."sales_user_id") AND ("ua"."role" = ANY (ARRAY['admin'::"public"."user_role", 'sales'::"public"."user_role"])) AND ("ua"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_accounts" "ua"
  WHERE (("ua"."user_id" = "auth"."uid"()) AND ("ua"."id" = "sales_assignments"."sales_user_id") AND ("ua"."role" = ANY (ARRAY['admin'::"public"."user_role", 'sales'::"public"."user_role"])) AND ("ua"."is_active" = true)))));



CREATE POLICY "Sales can update their proposals" ON "public"."proposals" FOR UPDATE USING ("public"."can_create_proposal"("created_by"));



CREATE POLICY "Sales can view customer accounts and their own" ON "public"."user_accounts" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (("role" = 'user'::"public"."user_role") AND ("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'sales'::"text"])))));



CREATE POLICY "Sales can view orders of assigned customers" ON "public"."orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_accounts" "ua"
  WHERE (("ua"."user_id" = "auth"."uid"()) AND ("ua"."id" = "orders"."sales_user_id") AND ("ua"."role" = ANY (ARRAY['admin'::"public"."user_role", 'sales'::"public"."user_role"]))))));



CREATE POLICY "Sales can view their assignments" ON "public"."sales_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_accounts" "ua"
  WHERE (("ua"."user_id" = "auth"."uid"()) AND ("ua"."id" = "sales_assignments"."sales_user_id") AND ("ua"."role" = ANY (ARRAY['admin'::"public"."user_role", 'sales'::"public"."user_role"]))))));



CREATE POLICY "Sales can view their proposals" ON "public"."proposals" FOR SELECT USING ("public"."can_create_proposal"("created_by"));



CREATE POLICY "System can insert activity logs" ON "public"."activity_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can update awarded credits" ON "public"."awarded_flexi_credits" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Users can accept invitations" ON "public"."couple_invitations" FOR UPDATE USING (true);



CREATE POLICY "Users can create their own flexi credit transactions" ON "public"."flexi_credits_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own transactions" ON "public"."flexi_credits_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own unlocks" ON "public"."awarded_credits_unlocks" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can delete their notes" ON "public"."brain_notes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own campaign participation" ON "public"."campaign_participants" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own campaigns" ON "public"."lead_gen_campaigns" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own payment methods" ON "public"."payment_methods" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their tasks" ON "public"."brain_tasks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can insert their notes" ON "public"."brain_notes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own campaign participation" ON "public"."campaign_participants" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own campaigns" ON "public"."lead_gen_campaigns" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can insert their own customer account" ON "public"."user_accounts" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND ("role" = 'user'::"public"."user_role")));



CREATE POLICY "Users can insert their own payment methods" ON "public"."payment_methods" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own reimbursement requests" ON "public"."reimbursement_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their tasks" ON "public"."brain_tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update couples" ON "public"."couples" FOR UPDATE USING (true);



CREATE POLICY "Users can update only their own profile" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"())::"text" = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can update their notes" ON "public"."brain_notes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own account" ON "public"."user_accounts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own campaign participation" ON "public"."campaign_participants" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own campaigns" ON "public"."lead_gen_campaigns" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own payment methods" ON "public"."payment_methods" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their tasks" ON "public"."brain_tasks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view active lead gen campaigns" ON "public"."lead_gen_campaigns" FOR SELECT USING (("status" = 'active'::"text"));



CREATE POLICY "Users can view couples" ON "public"."couples" FOR SELECT USING (true);



CREATE POLICY "Users can view only their own profile" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"())::"text" = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can view own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their notes" ON "public"."brain_notes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own account" ON "public"."user_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own activity logs" ON "public"."activity_logs" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own awarded credits" ON "public"."awarded_flexi_credits" FOR SELECT TO "authenticated" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can view their own campaign participation" ON "public"."campaign_participants" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own campaigns" ON "public"."lead_gen_campaigns" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own flexi credit transactions" ON "public"."flexi_credits_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own payment methods" ON "public"."payment_methods" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own reimbursement requests" ON "public"."reimbursement_requests" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own service assignments" ON "public"."admin_service_assignments" FOR SELECT TO "authenticated" USING ((("auth"."uid"())::"text" = ("user_id")::"text"));



CREATE POLICY "Users can view their own service billing transactions" ON "public"."admin_service_billing_transactions" FOR SELECT TO "authenticated" USING ((("auth"."uid"())::"text" = ("user_id")::"text"));



CREATE POLICY "Users can view their own transactions" ON "public"."flexi_credits_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own unlocks" ON "public"."awarded_credits_unlocks" FOR SELECT TO "authenticated" USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can view their recurring deductions" ON "public"."admin_recurring_deductions" FOR SELECT USING (("user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can view their tasks" ON "public"."brain_tasks" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ad_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."addon_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."addons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_recurring_deductions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_service_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_service_billing_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."awarded_credits_unlocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."awarded_flexi_credits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_access_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."case_studies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consultants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."couple_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."couples" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_gpt_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flexi_credits_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_subscription" ON "public"."subscribers" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."lead_gen_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memory_album_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memory_albums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monthly_billing_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."package_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."package_feature_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."package_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portfolio_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."proposals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reimbursement_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_own_subscription" ON "public"."subscribers" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("email" = "auth"."email"())));



ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."singapore_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscribers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_own_subscription" ON "public"."subscribers" FOR UPDATE USING (true);



ALTER TABLE "public"."user_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_campaign_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_group_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishlist_items" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."bookings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."campaign_participants";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."consultants";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."flexi_credits_transactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."lead_gen_campaigns";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."monthly_billing_transactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."reviews";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."services";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."can_create_proposal"("creator_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_create_proposal"("creator_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_create_proposal"("creator_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_profile_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_profile_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_profile_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_category_id"("category_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_category_id"("category_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_category_id"("category_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("check_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_roles"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_roles"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_roles"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_account"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_account"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_flexi_credits_balance"("user_id" "uuid", "credits_to_add" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_flexi_credits_balance"("user_id" "uuid", "credits_to_add" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_flexi_credits_balance"("user_id" "uuid", "credits_to_add" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_package_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_package_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_package_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_proposal_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_proposal_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_proposal_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."my_upcoming_flexi_charges"() TO "anon";
GRANT ALL ON FUNCTION "public"."my_upcoming_flexi_charges"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_upcoming_flexi_charges"() TO "service_role";



GRANT ALL ON FUNCTION "public"."round_credits_to_one_decimal"() TO "anon";
GRANT ALL ON FUNCTION "public"."round_credits_to_one_decimal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."round_credits_to_one_decimal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_consultant_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_consultant_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_consultant_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ad_variants" TO "anon";
GRANT ALL ON TABLE "public"."ad_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."ad_variants" TO "service_role";



GRANT ALL ON TABLE "public"."addon_features" TO "anon";
GRANT ALL ON TABLE "public"."addon_features" TO "authenticated";
GRANT ALL ON TABLE "public"."addon_features" TO "service_role";



GRANT ALL ON TABLE "public"."addons" TO "anon";
GRANT ALL ON TABLE "public"."addons" TO "authenticated";
GRANT ALL ON TABLE "public"."addons" TO "service_role";



GRANT ALL ON TABLE "public"."admin_recurring_deductions" TO "anon";
GRANT ALL ON TABLE "public"."admin_recurring_deductions" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_recurring_deductions" TO "service_role";



GRANT ALL ON TABLE "public"."admin_service_assignments" TO "anon";
GRANT ALL ON TABLE "public"."admin_service_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_service_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."admin_service_billing_transactions" TO "anon";
GRANT ALL ON TABLE "public"."admin_service_billing_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_service_billing_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON TABLE "public"."awarded_credits_unlocks" TO "anon";
GRANT ALL ON TABLE "public"."awarded_credits_unlocks" TO "authenticated";
GRANT ALL ON TABLE "public"."awarded_credits_unlocks" TO "service_role";



GRANT ALL ON TABLE "public"."awarded_flexi_credits" TO "anon";
GRANT ALL ON TABLE "public"."awarded_flexi_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."awarded_flexi_credits" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."brain_notes" TO "anon";
GRANT ALL ON TABLE "public"."brain_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."brain_notes" TO "service_role";



GRANT ALL ON TABLE "public"."brain_tasks" TO "anon";
GRANT ALL ON TABLE "public"."brain_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."brain_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_access_rules" TO "anon";
GRANT ALL ON TABLE "public"."campaign_access_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_access_rules" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_analytics" TO "anon";
GRANT ALL ON TABLE "public"."campaign_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_invitations" TO "anon";
GRANT ALL ON TABLE "public"."campaign_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_participants" TO "anon";
GRANT ALL ON TABLE "public"."campaign_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_participants" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_templates" TO "anon";
GRANT ALL ON TABLE "public"."campaign_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_templates" TO "service_role";



GRANT ALL ON TABLE "public"."case_studies" TO "anon";
GRANT ALL ON TABLE "public"."case_studies" TO "authenticated";
GRANT ALL ON TABLE "public"."case_studies" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."consultants" TO "anon";
GRANT ALL ON TABLE "public"."consultants" TO "authenticated";
GRANT ALL ON TABLE "public"."consultants" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."couple_invitations" TO "anon";
GRANT ALL ON TABLE "public"."couple_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."couple_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."couples" TO "anon";
GRANT ALL ON TABLE "public"."couples" TO "authenticated";
GRANT ALL ON TABLE "public"."couples" TO "service_role";



GRANT ALL ON TABLE "public"."custom_gpt_links" TO "anon";
GRANT ALL ON TABLE "public"."custom_gpt_links" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_gpt_links" TO "service_role";



GRANT ALL ON TABLE "public"."flexi_credits_transactions" TO "anon";
GRANT ALL ON TABLE "public"."flexi_credits_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."flexi_credits_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."lead_gen_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."lead_gen_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_gen_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."memories" TO "anon";
GRANT ALL ON TABLE "public"."memories" TO "authenticated";
GRANT ALL ON TABLE "public"."memories" TO "service_role";



GRANT ALL ON TABLE "public"."memory_album_items" TO "anon";
GRANT ALL ON TABLE "public"."memory_album_items" TO "authenticated";
GRANT ALL ON TABLE "public"."memory_album_items" TO "service_role";



GRANT ALL ON TABLE "public"."memory_albums" TO "anon";
GRANT ALL ON TABLE "public"."memory_albums" TO "authenticated";
GRANT ALL ON TABLE "public"."memory_albums" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_billing_transactions" TO "anon";
GRANT ALL ON TABLE "public"."monthly_billing_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_billing_transactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."package_categories" TO "anon";
GRANT ALL ON TABLE "public"."package_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."package_categories" TO "service_role";



GRANT ALL ON TABLE "public"."package_feature_items" TO "anon";
GRANT ALL ON TABLE "public"."package_feature_items" TO "authenticated";
GRANT ALL ON TABLE "public"."package_feature_items" TO "service_role";



GRANT ALL ON TABLE "public"."package_features" TO "anon";
GRANT ALL ON TABLE "public"."package_features" TO "authenticated";
GRANT ALL ON TABLE "public"."package_features" TO "service_role";



GRANT ALL ON TABLE "public"."packages" TO "anon";
GRANT ALL ON TABLE "public"."packages" TO "authenticated";
GRANT ALL ON TABLE "public"."packages" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_items" TO "anon";
GRANT ALL ON TABLE "public"."portfolio_items" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio_items" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."proposals" TO "anon";
GRANT ALL ON TABLE "public"."proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."proposals" TO "service_role";



GRANT ALL ON TABLE "public"."reimbursement_requests" TO "anon";
GRANT ALL ON TABLE "public"."reimbursement_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."reimbursement_requests" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."sales_assignments" TO "anon";
GRANT ALL ON TABLE "public"."sales_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."singapore_events" TO "anon";
GRANT ALL ON TABLE "public"."singapore_events" TO "authenticated";
GRANT ALL ON TABLE "public"."singapore_events" TO "service_role";



GRANT ALL ON TABLE "public"."subscribers" TO "anon";
GRANT ALL ON TABLE "public"."subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."upcoming_flexi_charges" TO "anon";
GRANT ALL ON TABLE "public"."upcoming_flexi_charges" TO "authenticated";
GRANT ALL ON TABLE "public"."upcoming_flexi_charges" TO "service_role";



GRANT ALL ON TABLE "public"."user_accounts" TO "anon";
GRANT ALL ON TABLE "public"."user_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."user_campaign_permissions" TO "anon";
GRANT ALL ON TABLE "public"."user_campaign_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_campaign_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."user_group_memberships" TO "anon";
GRANT ALL ON TABLE "public"."user_group_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."user_group_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."user_groups" TO "anon";
GRANT ALL ON TABLE "public"."user_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."user_groups" TO "service_role";



GRANT ALL ON TABLE "public"."user_invitations" TO "anon";
GRANT ALL ON TABLE "public"."user_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."wishlist_items" TO "anon";
GRANT ALL ON TABLE "public"."wishlist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist_items" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_created_account AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user_account();


  create policy "Admins can view all receipts"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'receipts'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (auth.uid())::text) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'master_admin'::user_role])))))));



  create policy "Anyone can view portfolio images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'portfolio-images'::text));



  create policy "Authenticated users can upload to their own folder in memories"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'memories'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Avatar images are publicly accessible"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Consultants can delete their service images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'service-images'::text) AND (auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM consultants
  WHERE (consultants.user_id = auth.uid())))));



  create policy "Consultants can update their service images"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'service-images'::text) AND (auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM consultants
  WHERE (consultants.user_id = auth.uid())))));



  create policy "Consultants can upload service images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'service-images'::text) AND (auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM consultants
  WHERE (consultants.user_id = auth.uid())))));



  create policy "Public read access for memories"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'memories'::text));



  create policy "Sales and admins can delete portfolio images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'portfolio-images'::text) AND (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'sales'::text, 'master_admin'::text]))));



  create policy "Sales and admins can update portfolio images"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'portfolio-images'::text) AND (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'sales'::text, 'master_admin'::text]))));



  create policy "Sales and admins can upload portfolio images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'portfolio-images'::text) AND (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'sales'::text, 'master_admin'::text]))));



  create policy "Service images are publicly accessible"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'service-images'::text));



  create policy "Users can delete their own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can delete their own files in memories"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'memories'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can update their own avatar"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can update their own files in memories"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'memories'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload their own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload their own receipts"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'receipts'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can view their own receipts"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'receipts'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



