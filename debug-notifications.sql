-- Debug Queries for Notification System
-- Run these in your Supabase SQL Editor to check the status

-- 1. Check if push tokens are saved
SELECT 
  u.username,
  u."isSeller",
  upt.push_token,
  upt.created_at
FROM "user" u
LEFT JOIN user_push_tokens upt ON u.id = upt.user_id
ORDER BY u.username;

-- 2. Check if requests exist
SELECT 
  r.id,
  r.title,
  r.buyer_id,
  u.username as buyer_name,
  r.created_at
FROM requests r
JOIN "user" u ON r.buyer_id = u.id
ORDER BY r.created_at DESC
LIMIT 10;

-- 3. Check if notification logs are being created
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
ORDER BY nl.sent_at DESC
LIMIT 10;

-- 4. Check sellers who should receive notifications
SELECT 
  u.id,
  u.username,
  u."isSeller",
  CASE WHEN upt.push_token IS NOT NULL THEN 'Has Token' ELSE 'No Token' END as token_status
FROM "user" u
LEFT JOIN user_push_tokens upt ON u.id = upt.user_id
WHERE u."isSeller" = true; 