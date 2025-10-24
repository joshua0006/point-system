-- Add RLS policies for payment_methods table
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own payment methods
CREATE POLICY "Users can view their own payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own payment methods
CREATE POLICY "Users can insert their own payment methods" 
ON public.payment_methods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own payment methods
CREATE POLICY "Users can update their own payment methods" 
ON public.payment_methods 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own payment methods
CREATE POLICY "Users can delete their own payment methods" 
ON public.payment_methods 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create partial unique index to ensure only one default payment method per user
CREATE UNIQUE INDEX idx_payment_methods_default_per_user 
ON public.payment_methods (user_id) 
WHERE is_default = true;