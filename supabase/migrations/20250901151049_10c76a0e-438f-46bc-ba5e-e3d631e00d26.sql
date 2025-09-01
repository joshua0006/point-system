-- Add RLS policies for points_transactions so users can see their own transaction history
CREATE POLICY "Users can view their own transactions" 
ON points_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users should also be able to create transactions (for purchases, etc.)
CREATE POLICY "Users can create their own transactions" 
ON points_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);