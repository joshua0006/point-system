-- Add missing foreign key so PostgREST can join campaign_participants -> lead_gen_campaigns
DO $$
BEGIN
  -- Only add if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'campaign_participants'
      AND c.conname = 'campaign_participants_campaign_id_fkey'
  ) THEN
    ALTER TABLE public.campaign_participants
      ADD CONSTRAINT campaign_participants_campaign_id_fkey
      FOREIGN KEY (campaign_id)
      REFERENCES public.lead_gen_campaigns (id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Helpful index for performance on joins/filters
CREATE INDEX IF NOT EXISTS idx_campaign_participants_campaign_id
  ON public.campaign_participants (campaign_id);
