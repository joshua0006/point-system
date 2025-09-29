-- Extend admin_service_assignments table to support Facebook Ads campaigns
ALTER TABLE admin_service_assignments 
ADD COLUMN campaign_template_id uuid REFERENCES campaign_templates(id),
ADD COLUMN target_audience text,
ADD COLUMN campaign_type text DEFAULT 'facebook_ads',
ADD COLUMN campaign_duration_months integer DEFAULT 1,
ADD COLUMN campaign_status text DEFAULT 'pending',
ADD COLUMN campaign_launched_at timestamp with time zone,
ADD COLUMN campaign_id uuid REFERENCES lead_gen_campaigns(id);

-- Create index for better performance
CREATE INDEX idx_admin_service_assignments_campaign_template 
ON admin_service_assignments(campaign_template_id);

CREATE INDEX idx_admin_service_assignments_campaign_id 
ON admin_service_assignments(campaign_id);