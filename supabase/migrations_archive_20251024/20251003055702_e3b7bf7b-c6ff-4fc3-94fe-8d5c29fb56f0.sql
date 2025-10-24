-- Create awarded_flexi_credits table
CREATE TABLE public.awarded_flexi_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  locked_amount NUMERIC NOT NULL DEFAULT 0 CHECK (locked_amount >= 0),
  unlocked_amount NUMERIC NOT NULL DEFAULT 0 CHECK (unlocked_amount >= 0),
  awarded_by TEXT NOT NULL REFERENCES public.profiles(user_id),
  awarded_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'fully_unlocked')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_amounts CHECK (locked_amount + unlocked_amount = amount)
);

-- Indexes for awarded_flexi_credits
CREATE INDEX idx_awarded_credits_user_id ON public.awarded_flexi_credits(user_id);
CREATE INDEX idx_awarded_credits_status ON public.awarded_flexi_credits(status);
CREATE INDEX idx_awarded_credits_expires_at ON public.awarded_flexi_credits(expires_at);

-- RLS Policies for awarded_flexi_credits
ALTER TABLE public.awarded_flexi_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own awarded credits"
  ON public.awarded_flexi_credits FOR SELECT
  TO authenticated
  USING (user_id = (auth.uid())::text);

CREATE POLICY "Admins can view all awarded credits"
  ON public.awarded_flexi_credits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = (auth.uid())::text
      AND profiles.role IN ('admin', 'master_admin')
    )
  );

CREATE POLICY "Admins can insert awarded credits"
  ON public.awarded_flexi_credits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = (auth.uid())::text
      AND profiles.role IN ('admin', 'master_admin')
    )
  );

CREATE POLICY "System can update awarded credits"
  ON public.awarded_flexi_credits FOR UPDATE
  TO authenticated
  USING (true);

-- Create awarded_credits_unlocks transaction log table
CREATE TABLE public.awarded_credits_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  awarded_credit_id UUID NOT NULL REFERENCES public.awarded_flexi_credits(id) ON DELETE CASCADE,
  topup_transaction_id UUID NOT NULL REFERENCES public.flexi_credits_transactions(id),
  amount_unlocked NUMERIC NOT NULL CHECK (amount_unlocked > 0),
  topup_amount_used NUMERIC NOT NULL CHECK (topup_amount_used > 0),
  unlock_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (topup_transaction_id, awarded_credit_id)
);

-- Indexes for awarded_credits_unlocks
CREATE INDEX idx_unlocks_user_id ON public.awarded_credits_unlocks(user_id);
CREATE INDEX idx_unlocks_awarded_credit_id ON public.awarded_credits_unlocks(awarded_credit_id);

-- RLS Policies for awarded_credits_unlocks
ALTER TABLE public.awarded_credits_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unlocks"
  ON public.awarded_credits_unlocks FOR SELECT
  TO authenticated
  USING (user_id = (auth.uid())::text);

CREATE POLICY "Admins can view all unlocks"
  ON public.awarded_credits_unlocks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = (auth.uid())::text
      AND profiles.role IN ('admin', 'master_admin')
    )
  );

CREATE POLICY "Users can create their own unlocks"
  ON public.awarded_credits_unlocks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (auth.uid())::text);

-- Trigger for updated_at on awarded_flexi_credits
CREATE TRIGGER update_awarded_credits_updated_at
  BEFORE UPDATE ON public.awarded_flexi_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();