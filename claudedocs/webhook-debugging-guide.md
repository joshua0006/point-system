# 🔧 Stripe Webhook Debugging Guide

## Issue: Balance Not Updating After Payment

**Current Status:**
- Balance shows: `-591 FXC` (unchanged)
- Payment completed successfully (redirected to `/thank-you`)
- **NO webhook logs detected** in browser console or Supabase

---

## 🎯 Quick Diagnosis Checklist

### Step 1: Check Stripe Dashboard Webhook Configuration

1. **Open Stripe Webhooks**
   - Go to: https://dashboard.stripe.com/webhooks
   - (Test Mode): https://dashboard.stripe.com/test/webhooks

2. **Verify Endpoint URL**
   ```
   ✅ CORRECT: https://rrnaquethuzvbsxcssss.supabase.co/functions/v1/stripe-webhook
   ❌ WRONG:   https://your-app.com/api/webhook
   ```

3. **Verify Events Selected**
   Must include:
   ```
   ✅ checkout.session.completed
   ✅ invoice.payment_succeeded
   □ customer.subscription.created
   □ customer.subscription.updated
   □ customer.subscription.deleted
   ```

4. **Copy Webhook Signing Secret**
   - Click on your webhook endpoint
   - Click "Reveal" under "Signing secret"
   - Copy the secret (starts with `whsec_...`)

### Step 2: Verify Supabase Configuration

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT

2. **Check Edge Functions**
   - Navigate to: **Edge Functions** → `stripe-webhook`
   - Verify function status: ✅ **Deployed**

3. **Verify Environment Variables**
   - Navigate to: **Settings** → **Edge Functions** → **Secrets**
   - Check for: `STRIPE_WEBHOOK_SECRET`
   - Value should match the signing secret from Stripe

4. **Check Function Logs**
   - Navigate to: **Edge Functions** → `stripe-webhook` → **Logs**
   - Look for recent activity
   - Check for errors like:
     - `"Webhook signature verification failed"`
     - `"STRIPE_WEBHOOK_SECRET is not set"`
     - `"No stripe signature header"`

### Step 3: Test Webhook Manually

1. **In Stripe Dashboard**
   - Go to: **Developers** → **Webhooks**
   - Click on your webhook endpoint
   - Click **"Send test webhook"**

2. **Select Event Type**
   - Choose: `checkout.session.completed`
   - Click **"Send test webhook"**

3. **Check Supabase Logs**
   - Should see: `[STRIPE-WEBHOOK] Webhook received`
   - Should see: `[STRIPE-WEBHOOK] Event received`
   - Should see: `[STRIPE-WEBHOOK] Processing unlock credits payment`

### Step 4: Check Database for Transactions

Run this SQL query in Supabase SQL Editor:

```sql
-- Check recent transactions
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
```

**Expected Results:**
- Should see transaction with description: `"Unlock credits top-up - Session ses_xxx"`
- Should see transaction with description: `"Unlocked X awarded flexi credits"`

---

## 🔍 Common Issues & Solutions

### Issue 1: Webhook Secret Mismatch

**Symptoms:**
- Supabase logs show: `"Webhook signature verification failed"`

**Solution:**
1. Get signing secret from Stripe Dashboard
2. Update in Supabase: Settings → Edge Functions → Secrets
3. Add/Update: `STRIPE_WEBHOOK_SECRET` = `whsec_...`
4. Redeploy edge function if needed

### Issue 2: Events Not Selected

**Symptoms:**
- Webhook exists but doesn't receive events
- No logs in Supabase for `checkout.session.completed`

**Solution:**
1. Edit webhook in Stripe Dashboard
2. Ensure `checkout.session.completed` is checked
3. Save changes
4. Test with "Send test webhook"

### Issue 3: Function Not Deployed

**Symptoms:**
- 404 error when Stripe tries to send webhook
- Webhook shows "Failed" status in Stripe

**Solution:**
```bash
# Deploy the function
cd supabase/functions
supabase functions deploy stripe-webhook --no-verify-jwt
```

### Issue 4: Test Mode vs Live Mode Mismatch

**Symptoms:**
- Using test credit cards but webhook configured for live mode (or vice versa)

**Solution:**
- Ensure you're using test mode webhook for test payments
- Test webhook URL: https://dashboard.stripe.com/test/webhooks
- Live webhook URL: https://dashboard.stripe.com/webhooks

