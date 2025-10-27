-- Give admin role to danquekyleerica@gmail.com
UPDATE public.profiles 
SET role = 'admin'::user_role,
    approval_status = 'approved'::approval_status,
    updated_at = now()
WHERE email = 'danquekyleerica@gmail.com';