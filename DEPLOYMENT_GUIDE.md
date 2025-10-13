# Campaign Purchase Notification - Deployment Guide

## Overview
This guide will help you deploy the automatic email notification system that sends alerts to `tanjunsing@gmail.com` whenever a user purchases a campaign.

## Prerequisites

### 1. Install Supabase CLI

**Linux (recommended for this environment):**
```bash
# Using brew (if available)
brew install supabase/tap/supabase

# OR using direct download
curl -o- https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash

# OR using npm/npx (run commands with npx)
# No installation needed, just use: npx supabase <command>
```

**Verify installation:**
```bash
supabase --version
# OR
npx supabase --version
```

### 2. Login to Supabase

```bash
supabase login
# OR
npx supabase login
```

This will open a browser window for authentication.

### 3. Link to Your Project

```bash
cd /home/workspace/Downloads/point-perk-plaza-main
supabase link --project-ref rrnaquethuzvbsxcssss
# OR
npx supabase link --project-ref rrnaquethuzvbsxcssss
```

## Deployment Steps

### Step 1: Deploy the Edge Function

```bash
supabase functions deploy send-campaign-purchase-notification
# OR
npx supabase functions deploy send-campaign-purchase-notification
```

**Expected output:**
```
Deploying Function send-campaign-purchase-notification (project: rrnaquethuzvbsxcssss)
✓ Function deployed successfully
Function URL: https://rrnaquethuzvbsxcssss.supabase.co/functions/v1/send-campaign-purchase-notification
```

### Step 2: Set Environment Secrets

Check if RESEND_API_KEY is already set:
```bash
supabase secrets list
# OR
npx supabase secrets list
```

If not set, add it:
```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
# OR
npx supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

**To get your Resend API key:**
1. Go to https://resend.com
2. Login/Create account
3. Navigate to API Keys
4. Create a new key or copy existing one

### Step 3: Apply Database Migration

This creates the trigger that automatically calls the email function:

```bash
supabase db push
# OR
npx supabase db push
```

**Expected output:**
```
Applying migration 20251009153804_add_campaign_purchase_email_notification_v2.sql...
✓ Migration applied successfully
```

## Verification

### 1. Check Function Deployment

```bash
supabase functions list
# OR
npx supabase functions list
```

You should see `send-campaign-purchase-notification` in the list.

### 2. Test the Function (Optional)

Create a test request:
```bash
curl -X POST 'https://rrnaquethuzvbsxcssss.supabase.co/functions/v1/send-campaign-purchase-notification' \
  -H 'Content-Type: application/json' \
  -d '{
    "campaignId": "test-123",
    "campaignName": "Test Campaign",
    "campaignType": "facebook-ads",
    "buyerUserId": "test-user-123",
    "buyerName": "Test Buyer",
    "buyerEmail": "buyer@example.com",
    "budgetContribution": 5000,
    "consultantName": "Test Consultant",
    "purchaseDate": "2025-10-09T12:00:00Z"
  }'
```

Check your email (tanjunsing@gmail.com) for the test notification.

### 3. Check Trigger in Database

Connect to your database and verify the trigger exists:

```sql
-- Check function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'notify_campaign_purchase';

-- Check trigger exists
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'trigger_campaign_purchase_notification';
```

### 4. Monitor Function Logs

```bash
supabase functions logs send-campaign-purchase-notification --follow
# OR
npx supabase functions logs send-campaign-purchase-notification --follow
```

## Testing in Production

1. Go to your application
2. Purchase/join a campaign as a regular user
3. Check that tanjunsing@gmail.com receives an email notification
4. Verify the email contains:
   - Campaign details (name, ID, type)
   - Buyer information (name, email, user ID)
   - Budget contribution
   - Purchase timestamp
   - Links to admin dashboard

## Troubleshooting

### Issue: Function deployment fails

**Solution:**
```bash
# Check if you're logged in
supabase projects list

