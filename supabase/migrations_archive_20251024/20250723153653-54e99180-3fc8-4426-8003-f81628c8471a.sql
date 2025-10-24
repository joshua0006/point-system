-- Add DELETE policy for conversations table
-- Users can delete conversations they participate in
CREATE POLICY "Participants can delete conversations" 
ON public.conversations 
FOR DELETE 
USING ((auth.uid() = buyer_id) OR (auth.uid() = seller_id));

-- Add DELETE policy for messages table  
-- Users can delete messages in conversations they participate in
CREATE POLICY "Users can delete messages in their conversations" 
ON public.messages 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1
  FROM conversations
  WHERE ((conversations.id = messages.conversation_id) 
    AND ((conversations.buyer_id = auth.uid()) OR (conversations.seller_id = auth.uid())))
));