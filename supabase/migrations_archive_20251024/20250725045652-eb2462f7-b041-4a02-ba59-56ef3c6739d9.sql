-- Create approval status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add approval columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN approval_status approval_status NOT NULL DEFAULT 'pending',
ADD COLUMN approved_by uuid REFERENCES auth.users(id),
ADD COLUMN approved_at timestamp with time zone;

-- Update existing users to be approved (for backward compatibility)
UPDATE public.profiles SET approval_status = 'approved', approved_at = now() WHERE approval_status = 'pending';

-- Update the handle_new_user function to set new users as pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, approval_status)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'pending');
  RETURN NEW;
END;
$$;

-- Add RLS policy for pending users (limited access)
CREATE POLICY "Pending users can view their own profile only" ON public.profiles
FOR SELECT USING (auth.uid() = user_id AND approval_status = 'pending');

-- Update existing policy to only allow approved users full access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Approved users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id AND approval_status = 'approved');