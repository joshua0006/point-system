-- Restore admin RLS policies after remote_schema override
-- This migration fixes the issue where admins cannot view other users' profiles
-- causing "(No name on file)" and "(No email on file)" in the Recurring Deductions table

-- Drop ALL existing policies first (before dropping the function they depend on)
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;

-- Now drop and recreate the is_admin() function
DROP FUNCTION IF EXISTS public.is_admin();

-- Create optimized is_admin() function using SQL to avoid recursion
-- SECURITY DEFINER ensures it runs with elevated privileges and bypasses RLS
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

COMMENT ON FUNCTION public.is_admin() IS
  'Helper function to check if current user is admin without triggering RLS recursion. Uses SECURITY DEFINER to bypass RLS.';

-- Recreate clean, non-conflicting policies

-- SELECT policies: Admins can view all profiles, users can view their own
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

-- UPDATE policies: Admins can update all profiles, users can update their own
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

-- INSERT policy: Allow users to create their own profile during registration
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = (auth.uid())::text);

-- Add descriptive comments
COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS
  'Allows admins to view all user profiles using is_admin() helper to avoid infinite recursion.';

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS
  'Allows users to view their own profile.';

COMMENT ON POLICY "Admins can update all profiles" ON public.profiles IS
  'Allows admins to update all user profiles using is_admin() helper to avoid infinite recursion.';

COMMENT ON POLICY "Users can update own profile" ON public.profiles IS
  'Allows users to update their own profile.';

COMMENT ON POLICY "Users can insert their own profile" ON public.profiles IS
  'Allows users to create their own profile during registration.';
