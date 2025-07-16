-- Create payment_methods table to store saved payment method references
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment methods"
ON public.payment_methods
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payment methods"
ON public.payment_methods
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own payment methods"
ON public.payment_methods
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own payment methods"
ON public.payment_methods
FOR DELETE
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();