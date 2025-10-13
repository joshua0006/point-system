# Campaign Purchase Notification Email Function

## Overview
This Supabase Edge Function sends an email notification to `tanjunsing@gmail.com` whenever a user purchases or joins a campaign. It's automatically triggered by a database trigger on the `campaign_participants` table.

## Features
- Automatic email notifications on campaign purchases
- Beautiful HTML email template with campaign and buyer details
- Non-blocking asynchronous operation (doesn't slow down purchases)
- Error handling to prevent purchase failures due to email issues

## Architecture

```
User Purchases Campaign
         ↓
INSERT into campaign_participants
         ↓
Database Trigger (notify_campaign_purchase)
         ↓
HTTP POST via pg_net
         ↓
Edge Function (send-campaign-purchase-notification)
         ↓
Resend API
         ↓
Email sent to tanjunsing@gmail.com
```

## Email Content

The notification email includes:
- **Campaign Details**: Name, ID, Type, Consultant
- **Buyer Information**: Name, Email, User ID, Budget Contribution
- **Purchase Details**: Timestamp, Budget amount
- **Quick Links**: Admin Dashboard, Campaign Monitor
- **Action Items**: Review checklist for admin

## Setup Instructions

### 1. Deploy the Edge Function

```bash
# Deploy the function to Supabase
supabase functions deploy send-campaign-purchase-notification

# Or deploy all functions
supabase functions deploy
```

### 2. Set Environment Variables

Make sure these environment variables are set in your Supabase project:

```bash
# Set Resend API key
supabase secrets set RESEND_API_KEY=your_resend_api_key_here

# Verify secrets are set
supabase secrets list
```

### 3. Run the Database Migration

```bash
# Apply the migration
supabase db push

# Or manually run the migration
supabase migration up
```

### 4. Test the Function

You can test the function manually:

```bash
# Test via curl
curl -X POST 'https://rrnaquethuzvbsxcssss.supabase.co/functions/v1/send-campaign-purchase-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "campaignId": "test-campaign-id",
    "campaignName": "Test Campaign",
    "campaignType": "facebook-ads",
    "buyerUserId": "test-user-id",
    "buyerName": "Test User",
    "buyerEmail": "test@example.com",
    "budgetContribution": 5000,
    "consultantName": "Test Consultant",
    "purchaseDate": "2025-10-09T12:00:00Z"
  }'
```

## Database Trigger

The trigger is automatically created by the migration file:
- **Migration**: `20251009153804_add_campaign_purchase_email_notification_v2.sql`
- **Function**: `public.notify_campaign_purchase()`
- **Trigger**: `trigger_campaign_purchase_notification`
- **Table**: `public.campaign_participants`
- **Event**: AFTER INSERT

## Monitoring & Troubleshooting

### Check Function Logs

```bash
# View function logs
supabase functions logs send-campaign-purchase-notification

# Follow logs in real-time
supabase functions logs send-campaign-purchase-notification --follow
```

### Check Database Logs

```sql
-- Check PostgreSQL logs for trigger execution
SELECT * FROM pg_stat_statements
WHERE query LIKE '%notify_campaign_purchase%';

-- Check pg_net requests
SELECT * FROM net._http_response
ORDER BY created DESC
LIMIT 10;
```

### Common Issues

1. **Emails not sending**
   - Verify RESEND_API_KEY is set correctly
   - Check function logs for errors
   - Verify Resend API key has sending permissions

2. **Trigger not firing**
   - Check if trigger exists: `\df+ notify_campaign_purchase`
   - Check trigger is attached: `\d campaign_participants`
   - Look for warnings in PostgreSQL logs

3. **HTTP request failures**
   - Verify pg_net extension is enabled
   - Check Supabase URL is correct in trigger function
   - Verify network connectivity from database

## Email Service Configuration

This function uses [Resend](https://resend.com) for email delivery.

**Resend Setup:**
1. Create account at resend.com
2. Verify your sending domain (or use their test domain)
3. Generate an API key
4. Add API key to Supabase secrets

## Customization

### Change Recipient Email

Edit the trigger function to change the recipient:

```sql
-- In the migration file, update the edge function call
-- Or create a new migration to modify the function
```

### Modify Email Template

Edit `supabase/functions/send-campaign-purchase-notification/index.ts`:
- Update HTML template in the `resend.emails.send()` call
- Modify email subject, colors, or content
- Add additional campaign information

### Add Multiple Recipients

```typescript
// In index.ts, change the 'to' field:
to: ["tanjunsing@gmail.com", "another@example.com"],
```

## Performance Considerations

- **Asynchronous**: Uses `pg_net` for non-blocking HTTP requests
- **Error Handling**: Wrapped in try-catch to prevent purchase failures
- **Timeout**: 5-second timeout prevents hanging
- **Logging**: All attempts are logged for debugging

## Security

- Function uses `SECURITY DEFINER` to run with elevated privileges
- Only INSERT operations trigger notifications
- No sensitive data exposed in logs
- API keys stored in Supabase secrets (not in code)

## Dependencies

- `@supabase/supabase-js` - Supabase client
- `resend` - Email sending service
- `pg_net` - PostgreSQL HTTP extension

## Support

For issues or questions:
1. Check function logs: `supabase functions logs`
2. Check database logs for trigger warnings
3. Verify Resend API dashboard for delivery status
4. Review migration was applied: `supabase db diff`
