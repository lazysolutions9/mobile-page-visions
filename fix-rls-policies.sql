-- Fix RLS Policies for Custom Authentication System
-- Run this in your Supabase SQL Editor

-- Drop existing RLS policies for user_push_tokens
DROP POLICY IF EXISTS "Users can view their own push tokens" ON user_push_tokens;
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON user_push_tokens;
DROP POLICY IF EXISTS "Users can update their own push tokens" ON user_push_tokens;
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON user_push_tokens;

-- Create new RLS policies that work with custom authentication
CREATE POLICY "Allow all operations on push tokens" ON user_push_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- Drop existing RLS policies for notification_logs
DROP POLICY IF EXISTS "Users can view notifications they sent or received" ON notification_logs;
DROP POLICY IF EXISTS "System can insert notifications" ON notification_logs;

-- Create new RLS policies for notification_logs
CREATE POLICY "Allow all operations on notification logs" ON notification_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Drop existing RLS policies for users table
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create new RLS policies for users table
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Drop existing RLS policies for requests table
DROP POLICY IF EXISTS "Users can view all requests" ON requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON requests;

-- Create new RLS policies for requests table
CREATE POLICY "Allow all operations on requests" ON requests
  FOR ALL USING (true) WITH CHECK (true);

-- Drop existing RLS policies for seller_responses table
DROP POLICY IF EXISTS "Users can view responses to their requests" ON seller_responses;
DROP POLICY IF EXISTS "Sellers can create responses" ON seller_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON seller_responses;

-- Create new RLS policies for seller_responses table
CREATE POLICY "Allow all operations on seller responses" ON seller_responses
  FOR ALL USING (true) WITH CHECK (true); 