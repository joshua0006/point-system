# Restore Orphaned Consultant Profiles - Migration Guide

## Issue Summary

**Problem:** 8 out of 10 consultants have no profile records, causing 37+ booking transactions to show "Unknown Consultant" instead of actual consultant names.

**Root Cause:** Profiles table is missing records for consultants whose auth accounts still exist in `auth.users`.

**Impact:**
- 80% of consultants (8/10) are orphaned
- Main affected consultant has 37 bookings with missing name
- Auth account exists: `demo-consultant@demo.com`
- Only 2 consultants ("leo" + 1 other) have working profiles

---

## Solution Overview

### Phase 1: Immediate UI Fix ✅ COMPLETED

**File:** `src/hooks/useTransactionHistory.ts`

**Change:**
```typescript
// Before
consultant: consultantName

// After
consultant: consultantName || "Unknown Consultant"
```

**Result:** Transactions now show "Unknown Consultant" instead of blank/N/A for orphaned consultants.

---

### Phase 2: Data Restoration (This Migration)

**Purpose:** Restore missing profiles from existing auth.users data

**Migration File:** `supabase/migrations/restore_orphaned_consultant_profiles.sql`

#### What This Migration Does

1. **Counts orphaned consultants** (should find 8)
2. **Creates missing profiles** from auth.users data:
   - Matches consultants to auth.users by user_id
   - Extracts name from user metadata or email
   - Sets role to 'consultant'
   - Initializes credits balance to 0
3. **Verifies restoration** with counts
4. **Reports results** in console

#### How to Run

**Option A: Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `restore_orphaned_consultant_profiles.sql`
3. Click "Run"
4. Check output for success messages:
   ```
   NOTICE: Found 8 orphaned consultants without profiles
   NOTICE: Restored 8 profiles
   NOTICE: 0 orphaned consultants remain
   ```

**Option B: Supabase CLI**

```bash
supabase db push
```

Or apply specific migration:
```bash
psql <connection-string> -f supabase/migrations/restore_orphaned_consultant_profiles.sql
```

#### Expected Results

**Before Migration:**
- Consultants with profiles: 2
- Orphaned consultants: 8
- Consultant "demo-consultant@demo.com": No profile, shows "Unknown Consultant"

**After Migration:**
- Consultants with profiles: 10
- Orphaned consultants: 0
- Consultant "demo-consultant@demo.com": Has profile, shows actual name
- 37 booking transactions: Now show consultant name

#### Verification

After running migration, execute test query:

```sql
-- Should now return 10 (all consultants have profiles)
SELECT COUNT(*)
FROM consultants c
INNER JOIN profiles p ON c.user_id::text = p.user_id;

-- Should now return 0 (no orphaned consultants)
SELECT COUNT(*)
FROM consultants c
LEFT JOIN profiles p ON c.user_id::text = p.user_id
WHERE p.user_id IS NULL;
```

Then check transaction history in browser:
1. Go to Dashboard → Transaction History
2. Set "per page" to 50
3. Scroll to older booking transactions
4. **Should now see consultant names instead of "Unknown Consultant"**

---

### Phase 3: Prevention Safeguards

**Goal:** Prevent orphaned consultants in the future

#### Option 1: Database Trigger

Create trigger to auto-create profile when consultant is created:

```sql
CREATE OR REPLACE FUNCTION create_profile_for_consultant()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile exists
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = NEW.user_id::text
  ) THEN
    -- Get user data from auth
    INSERT INTO profiles (id, user_id, email, full_name, role, flexi_credits_balance)
    SELECT
      gen_random_uuid(),
      au.id::text,
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)),
      'consultant',
      0
    FROM auth.users au
    WHERE au.id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_consultant_has_profile
  AFTER INSERT ON consultants
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_consultant();
```

#### Option 2: Application-Level Check

Update consultant creation logic to ensure profile exists:

```typescript
// In consultant signup/creation flow
async function createConsultant(userId: string, data: ConsultantData) {
  // 1. Ensure profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (!profile) {
    // Create profile first
    await createProfileFromAuthUser(userId);
  }

  // 2. Then create consultant
  await supabase.from('consultants').insert({
    user_id: userId,
    ...data
  });
}
```

#### Option 3: Data Integrity Validation

Add periodic checks to detect orphaned data:

```sql
-- Scheduled job or monitoring query
SELECT
  c.id,
  c.user_id,
  c.created_at,
  'ORPHANED: No profile' as issue
FROM consultants c
LEFT JOIN profiles p ON c.user_id::text = p.user_id
WHERE p.user_id IS NULL;
```

---

## Rollback Plan

If migration causes issues:

```sql
-- Rollback: Delete profiles created by migration
DELETE FROM profiles
WHERE created_at >= '[MIGRATION_TIMESTAMP]'
  AND role = 'consultant'
  AND user_id IN (
    SELECT user_id::text
    FROM consultants c
    WHERE c.created_at < '[MIGRATION_TIMESTAMP]'
  );
```

**Note:** Only rollback if absolutely necessary. Better to fix forward.

---

## Testing Checklist

- [ ] Run diagnostic query to confirm 8 orphaned consultants
- [ ] Back up database (recommended)
- [ ] Run migration in Supabase SQL Editor
- [ ] Verify output shows 8 profiles restored
- [ ] Run verification query to confirm 0 orphaned remain
- [ ] Check browser: Dashboard → Transaction History (50 per page)
- [ ] Verify booking transactions show consultant names
- [ ] Confirm 37 bookings for "demo-consultant@demo.com" now show name
- [ ] Test new bookings to ensure consultant names still work

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Consultants with profiles | 2 (20%) | 10 (100%) |
| Orphaned consultants | 8 (80%) | 0 (0%) |
| Bookings showing consultant name | ~20 | ~107 |
| UI display for orphaned | "Unknown Consultant" | Actual consultant name |

**Expected Improvement:** All 107 booking transactions will now show proper consultant information!
