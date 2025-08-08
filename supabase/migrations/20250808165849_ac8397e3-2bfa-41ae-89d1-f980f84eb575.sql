-- Points with 1-decimal precision
-- 1) Update columns to numeric(12,1)
ALTER TABLE public.profiles
  ALTER COLUMN points_balance TYPE numeric(12,1)
  USING round(coalesce(points_balance, 0)::numeric, 1);

ALTER TABLE public.points_transactions
  ALTER COLUMN amount TYPE numeric(12,1)
  USING round(coalesce(amount, 0)::numeric, 1);

-- 2) Update RPC to accept decimals and round to 1 decimal
DROP FUNCTION IF EXISTS public.increment_points_balance(uuid, integer);

CREATE OR REPLACE FUNCTION public.increment_points_balance(
  user_id uuid,
  points_to_add numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_user_id uuid := user_id;
  v_points numeric := round(points_to_add::numeric, 1);
BEGIN
  UPDATE public.profiles AS p
  SET 
    points_balance = round(COALESCE(p.points_balance, 0)::numeric + v_points, 1),
    updated_at = now()
  WHERE p.user_id::text = v_user_id::text;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', v_user_id;
  END IF;
END;
$function$;

-- 3) Triggers to enforce 1-decimal rounding at write-time
CREATE OR REPLACE FUNCTION public.round_points_to_one_decimal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $fn$
BEGIN
  IF TG_TABLE_NAME = 'points_transactions' THEN
    NEW.amount := round(COALESCE(NEW.amount, 0)::numeric, 1);
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    NEW.points_balance := round(COALESCE(NEW.points_balance, 0)::numeric, 1);
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_round_points_transactions ON public.points_transactions;
CREATE TRIGGER trg_round_points_transactions
BEFORE INSERT OR UPDATE ON public.points_transactions
FOR EACH ROW EXECUTE FUNCTION public.round_points_to_one_decimal();

DROP TRIGGER IF EXISTS trg_round_profiles_points_balance ON public.profiles;
CREATE TRIGGER trg_round_profiles_points_balance
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.round_points_to_one_decimal();