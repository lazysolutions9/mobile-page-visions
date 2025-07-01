-- Manual Notification Test Function
-- Run this to manually trigger a notification

-- 1. First, let's manually insert a notification log
INSERT INTO notification_logs (
  sender_id,
  receiver_id,
  notification_type,
  title,
  body,
  data,
  status
)
SELECT 
  (SELECT id FROM "user" WHERE username = 'buyer1' LIMIT 1) as sender_id,
  (SELECT id FROM "user" WHERE username = 'seller1' LIMIT 1) as receiver_id,
  'test_notification',
  'Test Notification',
  'This is a test notification to verify the system is working.',
  '{"test": true, "timestamp": "' || NOW() || '"}',
  'pending';

-- 2. Check if the notification was created
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
WHERE nl.notification_type = 'test_notification'
ORDER BY nl.sent_at DESC
LIMIT 5; 