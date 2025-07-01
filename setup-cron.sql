-- Setup Cron Job for Processing Notifications
-- Run this in your Supabase SQL Editor

-- 1. Enable the cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create a cron job that calls the Edge Function every minute
SELECT cron.schedule(
  'process-notifications',           -- job name
  '* * * * *',                       -- every minute (cron expression)
  $$
  SELECT net.http_post(
    url := 'https://fhwktehwsqmdfyvocdvy.supabase.co/functions/v1/process-notifications',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod2t0ZWh3c3FtZGZ5dm9jZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTI5MzksImV4cCI6MjA2NjE2ODkzOX0.gKhhJ7cKFSsqhQye1wK6qNNDnzul-d_CVV6-z5kEooU", "Content-Type": "application/json"}',
    body := '{}'
  );
  $$
);

-- 3. Check if the cron job was created successfully
SELECT * FROM cron.job WHERE jobname = 'process-notifications';

-- 4. List all active cron jobs
SELECT jobid, jobname, schedule, active FROM cron.job; 