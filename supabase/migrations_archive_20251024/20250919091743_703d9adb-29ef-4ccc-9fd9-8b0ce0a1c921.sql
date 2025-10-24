-- Fix RLS policies for admin dashboard data access
-- Enable admin access to all necessary tables

-- Ensure admin can read all flexi_credits_transactions
DROP POLICY IF EXISTS "Admins can view all flexi credit transactions" ON public.flexi_credits_transactions;
CREATE POLICY "Admins can view all flexi credit transactions" 
ON public.flexi_credits_transactions 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Ensure admin can read all bookings
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Ensure admin can read all services
DROP POLICY IF EXISTS "Admins can view all services" ON public.services;
CREATE POLICY "Admins can view all services" 
ON public.services 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Ensure admin can read all consultants
DROP POLICY IF EXISTS "Admins can view all consultants" ON public.consultants;
CREATE POLICY "Admins can view all consultants" 
ON public.consultants 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Ensure admin can read all lead_gen_campaigns
DROP POLICY IF EXISTS "Admins can view all campaigns" ON public.lead_gen_campaigns;
CREATE POLICY "Admins can view all campaigns" 
ON public.lead_gen_campaigns 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Ensure admin can read all campaign_participants
DROP POLICY IF EXISTS "Admins can view all campaign participants" ON public.campaign_participants;
CREATE POLICY "Admins can view all campaign participants" 
ON public.campaign_participants 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Ensure admin can read all monthly_billing_transactions
DROP POLICY IF EXISTS "Admins can view all billing transactions" ON public.monthly_billing_transactions;
CREATE POLICY "Admins can view all billing transactions" 
ON public.monthly_billing_transactions 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Configure realtime for all necessary tables
ALTER TABLE public.flexi_credits_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.consultants REPLICA IDENTITY FULL;
ALTER TABLE public.lead_gen_campaigns REPLICA IDENTITY FULL;
ALTER TABLE public.campaign_participants REPLICA IDENTITY FULL;
ALTER TABLE public.monthly_billing_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.flexi_credits_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_gen_campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_billing_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;