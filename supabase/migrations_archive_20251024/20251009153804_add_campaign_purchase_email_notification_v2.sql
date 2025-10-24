-- Migration: Add email notification trigger for campaign purchases
-- This trigger sends an email to tanjunsing@gmail.com whenever a user purchases/joins a campaign
--
-- SETUP INSTRUCTIONS:
-- 1. Deploy the Edge Function: supabase functions deploy send-campaign-purchase-notification
-- 2. Ensure RESEND_API_KEY is set in Edge Function secrets
-- 3. Update the SUPABASE_URL in the trigger function below if different
-- 4. Run this migration: supabase db push

-- Create function to send campaign purchase notification email via Edge Function
CREATE OR REPLACE FUNCTION public.notify_campaign_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign_name TEXT;
  v_campaign_type TEXT;
  v_buyer_name TEXT;
  v_buyer_email TEXT;
  v_consultant_name TEXT;
  v_payload JSONB;
  v_supabase_url TEXT := 'https://rrnaquethuzvbsxcssss.supabase.co';
BEGIN
  -- Get campaign details
  SELECT
    name,
    COALESCE(campaign_type, 'general')
  INTO v_campaign_name, v_campaign_type
  FROM public.lead_gen_campaigns
  WHERE id = NEW.campaign_id;

  -- Get buyer details from profiles
  SELECT
    COALESCE(full_name, 'Unknown User'),
    COALESCE(email, 'no-email@example.com')
  INTO v_buyer_name, v_buyer_email
  FROM public.profiles
  WHERE user_id = NEW.user_id::text;

  -- Set consultant name
  v_consultant_name := COALESCE(NEW.consultant_name, 'Not Assigned');

  -- Build payload for Edge Function
  v_payload := jsonb_build_object(
    'campaignId', NEW.campaign_id::text,
    'campaignName', COALESCE(v_campaign_name, 'Unknown Campaign'),
    'campaignType', v_campaign_type,
    'buyerUserId', NEW.user_id::text,
    'buyerName', v_buyer_name,
    'buyerEmail', v_buyer_email,
    'budgetContribution', NEW.budget_contribution,
    'consultantName', v_consultant_name,
    'purchaseDate', COALESCE(NEW.joined_at::text, NOW()::text)
  );

  -- Call Edge Function asynchronously using pg_net
  -- This uses the service role internally and doesn't block the transaction
  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-campaign-purchase-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := v_payload,
    timeout_milliseconds := 5000
  );

  -- Log the notification attempt
  RAISE LOG 'Campaign purchase notification queued: campaign=%, user=%, budget=%',
    v_campaign_name, v_buyer_name, NEW.budget_contribution;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the INSERT operation
    -- This ensures campaign purchases aren't blocked by email notification failures
    RAISE WARNING 'Failed to queue campaign purchase notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Create trigger that fires after a new campaign purchase
DROP TRIGGER IF EXISTS trigger_campaign_purchase_notification ON public.campaign_participants;

CREATE TRIGGER trigger_campaign_purchase_notification
  AFTER INSERT ON public.campaign_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_campaign_purchase();

-- Add helpful comments for documentation
COMMENT ON FUNCTION public.notify_campaign_purchase() IS
  'Sends an email notification to tanjunsing@gmail.com when a user purchases/joins a campaign.
   Called automatically via trigger on campaign_participants INSERT.
   Uses pg_net to make async HTTP request to Edge Function.';

COMMENT ON TRIGGER trigger_campaign_purchase_notification ON public.campaign_participants IS
  'Automatically sends email notification when a new campaign is purchased.
   Email sent to: tanjunsing@gmail.com
   Edge Function: send-campaign-purchase-notification';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.notify_campaign_purchase() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_campaign_purchase() TO service_role;
