-- Create campaign templates table for storing pre-built campaign configurations
CREATE TABLE public.campaign_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('nsf', 'general', 'seniors')),
  campaign_angle TEXT NOT NULL,
  template_config JSONB NOT NULL, -- Store template configuration (budget, duration, etc.)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad variants table for storing different ad creatives
CREATE TABLE public.ad_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.campaign_templates(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('educational', 'urgency', 'benefit', 'problem_solution')),
  ad_content JSONB NOT NULL, -- Store all ad content (title, copy, cta, etc.)
  performance_metrics JSONB, -- Store CTR, conversions, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign analytics table for tracking performance
CREATE TABLE public.campaign_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.lead_gen_campaigns(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.campaign_templates(id),
  ad_variant_id UUID REFERENCES public.ad_variants(id),
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_spent INTEGER DEFAULT 0, -- in points
  leads_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, ad_variant_id, date)
);

-- Enable RLS on all new tables
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_templates
CREATE POLICY "Templates are publicly viewable" 
ON public.campaign_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage templates" 
ON public.campaign_templates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- RLS Policies for ad_variants
CREATE POLICY "Ad variants are publicly viewable" 
ON public.ad_variants 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage ad variants" 
ON public.ad_variants 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- RLS Policies for campaign_analytics
CREATE POLICY "Users can view analytics of their campaigns" 
ON public.campaign_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_participants cp
    JOIN public.lead_gen_campaigns lgc ON cp.campaign_id = lgc.id
    WHERE lgc.id = campaign_analytics.campaign_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all analytics" 
ON public.campaign_analytics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "System can insert analytics" 
ON public.campaign_analytics 
FOR INSERT 
WITH CHECK (true);

-- Add updated_at triggers
CREATE TRIGGER update_campaign_templates_updated_at
BEFORE UPDATE ON public.campaign_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_variants_updated_at
BEFORE UPDATE ON public.ad_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample campaign templates
INSERT INTO public.campaign_templates (name, description, target_audience, campaign_angle, template_config) VALUES
-- NSF Templates
('NSF Financial Literacy Campaign', 'Educational campaign for NSF personnel focusing on financial basics', 'nsf', 'financial_literacy', '{"budget": 500, "duration_days": 7, "expected_leads": 25, "cost_per_lead": 20}'),
('NSF Early Investment Campaign', 'Investment-focused campaign for young servicemen', 'nsf', 'early_investment', '{"budget": 600, "duration_days": 10, "expected_leads": 30, "cost_per_lead": 20}'),
('NSF Career Transition Campaign', 'Post-service financial planning for NSF personnel', 'nsf', 'career_transition', '{"budget": 550, "duration_days": 14, "expected_leads": 28, "cost_per_lead": 19.6}'),

-- General Public Templates
('CPF Optimization Campaign', 'CPF optimization strategies for working professionals', 'general', 'retirement_planning', '{"budget": 600, "duration_days": 14, "expected_leads": 40, "cost_per_lead": 15}'),
('Investment Portfolio Campaign', 'Portfolio management for general public', 'general', 'investment_management', '{"budget": 700, "duration_days": 14, "expected_leads": 35, "cost_per_lead": 20}'),
('Tax Planning Campaign', 'Tax optimization and wealth preservation', 'general', 'tax_planning', '{"budget": 650, "duration_days": 10, "expected_leads": 32, "cost_per_lead": 20.3}'),

-- Seniors Templates
('Estate Planning Campaign', 'Legacy preservation for seniors', 'seniors', 'estate_planning', '{"budget": 800, "duration_days": 14, "expected_leads": 30, "cost_per_lead": 26.7}'),
('Healthcare Cost Campaign', 'Healthcare planning for retirees', 'seniors', 'healthcare_planning', '{"budget": 750, "duration_days": 12, "expected_leads": 25, "cost_per_lead": 30}'),
('Will Writing Campaign', 'Will writing and asset protection services', 'seniors', 'will_writing', '{"budget": 700, "duration_days": 10, "expected_leads": 22, "cost_per_lead": 31.8}');

-- Insert sample ad variants
INSERT INTO public.ad_variants (template_id, variant_name, ad_type, ad_content, performance_metrics) VALUES
-- NSF Financial Literacy variants
((SELECT id FROM public.campaign_templates WHERE name = 'NSF Financial Literacy Campaign'), 'Educational Workshop Ad', 'educational', '{"title": "Free Financial Health Check for NSF Personnel", "description": "Get a complimentary financial consultation during your service period", "offer": "Free 60-min consultation + Financial planning toolkit", "ad_copy": "🛡️ Serving Singapore? Secure Your Future Too!\n\nGet expert financial advice tailored for NSF personnel. Start building wealth while you serve.\n\n✅ Free 60-minute consultation\n✅ Personalized financial roadmap\n✅ Investment basics workshop\n\nBook now - Limited spots available!", "cta": "Claim Your Free Session"}', '{"ctr": 3.2, "cpm": 4.50, "conversions": 24}'),

((SELECT id FROM public.campaign_templates WHERE name = 'NSF Financial Literacy Campaign'), 'Urgency-Based Ad', 'urgency', '{"title": "Last Week: NSF Financial Planning Workshop", "description": "Final chance to join our exclusive NSF financial workshop", "offer": "Limited seats - only 10 spots left", "ad_copy": "⏰ FINAL WEEK for NSF Personnel!\n\nDon''t miss this exclusive opportunity to master your finances during NS. Only 10 spots remaining!\n\n✅ Expert financial guidance\n✅ Investment starter kit\n✅ Exclusive NSF discounts\n\nRegister before it''s too late!", "cta": "Secure My Spot Now"}', '{"ctr": 4.1, "cpm": 5.20, "conversions": 32}'),

-- General CPF Optimization variants
((SELECT id FROM public.campaign_templates WHERE name = 'CPF Optimization Campaign'), 'Benefit-Focused Ad', 'benefit', '{"title": "Maximize Your CPF Returns by 40%", "description": "Discover proven strategies to boost your CPF growth", "offer": "Free CPF optimization guide worth $200", "ad_copy": "📈 Boost Your CPF Returns by 40%!\n\nDiscover little-known strategies to maximize your CPF growth. Our experts reveal the secrets.\n\n✅ CPF optimization strategies\n✅ Top-up timing guidance\n✅ Investment scheme options\n\nFree guide worth $200 - Download now!", "cta": "Get Free Guide"}', '{"ctr": 3.7, "cpm": 4.80, "conversions": 28}'),

-- Seniors Estate Planning variants
((SELECT id FROM public.campaign_templates WHERE name = 'Estate Planning Campaign'), 'Problem-Solution Ad', 'problem_solution', '{"title": "Worried About Your Family''s Future?", "description": "Protect your legacy with comprehensive estate planning", "offer": "Free will consultation + Estate planning guide", "ad_copy": "😟 Worried About Your Family''s Financial Security?\n\nDon''t leave your loved ones struggling with legal complications. Secure their future with proper estate planning.\n\n✅ Professional will writing\n✅ Tax-efficient strategies\n✅ Asset protection guidance\n\nProtect what matters most!", "cta": "Secure My Family''s Future"}', '{"ctr": 4.5, "cpm": 7.20, "conversions": 35}');