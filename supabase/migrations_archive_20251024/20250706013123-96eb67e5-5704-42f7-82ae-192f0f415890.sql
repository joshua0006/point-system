-- Insert dummy consultant data with sample services

-- First, let's add some consultant profiles with generated UUIDs
-- Note: These would normally be created when real users sign up as consultants

-- Insert consultants with different tiers and expertise
INSERT INTO public.consultants (id, user_id, tier, bio, expertise_areas, calendar_link, is_active) VALUES
(
  'c1111111-1111-1111-1111-111111111111',
  'u1111111-1111-1111-1111-111111111111', 
  'platinum',
  'Senior Strategy Consultant with 15+ years of experience helping Fortune 500 companies scale and optimize their operations.',
  ARRAY['Business Strategy', 'Market Research', 'Digital Transformation'],
  'https://calendly.com/sarah-consultant',
  true
),
(
  'c2222222-2222-2222-2222-222222222222',
  'u2222222-2222-2222-2222-222222222222',
  'gold', 
  'Full-stack developer and technical architect specializing in modern web applications and cloud infrastructure.',
  ARRAY['Web Development', 'Cloud Architecture', 'DevOps'],
  'https://cal.com/alex-tech',
  true
),
(
  'c3333333-3333-3333-3333-333333333333',
  'u3333333-3333-3333-3333-333333333333',
  'silver',
  'Digital marketing specialist focused on content strategy, SEO, and social media growth for small to medium businesses.',
  ARRAY['SEO', 'Content Marketing', 'Social Media'],
  'https://calendly.com/maria-marketing',
  true
),
(
  'c4444444-4444-4444-4444-444444444444',
  'u4444444-4444-4444-4444-444444444444',
  'gold',
  'Certified Financial Planner with expertise in investment strategies, retirement planning, and corporate finance.',
  ARRAY['Financial Planning', 'Investment Strategy', 'Risk Management'],
  'https://cal.com/david-finance',
  true
),
(
  'c5555555-5555-5555-5555-555555555555',
  'u5555555-5555-5555-5555-555555555555',
  'bronze',
  'Operations consultant helping startups streamline processes and improve efficiency through automation.',
  ARRAY['Process Optimization', 'Automation', 'Lean Management'],
  'https://calendly.com/jenny-ops',
  true
),
(
  'c6666666-6666-6666-6666-666666666666',
  'u6666666-6666-6666-6666-666666666666',
  'silver',
  'HR professional specializing in talent acquisition, employee engagement, and organizational development.',
  ARRAY['Recruitment', 'Employee Training', 'Organizational Development'],
  'https://cal.com/mike-hr',
  true
),
(
  'c7777777-7777-7777-7777-777777777777',
  'u7777777-7777-7777-7777-777777777777',
  'platinum',
  'Cybersecurity expert with deep knowledge in penetration testing, security audits, and compliance frameworks.',
  ARRAY['Cybersecurity', 'Penetration Testing', 'Compliance'],
  'https://calendly.com/lisa-security',
  true
),
(
  'c8888888-8888-8888-8888-888888888888',
  'u8888888-8888-8888-8888-888888888888',
  'bronze',
  'Marketing consultant specializing in brand strategy and creative campaigns for emerging businesses.',
  ARRAY['Brand Strategy', 'Creative Direction', 'Campaign Management'],
  'https://cal.com/tom-brand',
  true
);

