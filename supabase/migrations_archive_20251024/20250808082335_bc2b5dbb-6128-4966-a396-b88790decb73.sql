-- Enable RLS and add SELECT policies so the UI can read existing campaigns and templates

-- Campaign templates should be publicly readable when active
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public can view active campaign templates"
ON public.campaign_templates
FOR SELECT
USING (is_active = true);

-- Lead gen campaigns list should be readable to authenticated users when active
ALTER TABLE public.lead_gen_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view active lead gen campaigns"
ON public.lead_gen_campaigns
FOR SELECT
USING (status = 'active');

-- Users should be able to read only their own participation records
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view their own campaign participation"
ON public.campaign_participants
FOR SELECT
USING (auth.uid() = user_id);
