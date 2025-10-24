
-- Add bio column to profiles table so all users (buyers and consultants) can have a bio
ALTER TABLE public.profiles 
ADD COLUMN bio TEXT;
