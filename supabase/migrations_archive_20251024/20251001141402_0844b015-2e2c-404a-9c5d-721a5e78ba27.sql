-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job to run recurring deductions daily at 00:30 UTC
SELECT cron.schedule(
  'process-recurring-deductions-daily',
  '30 0 * * *', -- Run at 00:30 UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://rrnaquethuzvbsxcssss.supabase.co/functions/v1/process-recurring-deductions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJybmFxdWV0aHV6dmJzeGNzc3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzA0NDYsImV4cCI6MjA2NzMwNjQ0Nn0.gGNkG0ck5DmKe9Xc5EVXWxDDTVheAz3WDz-Cot7A7eI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Query to view all cron jobs (for verification)
-- SELECT * FROM cron.job;

-- Query to view cron job run history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;