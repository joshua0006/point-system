-- Add archived status to conversations table and booking status integration
-- First, update the conversation status enum to include 'waiting_acceptance' and make 'archived' explicit
ALTER TYPE conversation_status ADD VALUE IF NOT EXISTS 'waiting_acceptance';

-- Add a manual_archive flag to track user-initiated archiving
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS manual_archive BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;