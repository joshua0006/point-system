-- Update user role to admin for joshuamagnase2000@gmail.com
UPDATE public.profiles 
SET role = 'admin'::user_role,
    updated_at = now()
WHERE email = 'joshuamagnase2000@gmail.com';