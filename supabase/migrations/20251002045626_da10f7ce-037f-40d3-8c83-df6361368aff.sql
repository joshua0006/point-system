-- Remove gifting credits system
ALTER TABLE profiles DROP COLUMN IF EXISTS gifting_credits_balance;

-- Drop gifting credits transactions table
DROP TABLE IF EXISTS gifting_credits_transactions;

-- Create reimbursement_requests table
CREATE TABLE IF NOT EXISTS reimbursement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  merchant text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  description text,
  receipt_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE reimbursement_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own reimbursement requests"
  ON reimbursement_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reimbursement requests"
  ON reimbursement_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reimbursement requests"
  ON reimbursement_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id::text = auth.uid()::text
      AND profiles.role IN ('admin', 'master_admin')
    )
  );

CREATE POLICY "Admins can update all reimbursement requests"
  ON reimbursement_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id::text = auth.uid()::text
      AND profiles.role IN ('admin', 'master_admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_reimbursement_requests_updated_at
  BEFORE UPDATE ON reimbursement_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();