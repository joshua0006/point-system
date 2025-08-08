-- Fix ambiguous user_id reference inside RPC by using local variables and qualifying table columns
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
DECLARE
  v_user_id uuid := user_id;
  v_points integer := points_to_add;
BEGIN
  UPDATE public.profiles AS p
  SET 
    points_balance = COALESCE(p.points_balance, 0) + v_points,
    updated_at = now()
  WHERE p.user_id::text = v_user_id::text;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', v_user_id;
  END IF;
END;
$function$;