-- Enable RLS and add SELECT policies so the UI can read existing campaigns and templates (idempotent)

-- Campaign templates should be publicly readable when active
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaign_templates'
      AND policyname = 'Public can view active campaign templates'
  ) THEN
    CREATE POLICY "Public can view active campaign templates"
    ON public.campaign_templates
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- Lead gen campaigns list should be readable to authenticated users when active
ALTER TABLE public.lead_gen_campaigns ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lead_gen_campaigns'
      AND policyname = 'Users can view active lead gen campaigns'
  ) THEN
    CREATE POLICY "Users can view active lead gen campaigns"
    ON public.lead_gen_campaigns
    FOR SELECT
    USING (status = 'active');
  END IF;
END $$;

-- Users should be able to read only their own participation records
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaign_participants'
      AND policyname = 'Users can view their own campaign participation'
  ) THEN
    CREATE POLICY "Users can view their own campaign participation"
    ON public.campaign_participants
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;
