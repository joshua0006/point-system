-- Create user groups table for grouping users with similar permissions
CREATE TABLE public.user_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user campaign permissions table
CREATE TABLE public.user_campaign_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_audience TEXT,
  campaign_type TEXT,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_participate BOOLEAN NOT NULL DEFAULT true,
  can_manage BOOLEAN NOT NULL DEFAULT false,
  min_budget INTEGER,
  max_budget INTEGER,
  geographic_restrictions TEXT[],
  time_restrictions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create user group memberships table
CREATE TABLE public.user_group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  UNIQUE(user_id, group_id)
);

-- Create campaign access rules table for template-based permissions
CREATE TABLE public.campaign_access_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  target_audience TEXT,
  campaign_type TEXT,
  required_user_tier TEXT,
  required_completed_campaigns INTEGER DEFAULT 0,
  min_budget INTEGER,
  max_budget INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_campaign_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_access_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_groups
CREATE POLICY "Admins can manage user groups" 
ON public.user_groups 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can view user groups" 
ON public.user_groups 
FOR SELECT 
USING (true);

-- RLS policies for user_campaign_permissions
CREATE POLICY "Admins can manage all permissions" 
ON public.user_campaign_permissions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can view their own permissions" 
ON public.user_campaign_permissions 
FOR SELECT 
USING (user_id = auth.uid());

-- RLS policies for user_group_memberships
CREATE POLICY "Admins can manage group memberships" 
ON public.user_group_memberships 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can view their own memberships" 
ON public.user_group_memberships 
FOR SELECT 
USING (user_id = auth.uid());

-- RLS policies for campaign_access_rules
CREATE POLICY "Admins can manage access rules" 
ON public.campaign_access_rules 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can view active access rules" 
ON public.campaign_access_rules 
FOR SELECT 
USING (is_active = true);

-- Create triggers for updated_at
CREATE TRIGGER update_user_groups_updated_at
  BEFORE UPDATE ON public.user_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_campaign_permissions_updated_at
  BEFORE UPDATE ON public.user_campaign_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_access_rules_updated_at
  BEFORE UPDATE ON public.campaign_access_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default user groups
INSERT INTO public.user_groups (name, description) VALUES 
('Bronze Consultants', 'Basic access to standard campaigns'),
('Silver Consultants', 'Enhanced access with higher budget limits'),
('Gold Consultants', 'Premium access to all campaign types'),
('VIP Consultants', 'Unlimited access and custom campaign options');

-- Insert default access rules
INSERT INTO public.campaign_access_rules (rule_name, target_audience, campaign_type, required_user_tier, min_budget, max_budget) VALUES
('General Facebook Ads - Bronze', 'General', 'Facebook Ads', 'bronze', 100, 1000),
('General Facebook Ads - Silver', 'General', 'Facebook Ads', 'silver', 100, 5000),
('General Facebook Ads - Gold', 'General', 'Facebook Ads', 'gold', 100, 10000),
('NSF Cold Calling - Silver+', 'NSF (National Science Foundation)', 'Cold Calling', 'silver', 500, 5000),
('Seniors Facebook Ads - Gold+', 'Seniors', 'Facebook Ads', 'gold', 200, 8000),
('Mothers Facebook Ads - All Tiers', 'Mothers', 'Facebook Ads', 'bronze', 100, 3000);