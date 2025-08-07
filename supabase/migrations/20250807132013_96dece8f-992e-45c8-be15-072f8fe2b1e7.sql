-- Add missing foreign key relationships to fix TypeScript errors

-- Add foreign key from bookings to consultants
ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_consultant 
FOREIGN KEY (consultant_id) REFERENCES public.consultants(id) ON DELETE CASCADE;

-- Add foreign key from messages to profiles for sender
ALTER TABLE public.messages 
ADD CONSTRAINT fk_messages_sender_profile 
FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;