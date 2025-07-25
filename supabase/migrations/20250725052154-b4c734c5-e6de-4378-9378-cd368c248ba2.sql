-- Add RLS policy for admins to manage all services
CREATE POLICY "Admins can manage all services" 
ON public.services 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 
  FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));