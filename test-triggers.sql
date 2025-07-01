-- Test Database Triggers
-- Run this to test if notifications are being created when requests are made

-- 1. First, let's create a test request to trigger notifications
INSERT INTO requests (
  buyer_id,
  title,
  description,
  category,
  budget,
  location,
  status
)
SELECT 
  (SELECT id FROM "user" WHERE username = 'buyer1' LIMIT 1) as buyer_id,
  'Test Request for Notifications',
  'This is a test request to check if notifications are triggered',
  'Test Category',
  100.00,
  'Test Location',
  'open';

-- 2. Check if the request was created
SELECT 
  r.id,
  r.title,
  r.buyer_id,
  u.username as buyer_name,
  r.created_at
FROM requests r
JOIN "user" u ON r.buyer_id = u.id
WHERE r.title = 'Test Request for Notifications'
ORDER BY r.created_at DESC
LIMIT 5;

-- 3. Check if notification logs were created
SELECT 
  nl.id,
  nl.notification_type,
  nl.title,
  nl.body,
  nl.status,
  sender.username as sender_name,
  receiver.username as receiver_name,
  nl.sent_at
FROM notification_logs nl
JOIN "user" sender ON nl.sender_id = sender.id
JOIN "user" receiver ON nl.receiver_id = receiver.id
WHERE nl.notification_type = 'new_request'
ORDER BY nl.sent_at DESC
LIMIT 10;

-- 4. Check if sellers have push tokens
SELECT 
  u.username,
  u."isSeller",
  CASE WHEN upt.push_token IS NOT NULL THEN 'Has Token' ELSE 'No Token' END as token_status,
  upt.push_token
FROM "user" u
LEFT JOIN user_push_tokens upt ON u.id = upt.user_id
WHERE u."isSeller" = true; 