-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Users can view reviews they are involved in"
ON public.reviews 
FOR SELECT 
USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

CREATE POLICY "Users can create reviews for their bookings"
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND (user_id = auth.uid() OR consultant_id IN (
      SELECT id FROM public.consultants WHERE user_id = auth.uid()
    ))
    AND status = 'completed'
  )
);

-- Create trigger for timestamp updates
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update bookings table to allow consultants to update status
CREATE POLICY "Consultants can update their booking status"
ON public.bookings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.consultants 
  WHERE id = bookings.consultant_id 
  AND user_id = auth.uid()
));

-- Update messages table to allow updating read_at
CREATE POLICY "Users can update read status of messages in their conversations"
ON public.messages 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE id = messages.conversation_id 
  AND (buyer_id = auth.uid() OR seller_id = auth.uid())
));

-- Add realtime for reviews
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;