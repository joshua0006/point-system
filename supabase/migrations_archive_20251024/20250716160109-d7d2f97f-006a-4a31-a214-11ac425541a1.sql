-- Create function to safely increment user points balance
CREATE OR REPLACE FUNCTION public.increment_points_balance(user_id UUID, points_to_add INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the points balance by adding the specified amount
  UPDATE public.profiles 
  SET 
    points_balance = points_balance + points_to_add,
    updated_at = now()
  WHERE profiles.user_id = increment_points_balance.user_id;
  
  -- Check if the update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', user_id;
  END IF;
END;
$$;