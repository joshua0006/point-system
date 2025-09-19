-- Create a SECURITY DEFINER helper to read current user's role from profiles safely
CREATE OR REPLACE FUNCTION public.current_user_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE user_id::text = (auth.uid())::text LIMIT 1;
$$;

-- Replace the admin profiles SELECT policy to avoid recursive subqueries
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  public.current_user_profile_role() = ANY (ARRAY['admin'::text, 'master_admin'::text])
);