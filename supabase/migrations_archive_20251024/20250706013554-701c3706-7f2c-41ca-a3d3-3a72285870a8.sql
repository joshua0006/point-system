-- Create dummy test data for marketplace testing
-- This uses placeholder UUIDs that would normally come from auth.users

-- Temporarily disable foreign key checks for testing
SET session_replication_role = replica;

-- Insert dummy user profiles (these would normally be created via auth signup)
INSERT INTO public.profiles (id, user_id, email, full_name, role, points_balance) VALUES
('p1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'sarah.strategy@example.com', 'Sarah Johnson', 'consultant', 1000),
('p2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'alex.tech@example.com', 'Alex Chen', 'consultant', 1000),
('p3333333-3333-3333-3333-333333333333', 'u3333333-3333-3333-3333-333333333333', 'maria.marketing@example.com', 'Maria Rodriguez', 'consultant', 1000),
('p4444444-4444-4444-4444-444444444444', 'u4444444-4444-4444-4444-444444444444', 'david.finance@example.com', 'David Wilson', 'consultant', 1000),
('p5555555-5555-5555-5555-555555555555', 'u5555555-5555-5555-5555-555555555555', 'jenny.ops@example.com', 'Jenny Park', 'consultant', 1000),
('p6666666-6666-6666-6666-666666666666', 'u6666666-6666-6666-6666-666666666666', 'mike.hr@example.com', 'Mike Thompson', 'consultant', 1000);

-- Insert consultant profiles
INSERT INTO public.consultants (id, user_id, tier, bio, expertise_areas, calendar_link, is_active) VALUES
('c1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'platinum', 'Senior Strategy Consultant with 15+ years helping Fortune 500 companies scale and optimize operations.', ARRAY['Business Strategy', 'Market Research'], 'https://calendly.com/sarah-consultant', true),
('c2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'gold', 'Full-stack developer and technical architect specializing in modern web applications.', ARRAY['Web Development', 'Cloud Architecture'], 'https://cal.com/alex-tech', true),
('c3333333-3333-3333-3333-333333333333', 'u3333333-3333-3333-3333-333333333333', 'silver', 'Digital marketing specialist focused on SEO and content strategy for SMBs.', ARRAY['SEO', 'Content Marketing'], 'https://calendly.com/maria-marketing', true),
('c4444444-4444-4444-4444-444444444444', 'u4444444-4444-4444-4444-444444444444', 'gold', 'Certified Financial Planner with expertise in investment strategies and corporate finance.', ARRAY['Financial Planning', 'Investment Strategy'], 'https://cal.com/david-finance', true),
('c5555555-5555-5555-5555-555555555555', 'u5555555-5555-5555-5555-555555555555', 'bronze', 'Operations consultant helping startups streamline processes through automation.', ARRAY['Process Optimization', 'Automation'], 'https://calendly.com/jenny-ops', true),
('c6666666-6666-6666-6666-666666666666', 'u6666666-6666-6666-6666-666666666666', 'silver', 'HR professional specializing in talent acquisition and organizational development.', ARRAY['Recruitment', 'Employee Training'], 'https://cal.com/mike-hr', true);

-- Insert services across all categories
INSERT INTO public.services (consultant_id, category_id, title, description, price, duration_minutes, is_active) VALUES
-- Strategy Services
('c1111111-1111-1111-1111-111111111111', (SELECT id FROM categories WHERE name = 'Strategy'), 'Business Strategy Deep Dive', 'Comprehensive analysis of your business model with actionable recommendations and 3-month roadmap.', 450, 120, true),
('c1111111-1111-1111-1111-111111111111', (SELECT id FROM categories WHERE name = 'Strategy'), 'Market Research & Analysis', 'In-depth market research with competitor analysis and customer personas.', 280, 90, true),

-- Technology Services  
('c2222222-2222-2222-2222-222222222222', (SELECT id FROM categories WHERE name = 'Technology'), 'Web Development Consultation', 'Technical architecture review and development roadmap for your web application.', 350, 90, true),
('c2222222-2222-2222-2222-222222222222', (SELECT id FROM categories WHERE name = 'Technology'), 'Cloud Infrastructure Audit', 'Review of your cloud setup with optimization recommendations for cost and performance.', 400, 75, true),

-- Marketing Services
('c3333333-3333-3333-3333-333333333333', (SELECT id FROM categories WHERE name = 'Marketing'), 'SEO Strategy & Implementation', 'Complete SEO audit and 6-month strategy to improve search rankings and traffic.', 220, 75, true),
('c3333333-3333-3333-3333-333333333333', (SELECT id FROM categories WHERE name = 'Marketing'), 'Content Marketing Strategy', 'Comprehensive content calendar and strategy aligned with your business goals.', 180, 60, true),

-- Finance Services
('c4444444-4444-4444-4444-444444444444', (SELECT id FROM categories WHERE name = 'Finance'), 'Investment Portfolio Review', 'Professional portfolio analysis with rebalancing recommendations and risk assessment.', 300, 90, true),
('c4444444-4444-4444-4444-444444444444', (SELECT id FROM categories WHERE name = 'Finance'), 'Financial Planning Session', 'Comprehensive financial health check including budget optimization and retirement planning.', 250, 120, true),
('c4444444-4444-4444-4444-444444444444', (SELECT id FROM categories WHERE name = 'Finance'), 'Startup Funding Strategy', 'Guidance on funding options, investor pitches, and financial projections.', 400, 75, true),

-- Operations Services  
('c5555555-5555-5555-5555-555555555555', (SELECT id FROM categories WHERE name = 'Operations'), 'Process Optimization Workshop', 'Identify bottlenecks and inefficiencies with actionable improvement recommendations.', 180, 90, true),
('c5555555-5555-5555-5555-555555555555', (SELECT id FROM categories WHERE name = 'Operations'), 'Automation Strategy Consultation', 'Discover automation opportunities to streamline workflows using modern tools.', 200, 60, true),

-- HR Services
('c6666666-6666-6666-6666-666666666666', (SELECT id FROM categories WHERE name = 'HR'), 'Recruitment Strategy Development', 'Design effective hiring processes with job descriptions and interview frameworks.', 220, 75, true),
('c6666666-6666-6666-6666-666666666666', (SELECT id FROM categories WHERE name = 'HR'), 'Employee Engagement Assessment', 'Evaluate team satisfaction with recommendations for improving workplace culture.', 190, 90, true),
('c6666666-6666-6666-6666-666666666666', (SELECT id FROM categories WHERE name = 'HR'), 'Leadership Development Coaching', 'One-on-one coaching focused on developing leadership skills and management effectiveness.', 160, 60, true);

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;