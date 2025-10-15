-- =====================================================
-- Payment & Balance Diagnostic Queries
-- =====================================================
-- Use these queries in Supabase SQL Editor to diagnose
-- payment and balance update issues
-- =====================================================

-- -----------------------------------------------------
-- 1. CHECK CURRENT USER BALANCE
-- -----------------------------------------------------
SELECT
  user_id,
  email,
  full_name,
  flexi_credits_balance,
  updated_at,
  created_at
FROM profiles
WHERE user_id = '36e4ea38-e1c1-47b4-90af-a36a7459b21a';

-- Expected: flexi_credits_balance should reflect all payments


-- -----------------------------------------------------
-- 2. CHECK RECENT TRANSACTIONS (Last 10)
-- -----------------------------------------------------
SELECT
  id,
  user_id,
  amount,
  type,
  description,
  created_at
FROM flexi_credits_transactions
WHERE user_id = '36e4ea38-e1c1-47b4-90af-a36a7459b21a'
ORDER BY created_at DESC
LIMIT 10;

-- Expected: Should see transactions like:
-- "Unlock credits top-up - Session ses_xxx"
-- "Unlocked X awarded flexi credits"


-- -----------------------------------------------------
-- 3. CHECK FOR MISSING PAYMENT TRANSACTIONS
-- -----------------------------------------------------
-- Find payments that might have been missed
SELECT
  id,
  user_id,
  amount,
  type,
  description,
  created_at
FROM flexi_credits_transactions
WHERE user_id = '36e4ea38-e1c1-47b4-90af-a36a7459b21a'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- If you made a payment in last 24h but don't see it here,
-- the webhook didn't fire


-- -----------------------------------------------------
-- 4. CALCULATE EXPECTED BALANCE
-- -----------------------------------------------------
-- This shows what your balance SHOULD be based on transactions
SELECT
  user_id,
  SUM(CASE WHEN type IN ('purchase', 'credit', 'admin_credit') THEN amount ELSE 0 END) as total_credits,
  SUM(CASE WHEN type IN ('debit', 'refund') THEN amount ELSE 0 END) as total_debits,
  SUM(CASE WHEN type IN ('purchase', 'credit', 'admin_credit') THEN amount ELSE 0 END) -
  SUM(CASE WHEN type IN ('debit', 'refund') THEN amount ELSE 0 END) as calculated_balance
FROM flexi_credits_transactions
WHERE user_id = '36e4ea38-e1c1-47b4-90af-a36a7459b21a'
GROUP BY user_id;

-- Compare calculated_balance with flexi_credits_balance from profiles


-- -----------------------------------------------------
-- 5. CHECK AWARDED CREDITS STATUS
-- -----------------------------------------------------
SELECT
  id,
  user_id,
  total_amount,
  locked_amount,
  unlocked_amount,
  status,
  awarded_date,
  expires_at,
  reason
FROM awarded_flexi_credits
WHERE user_id = '36e4ea38-e1c1-47b4-90af-a36a7459b21a'
ORDER BY awarded_date DESC;

-- Check locked_amount to see if you have credits to unlock


-- -----------------------------------------------------
-- 6. CHECK UNLOCK HISTORY
-- -----------------------------------------------------
SELECT
  acu.id,
  acu.user_id,
  acu.awarded_credit_id,
  acu.topup_transaction_id,
  acu.amount_unlocked,
  acu.topup_amount_used,
  acu.created_at,
  afc.total_amount as award_total,
  afc.reason as award_reason
FROM awarded_credits_unlocks acu
JOIN awarded_flexi_credits afc ON acu.awarded_credit_id = afc.id
WHERE acu.user_id = '36e4ea38-e1c1-47b4-90af-a36a7459b21a'
ORDER BY acu.created_at DESC;

-- Shows history of credit unlocking


-- =====================================================
-- MANUAL RECOVERY QUERIES
-- =====================================================
-- Use these ONLY if webhook failed and you need to
-- manually add credits
-- =====================================================

