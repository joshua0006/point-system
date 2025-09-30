-- Create table for recurring flexi credits deductions
CREATE TABLE IF NOT EXISTS public.admin_recurring_deductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 28),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_by TEXT NOT NULL,
  next_billing_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for querying active recurring deductions
CREATE INDEX idx_recurring_deductions_user_status ON public.admin_recurring_deductions(user_id, status);
CREATE INDEX idx_recurring_deductions_next_billing ON public.admin_recurring_deductions(next_billing_date) WHERE status = 'active';

-- Add RLS policies
ALTER TABLE public.admin_recurring_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage recurring deductions"
  ON public.admin_recurring_deductions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id::text = auth.uid()::text
      AND profiles.role IN ('admin', 'master_admin')
    )
  );

CREATE POLICY "Users can view their recurring deductions"
  ON public.admin_recurring_deductions
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Add trigger for updated_at
CREATE TRIGGER update_recurring_deductions_updated_at
  BEFORE UPDATE ON public.admin_recurring_deductions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();