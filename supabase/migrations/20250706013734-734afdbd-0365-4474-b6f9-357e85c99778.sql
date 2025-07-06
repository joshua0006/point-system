-- Create dummy test data with proper UUIDs

-- Create test consultant profiles and services
WITH test_users AS (
  SELECT 
    gen_random_uuid() as user_id,
    gen_random_uuid() as profile_id,
    gen_random_uuid() as consultant_id,
    tier,
    name,
    email,
    bio,
    calendar_link
  FROM (VALUES
    ('platinum', 'Sarah Johnson', 'sarah.strategy@example.com', 'Senior Strategy Consultant with 15+ years helping Fortune 500 companies.', 'https://calendly.com/sarah-consultant'),
    ('gold', 'Alex Chen', 'alex.tech@example.com', 'Full-stack developer and technical architect specializing in modern web applications.', 'https://cal.com/alex-tech'),
    ('silver', 'Maria Rodriguez', 'maria.marketing@example.com', 'Digital marketing specialist focused on SEO and content strategy.', 'https://calendly.com/maria-marketing'),
    ('gold', 'David Wilson', 'david.finance@example.com', 'Certified Financial Planner with expertise in investment strategies.', 'https://cal.com/david-finance'),
    ('bronze', 'Jenny Park', 'jenny.ops@example.com', 'Operations consultant helping startups streamline processes.', 'https://calendly.com/jenny-ops'),
    ('silver', 'Mike Thompson', 'mike.hr@example.com', 'HR professional specializing in talent acquisition.', 'https://cal.com/mike-hr')
  ) AS data(tier, name, email, bio, calendar_link)
),
inserted_profiles AS (
  INSERT INTO public.profiles (id, user_id, email, full_name, role, points_balance)
  SELECT profile_id, user_id, email, name, 'consultant', 1000
  FROM test_users
  RETURNING id, user_id, full_name
),
inserted_consultants AS (
  INSERT INTO public.consultants (id, user_id, tier, bio, calendar_link, is_active)
  SELECT 
    tu.consultant_id,
    tu.user_id, 
    tu.tier::consultant_tier,
    tu.bio,
    tu.calendar_link,
    true
  FROM test_users tu
  RETURNING id, user_id, tier
)
INSERT INTO public.services (consultant_id, category_id, title, description, price, duration_minutes, is_active)
SELECT consultant_id, category_id, title, description, price, duration_minutes, true
FROM (
  SELECT 
    (SELECT id FROM inserted_consultants WHERE tier = 'platinum' LIMIT 1) as consultant_id,
    (SELECT id FROM categories WHERE name = 'Strategy') as category_id,
    'Business Strategy Deep Dive' as title,
    'Comprehensive analysis of your business model with actionable recommendations.' as description,
    450 as price,
    120 as duration_minutes
  UNION ALL
  SELECT 
    (SELECT id FROM inserted_consultants WHERE tier = 'platinum' LIMIT 1),
    (SELECT id FROM categories WHERE name = 'Strategy'),
    'Market Research & Analysis',
    'In-depth market research with competitor analysis and customer personas.',
    280,
    90
  UNION ALL
  SELECT 
    (SELECT id FROM inserted_consultants WHERE tier = 'gold' LIMIT 1),
    (SELECT id FROM categories WHERE name = 'Technology'),
    'Web Development Consultation',
    'Technical architecture review and development roadmap for your application.',
    350,
    90
  UNION ALL
  SELECT 
    (SELECT id FROM inserted_consultants WHERE tier = 'gold' LIMIT 1),
    (SELECT id FROM categories WHERE name = 'Technology'),
    'Cloud Infrastructure Audit',
    'Review of your cloud setup with optimization recommendations.',
    400,
    75
  UNION ALL
  SELECT 
    (SELECT id FROM inserted_consultants WHERE tier = 'silver' LIMIT 1 OFFSET 0),
    (SELECT id FROM categories WHERE name = 'Marketing'),
    'SEO Strategy & Implementation',
    'Complete SEO audit and 6-month strategy to improve rankings.',
    220,
    75
  UNION ALL
  SELECT 
    (SELECT id FROM inserted_consultants WHERE tier = 'silver' LIMIT 1 OFFSET 0),
    (SELECT id FROM categories WHERE name = 'Marketing'),
    'Content Marketing Strategy',
    'Comprehensive content calendar aligned with your business goals.',
    180,
    60
  UNION ALL
  SELECT 
    (SELECT id FROM inserted_consultants WHERE tier = 'gold' LIMIT 1 OFFSET 1),
    (SELECT id FROM categories WHERE name = 'Finance'),
    'Investment Portfolio Review',
    'Professional portfolio analysis with rebalancing recommendations.',
    300,
    90
  UNION ALL
  SELECT 
    (SELECT id FROM inserted_consultants WHERE tier = 'gold' LIMIT 1 OFFSET 1),
    (SELECT id FROM categories WHERE name = 'Finance'),
    'Financial Planning Session',
    'Comprehensive financial health check and retirement planning.',
    250,
    120
  UNION ALL
  SELECT 
    (SELECT id FROM inserted_consultants WHERE tier = 'bronze' LIMIT 1),
    (SELECT id FROM categories WHERE name = 'Operations'),
    'Process Optimization Workshop',
    'Identify bottlenecks with actionable improvement recommendations.',
    180,
    90
  UNION ALL
  SELECT 
    (SELECT id FROM inserted_consultants WHERE tier = 'silver' LIMIT 1 OFFSET 1),
    (SELECT id FROM categories WHERE name = 'HR'),
    'Recruitment Strategy Development',
    'Design effective hiring processes and interview frameworks.',
    220,
    75
) AS service_data;