
-- Remove placeholder data but keep demo accounts
-- First, let's identify and remove non-demo placeholder data

-- Remove services from non-demo consultants (keep demo accounts)
DELETE FROM public.services 
WHERE consultant_id IN (
  SELECT c.id FROM public.consultants c
  JOIN public.profiles p ON c.user_id = p.user_id
  WHERE p.email NOT LIKE 'demo-%@demo.com'
  AND c.user_id NOT IN (
    SELECT user_id FROM public.profiles 
    WHERE email IN ('demo-buyer@demo.com', 'demo-consultant@demo.com')
  )
);

-- Remove non-demo consultants (keep demo accounts)
DELETE FROM public.consultants 
WHERE user_id IN (
  SELECT p.user_id FROM public.profiles p
  WHERE p.email NOT LIKE 'demo-%@demo.com'
  AND p.email NOT IN ('demo-buyer@demo.com', 'demo-consultant@demo.com')
  AND p.user_id != '952c1a39-f9bf-4f5d-ba81-fac0ab686384' -- Keep the existing authenticated user
);

-- Remove non-demo profiles (except actual authenticated users and demo accounts)
DELETE FROM public.profiles 
WHERE email NOT LIKE 'demo-%@demo.com'
AND email NOT IN ('demo-buyer@demo.com', 'demo-consultant@demo.com')
AND user_id NOT IN (
  -- Keep profiles that correspond to actual auth.users
  SELECT id FROM auth.users
)
AND email LIKE '%@example.com'; -- Only remove the placeholder @example.com emails

-- Clean up any orphaned conversations and messages from removed profiles
DELETE FROM public.messages 
WHERE conversation_id IN (
  SELECT id FROM public.conversations 
  WHERE buyer_id NOT IN (SELECT user_id FROM public.profiles)
  OR seller_id NOT IN (SELECT user_id FROM public.profiles)
);

DELETE FROM public.conversations 
WHERE buyer_id NOT IN (SELECT user_id FROM public.profiles)
OR seller_id NOT IN (SELECT user_id FROM public.profiles);
