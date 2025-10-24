-- Add INSERT policy for points_transactions table
CREATE POLICY "Users can create their own transactions" 
ON public.points_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);