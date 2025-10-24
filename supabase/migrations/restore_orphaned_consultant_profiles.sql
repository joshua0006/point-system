-- Migration: Restore Missing Profiles for Orphaned Consultants
-- Issue: 8 consultants exist without corresponding profiles
-- Impact: 37+ booking transactions show "Unknown Consultant" instead of actual names
--
-- This migration restores profiles from auth.users data for consultants that have
-- auth accounts but missing profiles

-- Step 1: Verify orphaned consultants before migration
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM consultants c
  LEFT JOIN profiles p ON c.user_id::text = p.user_id
  WHERE p.user_id IS NULL;

  RAISE NOTICE 'Found % orphaned consultants without profiles', orphaned_count;
END $$;

-- Step 2: Create missing profiles from auth.users data
-- This restores profiles for consultants whose auth accounts still exist
INSERT INTO profiles (
  id,
  user_id,
  email,
  full_name,
  role,
  flexi_credits_balance,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  au.id::text as user_id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  ) as full_name,
  'consultant'::user_role as role,
  0 as flexi_credits_balance,
  au.created_at,
  NOW() as updated_at
FROM consultants c
INNER JOIN auth.users au ON c.user_id = au.id
LEFT JOIN profiles p ON c.user_id::text = p.user_id
WHERE p.user_id IS NULL  -- Only consultants without profiles
  AND au.deleted_at IS NULL;  -- Only non-deleted auth users

-- Step 3: Verify restoration
DO $$
DECLARE
  remaining_orphaned INTEGER;
  restored_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_orphaned
  FROM consultants c
  LEFT JOIN profiles p ON c.user_id::text = p.user_id
  WHERE p.user_id IS NULL;

  SELECT COUNT(*) INTO restored_count
  FROM profiles
  WHERE created_at >= NOW() - INTERVAL '1 minute';

  RAISE NOTICE 'Restored % profiles', restored_count;
  RAISE NOTICE '% orphaned consultants remain (auth users may be deleted)', remaining_orphaned;
END $$;

-- Step 4: Log the migration in a tracking table (optional)
-- Uncomment if you have a migrations_log table
-- INSERT INTO migrations_log (migration_name, executed_at, notes)
-- VALUES (
--   'restore_orphaned_consultant_profiles',
--   NOW(),
--   'Restored missing profiles for 8 orphaned consultants'
-- );
