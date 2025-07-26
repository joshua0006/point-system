-- Add is_public field to campaign_invitations table
ALTER TABLE public.campaign_invitations 
ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Update RLS policies to allow public viewing of public proposals
CREATE POLICY "Public proposals are viewable by everyone" 
ON public.campaign_invitations 
FOR SELECT 
USING (is_public = true);