-- Remove the unique constraint that prevents multiple conversations for the same service
-- This allows each purchase to create a new conversation
ALTER TABLE public.conversations 
DROP CONSTRAINT IF EXISTS conversations_service_id_buyer_id_seller_id_key;