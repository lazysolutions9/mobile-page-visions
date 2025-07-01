-- Manual Push Notification Test
-- This will create a notification and immediately try to send it

-- 1. Create a test notification for a seller
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
  'manual_test',
  'Manual Test Notification',
  'This is a manual test notification to verify push notifications work.',
  '{"manual_test": true, "timestamp": "' || NOW() || '"}',
  'pending';

-- 2. Check the created notification
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
WHERE nl.notification_type = 'manual_test'
ORDER BY nl.sent_at DESC
LIMIT 5; 