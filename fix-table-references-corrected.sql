-- Fix table references to match existing 'user' table (CORRECTED VERSION)
-- Run this in your Supabase SQL Editor

-- Drop existing tables and recreate with correct references
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS user_push_tokens CASCADE;
DROP TABLE IF EXISTS seller_responses CASCADE;
DROP TABLE IF EXISTS requests CASCADE;

-- Recreate tables with correct foreign key references to 'user' table

-- 1. Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  budget DECIMAL(10,2),
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create seller_responses table
CREATE TABLE IF NOT EXISTS seller_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  price DECIMAL(10,2),
  estimated_duration VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_push_tokens table
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES "user"(id),
  receiver_id UUID REFERENCES "user"(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_requests_buyer_id ON requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_seller_responses_request_id ON seller_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_seller_responses_seller_id ON seller_responses(seller_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_receiver_id ON notification_logs(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- 6. Enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies (allowing all operations for now)
CREATE POLICY "Allow all operations on requests" ON requests
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on seller responses" ON seller_responses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on push tokens" ON user_push_tokens
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on notification logs" ON notification_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 8. Create notification functions with correct table references
CREATE OR REPLACE FUNCTION notify_sellers_new_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_logs (
    sender_id, receiver_id, notification_type, title, body, data
  )
  SELECT 
    NEW.buyer_id, u.id, 'new_request', 'New Service Request',
    'A buyer has posted a new service request that matches your profile.',
    jsonb_build_object('request_id', NEW.id, 'request_title', NEW.title, 'buyer_id', NEW.buyer_id)
  FROM "user" u
  WHERE u."isSeller" = true 
    AND u.id != NEW.buyer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to notify buyer when seller responds
CREATE OR REPLACE FUNCTION notify_buyer_seller_response()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_logs (
    sender_id, receiver_id, notification_type, title, body, data
  )
  SELECT 
    NEW.seller_id, r.buyer_id, 'seller_response', 'Seller Response',
    'A seller has responded to your service request.',
    jsonb_build_object('request_id', NEW.request_id, 'seller_id', NEW.seller_id, 'response_id', NEW.id)
  FROM requests r
  WHERE r.id = NEW.request_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to get user's push token
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

-- 11. Create triggers
DROP TRIGGER IF EXISTS trigger_notify_sellers_new_request ON requests;
CREATE TRIGGER trigger_notify_sellers_new_request
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_sellers_new_request();

DROP TRIGGER IF EXISTS trigger_notify_buyer_seller_response ON seller_responses;
CREATE TRIGGER trigger_notify_buyer_seller_response
  AFTER INSERT ON seller_responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_buyer_seller_response(); 