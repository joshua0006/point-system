-- Add missing INSERT policy for campaign_participants table
CREATE POLICY "Users can insert their own campaign participation" 
ON public.campaign_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add missing DELETE policy for campaign_participants table  
CREATE POLICY "Users can delete their own campaign participation"
ON public.campaign_participants
FOR DELETE 
USING (auth.uid() = user_id);