---

## 🚑 Emergency: Manual Credit Recovery

If webhook can't be fixed immediately and you need to add credits manually:

### Option 1: Admin Panel (Recommended)

1. Log in as admin
2. Go to **Admin Dashboard** → **User Management**
3. Find your user
4. Click **"Top Up"** or **"Award Credits"**
5. Add the missing credits

### Option 2: SQL Query (Advanced)

```sql
-- Add credits manually (replace values)
SELECT increment_flexi_credits_balance(
  '36e4ea38-e1c1-47b4-90af-a36a7459b21a'::uuid,  -- user_id
  100.0  -- amount to add (payment + unlocked credits)
);

-- Create transaction record
INSERT INTO flexi_credits_transactions (
  user_id,
  amount,
  type,
  description
) VALUES (
  '36e4ea38-e1c1-47b4-90af-a36a7459b21a',
  100.0,
  'admin_credit',
  'Manual credit recovery - Webhook failure'
);
```

### Option 3: Check Stripe Payment Intent

Find the actual payment amount:

1. Go to: https://dashboard.stripe.com/test/payments
2. Find your recent payment
3. Click on it to see details
4. Note the **Amount** and **Session ID**

---

## 📊 Webhook Flow Diagram

```
User Pays → Stripe Checkout
                ↓
        Stripe processes payment
                ↓
        Stripe sends webhook event
                ↓
        Supabase receives webhook
                ↓
        Verify signature (STRIPE_WEBHOOK_SECRET)
                ↓
        Process payment:
          - Add payment credits (increment_flexi_credits_balance)
          - Create transaction record
          - Call unlock-awarded-credits function
          - Add unlocked credits (increment_flexi_credits_balance)
                ↓
        Database updated
                ↓
        Frontend refreshes via:
          - refreshProfile() on ThankYou page
          - Realtime subscription
          - React Query invalidation
```

---

## 🧪 Complete Testing Procedure

### 1. Configure Webhook (One-time Setup)

```bash
# In Stripe Dashboard
Endpoint URL: https://rrnaquethuzvbsxcssss.supabase.co/functions/v1/stripe-webhook
Events: checkout.session.completed, invoice.payment_succeeded
Copy signing secret: whsec_xxx
```

### 2. Set Environment Variable

```bash
# In Supabase Dashboard
Settings → Edge Functions → Secrets
Add: STRIPE_WEBHOOK_SECRET = whsec_xxx
```

### 3. Test End-to-End

```bash
# 1. Make test payment
Use test card: 4242 4242 4242 4242

# 2. Check Supabase logs
Should see: [STRIPE-WEBHOOK] Processing unlock credits payment

# 3. Verify database
SELECT flexi_credits_balance FROM profiles WHERE user_id = 'YOUR_USER_ID';

# 4. Check frontend
Balance should update automatically on /thank-you page
```

---

## 📞 Getting Help

If webhook still doesn't work after following this guide:

1. **Check Supabase Edge Function Logs**
   - Copy any error messages
   - Note the timestamp

2. **Check Stripe Webhook Logs**
   - Go to Stripe Dashboard → Webhooks → Your endpoint
   - Click "Events & logs" tab
   - Check for failed deliveries

3. **Collect Diagnostic Info**
   - Stripe Session ID
   - Supabase Project ID
   - Error messages from logs
   - Current balance vs expected balance

---

## ✅ Success Criteria

After fixing the webhook, you should see:

1. **In Supabase Logs:**
   ```
   [STRIPE-WEBHOOK] Webhook received
   [STRIPE-WEBHOOK] Event received - {"type":"checkout.session.completed"}
   [STRIPE-WEBHOOK] Processing unlock credits payment
   [STRIPE-WEBHOOK] Payment credits added
   [STRIPE-WEBHOOK] Awarded credits unlocked successfully
   [STRIPE-WEBHOOK] Unlock credits payment fully processed
   ```

2. **In Browser Console:**
   ```
   Profile refreshed: {flexi_credits_balance: NEW_BALANCE}
   ```

3. **In Database:**
   - New transactions in `flexi_credits_transactions`
   - Updated `flexi_credits_balance` in `profiles`

4. **In UI:**
   - Balance updates immediately on `/thank-you` page
   - No page refresh needed
