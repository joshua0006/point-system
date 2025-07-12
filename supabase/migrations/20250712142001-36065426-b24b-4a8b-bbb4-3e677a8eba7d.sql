-- Add image_url column to services table
ALTER TABLE public.services 
ADD COLUMN image_url TEXT;