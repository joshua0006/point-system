# Complete Stripe Webhook Setup Guide

## Problem Statement

**Issue**: Balance not updating after payment completion
**Root Cause**: Stripe webhook not configured or not firing
**Symptom**: No `[STRIPE-WEBHOOK]` logs in Supabase Edge Function logs

---

## Prerequisites

Before starting, ensure you have:
- Stripe account with test mode access
- Supabase project with deployed `stripe-webhook` edge function
- Admin access to both Stripe Dashboard and Supabase Dashboard

---

## Part 1: Stripe Dashboard Configuration

### Step 1: Access Webhook Configuration

1. **Go to Stripe Webhooks Page**
   - **Test Mode**: https://dashboard.stripe.com/test/webhooks
   - **Live Mode**: https://dashboard.stripe.com/webhooks

2. **Click "Add endpoint" or "Add an endpoint"**

### Step 2: Configure Endpoint URL

1. **Enter your Supabase Edge Function URL**:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/functions/v1/stripe-webhook
   ```

   **Example**:
   ```
   https://rrnaquethuzvbsxcssss.supabase.co/functions/v1/stripe-webhook
   ```

2. **Find Your Project Reference**:
   - Open Supabase Dashboard: https://supabase.com/dashboard
   - Go to your project
   - URL format: `https://supabase.com/dashboard/project/[PROJECT-REF]`
   - Copy the `[PROJECT-REF]` part

### Step 3: Select Events to Listen

**CRITICAL**: You must select these specific events:

✅ **Required Events**:
- `checkout.session.completed` - Fires when payment completes
- `invoice.payment_succeeded` - Fires for subscription payments

**Optional Events** (for subscription features):
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**How to Select Events**:
1. Click "Select events"
2. Search for "checkout.session.completed"
3. Check the box next to it
4. Search for "invoice.payment_succeeded"
5. Check the box next to it
6. Click "Add events"

### Step 4: Get Webhook Signing Secret

1. **After creating the endpoint**, you'll see the endpoint details page
2. **Locate "Signing secret" section**
3. **Click "Reveal" or "Click to reveal"**
4. **Copy the secret** - it starts with `whsec_`

   Example format: `whsec_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890`

---

## Part 2: Supabase Configuration

### Step 5: Add Webhook Secret to Supabase

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Function Secrets**
   - Click "Settings" in left sidebar
   - Click "Edge Functions"
   - Scroll to "Secrets" section

3. **Add the Webhook Secret**
   - Click "Add secret" or "New secret"
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Paste the `whsec_...` secret from Stripe
   - Click "Save" or "Add secret"

### Step 6: Verify Edge Function Deployment

1. **Check Function Status**
   - Go to "Edge Functions" in left sidebar
   - Find `stripe-webhook` function
   - Status should show: **✅ Deployed**

2. **If NOT Deployed, Deploy It**:
   ```bash
   cd supabase/functions
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

   **Why `--no-verify-jwt`?**: Stripe sends requests without Supabase JWT tokens, so we must disable JWT verification for webhook endpoints.

---

## Part 3: Testing the Webhook

### Step 7: Send Test Webhook from Stripe

1. **Go to Stripe Dashboard** → **Developers** → **Webhooks**
2. **Click on your webhook endpoint**
3. **Click "Send test webhook"** button (top right)
4. **Select event**: `checkout.session.completed`
5. **Click "Send test webhook"**

### Step 8: Verify in Supabase Logs

1. **Open Supabase Dashboard** → **Edge Functions** → `stripe-webhook` → **Logs**

2. **Expected Success Logs**:
   ```
   [STRIPE-WEBHOOK] Webhook received
   [STRIPE-WEBHOOK] Event received - {"type":"checkout.session.completed"}
   [STRIPE-WEBHOOK] Processing unlock credits payment
   [STRIPE-WEBHOOK] Payment credits added: X FXC
   [STRIPE-WEBHOOK] Awarded credits unlocked successfully
   [STRIPE-WEBHOOK] Unlock credits payment fully processed
   ```

3. **Common Error Messages**:

   **Error: "Webhook signature verification failed"**
   - **Cause**: `STRIPE_WEBHOOK_SECRET` mismatch
   - **Fix**: Re-copy signing secret from Stripe → Update in Supabase secrets

   **Error: "STRIPE_WEBHOOK_SECRET is not set"**
   - **Cause**: Environment variable not configured
   - **Fix**: Add secret in Supabase Edge Function secrets (Step 5)

   **Error: "No stripe signature header"**
   - **Cause**: Request not from Stripe or endpoint URL incorrect
   - **Fix**: Verify endpoint URL matches exactly

---

## Part 4: End-to-End Payment Test

### Step 9: Make Real Test Payment

1. **Go to your application** → **Unlock Credits** or **Top Up** page

2. **Use Stripe Test Card**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

3. **Complete Payment**
   - Click "Pay"
   - Wait for redirect to `/thank-you` page

### Step 10: Verify Balance Update

1. **Check Browser Console** (F12 → Console tab):
   ```
   ✅ Expected: Profile refreshed: {flexi_credits_balance: NEW_BALANCE}
   ❌ Bad: 100+ "Profile refreshed" messages (infinite loop - should be fixed now)
   ```

2. **Check Database Balance**:
   ```sql
   SELECT flexi_credits_balance, updated_at
   FROM profiles
   WHERE user_id = 'YOUR-USER-ID';
   ```

3. **Check Transaction History**:
   ```sql
   SELECT *
   FROM flexi_credits_transactions
   WHERE user_id = 'YOUR-USER-ID'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

   **Expected Transactions** (for unlock credits payment):
   - Transaction 1: `"Unlock credits top-up - Session ses_xxx"` (payment amount)
   - Transaction 2: `"Unlocked X awarded flexi credits"` (unlocked amount)

