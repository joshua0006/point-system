-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true);

-- Create storage policies for service images
CREATE POLICY "Service images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'service-images');

CREATE POLICY "Consultants can upload service images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'service-images' 
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.consultants 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Consultants can update their service images" 
ON storage.objects 
FOR UPDATE 
USING (
    bucket_id = 'service-images' 
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.consultants 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Consultants can delete their service images" 
ON storage.objects 
FOR DELETE 
USING (
    bucket_id = 'service-images' 
    AND auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.consultants 
        WHERE user_id = auth.uid()
    )
);