# Check if project is linked
cat .supabase/config.toml

# Try re-linking
supabase link --project-ref rrnaquethuzvbsxcssss
```

### Issue: Emails not sending

**Checklist:**
1. ✅ RESEND_API_KEY is set: `supabase secrets list`
2. ✅ Function is deployed: `supabase functions list`
3. ✅ Trigger exists in database
4. ✅ Check function logs for errors: `supabase functions logs send-campaign-purchase-notification`
5. ✅ Verify Resend API key is valid at https://resend.com

### Issue: Trigger not firing

**Debug steps:**
```sql
-- Check PostgreSQL logs
SELECT * FROM pg_stat_statements
WHERE query LIKE '%notify_campaign_purchase%';

-- Check pg_net requests
SELECT * FROM net._http_response
ORDER BY created DESC
LIMIT 10;

-- Test trigger manually
INSERT INTO campaign_participants (campaign_id, user_id, consultant_name, budget_contribution)
VALUES (
  (SELECT id FROM lead_gen_campaigns LIMIT 1),
  (SELECT user_id FROM profiles LIMIT 1),
  'Test Consultant',
  1000
);
```

### Issue: Migration fails

**Common causes:**
1. Migration already applied
2. Database schema conflicts
3. Permissions issues

**Solution:**
```bash
# Check migration status
supabase db diff

# Reset if needed (CAUTION: only in development)
supabase db reset

# Or manually apply the migration file
psql $DATABASE_URL < supabase/migrations/20251009153804_add_campaign_purchase_email_notification_v2.sql
```

## Manual Deployment (Alternative)

If CLI issues persist, you can deploy manually through Supabase Dashboard:

### 1. Deploy Function via Dashboard
1. Go to https://supabase.com/dashboard/project/rrnaquethuzvbsxcssss
2. Navigate to Edge Functions
3. Click "New function"
4. Name: `send-campaign-purchase-notification`
5. Copy code from `supabase/functions/send-campaign-purchase-notification/index.ts`
6. Deploy

### 2. Set Secrets via Dashboard
1. Go to Project Settings → Edge Functions
2. Add secret: `RESEND_API_KEY` = your_key

### 3. Apply Migration via SQL Editor
1. Go to SQL Editor
2. Open `supabase/migrations/20251009153804_add_campaign_purchase_email_notification_v2.sql`
3. Copy and run the SQL

## Files Modified/Created

- ✅ `supabase/functions/send-campaign-purchase-notification/index.ts` - Email sending function
- ✅ `supabase/functions/send-campaign-purchase-notification/README.md` - Function documentation
- ✅ `supabase/migrations/20251009153804_add_campaign_purchase_email_notification_v2.sql` - Database trigger
- ✅ `supabase/config.toml` - Added function configuration
- ✅ `DEPLOYMENT_GUIDE.md` - This file

## Support

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Resend API**: https://resend.com/docs
- **PostgreSQL Triggers**: https://www.postgresql.org/docs/current/trigger-definition.html

## Quick Command Reference

```bash
# Using npx (no installation needed)
npx supabase login
npx supabase link --project-ref rrnaquethuzvbsxcssss
npx supabase functions deploy send-campaign-purchase-notification
npx supabase secrets set RESEND_API_KEY=your_key
npx supabase db push
npx supabase functions logs send-campaign-purchase-notification --follow

# OR using installed CLI
supabase login
supabase link --project-ref rrnaquethuzvbsxcssss
supabase functions deploy send-campaign-purchase-notification
supabase secrets set RESEND_API_KEY=your_key
supabase db push
supabase functions logs send-campaign-purchase-notification --follow
```

---

**Email Recipient**: tanjunsing@gmail.com
**Trigger**: INSERT on campaign_participants table
**Edge Function**: send-campaign-purchase-notification
**Migration**: 20251009153804_add_campaign_purchase_email_notification_v2.sql
