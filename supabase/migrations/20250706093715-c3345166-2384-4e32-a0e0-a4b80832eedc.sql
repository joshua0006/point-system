-- Create demo users and sample data for the marketplace

-- First, let's insert some demo profiles (these will be created when users sign up)
-- We'll insert them manually for the demo

-- Insert demo categories
INSERT INTO public.categories (id, name, description) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Business Strategy', 'Strategic planning and business development'),
('550e8400-e29b-41d4-a716-446655440001', 'Marketing', 'Digital marketing and brand strategy'),
('550e8400-e29b-41d4-a716-446655440002', 'Technology', 'Tech consulting and development advice'),
('550e8400-e29b-41d4-a716-446655440003', 'Finance', 'Financial planning and investment advice')
ON CONFLICT (id) DO NOTHING;

-- Note: We'll create demo users through the auth signup process in the frontend
-- and then insert their profiles and consultant data programmatically

-- Create some placeholder data that we can reference
-- (The actual user accounts will be created when the demo users first sign up)