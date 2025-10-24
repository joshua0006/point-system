-- Fix increment_points_balance to work with profiles.user_id (text) by casting the UUID param to text
CREATE OR REPLACE FUNCTION public.increment_points_balance(user_id uuid, points_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the points balance by adding the specified amount
  UPDATE public.profiles 
  SET 
    points_balance = points_balance + points_to_add,
    updated_at = now()
  WHERE profiles.user_id = user_id::text;
  
  -- Check if the update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', user_id;
  END IF;
END;
$function$;