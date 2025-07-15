-- Create lead generation campaigns table
CREATE TABLE public.lead_gen_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  total_budget INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'completed')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign participants table
CREATE TABLE public.campaign_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.lead_gen_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  consultant_name TEXT NOT NULL,
  budget_contribution INTEGER NOT NULL,
  leads_received INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated INTEGER DEFAULT 0,
  notes TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Enable RLS
ALTER TABLE public.lead_gen_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Everyone can view active campaigns" 
ON public.lead_gen_campaigns 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Admins can manage all campaigns" 
ON public.lead_gen_campaigns 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- RLS Policies for participants
CREATE POLICY "Users can view participants of campaigns they joined" 
ON public.campaign_participants 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can join campaigns" 
ON public.campaign_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" 
ON public.campaign_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all participants" 
ON public.campaign_participants 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Add updated_at trigger
CREATE TRIGGER update_lead_gen_campaigns_updated_at
BEFORE UPDATE ON public.lead_gen_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_participants_updated_at
BEFORE UPDATE ON public.campaign_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();