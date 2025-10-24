-- Fix infinite recursion in profiles RLS policies by creating a helper function
-- that safely checks admin status without triggering recursive policy evaluation

-- Step 1: Create a helper function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the current user's role directly, bypassing RLS
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = (auth.uid())::text
  LIMIT 1;

  -- Return true if user is admin or master_admin
  RETURN user_role IN ('admin', 'master_admin');
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, default to false (not admin)
    RETURN false;
END;
$function$;

-- Add comment to document this helper function
COMMENT ON FUNCTION public.is_admin() IS
  'Helper function to check if current user is admin without triggering RLS recursion. Uses SECURITY DEFINER to bypass RLS.';

-- Step 2: Drop all existing SELECT/UPDATE policies to recreate them properly
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Step 3: Recreate admin policies using the helper function (no recursion)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = (auth.uid())::text);

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = (auth.uid())::text);

-- Add comments to document the fix
COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS
  'Allows admins to view all profiles using is_admin() helper to avoid infinite recursion.';
COMMENT ON POLICY "Admins can update all profiles" ON public.profiles IS
  'Allows admins to update all profiles using is_admin() helper to avoid infinite recursion.';
