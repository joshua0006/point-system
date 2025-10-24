-- Update RLS policies to allow public access to marketplace data

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Services are viewable by authenticated users" ON public.services;
DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON public.categories;  
DROP POLICY IF EXISTS "Consultants are viewable by authenticated users" ON public.consultants;

-- Create new public access policies for marketplace browsing
CREATE POLICY "Services are publicly viewable" 
ON public.services 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Categories are publicly viewable" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Consultants are publicly viewable" 
ON public.consultants 
FOR SELECT 
USING (is_active = true);