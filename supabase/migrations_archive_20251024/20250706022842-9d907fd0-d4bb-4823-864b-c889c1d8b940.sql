-- Create test data using the existing authenticated user
-- Using user ID from auth logs: 952c1a39-f9bf-4f5d-ba81-fac0ab686384

-- First, ensure this user has a profile
INSERT INTO public.profiles (id, user_id, email, full_name, role, points_balance)
VALUES (
  gen_random_uuid(),
  '952c1a39-f9bf-4f5d-ba81-fac0ab686384',
  'demo@example.com',
  'Demo Consultant',
  'consultant',
  5000
) 
ON CONFLICT (user_id) DO UPDATE SET
  points_balance = 5000,
  role = 'consultant';

-- Create a consultant profile using the authenticated user
INSERT INTO public.consultants (id, user_id, tier, bio, calendar_link, is_active) VALUES 
(gen_random_uuid(), '952c1a39-f9bf-4f5d-ba81-fac0ab686384', 'platinum', 'Senior Strategy Consultant with 15+ years helping Fortune 500 companies scale operations', 'https://calendly.com/demo-consultant', true);

-- Create diverse services across all categories
INSERT INTO public.services (consultant_id, category_id, title, description, price, duration_minutes, is_active) VALUES
-- Strategy Services
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'Strategy' LIMIT 1), 'Business Strategy Deep Dive', 'Comprehensive business model analysis with 3-month roadmap and growth opportunities assessment.', 450, 120, true),
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'Strategy' LIMIT 1), 'Market Research & Analysis', 'In-depth market research including competitor analysis, customer personas, and market sizing.', 280, 90, true),

-- Technology Services
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'Technology' LIMIT 1), 'Web Development Consultation', 'Technical architecture review and development roadmap with technology stack recommendations.', 350, 90, true),
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'Technology' LIMIT 1), 'Cloud Infrastructure Audit', 'Comprehensive cloud setup review with cost, performance, and security optimization.', 400, 75, true),

-- Marketing Services
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'Marketing' LIMIT 1), 'SEO Strategy & Implementation', 'Complete SEO audit with 6-month implementation strategy for improved rankings.', 220, 75, true),
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'Marketing' LIMIT 1), 'Content Marketing Strategy', 'Comprehensive content calendar and strategy aligned with business goals.', 180, 60, true),

-- Finance Services
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'Finance' LIMIT 1), 'Investment Portfolio Review', 'Professional portfolio analysis with rebalancing recommendations and risk assessment.', 300, 90, true),
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'Finance' LIMIT 1), 'Financial Planning Session', 'Comprehensive financial health check including budget and retirement planning.', 250, 120, true),

-- Operations Services
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'Operations' LIMIT 1), 'Process Optimization Workshop', 'Identify operational bottlenecks with actionable improvement recommendations.', 180, 90, true),
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'Operations' LIMIT 1), 'Automation Strategy Session', 'Discover automation opportunities to streamline workflows with modern tools.', 200, 60, true),

-- HR Services
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'HR' LIMIT 1), 'Recruitment Strategy Development', 'Design effective hiring processes with job descriptions and interview frameworks.', 220, 75, true),
((SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1), (SELECT id FROM public.categories WHERE name = 'HR' LIMIT 1), 'Leadership Development Coaching', 'One-on-one coaching focused on leadership skills and management effectiveness.', 160, 60, true);