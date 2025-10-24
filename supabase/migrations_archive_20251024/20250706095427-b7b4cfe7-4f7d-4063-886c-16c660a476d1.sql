-- Create sample conversations and messages for demo mode
INSERT INTO public.conversations (id, buyer_id, seller_id, service_id, status, last_message_at) VALUES 
('550e8400-e29b-41d4-a716-446655440100', 
 (SELECT user_id FROM profiles WHERE email = 'demo-buyer@demo.com' LIMIT 1),
 (SELECT user_id FROM profiles WHERE email = 'demo-consultant@demo.com' LIMIT 1),
 (SELECT id FROM services LIMIT 1),
 'active',
 now())
ON CONFLICT (id) DO NOTHING;

-- Add sample messages to the conversation
INSERT INTO public.messages (conversation_id, sender_id, message_text, message_type, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440100',
 (SELECT user_id FROM profiles WHERE email = 'demo-consultant@demo.com' LIMIT 1),
 'Hi! Thanks for your interest in my business strategy consultation. I''d be happy to help you develop a comprehensive plan for your venture.',
 'text',
 now() - interval '2 hours'),
('550e8400-e29b-41d4-a716-446655440100',
 (SELECT user_id FROM profiles WHERE email = 'demo-buyer@demo.com' LIMIT 1), 
 'That sounds great! I''m looking to expand my e-commerce business and need guidance on market positioning.',
 'text',
 now() - interval '1 hour 30 minutes'),
('550e8400-e29b-41d4-a716-446655440100',
 (SELECT user_id FROM profiles WHERE email = 'demo-consultant@demo.com' LIMIT 1),
 'Perfect! Market positioning is crucial for e-commerce success. Let''s schedule a session to dive deep into your target audience and competitive landscape.',
 'text',
 now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;