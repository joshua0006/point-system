-- Add columns to track completion status from both parties
ALTER TABLE public.bookings 
ADD COLUMN buyer_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN consultant_completed BOOLEAN DEFAULT FALSE;