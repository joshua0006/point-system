-- First, drop the existing triggers that depend on the old function
DROP TRIGGER IF EXISTS trg_round_points_transactions ON flexi_credits_transactions;
DROP TRIGGER IF EXISTS trg_round_profiles_points_balance ON profiles;

-- Drop the old function now that triggers are removed
DROP FUNCTION IF EXISTS public.round_points_to_one_decimal();

-- Update the rounding trigger function with new name
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

-- Create new triggers with updated function
CREATE TRIGGER trg_round_flexi_credits_transactions
  BEFORE INSERT OR UPDATE ON flexi_credits_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.round_credits_to_one_decimal();

CREATE TRIGGER trg_round_profiles_flexi_credits_balance
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.round_credits_to_one_decimal();

-- Update the increment function with new naming
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

-- Drop the old increment function
DROP FUNCTION IF EXISTS public.increment_points_balance(uuid, numeric);