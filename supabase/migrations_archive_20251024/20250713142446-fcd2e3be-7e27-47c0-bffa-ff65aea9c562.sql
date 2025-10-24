-- Insert comprehensive demo data for heavily used accounts

-- First, insert demo user profiles with placeholder data (these will have accounts created through auth)
-- Note: These are placeholder profiles that will be linked when demo accounts are created

-- Insert multiple demo buyer profiles
INSERT INTO public.profiles (user_id, email, full_name, bio, points_balance, role, avatar_url) VALUES 
-- Main demo buyer
('46252f81-9cea-470e-8edd-0227071b0177', 'demo-buyer@demo.com', 'Alex Johnson', 'Entrepreneur looking to scale my e-commerce business. Always eager to learn from experts.', 2500, 'user', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
-- Additional demo buyers
('46252f81-9cea-470e-8edd-0227071b0178', 'sarah.marketing@demo.com', 'Sarah Chen', 'Marketing director at a growing startup. Passionate about data-driven marketing strategies.', 1800, 'user', 'https://images.unsplash.com/photo-1494790108755-2616b31b1b67?w=150&h=150&fit=crop&crop=face'),
('46252f81-9cea-470e-8edd-0227071b0179', 'mike.founder@demo.com', 'Mike Rodriguez', 'Serial entrepreneur with 3 successful exits. Always looking for new insights and strategies.', 3200, 'user', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
('46252f81-9cea-470e-8edd-0227071b017a', 'emma.startup@demo.com', 'Emma Wilson', 'Tech startup founder focused on fintech solutions. Seeking guidance on scaling and funding.', 1500, 'user', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face')
ON CONFLICT (user_id) DO UPDATE SET
email = EXCLUDED.email,
full_name = EXCLUDED.full_name,
bio = EXCLUDED.bio,
points_balance = EXCLUDED.points_balance,
avatar_url = EXCLUDED.avatar_url;

-- Insert demo consultant profiles
INSERT INTO public.profiles (user_id, email, full_name, bio, points_balance, role, avatar_url) VALUES 
-- Main demo consultant
('46252f81-9cea-470e-8edd-0227071b0180', 'demo-consultant@demo.com', 'Dr. Jennifer Smith', 'Senior business strategist with 15+ years helping Fortune 500 companies and startups scale.', 5000, 'consultant', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face'),
-- Additional demo consultants
('46252f81-9cea-470e-8edd-0227071b0181', 'david.tech@demo.com', 'David Kumar', 'Former CTO turned consultant. Expert in technology strategy, digital transformation, and team building.', 4200, 'consultant', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face'),
('46252f81-9cea-470e-8edd-0227071b0182', 'lisa.marketing@demo.com', 'Lisa Thompson', 'Growth marketing expert who has scaled 20+ companies from startup to IPO. Specialized in digital marketing.', 3800, 'consultant', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face'),
('46252f81-9cea-470e-8edd-0227071b0183', 'robert.finance@demo.com', 'Robert Chen', 'Former investment banker with expertise in financial planning, fundraising, and M&A strategies.', 4500, 'consultant', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face')
ON CONFLICT (user_id) DO UPDATE SET
email = EXCLUDED.email,
full_name = EXCLUDED.full_name,
bio = EXCLUDED.bio,
points_balance = EXCLUDED.points_balance,
role = EXCLUDED.role,
avatar_url = EXCLUDED.avatar_url;

-- Insert consultant profiles
INSERT INTO public.consultants (user_id, bio, tier, hourly_rate, expertise_areas, is_active, calendar_link) VALUES 
('46252f81-9cea-470e-8edd-0227071b0180', 'Dr. Jennifer Smith is a renowned business strategist with over 15 years of experience helping both Fortune 500 companies and promising startups achieve their growth objectives. She holds an MBA from Wharton and has successfully guided over 200 companies through strategic transformations.', 'platinum', 250, ARRAY['Business Strategy', 'Operations', 'Leadership', 'Scale-up', 'Digital Transformation'], true, 'https://calendly.com/jennifer-smith'),
('46252f81-9cea-470e-8edd-0227071b0181', 'David Kumar brings 12 years of hands-on technology leadership experience, having served as CTO for multiple successful startups before transitioning to consulting. He specializes in helping companies make critical technology decisions and build high-performing engineering teams.', 'gold', 200, ARRAY['Technology Strategy', 'Team Building', 'Architecture', 'DevOps', 'Product Development'], true, 'https://calendly.com/david-kumar'),
('46252f81-9cea-470e-8edd-0227071b0182', 'Lisa Thompson is a growth marketing virtuoso who has played pivotal roles in scaling 20+ companies from early-stage startups to successful IPOs. Her data-driven approach and deep understanding of customer acquisition funnels have generated over $500M in revenue for her clients.', 'gold', 180, ARRAY['Growth Marketing', 'Digital Strategy', 'Customer Acquisition', 'Analytics', 'Brand Building'], true, 'https://calendly.com/lisa-thompson'),
('46252f81-9cea-470e-8edd-0227071b0183', 'Robert Chen leveraged his 10 years as an investment banker at Goldman Sachs to become one of the most sought-after financial consultants for startups and growth-stage companies. He has helped raise over $2B in funding across various industries.', 'platinum', 300, ARRAY['Financial Planning', 'Fundraising', 'M&A Strategy', 'Valuation', 'Investment Strategy'], true, 'https://calendly.com/robert-chen')
ON CONFLICT (user_id) DO UPDATE SET
bio = EXCLUDED.bio,
tier = EXCLUDED.tier,
hourly_rate = EXCLUDED.hourly_rate,
expertise_areas = EXCLUDED.expertise_areas,
calendar_link = EXCLUDED.calendar_link;

-- Insert comprehensive services for each consultant
INSERT INTO public.services (consultant_id, title, description, price, duration_minutes, category_id, is_active, image_url) VALUES 
-- Jennifer Smith's services (Business Strategy)
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0180'), 'Strategic Planning Workshop', 'Comprehensive 2-hour workshop to develop your long-term business strategy and roadmap for success.', 500, 120, '550e8400-e29b-41d4-a716-446655440000', true, 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop'),
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0180'), 'Executive Coaching Session', 'One-on-one leadership coaching to help you develop executive presence and decision-making skills.', 250, 60, '550e8400-e29b-41d4-a716-446655440000', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop'),
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0180'), 'Market Entry Strategy', 'Detailed analysis and strategy for entering new markets or launching new products.', 400, 90, '550e8400-e29b-41d4-a716-446655440000', true, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop'),

-- David Kumar's services (Technology)
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0181'), 'Tech Stack Architecture Review', 'Comprehensive review of your technology architecture with recommendations for optimization and scaling.', 300, 90, '550e8400-e29b-41d4-a716-446655440002', true, 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop'),
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0181'), 'Team Building Strategy', 'Learn how to build and manage high-performing engineering teams that deliver results.', 200, 60, '550e8400-e29b-41d4-a716-446655440002', true, 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=200&fit=crop'),
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0181'), 'CTO Advisory Package', 'Monthly advisory package for CTOs and tech leaders to navigate complex technology decisions.', 800, 120, '550e8400-e29b-41d4-a716-446655440002', true, 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=300&h=200&fit=crop'),

-- Lisa Thompson's services (Marketing)
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0182'), 'Growth Marketing Audit', 'Complete audit of your marketing funnel with actionable recommendations for growth.', 350, 90, '550e8400-e29b-41d4-a716-446655440001', true, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop'),
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0182'), 'Digital Marketing Strategy', 'Develop a comprehensive digital marketing strategy tailored to your target audience.', 280, 75, '550e8400-e29b-41d4-a716-446655440001', true, 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=300&h=200&fit=crop'),
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0182'), 'Customer Acquisition Workshop', 'Intensive workshop on building scalable customer acquisition systems.', 450, 120, '550e8400-e29b-41d4-a716-446655440001', true, 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop'),

