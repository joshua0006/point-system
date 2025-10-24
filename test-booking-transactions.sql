-- Test Query: Find Booking Transactions to Verify Consultant Names
-- This will show transactions that SHOULD display consultant names

-- Find your most recent booking transactions (replace USER_ID with your actual user_id)
SELECT
  t.id as transaction_id,
  t.type,
  t.amount,
  t.description,
  t.created_at,
  t.booking_id,
  b.id as booking_table_id,
  b.consultant_id,
  c.user_id as consultant_user_id,
  p.full_name as consultant_name,
  s.title as service_title
FROM flexi_credits_transactions t
LEFT JOIN bookings b ON t.booking_id = b.id
LEFT JOIN consultants c ON b.consultant_id = c.id
LEFT JOIN profiles p ON c.user_id::text = p.user_id
LEFT JOIN services s ON b.service_id = s.id
WHERE t.booking_id IS NOT NULL
  -- AND t.user_id = '36e4ea38-e1c1-47b4-90af-a36a7459b21a'  -- Uncomment and replace with your user_id
ORDER BY t.created_at DESC
LIMIT 10;

-- Alternative: Find ALL booking transactions for current user
-- Replace '36e4ea38-e1c1-47b4-90af-a36a7459b21a' with your actual user_id from profiles table
