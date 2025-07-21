
-- Set a user to admin role (using the existing test user)
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384';

-- Ensure admins can view all campaign participants and campaigns
CREATE POLICY "Admins can view all campaign data" 
ON public.campaign_participants 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Allow admins to view all lead gen campaigns
CREATE POLICY "Admins can view all lead gen campaigns" 
ON public.lead_gen_campaigns 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));