---

## Part 5: Troubleshooting

### Issue 1: Webhook Still Not Firing

**Symptoms**:
- No logs in Supabase Edge Function logs
- No `[STRIPE-WEBHOOK]` messages
- Balance unchanged after payment

**Diagnosis Steps**:

1. **Check Webhook Delivery Attempts in Stripe**:
   - Go to Stripe Dashboard → Webhooks → Your endpoint
   - Click "Events & logs" tab
   - Look for recent events

2. **Check Response Codes**:
   - **200 OK**: Webhook delivered successfully ✅
   - **404 Not Found**: Edge function URL incorrect ❌
   - **500 Internal Server Error**: Edge function error ❌
   - **Timeout**: Edge function too slow or crashed ❌

3. **Verify Event is Being Sent**:
   - After test payment, check "Events & logs" tab
   - If NO events appear, the problem is event selection (Step 3)

**Solutions**:

| Problem | Solution |
|---------|----------|
| 404 Error | Verify edge function URL is correct |
| 500 Error | Check Supabase function logs for errors |
| No events in Stripe | Re-select events in webhook configuration |
| Signature failed | Re-copy webhook secret to Supabase |

### Issue 2: Webhook Fires But Balance Not Updated

**Symptoms**:
- `[STRIPE-WEBHOOK]` logs appear
- But `flexi_credits_balance` unchanged

**Diagnosis**:

1. **Check Supabase Logs for Errors**:
   ```
   [STRIPE-WEBHOOK] Error in unlock credits payment processing
   ```

2. **Common Causes**:
   - Database permissions issue
   - RPC function error
   - User ID mismatch

**Run Diagnostic Queries**:
```sql
-- See payment-diagnostic-queries.sql for full diagnostic suite

-- Check if transaction was created
SELECT * FROM flexi_credits_transactions
WHERE user_id = 'YOUR-USER-ID'
AND description LIKE '%Session ses_%'
ORDER BY created_at DESC
LIMIT 1;

-- Check balance reconciliation
SELECT
  p.flexi_credits_balance as current_balance,
  COALESCE(SUM(CASE WHEN t.type IN ('purchase', 'credit', 'admin_credit') THEN t.amount ELSE 0 END), 0) as total_credits,
  COALESCE(SUM(CASE WHEN t.type IN ('debit', 'refund') THEN ABS(t.amount) ELSE 0 END), 0) as total_debits
FROM profiles p
LEFT JOIN flexi_credits_transactions t ON p.user_id = t.user_id
WHERE p.user_id = 'YOUR-USER-ID'
GROUP BY p.flexi_credits_balance;
```

### Issue 3: Infinite Loop (Should Be Fixed)

**Symptoms**:
- 100+ "Profile refreshed" messages in console
- Browser freezes or becomes slow

**Root Cause**:
- `refreshProfile` not wrapped in `useCallback`
- `useEffect` dependency array includes `refreshProfile`

**Fix Applied** (in this implementation):
- ✅ AuthContext.tsx: Wrapped `refreshProfile` in `useCallback`
- ✅ ThankYou.tsx: Removed `refreshProfile` from dependency array

