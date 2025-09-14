-- Update your profile to master_admin role
UPDATE public.profiles 
SET role = 'master_admin'::user_role 
WHERE email = 'tanjunsing@gmail.com' OR user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384';