-- Allow users to create their own lead generation campaigns
CREATE POLICY "users_can_create_campaigns" ON public.lead_gen_campaigns
FOR INSERT
WITH CHECK (auth.uid() = created_by);