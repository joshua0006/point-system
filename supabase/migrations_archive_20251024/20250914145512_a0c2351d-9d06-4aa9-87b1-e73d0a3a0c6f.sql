-- Allow admins and master_admins to view all profiles for user management
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid()::text 
    AND p.role IN ('admin', 'master_admin')
  )
);