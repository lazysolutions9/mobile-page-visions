-- Complete Database Schema for Mobile Page Visions
-- Run this SQL in your Supabase SQL Editor

-- 1. Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller')),
  is_seller BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  budget DECIMAL(10,2),
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create seller_responses table
CREATE TABLE IF NOT EXISTS seller_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  price DECIMAL(10,2),
  estimated_duration VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user_push_tokens table
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 5. Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requests_buyer_id ON requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_seller_responses_request_id ON seller_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_seller_responses_seller_id ON seller_responses(seller_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_receiver_id ON notification_logs(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- 7. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies for users table
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- 9. Create RLS Policies for requests table
CREATE POLICY "Users can view all requests" ON requests
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own requests" ON requests
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can update their own requests" ON requests
  FOR UPDATE USING (buyer_id = auth.uid());

-- 10. Create RLS Policies for seller_responses table
CREATE POLICY "Users can view responses to their requests" ON seller_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM requests 
      WHERE requests.id = seller_responses.request_id 
      AND requests.buyer_id = auth.uid()
    ) OR seller_id = auth.uid()
  );

CREATE POLICY "Sellers can create responses" ON seller_responses
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Users can update their own responses" ON seller_responses
  FOR UPDATE USING (seller_id = auth.uid());

-- 11. Create RLS Policies for user_push_tokens
CREATE POLICY "Users can view their own push tokens" ON user_push_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own push tokens" ON user_push_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own push tokens" ON user_push_tokens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own push tokens" ON user_push_tokens
  FOR DELETE USING (user_id = auth.uid());

-- 12. Create RLS Policies for notification_logs
CREATE POLICY "Users can view notifications they sent or received" ON notification_logs
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- 13. Create notification functions
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
  FROM users u
  WHERE u.role = 'seller' 
    AND u.id != NEW.buyer_id 
    AND u.is_active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create function to notify buyer when seller responds
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

-- 15. Create function to get user's push token
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

-- 16. Create triggers
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

-- 17. Insert sample data (optional)
INSERT INTO users (username, email, password, role, is_seller) VALUES
('buyer1', 'buyer1@example.com', 'password123', 'buyer', false),
('seller1', 'seller1@example.com', 'password123', 'seller', true),
('seller2', 'seller2@example.com', 'password123', 'seller', true)
ON CONFLICT (username) DO NOTHING; 