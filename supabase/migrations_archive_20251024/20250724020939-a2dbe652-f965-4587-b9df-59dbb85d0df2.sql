-- Update demo admin user to have admin role
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE email = 'demo-admin@demo.com';