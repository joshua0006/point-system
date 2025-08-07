-- Add missing foreign key relationships to fix database query errors

-- Add foreign key for bookings to consultants
ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_consultant 
FOREIGN KEY (consultant_id) REFERENCES public.consultants(id);

-- Add foreign key for messages to profiles (sender)
ALTER TABLE public.messages 
ADD CONSTRAINT fk_messages_sender_profile 
FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id);