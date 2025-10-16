-- Enforce one active campaign per user per campaign type
-- This migration creates partial unique indexes to prevent users from having
-- multiple active cold calling or VA support campaigns simultaneously

-- Create a helper function to extract campaign type from campaign name
-- This function categorizes campaigns based on their name pattern
CREATE OR REPLACE FUNCTION public.get_campaign_type_from_name(campaign_name text)
RETURNS text AS $$
BEGIN
  IF campaign_name ILIKE 'Cold Calling Campaign%' THEN
    RETURN 'cold-calling';
  ELSIF campaign_name ILIKE 'VA Support Campaign%' THEN
    RETURN 'va-support';
  ELSE
    RETURN 'other';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a composite partial unique index for cold calling campaigns
-- This prevents a user from having multiple active cold calling campaigns
-- Only enforces uniqueness when billing_status = 'active'
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_cold_calling_per_user
ON public.campaign_participants (user_id, (
  SELECT get_campaign_type_from_name(name)
  FROM public.lead_gen_campaigns
  WHERE id = campaign_participants.campaign_id
))
WHERE billing_status = 'active'
  AND (
    SELECT get_campaign_type_from_name(name)
    FROM public.lead_gen_campaigns
    WHERE id = campaign_participants.campaign_id
  ) = 'cold-calling';

-- Create a composite partial unique index for VA support campaigns
-- This prevents a user from having multiple active VA support campaigns
-- Only enforces uniqueness when billing_status = 'active'
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_va_support_per_user
ON public.campaign_participants (user_id, (
  SELECT get_campaign_type_from_name(name)
  FROM public.lead_gen_campaigns
  WHERE id = campaign_participants.campaign_id
))
WHERE billing_status = 'active'
  AND (
    SELECT get_campaign_type_from_name(name)
    FROM public.lead_gen_campaigns
    WHERE id = campaign_participants.campaign_id
  ) = 'va-support';

-- Add helpful comment to the campaign_participants table
COMMENT ON TABLE public.campaign_participants IS
'Tracks user participation in lead generation campaigns.
Constraint: Users can have only one active cold calling and one active VA support campaign at a time.
This is enforced by partial unique indexes: idx_unique_active_cold_calling_per_user and idx_unique_active_va_support_per_user.';

-- Add comment to explain the constraint
COMMENT ON COLUMN public.campaign_participants.billing_status IS
'Billing status of campaign participation.
When set to ''active'', uniqueness constraints apply per campaign type (cold-calling, va-support).';
