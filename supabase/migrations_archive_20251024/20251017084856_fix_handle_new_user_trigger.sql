-- Fix the handle_new_user() trigger function to properly create profiles
-- This ensures all required fields are set and provides better error handling

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the new user creation attempt
  RAISE NOTICE 'Creating profile for new user: % (%)', NEW.email, NEW.id;

  -- Attempt to insert the new profile with all required fields
  BEGIN
    INSERT INTO public.profiles (
      user_id,
      email,
      full_name,
      role,
      flexi_credits_balance,
      approval_status
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'user'::user_role,
      0,
      'pending'::approval_status
    );

    RAISE NOTICE 'Profile created successfully for user: %', NEW.email;

  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'Profile already exists for user: %', NEW.email;
    WHEN OTHERS THEN
      -- Log the error details
      RAISE EXCEPTION 'Failed to create profile for user % (%): % - %',
        NEW.email, NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$function$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add a comment to document this fix
COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a profile for new users with all required fields. Updated to fix profile missing errors.';
