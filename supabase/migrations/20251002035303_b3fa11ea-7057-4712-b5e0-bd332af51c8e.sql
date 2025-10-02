-- Add gifting credits balance to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gifting_credits_balance numeric DEFAULT 0 NOT NULL;

-- Update the rounding trigger to include gifting credits
CREATE OR REPLACE FUNCTION public.round_credits_to_one_decimal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'flexi_credits_transactions' THEN
    NEW.amount := round(COALESCE(NEW.amount, 0)::numeric, 1);
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    NEW.flexi_credits_balance := round(COALESCE(NEW.flexi_credits_balance, 0)::numeric, 1);
    NEW.gifting_credits_balance := round(COALESCE(NEW.gifting_credits_balance, 0)::numeric, 1);
  END IF;
  RETURN NEW;
END;
$function$;

-- Create gifting credits transactions table
CREATE TABLE IF NOT EXISTS public.gifting_credits_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  transaction_type text NOT NULL,
  description text,
  reference_transaction_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on gifting credits transactions
ALTER TABLE public.gifting_credits_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for gifting credits transactions
CREATE POLICY "Users can view their own gifting transactions"
ON public.gifting_credits_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gifting transactions"
ON public.gifting_credits_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all gifting transactions"
ON public.gifting_credits_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id::text = auth.uid()::text
    AND p.role IN ('admin', 'master_admin')
  )
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_gifting_transactions_user_id 
ON public.gifting_credits_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_gifting_transactions_created_at 
ON public.gifting_credits_transactions(created_at DESC);