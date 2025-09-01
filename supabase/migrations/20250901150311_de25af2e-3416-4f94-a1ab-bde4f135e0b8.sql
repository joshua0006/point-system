-- Add UPDATE policy for campaign participants so users can manage their own billing status
CREATE POLICY "Users can update their own campaign participation" 
ON campaign_participants 
FOR UPDATE 
USING (auth.uid() = user_id);