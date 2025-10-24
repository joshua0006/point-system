-- Fix profile INSERT RLS policy to properly handle UUID to TEXT type casting
-- This ensures the trigger function can successfully create profiles during user signup

-- Drop the old INSERT policy that lacks proper type casting
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Recreate with proper type casting to match SELECT/UPDATE policies
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid())::text = user_id);

-- Add comment to document this fix
COMMENT ON POLICY "Users can insert their own profile" ON public.profiles IS
  'Allows users to insert their own profile with proper UUID to TEXT type casting. Fixed to resolve profile creation failures during signup.';
