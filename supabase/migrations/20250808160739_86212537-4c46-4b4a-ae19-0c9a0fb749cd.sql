-- Ensure we replace any existing versions and avoid ambiguous references
DROP FUNCTION IF EXISTS public.increment_points_balance(uuid, integer);

-- Recreate with clear parameter names and safe arithmetic
CREATE OR REPLACE FUNCTION public.increment_points_balance(
  p_user_id uuid,
  p_points_to_add integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
BEGIN
  UPDATE public.profiles 
  SET 
    points_balance = COALESCE(points_balance, 0) + p_points_to_add,
    updated_at = now()
  WHERE user_id = p_user_id::text;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', p_user_id;
  END IF;
END;
$function$;