-- Add corresponding profiles for the consultants
INSERT INTO public.profiles (id, user_id, email, full_name, role, points_balance) VALUES
('p1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'sarah.strategy@example.com', 'Sarah Johnson', 'consultant', 1000),
('p2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'alex.tech@example.com', 'Alex Chen', 'consultant', 1000),
('p3333333-3333-3333-3333-333333333333', 'u3333333-3333-3333-3333-333333333333', 'maria.marketing@example.com', 'Maria Rodriguez', 'consultant', 1000),
('p4444444-4444-4444-4444-444444444444', 'u4444444-4444-4444-4444-444444444444', 'david.finance@example.com', 'David Wilson', 'consultant', 1000),
('p5555555-5555-5555-5555-555555555555', 'u5555555-5555-5555-5555-555555555555', 'jenny.ops@example.com', 'Jenny Park', 'consultant', 1000),
('p6666666-6666-6666-6666-666666666666', 'u6666666-6666-6666-6666-666666666666', 'mike.hr@example.com', 'Mike Thompson', 'consultant', 1000),
('p7777777-7777-7777-7777-777777777777', 'u7777777-7777-7777-7777-777777777777', 'lisa.security@example.com', 'Lisa Anderson', 'consultant', 1000),
('p8888888-8888-8888-8888-888888888888', 'u8888888-8888-8888-8888-888888888888', 'tom.brand@example.com', 'Tom Davis', 'consultant', 1000);

-- Now add services across all categories
-- Get category IDs first, then insert services

-- Strategy Services
INSERT INTO public.services (consultant_id, category_id, title, description, price, duration_minutes, is_active) VALUES
(
  'c1111111-1111-1111-1111-111111111111',
  (SELECT id FROM public.categories WHERE name = 'Strategy' LIMIT 1),
  'Business Strategy Deep Dive',
  'Comprehensive analysis of your business model, market position, and growth opportunities. Includes actionable recommendations and 3-month roadmap.',
  450,
  120,
  true
),
(
  'c1111111-1111-1111-1111-111111111111', 
  (SELECT id FROM public.categories WHERE name = 'Strategy' LIMIT 1),
  'Market Research & Analysis',
  'In-depth market research including competitor analysis, customer personas, and market sizing for your target audience.',
  280,
  90,
  true
),

-- Technology Services  
(
  'c2222222-2222-2222-2222-222222222222',
  (SELECT id FROM public.categories WHERE name = 'Technology' LIMIT 1),
  'Full-Stack Web Development Consultation',
  'Technical architecture review and development roadmap for your web application. Includes technology stack recommendations and scalability planning.',
  350,
  90,
  true
),
(
  'c2222222-2222-2222-2222-222222222222',
  (SELECT id FROM public.categories WHERE name = 'Technology' LIMIT 1),
  'Cloud Infrastructure Audit',
  'Comprehensive review of your cloud setup with optimization recommendations for cost, performance, and security.',
  400,
  60,
  true
),
(
  'c7777777-7777-7777-7777-777777777777',
  (SELECT id FROM public.categories WHERE name = 'Technology' LIMIT 1),
  'Cybersecurity Assessment',
  'Professional security audit of your systems and processes. Includes vulnerability assessment and remediation plan.',
  500,
  120,
  true
),

-- Marketing Services
(
  'c3333333-3333-3333-3333-333333333333',
  (SELECT id FROM public.categories WHERE name = 'Marketing' LIMIT 1),
  'SEO Strategy & Implementation Plan',
  'Complete SEO audit and 6-month implementation strategy to improve your search rankings and organic traffic.',
  220,
  75,
  true
),
(
  'c3333333-3333-3333-3333-333333333333',
  (SELECT id FROM public.categories WHERE name = 'Marketing' LIMIT 1),
  'Content Marketing Strategy',
  'Develop a comprehensive content calendar and strategy aligned with your business goals and target audience.',
  180,
  60,
  true
),
(
  'c8888888-8888-8888-8888-888888888888',
  (SELECT id FROM public.categories WHERE name = 'Marketing' LIMIT 1),
  'Brand Identity Consultation',
  'Brand positioning, messaging, and visual identity guidance to help you stand out in your market.',
  150,
  90,
  true
),

-- Finance Services
(
  'c4444444-4444-4444-4444-444444444444',
  (SELECT id FROM public.categories WHERE name = 'Finance' LIMIT 1),
  'Investment Portfolio Review',
  'Professional analysis of your investment portfolio with rebalancing recommendations and risk assessment.',
  300,
  90,
  true
),
(
  'c4444444-4444-4444-4444-444444444444',
  (SELECT id FROM public.categories WHERE name = 'Finance' LIMIT 1),
  'Financial Planning Session',
  'Comprehensive financial health check including budget optimization, debt management, and retirement planning.',
  250,
  120,
  true
),
(
  'c4444444-4444-4444-4444-444444444444',
  (SELECT id FROM public.categories WHERE name = 'Finance' LIMIT 1),
  'Startup Funding Strategy',
  'Guidance on funding options, investor pitch preparation, and financial projections for early-stage startups.',
  400,
  75,
  true
),

-- Operations Services  
(
  'c5555555-5555-5555-5555-555555555555',
  (SELECT id FROM public.categories WHERE name = 'Operations' LIMIT 1),
  'Process Optimization Workshop',
  'Identify bottlenecks and inefficiencies in your operations with actionable improvement recommendations.',
  180,
  90,
  true
),
(
  'c5555555-5555-5555-5555-555555555555',
  (SELECT id FROM public.categories WHERE name = 'Operations' LIMIT 1),
  'Automation Strategy Consultation',
  'Discover opportunities to automate repetitive tasks and streamline your workflows using modern tools.',
  200,
  60,
  true
),

-- HR Services
(
  'c6666666-6666-6666-6666-666666666666',
  (SELECT id FROM public.categories WHERE name = 'HR' LIMIT 1),
  'Recruitment Strategy Development',
  'Design an effective hiring process including job descriptions, interview frameworks, and candidate evaluation criteria.',
  220,
  75,
  true
),
(
  'c6666666-6666-6666-6666-666666666666',
  (SELECT id FROM public.categories WHERE name = 'HR' LIMIT 1),
  'Employee Engagement Assessment',
  'Evaluate team satisfaction and productivity with recommendations for improving workplace culture and retention.',
  190,
  90,
  true
),
(
  'c6666666-6666-6666-6666-666666666666', 
  (SELECT id FROM public.categories WHERE name = 'HR' LIMIT 1),
  'Leadership Development Coaching',
  'One-on-one coaching session focused on developing leadership skills and management effectiveness.',
  160,
  60,
  true
);