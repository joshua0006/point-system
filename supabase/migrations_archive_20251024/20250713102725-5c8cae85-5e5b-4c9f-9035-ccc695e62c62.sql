
-- Drop the existing INSERT policy for points_transactions
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.points_transactions;

-- Create a new policy that allows users to create their own transactions
-- AND allows creating earning transactions for consultants when purchasing services
CREATE POLICY "Users can create transactions" ON public.points_transactions
FOR INSERT 
WITH CHECK (
  -- Users can create their own transactions (purchases, refunds, etc.)
  auth.uid() = user_id 
  OR 
  -- Allow creating earning transactions for consultants when there's a related booking
  (type = 'earning' AND booking_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_id 
    AND bookings.user_id = auth.uid()
  ))
);
