-- Add foreign key constraint between user_campaign_permissions and profiles
ALTER TABLE public.user_campaign_permissions 
ADD CONSTRAINT user_campaign_permissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;