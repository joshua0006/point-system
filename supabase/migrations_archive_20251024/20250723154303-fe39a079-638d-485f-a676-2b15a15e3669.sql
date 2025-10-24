-- Add auto-reply fields to consultants table
ALTER TABLE public.consultants 
ADD COLUMN auto_reply_enabled boolean DEFAULT false,
ADD COLUMN auto_reply_message text DEFAULT NULL;

-- Update the updated_at timestamp when these fields change
CREATE OR REPLACE FUNCTION public.update_consultant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for consultants table if it doesn't exist
DROP TRIGGER IF EXISTS update_consultants_updated_at ON public.consultants;
CREATE TRIGGER update_consultants_updated_at
  BEFORE UPDATE ON public.consultants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_consultant_updated_at();