-- Create campaign invitations table for admin-created campaigns
CREATE TABLE public.campaign_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  template_id UUID NOT NULL,
  campaign_config JSONB NOT NULL,
  budget_amount INTEGER NOT NULL,
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  campaign_id UUID,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Enable RLS
ALTER TABLE public.campaign_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all invitations" 
ON public.campaign_invitations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can view their own invitations" 
ON public.campaign_invitations 
FOR SELECT 
USING (target_user_id = auth.uid());

CREATE POLICY "Users can update their own invitations" 
ON public.campaign_invitations 
FOR UPDATE 
USING (target_user_id = auth.uid());

-- Anyone with the token can view (for preview)
CREATE POLICY "Token holders can view invitations" 
ON public.campaign_invitations 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE TRIGGER update_campaign_invitations_updated_at
BEFORE UPDATE ON public.campaign_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for token lookups
CREATE INDEX idx_campaign_invitations_token ON public.campaign_invitations(invitation_token);
CREATE INDEX idx_campaign_invitations_target_user ON public.campaign_invitations(target_user_id);
CREATE INDEX idx_campaign_invitations_status ON public.campaign_invitations(status);