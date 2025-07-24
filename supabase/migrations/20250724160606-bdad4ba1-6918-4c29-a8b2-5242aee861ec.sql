-- Update the check constraint to allow 'custom' as a valid target_audience value
ALTER TABLE campaign_templates DROP CONSTRAINT campaign_templates_target_audience_check;

ALTER TABLE campaign_templates ADD CONSTRAINT campaign_templates_target_audience_check 
CHECK (target_audience = ANY (ARRAY['nsf'::text, 'general'::text, 'seniors'::text, 'custom'::text]));