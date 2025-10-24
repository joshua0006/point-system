-- Add proration fields to campaign_participants
ALTER TABLE public.campaign_participants
  ADD COLUMN IF NOT EXISTS proration_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS monthly_budget integer;

-- Note: No changes to RLS; participants are created by service role or existing flows.
