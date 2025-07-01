-- Cron Job Management Functions
-- Useful for managing your notification processing cron jobs

-- 1. List all cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  created_at
FROM cron.job
ORDER BY created_at DESC;

-- 2. Disable a specific cron job
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications'),
  enabled := false
);

-- 3. Enable a specific cron job
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications'),
  enabled := true
);

-- 4. Delete a cron job
SELECT cron.unschedule('process-notifications');

-- 5. Update cron job schedule
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications'),
  schedule := '*/5 * * * *'  -- change to every 5 minutes
);

-- 6. Check cron job run history
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  return_message,
  start_time,
  end_time,
  total_runtime
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications')
ORDER BY start_time DESC
LIMIT 10; 