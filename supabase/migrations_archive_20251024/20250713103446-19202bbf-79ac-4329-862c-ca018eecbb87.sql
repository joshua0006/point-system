
-- Clean up remaining placeholder data more thoroughly

-- Remove placeholder services (keep only real user services)
DELETE FROM public.services 
WHERE consultant_id IN (
  SELECT c.id FROM public.consultants c
  JOIN public.profiles p ON c.user_id = p.user_id
  WHERE p.email LIKE '%@example.com' 
  OR p.email LIKE 'demo-%@demo.com'
  OR p.full_name LIKE '%Demo%'
  OR c.bio LIKE '%Fortune 500%'
  OR c.bio LIKE '%15+ years%'
);

-- Remove placeholder consultant profiles
DELETE FROM public.consultants 
WHERE user_id IN (
  SELECT p.user_id FROM public.profiles p
  WHERE p.email LIKE '%@example.com' 
  OR p.email LIKE 'demo-%@demo.com'
  OR p.full_name LIKE '%Demo%'
  OR p.full_name = 'Demo Consultant'
);

-- Remove placeholder user profiles (but keep real authenticated users)
DELETE FROM public.profiles 
WHERE (
  email LIKE '%@example.com' 
  OR email LIKE 'demo-%@demo.com'
  OR full_name LIKE '%Demo%'
  OR full_name = 'Demo Consultant'
)
AND user_id NOT IN (
  -- Keep profiles that correspond to actual auth.users
  SELECT id FROM auth.users
);

-- Clean up any orphaned bookings, transactions, conversations, and messages
DELETE FROM public.points_transactions 
WHERE user_id NOT IN (SELECT user_id FROM public.profiles);

DELETE FROM public.bookings 
WHERE user_id NOT IN (SELECT user_id FROM public.profiles)
OR consultant_id NOT IN (SELECT id FROM public.consultants);

DELETE FROM public.messages 
WHERE conversation_id IN (
  SELECT id FROM public.conversations 
  WHERE buyer_id NOT IN (SELECT user_id FROM public.profiles)
  OR seller_id NOT IN (SELECT user_id FROM public.profiles)
);

DELETE FROM public.conversations 
WHERE buyer_id NOT IN (SELECT user_id FROM public.profiles)
OR seller_id NOT IN (SELECT user_id FROM public.profiles);
