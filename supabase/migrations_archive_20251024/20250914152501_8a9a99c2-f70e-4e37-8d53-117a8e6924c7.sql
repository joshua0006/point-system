-- Allow admins to view all flexi credits transactions  
CREATE POLICY "Admins can view all flexi credit transactions"
ON public.flexi_credits_transactions
FOR SELECT
USING (
  public.get_user_role(auth.uid()) IN ('admin','master_admin')
);