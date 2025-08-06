-- Add scripts to campaign templates for admin editable scripts
-- This adds calling, texting, and reminder scripts to the template_config

-- Update existing campaign templates to include scripts structure
UPDATE campaign_templates 
SET template_config = COALESCE(template_config, '{}'::jsonb) || '{
  "scripts": {
    "calling": "Hi [LEAD_NAME], I''m calling from [CONSULTANT_NAME] regarding your interest in financial planning. We have a limited-time offer for a free consultation to help you secure your financial future. Would you be available for a 15-minute call this week?",
    "texting": "Hi [LEAD_NAME]! Thanks for your interest in financial planning. I''m [CONSULTANT_NAME] and I''d love to help you achieve your financial goals. When would be a good time for a quick 15-min call? Text me back!",
    "reminder": "Hi [LEAD_NAME], this is [CONSULTANT_NAME] following up on our previous conversation about financial planning. I wanted to remind you about our free consultation offer. Are you still interested in securing your financial future?"
  }
}'::jsonb
WHERE is_active = true;