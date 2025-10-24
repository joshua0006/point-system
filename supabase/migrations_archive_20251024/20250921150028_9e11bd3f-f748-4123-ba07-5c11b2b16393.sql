-- Enable admin management of services, campaigns, and consultants
-- Update RLS policies for services table to allow admin operations

-- Allow admins to insert services
CREATE POLICY "Admins can insert services" 
ON public.services 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Allow admins to update services
CREATE POLICY "Admins can update services" 
ON public.services 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Allow admins to delete services
CREATE POLICY "Admins can delete services" 
ON public.services 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Allow admins to insert consultants
CREATE POLICY "Admins can insert consultants" 
ON public.consultants 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Allow admins to update consultants
CREATE POLICY "Admins can update consultants" 
ON public.consultants 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Allow admins to delete consultants
CREATE POLICY "Admins can delete consultants" 
ON public.consultants 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text]));

-- Create service types for better categorization
CREATE TYPE public.service_type AS ENUM ('consulting', 'cold_calling', 'va_support', 'lead_generation', 'other');

-- Add service type column to services table
ALTER TABLE public.services ADD COLUMN service_type public.service_type DEFAULT 'consulting'::public.service_type;

-- Add more detailed service configuration
ALTER TABLE public.services ADD COLUMN features jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.services ADD COLUMN includes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.services ADD COLUMN excludes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.services ADD COLUMN service_tier text DEFAULT 'standard';

-- Update consultants table to support different service types
ALTER TABLE public.consultants ADD COLUMN service_specialties text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.consultants ADD COLUMN cold_calling_rate integer;
ALTER TABLE public.consultants ADD COLUMN va_support_rate integer;
ALTER TABLE public.consultants ADD COLUMN lead_gen_rate integer;