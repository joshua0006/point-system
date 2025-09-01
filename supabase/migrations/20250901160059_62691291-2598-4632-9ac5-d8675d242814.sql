-- Add RLS policies for the renamed flexi_credits_transactions table
-- Enable RLS on the table
ALTER TABLE public.flexi_credits_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own transactions
CREATE POLICY "Users can view their own flexi credit transactions" 
ON public.flexi_credits_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for users to create their own transactions
CREATE POLICY "Users can create their own flexi credit transactions" 
ON public.flexi_credits_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);