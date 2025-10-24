-- Fix the round_credits_to_one_decimal trigger to remove gifting_credits_balance reference
CREATE OR REPLACE FUNCTION public.round_credits_to_one_decimal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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