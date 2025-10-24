  -- Fix infinite recursion in profiles RLS policies
  -- This migration creates a properly optimized is_admin() function that bypasses RLS

  -- Drop the existing is_admin() function if it exists
  DROP FUNCTION IF EXISTS public.is_admin();

  -- Create optimized is_admin() function using SQL (not PL/pgSQL) to avoid recursion
  -- SECURITY DEFINER ensures it runs with superuser privileges and bypasses RLS
  CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = (auth.uid())::text
      AND role IN ('admin', 'master_admin')
      LIMIT 1
    );
  $$;

  -- Add comment to document this helper function
  COMMENT ON FUNCTION public.is_admin() IS
    'Helper function to check if current user is admin without triggering RLS recursion. Uses SECURITY DEFINER to bypass RLS.';

  -- Drop all existing profiles policies to ensure clean state
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles via role func" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Approved users can view their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Pending users can view their own profile only" ON public.profiles;
  DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

  -- Recreate policies using the is_admin() helper function

  -- SELECT policies: Admins can view all, users can view their own
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

  -- UPDATE policies: Admins can update all, users can update their own
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

  -- INSERT policy: Users can insert their own profile
  CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (auth.uid())::text);

  -- Add comments to document the policies
  COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS
    'Allows admins to view all profiles using is_admin() helper to avoid infinite recursion.';
  COMMENT ON POLICY "Admins can update all profiles" ON public.profiles IS
    'Allows admins to update all profiles using is_admin() helper to avoid infinite recursion.';
  COMMENT ON POLICY "Users can insert their own profile" ON public.profiles IS
    'Allows users to create their own profile during registration.';
