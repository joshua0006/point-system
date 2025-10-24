-- Diagnostic Query: Check Consultant-Profile Data Integrity
-- This investigates why consultant_name is NULL in transactions

-- 1. Check if specific consultant profile exists
SELECT
  'Specific consultant profile check' as check_type,
  user_id,
  full_name,
  email,
  role,
  created_at
FROM profiles
WHERE user_id = '6a60a946-fcf6-49c1-8b36-465365874715';

-- 2. Count consultants WITH profiles
SELECT
  'Consultants with profiles' as check_type,
  COUNT(*) as count
FROM consultants c
INNER JOIN profiles p ON c.user_id::text = p.user_id;

-- 3. Count consultants WITHOUT profiles (orphaned)
SELECT
  'Consultants without profiles (ORPHANED)' as check_type,
  COUNT(*) as count
FROM consultants c
LEFT JOIN profiles p ON c.user_id::text = p.user_id
WHERE p.user_id IS NULL;

-- 4. List orphaned consultants with booking counts
SELECT
  c.id as consultant_id,
  c.user_id as consultant_user_id,
  c.tier,
  c.is_active,
  c.created_at as consultant_created_at,
  COUNT(b.id) as booking_count
FROM consultants c
LEFT JOIN profiles p ON c.user_id::text = p.user_id
LEFT JOIN bookings b ON c.id = b.consultant_id
WHERE p.user_id IS NULL
GROUP BY c.id, c.user_id, c.tier, c.is_active, c.created_at
ORDER BY booking_count DESC;

-- 5. Check if problematic user_id exists in auth.users
SELECT
  'Auth user check' as check_type,
  id,
  email,
  created_at,
  deleted_at
FROM auth.users
WHERE id = '6a60a946-fcf6-49c1-8b36-465365874715';

-- 6. Compare working consultant vs problematic consultant
SELECT
  'Comparison: Working vs Problematic' as comparison,
  'WORKING: leo' as consultant_type,
  c.id as consultant_id,
  c.user_id as consultant_user_id,
  c.tier,
  c.is_active,
  p.full_name,
  p.email
FROM consultants c
LEFT JOIN profiles p ON c.user_id::text = p.user_id
WHERE c.user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384'

UNION ALL

SELECT
  'Comparison: Working vs Problematic' as comparison,
  'PROBLEMATIC: null name' as consultant_type,
  c.id as consultant_id,
  c.user_id as consultant_user_id,
  c.tier,
  c.is_active,
  p.full_name,
  p.email
FROM consultants c
LEFT JOIN profiles p ON c.user_id::text = p.user_id
WHERE c.user_id = '6a60a946-fcf6-49c1-8b36-465365874715';
