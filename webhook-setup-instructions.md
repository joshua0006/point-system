# Stripe Webhook Setup Instructions for Subscription Payments

## The Problem
Your $250 monthly subscription payment was processed by Stripe, but the webhook isn't configured to notify your application, so your flexi-credits weren't added.

## Solution: Configure Stripe Webhook

1. **Go to your Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/webhooks

2. **Add/Edit Your Webhook Endpoint**
   - Click "Add endpoint" or edit your existing webhook
   - Endpoint URL: `https://rrnaquethuzvbsxcssss.supabase.co/functions/v1/stripe-webhook`
   
3. **Select These Events** (CRITICAL):
   - `checkout.session.completed` (for one-time payments)
   - `invoice.payment_succeeded` (for subscription payments) ← THIS IS MISSING!
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

4. **Test the Webhook**
   - In Stripe dashboard, go to the webhook you just created
   - Click "Send test webhook"
   - Select "invoice.payment_succeeded"
   - Send the test

## What Happens Next
Once configured properly, future subscription payments will automatically:
- Add 250 flexi-credits to your account
- Create a transaction record
- Show up in your dashboard

## For Your Current Payment
Since your $250 payment already went through but wasn't processed by the webhook, you'll need to either:
1. Wait for next month's payment (webhook will work then)
2. Contact support to manually add the 250 credits
3. Cancel and re-subscribe (not recommended)

## Verification
After setting up the webhook, you can verify it's working by checking the Stripe webhook logs in your dashboard.