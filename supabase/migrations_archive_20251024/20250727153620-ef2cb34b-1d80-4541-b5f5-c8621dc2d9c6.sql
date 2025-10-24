-- Create user_campaign_permissions table
CREATE TABLE public.user_campaign_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_audience TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_participate BOOLEAN NOT NULL DEFAULT false,
  can_manage BOOLEAN NOT NULL DEFAULT false,
  min_budget INTEGER,
  max_budget INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_audience, campaign_type)
);

-- Create campaign_access_rules table
CREATE TABLE public.campaign_access_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_audience TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  required_user_tier TEXT NOT NULL DEFAULT 'bronze',
  required_completed_campaigns INTEGER NOT NULL DEFAULT 0,
  min_budget INTEGER,
  max_budget INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(target_audience, campaign_type)
);

-- Enable RLS
ALTER TABLE public.user_campaign_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_access_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for user_campaign_permissions
CREATE POLICY "Users can view their own campaign permissions"
ON public.user_campaign_permissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all campaign permissions"
ON public.user_campaign_permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage campaign permissions"
ON public.user_campaign_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create policies for campaign_access_rules
CREATE POLICY "Everyone can view active access rules"
ON public.campaign_access_rules
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage access rules"
ON public.campaign_access_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_user_campaign_permissions_updated_at
BEFORE UPDATE ON public.user_campaign_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_access_rules_updated_at
BEFORE UPDATE ON public.campaign_access_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();