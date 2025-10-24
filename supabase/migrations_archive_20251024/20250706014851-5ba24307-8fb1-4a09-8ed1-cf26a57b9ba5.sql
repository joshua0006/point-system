-- Create test data using the existing authenticated user
-- Using user ID from auth logs: 952c1a39-f9bf-4f5d-ba81-fac0ab686384

-- First, let's check if this user has a profile and create one if needed
INSERT INTO public.profiles (id, user_id, email, full_name, role, points_balance)
VALUES (
  gen_random_uuid(),
  '952c1a39-f9bf-4f5d-ba81-fac0ab686384',
  'test@example.com',
  'Test User',
  'user',
  5000
) 
ON CONFLICT (user_id) DO UPDATE SET
  points_balance = 5000,
  role = 'consultant';

-- Create multiple consultant profiles using the same user (for testing purposes)
INSERT INTO public.consultants (id, user_id, tier, bio, calendar_link, is_active) VALUES 
(gen_random_uuid(), '952c1a39-f9bf-4f5d-ba81-fac0ab686384', 'platinum', 'Senior Strategy Consultant - 15+ years Fortune 500 experience', 'https://calendly.com/demo-sarah', true);

-- Create services using this consultant
WITH test_consultant AS (
  SELECT id FROM public.consultants WHERE user_id = '952c1a39-f9bf-4f5d-ba81-fac0ab686384' LIMIT 1
)
INSERT INTO public.services (consultant_id, category_id, title, description, price, duration_minutes, is_active)
SELECT 
  tc.id,
  cat.id,
  service_data.title,
  service_data.description,
  service_data.price,
  service_data.duration_minutes,
  true
FROM test_consultant tc
CROSS JOIN (
  SELECT id FROM public.categories
) cat
CROSS JOIN (
  VALUES
    ('Business Strategy Deep Dive', 'Comprehensive business model analysis with 3-month roadmap and growth opportunities assessment.', 450, 120),
    ('Market Research & Analysis', 'In-depth market research including competitor analysis, customer personas, and market sizing.', 280, 90),
    ('Web Development Consultation', 'Technical architecture review and development roadmap with technology stack recommendations.', 350, 90),
    ('SEO Strategy & Implementation', 'Complete SEO audit with 6-month implementation strategy for improved rankings.', 220, 75),
    ('Investment Portfolio Review', 'Professional portfolio analysis with rebalancing recommendations and risk assessment.', 300, 90),
    ('Process Optimization Workshop', 'Identify operational bottlenecks with actionable improvement recommendations.', 180, 90),
    ('Recruitment Strategy Development', 'Design effective hiring processes with job descriptions and interview frameworks.', 220, 75),
    ('Content Marketing Strategy', 'Comprehensive content calendar and strategy aligned with business goals.', 180, 60),
    ('Financial Planning Session', 'Comprehensive financial health check including budget and retirement planning.', 250, 120),
    ('Cloud Infrastructure Audit', 'Comprehensive cloud setup review with cost, performance, and security optimization.', 400, 75),
    ('Employee Engagement Assessment', 'Team satisfaction evaluation with workplace culture improvement recommendations.', 190, 90),
    ('Leadership Development Coaching', 'One-on-one coaching focused on leadership skills and management effectiveness.', 160, 60)
) AS service_data(title, description, price, duration_minutes)
WHERE cat.name IN ('Strategy', 'Technology', 'Marketing', 'Finance', 'Operations', 'HR')
LIMIT 15;