-- Diagnostic Query: Check for Booking Transactions
-- Run this in Supabase SQL Editor to investigate consultant column issue

-- 1. Check total transactions
SELECT
  'Total Transactions' as check_type,
  COUNT(*) as count
FROM flexi_credits_transactions;

-- 2. Check transactions WITH booking_id
SELECT
  'Transactions with booking_id' as check_type,
  COUNT(*) as count
FROM flexi_credits_transactions
WHERE booking_id IS NOT NULL;

-- 3. Check transactions WITHOUT booking_id
SELECT
  'Transactions without booking_id' as check_type,
  COUNT(*) as count
FROM flexi_credits_transactions
WHERE booking_id IS NULL;

-- 4. Check total bookings
SELECT
  'Total Bookings' as check_type,
  COUNT(*) as count
FROM bookings;

-- 5. Sample of transactions with booking details
SELECT
  t.id,
  t.type,
  t.amount,
  t.description,
  t.booking_id,
  t.created_at,
  CASE WHEN t.booking_id IS NOT NULL THEN 'HAS_BOOKING' ELSE 'NO_BOOKING' END as booking_status
FROM flexi_credits_transactions t
ORDER BY t.created_at DESC
LIMIT 10;

-- 6. Check if bookings have consultant relationships
SELECT
  b.id as booking_id,
  b.consultant_id,
  c.id as consultant_table_id,
  c.user_id as consultant_user_id,
  p.full_name as consultant_name
FROM bookings b
LEFT JOIN consultants c ON b.consultant_id = c.id
LEFT JOIN profiles p ON c.user_id::text = p.user_id
LIMIT 5;