---

## Part 6: Manual Recovery (Emergency Only)

### When to Use Manual Recovery

**ONLY use this if**:
- Webhook cannot be fixed immediately
- User needs credits urgently
- You have verified payment succeeded in Stripe

### Manual Credit Addition

1. **Find Payment Details in Stripe**:
   - Go to: https://dashboard.stripe.com/test/payments
   - Find the payment
   - Note: Amount paid, Session ID

2. **Run SQL Query** (in Supabase SQL Editor):
   ```sql
   BEGIN;

   -- Add credits to balance
   SELECT increment_flexi_credits_balance(
     'YOUR-USER-ID'::uuid,
     100.0  -- Replace with actual payment amount
   );

   -- Create transaction record
   INSERT INTO flexi_credits_transactions (
     user_id,
     amount,
     type,
     description
   ) VALUES (
     'YOUR-USER-ID',
     100.0,  -- Replace with actual payment amount
     'admin_credit',
     'Manual recovery - Webhook failure - Session ses_XXXXXX'  -- Replace with actual session ID
   );

   COMMIT;
   ```

3. **Verify Balance Updated**:
   ```sql
   SELECT flexi_credits_balance, updated_at
   FROM profiles
   WHERE user_id = 'YOUR-USER-ID';
   ```

---

## Part 7: Verification Checklist

### Pre-Launch Checklist

Before going live with payments, verify:

- [ ] Webhook endpoint URL is correct in Stripe
- [ ] Events `checkout.session.completed` and `invoice.payment_succeeded` are selected
- [ ] Webhook signing secret is correctly set in Supabase secrets
- [ ] Edge function `stripe-webhook` is deployed
- [ ] Test webhook sends successfully from Stripe Dashboard
- [ ] Test payment updates balance correctly
- [ ] Transaction records are created in database
- [ ] No infinite loops in browser console
- [ ] Balance reconciliation query shows no discrepancies

### Post-Payment Success Criteria

After successful payment, you should see:

1. **In Stripe Dashboard**:
   - Event appears in webhook logs
   - Response code: 200 OK

2. **In Supabase Logs**:
   - `[STRIPE-WEBHOOK] Webhook received`
   - `[STRIPE-WEBHOOK] Processing unlock credits payment`
   - `[STRIPE-WEBHOOK] Payment credits added`
   - `[STRIPE-WEBHOOK] Unlock credits payment fully processed`

3. **In Browser Console**:
   - `Profile refreshed: {flexi_credits_balance: NEW_BALANCE}`
   - NO infinite loops (should only see 1-2 refresh messages)

4. **In Database**:
   - `flexi_credits_balance` increased by payment amount + unlocked credits
   - New transactions in `flexi_credits_transactions`
   - `updated_at` timestamp is recent

---

## Quick Reference

### Essential URLs

| Resource | Test Mode | Live Mode |
|----------|-----------|-----------|
| Webhooks | https://dashboard.stripe.com/test/webhooks | https://dashboard.stripe.com/webhooks |
| Payments | https://dashboard.stripe.com/test/payments | https://dashboard.stripe.com/payments |
| Events | https://dashboard.stripe.com/test/events | https://dashboard.stripe.com/events |

### Key Files

- Webhook handler: `supabase/functions/stripe-webhook/index.ts`
- Unlock logic: `supabase/functions/unlock-awarded-credits/index.ts`
- Auth context: `src/contexts/AuthContext.tsx`
- Thank you page: `src/pages/ThankYou.tsx`
- Unlock hook: `src/hooks/useUnlockAwardedCredits.ts`

### Diagnostic Files

- Troubleshooting guide: `claudedocs/webhook-debugging-guide.md`
- SQL queries: `claudedocs/payment-diagnostic-queries.sql`
- This guide: `claudedocs/stripe-webhook-setup-complete-guide.md`

---

## Support

If webhook still doesn't work after following this guide:

1. **Collect Information**:
   - Stripe session ID
   - Supabase project ID
   - Error messages from Supabase logs
   - Webhook delivery status from Stripe
   - User ID experiencing the issue

2. **Run Full Diagnostics**:
   ```bash
   # See payment-diagnostic-queries.sql
   ```

3. **Check Both Sides**:
   - Stripe: Events & logs tab shows delivery attempts
   - Supabase: Edge function logs show processing attempts

---

**Last Updated**: 2025-10-15
**Status**: Implementation complete with infinite loop fixes
