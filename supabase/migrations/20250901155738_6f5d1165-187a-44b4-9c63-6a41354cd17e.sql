-- Rename points_balance to flexi_credits_balance in profiles table
ALTER TABLE public.profiles RENAME COLUMN points_balance TO flexi_credits_balance;

-- Rename points_transactions table to flexi_credits_transactions
ALTER TABLE public.points_transactions RENAME TO flexi_credits_transactions;

-- Update the database function to use new naming
CREATE OR REPLACE FUNCTION public.increment_flexi_credits_balance(user_id uuid, credits_to_add numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update the rounding trigger function
CREATE OR REPLACE FUNCTION public.round_credits_to_one_decimal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'flexi_credits_transactions' THEN
    NEW.amount := round(COALESCE(NEW.amount, 0)::numeric, 1);
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    NEW.flexi_credits_balance := round(COALESCE(NEW.flexi_credits_balance, 0)::numeric, 1);
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop the old function
DROP FUNCTION IF EXISTS public.increment_points_balance(uuid, numeric);
DROP FUNCTION IF EXISTS public.round_points_to_one_decimal();