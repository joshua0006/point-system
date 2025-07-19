-- Add billing tracking to campaign_participants table
ALTER TABLE public.campaign_participants 
ADD COLUMN next_billing_date DATE,
ADD COLUMN billing_status TEXT DEFAULT 'active',
ADD COLUMN last_billed_date DATE,
ADD COLUMN billing_cycle_day INTEGER DEFAULT 1;

-- Set initial billing dates for existing participants
UPDATE public.campaign_participants 
SET next_billing_date = DATE_TRUNC('month', joined_at) + INTERVAL '1 month',
    last_billed_date = joined_at::date
WHERE next_billing_date IS NULL;

-- Create monthly billing transactions table
CREATE TABLE public.monthly_billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.campaign_participants(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  billing_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monthly_billing_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own billing transactions"
ON public.monthly_billing_transactions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert billing transactions"
ON public.monthly_billing_transactions
FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_monthly_billing_transactions_updated_at
BEFORE UPDATE ON public.monthly_billing_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();