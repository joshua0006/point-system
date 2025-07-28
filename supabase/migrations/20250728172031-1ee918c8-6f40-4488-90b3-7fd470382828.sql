-- Update the default points balance for new users to start with 0 points instead of 1000
ALTER TABLE public.profiles 
ALTER COLUMN points_balance SET DEFAULT 0;