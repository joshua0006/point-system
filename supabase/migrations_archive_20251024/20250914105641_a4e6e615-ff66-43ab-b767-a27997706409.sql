-- Add master_admin role to user_role enum
ALTER TYPE public.user_role ADD VALUE 'master_admin';

-- Update your profile to master_admin role (replace with your actual user_id)
-- You'll need to get your user_id from the auth.users table or profiles table first
UPDATE public.profiles 
SET role = 'master_admin'::user_role 
WHERE email = 'tanjunsing@gmail.com' OR user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384';