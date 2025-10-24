-- Create custom GPT links table
CREATE TABLE public.custom_gpt_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'Bot',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.custom_gpt_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active custom GPT links" 
ON public.custom_gpt_links 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage custom GPT links" 
ON public.custom_gpt_links 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id::text = auth.uid()::text 
    AND profiles.role IN ('admin', 'master_admin')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_gpt_links_updated_at
BEFORE UPDATE ON public.custom_gpt_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample links
INSERT INTO public.custom_gpt_links (name, url, description, icon_name, sort_order) VALUES
('Marketing Copy Assistant', 'https://chatgpt.com/g/g-abc123', 'Helps create compelling marketing copy and ad content', 'PenTool', 1),
('Lead Research GPT', 'https://chatgpt.com/g/g-def456', 'Assists with lead research and qualification', 'Search', 2),
('Sales Script Writer', 'https://chatgpt.com/g/g-ghi789', 'Creates effective cold calling and sales scripts', 'Phone', 3);