-- -----------------------------------------------------
-- 7. MANUALLY ADD CREDITS (Use with caution!)
-- -----------------------------------------------------
-- IMPORTANT: Replace values before running
-- Example: Adding 50 credits for a failed $50 payment
/*
BEGIN;

-- Add credits to balance
SELECT increment_flexi_credits_balance(
  '36e4ea38-e1c1-47b4-90af-a36a7459b21a'::uuid,  -- YOUR user_id
  50.0  -- Amount to add (payment amount)
);

-- Create transaction record
INSERT INTO flexi_credits_transactions (
  user_id,
  amount,
  type,
  description
) VALUES (
  '36e4ea38-e1c1-47b4-90af-a36a7459b21a',
  50.0,
  'admin_credit',
  'Manual recovery - Webhook failure - Session ses_XXXXX'
);

COMMIT;
*/


-- -----------------------------------------------------
-- 8. VERIFY MANUAL ADDITION
-- -----------------------------------------------------
-- Run this after manual credit addition
SELECT
  flexi_credits_balance,
  updated_at
FROM profiles
WHERE user_id = '36e4ea38-e1c1-47b4-90af-a36a7459b21a';

-- Check that balance updated and timestamp is recent


-- =====================================================
-- WEBHOOK DIAGNOSTIC QUERIES
-- =====================================================

-- -----------------------------------------------------
-- 9. CHECK FOR DUPLICATE TRANSACTIONS
-- -----------------------------------------------------
-- Looks for transactions that might indicate webhook fired twice
SELECT
  description,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  ARRAY_AGG(id) as transaction_ids
FROM flexi_credits_transactions
WHERE user_id = '36e4ea38-e1c1-47b4-90af-a36a7459b21a'
GROUP BY description
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- If count > 1 for same session, webhook fired multiple times


-- -----------------------------------------------------
-- 10. BALANCE RECONCILIATION REPORT
-- -----------------------------------------------------
-- Comprehensive balance check
WITH
  profile_balance AS (
    SELECT
      user_id,
      flexi_credits_balance as current_balance,
      updated_at
    FROM profiles
    WHERE user_id = '36e4ea38-e1c1-47b4-90af-a36a7459b21a'
  ),
  transaction_summary AS (
    SELECT
      user_id,
      SUM(CASE WHEN type IN ('purchase', 'credit', 'admin_credit') THEN amount ELSE 0 END) as total_credits,
      SUM(CASE WHEN type IN ('debit', 'refund') THEN ABS(amount) ELSE 0 END) as total_debits,
      COUNT(*) as transaction_count
    FROM flexi_credits_transactions
    WHERE user_id = '36e4ea38-e1c1-47b4-90af-a36a7459b21a'
    GROUP BY user_id
  )
SELECT
  pb.user_id,
  pb.current_balance,
  ts.total_credits,
  ts.total_debits,
  (ts.total_credits - ts.total_debits) as calculated_balance,
  (pb.current_balance - (ts.total_credits - ts.total_debits)) as discrepancy,
  ts.transaction_count,
  pb.updated_at as last_balance_update
FROM profile_balance pb
LEFT JOIN transaction_summary ts ON pb.user_id = ts.user_id;

-- If discrepancy != 0, there's a balance mismatch
-- Positive discrepancy = balance higher than transactions
-- Negative discrepancy = balance lower than transactions (missing credits)


-- =====================================================
-- NOTES
-- =====================================================
--
-- Normal unlock payment flow creates these transactions:
-- 1. "Unlock credits top-up - Session ses_xxx" (payment amount as credits)
-- 2. "Unlocked X awarded flexi credits" (unlocked credits)
--
-- Total balance increase = payment_amount + unlocked_amount
-- Example: $100 payment unlocks 50 awarded credits
--          Balance increases by: 100 + 50 = 150 FXC
--
-- If you don't see BOTH transactions, webhook partially failed
-- =====================================================
