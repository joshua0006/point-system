-- Fix recursive RLS policy on profiles causing 42P17 errors
-- Drop the problematic policy that referenced profiles inside itself
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can view all profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can view all profiles" ON public.profiles';
  END IF;
END $$;

-- Create a safe admin view policy using role function to avoid recursion
CREATE POLICY "Admins can view all profiles via role func"
ON public.profiles
FOR SELECT
USING (
  public.get_user_role(auth.uid()) IN ('admin','master_admin')
);