-- Robert Chen's services (Finance)
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0183'), 'Fundraising Strategy Session', 'Strategic guidance on preparing for and executing successful fundraising rounds.', 500, 90, '550e8400-e29b-41d4-a716-446655440003', true, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop'),
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0183'), 'Financial Planning & Analysis', 'Develop robust financial models and planning frameworks for your business.', 400, 90, '550e8400-e29b-41d4-a716-446655440003', true, 'https://images.unsplash.com/photo-1565885534720-0c4b3db42ca9?w=300&h=200&fit=crop'),
((SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0183'), 'M&A Advisory Session', 'Expert guidance on mergers, acquisitions, and strategic partnerships.', 600, 120, '550e8400-e29b-41d4-a716-446655440003', true, 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=300&h=200&fit=crop')
ON CONFLICT DO NOTHING;

-- Insert historical bookings to show heavy usage
INSERT INTO public.bookings (user_id, consultant_id, service_id, status, points_spent, scheduled_at, notes, created_at) VALUES 
-- Alex Johnson's bookings
('46252f81-9cea-470e-8edd-0227071b0177', (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0180'), (SELECT id FROM services WHERE title = 'Strategic Planning Workshop' LIMIT 1), 'completed', 500, '2024-07-01 14:00:00+00', 'Amazing session! Really helped clarify our business direction.', '2024-06-28 10:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0177', (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0182'), (SELECT id FROM services WHERE title = 'Growth Marketing Audit' LIMIT 1), 'completed', 350, '2024-07-15 11:00:00+00', 'Excellent insights into our marketing funnel gaps.', '2024-07-12 09:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0177', (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0181'), (SELECT id FROM services WHERE title = 'Tech Stack Architecture Review' LIMIT 1), 'confirmed', 300, '2024-07-25 15:00:00+00', 'Looking forward to optimizing our tech stack.', '2024-07-20 16:00:00+00'),

-- Sarah Chen's bookings
('46252f81-9cea-470e-8edd-0227071b0178', (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0182'), (SELECT id FROM services WHERE title = 'Digital Marketing Strategy' LIMIT 1), 'completed', 280, '2024-06-20 10:00:00+00', 'Fantastic strategy session. Implemented all recommendations.', '2024-06-17 14:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0178', (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0182'), (SELECT id FROM services WHERE title = 'Customer Acquisition Workshop' LIMIT 1), 'completed', 450, '2024-07-05 13:00:00+00', 'Workshop exceeded expectations. CAC improved by 40%.', '2024-07-01 12:00:00+00'),

-- Mike Rodriguez's bookings
('46252f81-9cea-470e-8edd-0227071b0179', (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0183'), (SELECT id FROM services WHERE title = 'Fundraising Strategy Session' LIMIT 1), 'completed', 500, '2024-06-10 16:00:00+00', 'Raised $2M Series A using this strategy. Incredible ROI.', '2024-06-05 11:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0179', (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0180'), (SELECT id FROM services WHERE title = 'Market Entry Strategy' LIMIT 1), 'completed', 400, '2024-07-08 14:00:00+00', 'Perfect guidance for European market expansion.', '2024-07-03 10:00:00+00'),

-- Emma Wilson's bookings
('46252f81-9cea-470e-8edd-0227071b017a', (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0183'), (SELECT id FROM services WHERE title = 'Financial Planning & Analysis' LIMIT 1), 'completed', 400, '2024-06-25 09:00:00+00', 'Financial models are now investor-ready. Thank you!', '2024-06-22 15:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b017a', (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0181'), (SELECT id FROM services WHERE title = 'Team Building Strategy' LIMIT 1), 'pending', 200, '2024-07-30 11:00:00+00', 'Excited to learn about building our engineering team.', '2024-07-25 13:00:00+00')
ON CONFLICT DO NOTHING;

-- Insert points transactions showing heavy activity
INSERT INTO public.points_transactions (user_id, type, amount, description, booking_id, created_at) VALUES 
-- Alex Johnson transactions
('46252f81-9cea-470e-8edd-0227071b0177', 'initial_credit', 3000, 'Welcome bonus for new users', NULL, '2024-06-01 10:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0177', 'purchase', 2000, 'Points purchase - Premium package', NULL, '2024-06-15 14:30:00+00'),
('46252f81-9cea-470e-8edd-0227071b0177', 'purchase', -500, 'Strategic Planning Workshop with Dr. Jennifer Smith', (SELECT id FROM bookings WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0177' AND points_spent = 500 LIMIT 1), '2024-07-01 14:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0177', 'purchase', -350, 'Growth Marketing Audit with Lisa Thompson', (SELECT id FROM bookings WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0177' AND points_spent = 350 LIMIT 1), '2024-07-15 11:00:00+00'),

-- Sarah Chen transactions
('46252f81-9cea-470e-8edd-0227071b0178', 'initial_credit', 3000, 'Welcome bonus for new users', NULL, '2024-06-01 10:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0178', 'purchase', -280, 'Digital Marketing Strategy with Lisa Thompson', (SELECT id FROM bookings WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0178' AND points_spent = 280 LIMIT 1), '2024-06-20 10:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0178', 'purchase', -450, 'Customer Acquisition Workshop with Lisa Thompson', (SELECT id FROM bookings WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0178' AND points_spent = 450 LIMIT 1), '2024-07-05 13:00:00+00'),

-- Mike Rodriguez transactions
('46252f81-9cea-470e-8edd-0227071b0179', 'initial_credit', 3000, 'Welcome bonus for new users', NULL, '2024-06-01 10:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0179', 'purchase', 3000, 'Points purchase - Enterprise package', NULL, '2024-06-20 16:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0179', 'purchase', -500, 'Fundraising Strategy Session with Robert Chen', (SELECT id FROM bookings WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0179' AND points_spent = 500 LIMIT 1), '2024-06-10 16:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0179', 'purchase', -400, 'Market Entry Strategy with Dr. Jennifer Smith', (SELECT id FROM bookings WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0179' AND points_spent = 400 LIMIT 1), '2024-07-08 14:00:00+00'),

-- Emma Wilson transactions
('46252f81-9cea-470e-8edd-0227071b017a', 'initial_credit', 3000, 'Welcome bonus for new users', NULL, '2024-06-01 10:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b017a', 'purchase', -400, 'Financial Planning & Analysis with Robert Chen', (SELECT id FROM bookings WHERE user_id = '46252f81-9cea-470e-8edd-0227071b017a' AND points_spent = 400 LIMIT 1), '2024-06-25 09:00:00+00'),

-- Consultant earnings
('46252f81-9cea-470e-8edd-0227071b0180', 'earning', 400, 'Earnings from Strategic Planning Workshop', (SELECT id FROM bookings WHERE consultant_id = (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0180') AND points_spent = 500 LIMIT 1), '2024-07-01 15:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0180', 'earning', 320, 'Earnings from Market Entry Strategy', (SELECT id FROM bookings WHERE consultant_id = (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0180') AND points_spent = 400 LIMIT 1), '2024-07-08 15:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0182', 'earning', 280, 'Earnings from Growth Marketing Audit', (SELECT id FROM bookings WHERE consultant_id = (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0182') AND points_spent = 350 LIMIT 1), '2024-07-15 12:00:00+00'),
('46252f81-9cea-470e-8edd-0227071b0183', 'earning', 400, 'Earnings from Fundraising Strategy Session', (SELECT id FROM bookings WHERE consultant_id = (SELECT id FROM consultants WHERE user_id = '46252f81-9cea-470e-8edd-0227071b0183') AND points_spent = 500 LIMIT 1), '2024-06-10 17:00:00+00')
ON CONFLICT DO NOTHING;