-- Alternative Cron Schedules for Processing Notifications
-- Choose one based on your needs

-- Option A: Every 5 minutes (less resource intensive)
SELECT cron.schedule(
  'process-notifications-5min',
  '*/5 * * * *',  -- every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://fhwktehwsqmdfyvocdvy.supabase.co/functions/v1/process-notifications',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod2t0ZWh3c3FtZGZ5dm9jZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTI5MzksImV4cCI6MjA2NjE2ODkzOX0.gKhhJ7cKFSsqhQye1wK6qNNDnzul-d_CVV6-z5kEooU", "Content-Type": "application/json"}',
    body := '{}'
  );
  $$
);

-- Option B: Every 10 minutes
SELECT cron.schedule(
  'process-notifications-10min',
  '*/10 * * * *',  -- every 10 minutes
  $$
  SELECT net.http_post(
    url := 'https://fhwktehwsqmdfyvocdvy.supabase.co/functions/v1/process-notifications',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod2t0ZWh3c3FtZGZ5dm9jZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTI5MzksImV4cCI6MjA2NjE2ODkzOX0.gKhhJ7cKFSsqhQye1wK6qNNDnzul-d_CVV6-z5kEooU", "Content-Type": "application/json"}',
    body := '{}'
  );
  $$
);

-- Option C: Every 30 minutes
SELECT cron.schedule(
  'process-notifications-30min',
  '*/30 * * * *',  -- every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://fhwktehwsqmdfyvocdvy.supabase.co/functions/v1/process-notifications',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod2t0ZWh3c3FtZGZ5dm9jZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTI5MzksImV4cCI6MjA2NjE2ODkzOX0.gKhhJ7cKFSsqhQye1wK6qNNDnzul-d_CVV6-z5kEooU", "Content-Type": "application/json"}',
    body := '{}'
  );
  $$
); 