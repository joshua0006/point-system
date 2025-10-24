-- Add admin_deduction to transaction_type enum
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'admin_deduction';

-- Add admin_recurring_deduction to transaction_type enum for recurring deductions
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'admin_recurring_deduction';