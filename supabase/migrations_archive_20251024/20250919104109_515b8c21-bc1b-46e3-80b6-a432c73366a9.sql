-- Fix admin visibility for flexi credits transactions using profiles-based roles
-- Drop old admin policy that relied on user_accounts
DROP POLICY IF EXISTS "Admins can view all flexi credit transactions" ON public.flexi_credits_transactions;

-- Recreate admin SELECT policy using profiles.role and make it permissive
CREATE POLICY "Admins can view all flexi credit transactions"
ON public.flexi_credits_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()::text AND p.role IN ('admin', 'master_admin')
  )
);
