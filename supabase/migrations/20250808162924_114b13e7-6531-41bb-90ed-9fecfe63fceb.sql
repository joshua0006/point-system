-- Restore backward-compatible RPC signature for PostgREST callers
DROP FUNCTION IF EXISTS public.increment_points_balance(uuid, integer);

CREATE OR REPLACE FUNCTION public.increment_points_balance(
  user_id uuid,
  points_to_add integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
BEGIN
  UPDATE public.profiles 
  SET 
    points_balance = COALESCE(points_balance, 0) + points_to_add,
    updated_at = now()
  WHERE public.profiles.user_id::text = user_id::text;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', user_id;
  END IF;
END;
$function$;