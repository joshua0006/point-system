-- Create table for storing AI assistant conversations
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultant_id UUID NOT NULL,
  title TEXT NOT NULL,
  task_category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing AI assistant messages
CREATE TABLE public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_conversations
CREATE POLICY "Consultants can view their own AI conversations" 
ON public.ai_conversations 
FOR SELECT 
USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can create their own AI conversations" 
ON public.ai_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = consultant_id);

CREATE POLICY "Consultants can update their own AI conversations" 
ON public.ai_conversations 
FOR UPDATE 
USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can delete their own AI conversations" 
ON public.ai_conversations 
FOR DELETE 
USING (auth.uid() = consultant_id);

-- Create policies for ai_messages
CREATE POLICY "Users can view messages from their conversations" 
ON public.ai_messages 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT id FROM public.ai_conversations WHERE consultant_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations" 
ON public.ai_messages 
FOR INSERT 
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.ai_conversations WHERE consultant_id = auth.uid()
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ai_conversations_consultant_id ON public.ai_conversations(consultant_id);
CREATE INDEX idx_ai_conversations_created_at ON public.ai_conversations(created_at DESC);
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON public.ai_messages(created_at ASC);