-- Add missing foreign key constraints for marketplace functionality

-- Add foreign key constraint from services to consultants
ALTER TABLE public.services 
ADD CONSTRAINT fk_services_consultant_id 
FOREIGN KEY (consultant_id) REFERENCES public.consultants(id) 
ON DELETE CASCADE;

-- Add foreign key constraint from services to categories
ALTER TABLE public.services 
ADD CONSTRAINT fk_services_category_id 
FOREIGN KEY (category_id) REFERENCES public.categories(id) 
ON DELETE SET NULL;

-- Add foreign key constraint from bookings to services
ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_service_id 
FOREIGN KEY (service_id) REFERENCES public.services(id) 
ON DELETE CASCADE;

-- Add foreign key constraint from bookings to consultants
ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_consultant_id 
FOREIGN KEY (consultant_id) REFERENCES public.consultants(id) 
ON DELETE CASCADE;

-- Add foreign key constraint from conversations to services
ALTER TABLE public.conversations 
ADD CONSTRAINT fk_conversations_service_id 
FOREIGN KEY (service_id) REFERENCES public.services(id) 
ON DELETE CASCADE;

-- Add foreign key constraint from messages to conversations
ALTER TABLE public.messages 
ADD CONSTRAINT fk_messages_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) 
ON DELETE CASCADE;

-- Add foreign key constraint from points_transactions to bookings
ALTER TABLE public.points_transactions 
ADD CONSTRAINT fk_points_transactions_booking_id 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) 
ON DELETE SET NULL;

-- Add foreign key constraint from reviews to bookings
ALTER TABLE public.reviews 
ADD CONSTRAINT fk_reviews_booking_id 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) 
ON DELETE CASCADE;