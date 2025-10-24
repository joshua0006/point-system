-- Create placeholder consultant and service data for testing
-- This temporarily works around auth constraints for demo purposes

-- Create placeholder consultants with test user IDs that won't conflict
INSERT INTO public.consultants (id, user_id, tier, bio, calendar_link, is_active) VALUES 
(gen_random_uuid(), gen_random_uuid(), 'platinum', 'Senior Strategy Consultant - 15+ years Fortune 500 experience', 'https://calendly.com/demo-sarah', true),
(gen_random_uuid(), gen_random_uuid(), 'gold', 'Full-Stack Developer & Technical Architect', 'https://cal.com/demo-alex', true),
(gen_random_uuid(), gen_random_uuid(), 'silver', 'Digital Marketing Specialist - SEO & Content Expert', 'https://calendly.com/demo-maria', true),
(gen_random_uuid(), gen_random_uuid(), 'gold', 'Certified Financial Planner & Investment Strategist', 'https://cal.com/demo-david', true),
(gen_random_uuid(), gen_random_uuid(), 'bronze', 'Operations Consultant - Process Optimization', 'https://calendly.com/demo-jenny', true),
(gen_random_uuid(), gen_random_uuid(), 'silver', 'HR Professional - Talent & Organizational Development', 'https://cal.com/demo-mike', true);

-- Create corresponding placeholder profiles
INSERT INTO public.profiles (id, user_id, email, full_name, role, points_balance)
SELECT 
  gen_random_uuid(),
  user_id,
  CASE 
    WHEN tier = 'platinum' THEN 'sarah.demo@example.com'
    WHEN tier = 'gold' AND bio LIKE '%Developer%' THEN 'alex.demo@example.com'
    WHEN tier = 'silver' AND bio LIKE '%Marketing%' THEN 'maria.demo@example.com'
    WHEN tier = 'gold' AND bio LIKE '%Financial%' THEN 'david.demo@example.com'
    WHEN tier = 'bronze' THEN 'jenny.demo@example.com'
    ELSE 'mike.demo@example.com'
  END,
  CASE 
    WHEN tier = 'platinum' THEN 'Sarah Johnson'
    WHEN tier = 'gold' AND bio LIKE '%Developer%' THEN 'Alex Chen'
    WHEN tier = 'silver' AND bio LIKE '%Marketing%' THEN 'Maria Rodriguez'
    WHEN tier = 'gold' AND bio LIKE '%Financial%' THEN 'David Wilson'
    WHEN tier = 'bronze' THEN 'Jenny Park'
    ELSE 'Mike Thompson'
  END,
  'consultant',
  1000
FROM public.consultants WHERE bio IS NOT NULL;

-- Create diverse services across all categories
WITH consultant_data AS (
  SELECT id, tier FROM public.consultants ORDER BY created_at
)
INSERT INTO public.services (consultant_id, category_id, title, description, price, duration_minutes, is_active) VALUES
-- Strategy Services (Platinum consultant)
((SELECT id FROM consultant_data WHERE tier = 'platinum' LIMIT 1), (SELECT id FROM categories WHERE name = 'Strategy'), 'Business Strategy Deep Dive', 'Comprehensive business model analysis with 3-month roadmap and growth opportunities assessment.', 450, 120, true),
((SELECT id FROM consultant_data WHERE tier = 'platinum' LIMIT 1), (SELECT id FROM categories WHERE name = 'Strategy'), 'Market Research & Competitive Analysis', 'In-depth market research including competitor analysis, customer personas, and market sizing.', 280, 90, true),

-- Technology Services (Gold consultant)
((SELECT id FROM consultant_data WHERE tier = 'gold' LIMIT 1), (SELECT id FROM categories WHERE name = 'Technology'), 'Full-Stack Development Consultation', 'Technical architecture review and development roadmap with technology stack recommendations.', 350, 90, true),
((SELECT id FROM consultant_data WHERE tier = 'gold' LIMIT 1), (SELECT id FROM categories WHERE name = 'Technology'), 'Cloud Infrastructure Audit', 'Comprehensive cloud setup review with cost, performance, and security optimization.', 400, 75, true),

-- Marketing Services (Silver consultant)
((SELECT id FROM consultant_data WHERE tier = 'silver' AND id IN (SELECT id FROM consultant_data WHERE tier = 'silver' LIMIT 1)), (SELECT id FROM categories WHERE name = 'Marketing'), 'SEO Strategy & Implementation', 'Complete SEO audit with 6-month implementation strategy for improved rankings.', 220, 75, true),
((SELECT id FROM consultant_data WHERE tier = 'silver' AND id IN (SELECT id FROM consultant_data WHERE tier = 'silver' LIMIT 1)), (SELECT id FROM categories WHERE name = 'Marketing'), 'Content Marketing Masterplan', 'Comprehensive content calendar and strategy aligned with business goals.', 180, 60, true),

-- Finance Services (Gold consultant - different one)
((SELECT id FROM consultant_data WHERE tier = 'gold' LIMIT 1 OFFSET 1), (SELECT id FROM categories WHERE name = 'Finance'), 'Investment Portfolio Review', 'Professional portfolio analysis with rebalancing recommendations and risk assessment.', 300, 90, true),
((SELECT id FROM consultant_data WHERE tier = 'gold' LIMIT 1 OFFSET 1), (SELECT id FROM categories WHERE name = 'Finance'), 'Financial Planning Session', 'Comprehensive financial health check including budget and retirement planning.', 250, 120, true),
((SELECT id FROM consultant_data WHERE tier = 'gold' LIMIT 1 OFFSET 1), (SELECT id FROM categories WHERE name = 'Finance'), 'Startup Funding Strategy', 'Funding options guidance with investor pitch prep and financial projections.', 400, 75, true),

-- Operations Services (Bronze consultant)
((SELECT id FROM consultant_data WHERE tier = 'bronze' LIMIT 1), (SELECT id FROM categories WHERE name = 'Operations'), 'Process Optimization Workshop', 'Identify operational bottlenecks with actionable improvement recommendations.', 180, 90, true),
((SELECT id FROM consultant_data WHERE tier = 'bronze' LIMIT 1), (SELECT id FROM categories WHERE name = 'Operations'), 'Automation Strategy Session', 'Discover automation opportunities to streamline workflows with modern tools.', 200, 60, true),

-- HR Services (Silver consultant - different one)
((SELECT id FROM consultant_data WHERE tier = 'silver' LIMIT 1 OFFSET 1), (SELECT id FROM categories WHERE name = 'HR'), 'Recruitment Strategy Development', 'Design effective hiring processes with job descriptions and interview frameworks.', 220, 75, true),
((SELECT id FROM consultant_data WHERE tier = 'silver' LIMIT 1 OFFSET 1), (SELECT id FROM categories WHERE name = 'HR'), 'Employee Engagement Assessment', 'Team satisfaction evaluation with workplace culture improvement recommendations.', 190, 90, true),
((SELECT id FROM consultant_data WHERE tier = 'silver' LIMIT 1 OFFSET 1), (SELECT id FROM categories WHERE name = 'HR'), 'Leadership Development Coaching', 'One-on-one coaching focused on leadership skills and management effectiveness.', 160, 60, true);