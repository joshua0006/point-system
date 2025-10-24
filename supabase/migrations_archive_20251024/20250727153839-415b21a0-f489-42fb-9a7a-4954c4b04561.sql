-- Add missing NOT NULL columns to user_campaign_permissions table
ALTER TABLE public.user_campaign_permissions 
ADD COLUMN IF NOT EXISTS target_audience_new TEXT NOT NULL DEFAULT 'general';

ALTER TABLE public.user_campaign_permissions 
ADD COLUMN IF NOT EXISTS campaign_type_new TEXT NOT NULL DEFAULT 'lead_generation';

-- Now copy existing data if any and drop the old nullable columns
UPDATE public.user_campaign_permissions 
SET target_audience_new = COALESCE(target_audience, 'general'),
    campaign_type_new = COALESCE(campaign_type, 'lead_generation');

-- Drop old columns and rename new ones
ALTER TABLE public.user_campaign_permissions 
DROP COLUMN IF EXISTS target_audience,
DROP COLUMN IF EXISTS campaign_type;

ALTER TABLE public.user_campaign_permissions 
RENAME COLUMN target_audience_new TO target_audience;

ALTER TABLE public.user_campaign_permissions 
RENAME COLUMN campaign_type_new TO campaign_type;

-- Add unique constraint for the new required columns
ALTER TABLE public.user_campaign_permissions 
DROP CONSTRAINT IF EXISTS user_campaign_permissions_user_id_target_audience_campaign_type_key;

ALTER TABLE public.user_campaign_permissions 
ADD CONSTRAINT user_campaign_permissions_user_id_target_audience_campaign_type_key 
UNIQUE(user_id, target_audience, campaign_type);