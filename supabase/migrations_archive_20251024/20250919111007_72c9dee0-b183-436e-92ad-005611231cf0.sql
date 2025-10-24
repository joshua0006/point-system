-- Update profiles RLS policy to use profiles.role instead of user_accounts.role
-- This ensures consistency with the flexi_credits_transactions policies

-- Drop the existing policy that uses get_user_role (which checks user_accounts)
DROP POLICY IF EXISTS "Admins can view all profiles via role func" ON public.profiles;

-- Create new policy that uses profiles.role directly
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE user_id::text = (auth.uid())::text LIMIT 1) = ANY (ARRAY['admin'::user_role, 'master_admin'::user_role])
);