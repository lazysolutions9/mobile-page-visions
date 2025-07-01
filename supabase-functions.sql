-- Create table for storing user push tokens
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create table for notification logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id),
  receiver_id UUID REFERENCES auth.users(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- Function to send notification when a new request is created
CREATE OR REPLACE FUNCTION notify_sellers_new_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification log
  INSERT INTO notification_logs (
    sender_id,
    receiver_id,
    notification_type,
    title,
    body,
    data
  )
  SELECT 
    NEW.buyer_id,
    u.id,
    'new_request',
    'New Service Request',
    'A buyer has posted a new service request that matches your profile.',
    jsonb_build_object(
      'request_id', NEW.id,
      'request_title', NEW.title,
      'buyer_id', NEW.buyer_id
    )
  FROM users u
  WHERE u.role = 'seller' 
    AND u.id != NEW.buyer_id
    AND u.is_active = true;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new requests
DROP TRIGGER IF EXISTS trigger_notify_sellers_new_request ON requests;
CREATE TRIGGER trigger_notify_sellers_new_request
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_sellers_new_request();

-- Function to notify buyer when seller responds
CREATE OR REPLACE FUNCTION notify_buyer_seller_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification log
  INSERT INTO notification_logs (
    sender_id,
    receiver_id,
    notification_type,
    title,
    body,
    data
  )
  SELECT 
    NEW.seller_id,
    r.buyer_id,
    'seller_response',
    'Seller Response',
    'A seller has responded to your service request.',
    jsonb_build_object(
      'request_id', NEW.request_id,
      'seller_id', NEW.seller_id,
      'response_id', NEW.id
    )
  FROM requests r
  WHERE r.id = NEW.request_id;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for seller responses
DROP TRIGGER IF EXISTS trigger_notify_buyer_seller_response ON seller_responses;
CREATE TRIGGER trigger_notify_buyer_seller_response
  AFTER INSERT ON seller_responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_buyer_seller_response();

-- Function to get user's push token
CREATE OR REPLACE FUNCTION get_user_push_token(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT push_token 
    FROM user_push_tokens 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_push_tokens
CREATE POLICY "Users can view their own push tokens" ON user_push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens" ON user_push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens" ON user_push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens" ON user_push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notification_logs
CREATE POLICY "Users can view notifications they sent or received" ON notification_logs
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "System can insert notifications" ON notification_logs
  FOR INSERT WITH CHECK (true); 