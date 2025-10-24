-- Create comprehensive demo data with placeholder profiles that will be linked to actual demo accounts

-- First, create additional categories to make the marketplace richer
INSERT INTO public.categories (id, name, description) VALUES 
('550e8400-e29b-41d4-a716-446655440004', 'Operations', 'Operational efficiency and process optimization'),
('550e8400-e29b-41d4-a716-446655440005', 'Product Management', 'Product strategy and development guidance'),
('550e8400-e29b-41d4-a716-446655440006', 'Sales', 'Sales strategy and team development'),
('550e8400-e29b-41d4-a716-446655440007', 'HR & Talent', 'Human resources and talent acquisition'),
('550e8400-e29b-41d4-a716-446655440008', 'Legal', 'Legal strategy and compliance guidance')
ON CONFLICT (id) DO NOTHING;

-- Create demo consultant data that can be used when demo accounts are created
-- These will serve as templates for the setup-demo-data function

-- Update the existing demo data creation to be more comprehensive
-- This data will be used by the edge function when creating demo accounts

-- Add more sample services data for existing categories to make marketplace richer
-- These are general services that can be created for any consultant

-- Create sample conversation templates
INSERT INTO public.conversations (id, buyer_id, seller_id, service_id, status, last_message_at) VALUES 
('550e8400-e29b-41d4-a716-446655440101', 
 (SELECT user_id FROM profiles WHERE email LIKE '%demo-buyer%' LIMIT 1),
 (SELECT user_id FROM profiles WHERE email LIKE '%demo-consultant%' LIMIT 1),
 (SELECT id FROM services LIMIT 1),
 'active',
 now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Add more diverse sample messages to make conversations look realistic
INSERT INTO public.messages (conversation_id, sender_id, message_text, message_type, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440101',
 (SELECT user_id FROM profiles WHERE email LIKE '%demo-consultant%' LIMIT 1),
 'Hi there! I see you''re interested in business strategy consulting. I''d love to help you take your business to the next level.',
 'text',
 now() - interval '3 hours'),
('550e8400-e29b-41d4-a716-446655440101',
 (SELECT user_id FROM profiles WHERE email LIKE '%demo-buyer%' LIMIT 1), 
 'That sounds perfect! I''m particularly interested in market expansion strategies for my e-commerce business.',
 'text',
 now() - interval '2 hours 30 minutes'),
('550e8400-e29b-41d4-a716-446655440101',
 (SELECT user_id FROM profiles WHERE email LIKE '%demo-consultant%' LIMIT 1),
 'Excellent! E-commerce market expansion is one of my specialties. I''ve helped several companies successfully enter new markets.',
 'text',
 now() - interval '2 hours'),
('550e8400-e29b-41d4-a716-446655440101',
 (SELECT user_id FROM profiles WHERE email LIKE '%demo-buyer%' LIMIT 1), 
 'That''s exactly what I need. What would be the best way to get started?',
 'text',
 now() - interval '1 hour 45 minutes'),
('550e8400-e29b-41d4-a716-446655440101',
 (SELECT user_id FROM profiles WHERE email LIKE '%demo-consultant%' LIMIT 1),
 'I''d recommend starting with a strategic planning session where we can analyze your current market position and identify the best expansion opportunities.',
 'text',
 now() - interval '1 hour 30 minutes'),
('550e8400-e29b-41d4-a716-446655440101',
 (SELECT user_id FROM profiles WHERE email LIKE '%demo-buyer%' LIMIT 1), 
 'Sounds great! How do we schedule this?',
 'text',
 now() - interval '1 hour 15 minutes'),
('550e8400-e29b-41d4-a716-446655440101',
 (SELECT user_id FROM profiles WHERE email LIKE '%demo-consultant%' LIMIT 1),
 'You can book directly through my calendar link, or I can send you some available time slots. What works better for you?',
 'text',
 now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;