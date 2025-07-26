-- Fix the remaining function search path issue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, approval_status)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'pending');
  RETURN NEW;
END;
$$;