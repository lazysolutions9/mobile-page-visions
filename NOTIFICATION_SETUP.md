# Push Notification Setup Guide

## Overview
This guide will help you set up Firebase Cloud Messaging (FCM) for push notifications in your React Native app with Supabase backend.

## Step 1: Firebase Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Cloud Messaging

2. **Download google-services.json:**
   - In Firebase Console, go to Project Settings
   - Add Android app with package name: `com.lazysolutions.mobilepagevisions`
   - Download `google-services.json` and place it in your project root

## Step 2: Supabase Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
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
  INSERT INTO notification_logs (
    sender_id, receiver_id, notification_type, title, body, data
  )
  SELECT 
    NEW.buyer_id, u.id, 'new_request', 'New Service Request',
    'A buyer has posted a new service request that matches your profile.',
    jsonb_build_object('request_id', NEW.id, 'request_title', NEW.title, 'buyer_id', NEW.buyer_id)
  FROM users u
  WHERE u.role = 'seller' AND u.id != NEW.buyer_id AND u.is_active = true;
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
  INSERT INTO notification_logs (
    sender_id, receiver_id, notification_type, title, body, data
  )
  SELECT 
    NEW.seller_id, r.buyer_id, 'seller_response', 'Seller Response',
    'A seller has responded to your service request.',
    jsonb_build_object('request_id', NEW.request_id, 'seller_id', NEW.seller_id, 'response_id', NEW.id)
  FROM requests r WHERE r.id = NEW.request_id;
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
  RETURN (SELECT push_token FROM user_push_tokens WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own push tokens" ON user_push_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own push tokens" ON user_push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own push tokens" ON user_push_tokens
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own push tokens" ON user_push_tokens
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view notifications they sent or received" ON notification_logs
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "System can insert notifications" ON notification_logs
  FOR INSERT WITH CHECK (true);
```

## Step 3: Supabase Edge Function

Create a new Edge Function in Supabase:

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login and link project:**
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Create Edge Function:**
   ```bash
   supabase functions new process-notifications
   ```

4. **Add the following code to `supabase/functions/process-notifications/index.ts`:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: notifications, error: fetchError } = await supabaseClient
      .from('notification_logs')
      .select('*')
      .eq('status', 'pending')
      .order('sent_at', { ascending: true })

    if (fetchError) {
      throw new Error(`Error fetching notifications: ${fetchError.message}`)
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0
    let failedCount = 0

    for (const notification of notifications) {
      try {
        const { data: tokenData, error: tokenError } = await supabaseClient
          .rpc('get_user_push_token', { user_uuid: notification.receiver_id })

        if (tokenError || !tokenData) {
          await supabaseClient
            .from('notification_logs')
            .update({ status: 'failed' })
            .eq('id', notification.id)
          failedCount++
          continue
        }

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: tokenData,
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
            sound: 'default',
            priority: 'high',
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to send notification: ${response.statusText}`)
        }

        await supabaseClient
          .from('notification_logs')
          .update({ status: 'sent' })
          .eq('id', notification.id)

        processedCount++
      } catch (error) {
        await supabaseClient
          .from('notification_logs')
          .update({ status: 'failed' })
          .eq('id', notification.id)
        failedCount++
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications processed',
        processed: processedCount,
        failed: failedCount,
        total: notifications.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```

5. **Deploy the function:**
   ```bash
   supabase functions deploy process-notifications
   ```

## Step 4: Set Up Cron Job

In Supabase Dashboard:

1. Go to **Database** → **Functions**
2. Create a new function to call your Edge Function every minute:

```sql
-- Create a cron job to process notifications every minute
SELECT cron.schedule(
  'process-notifications',
  '* * * * *',
  'SELECT net.http_post(
    url := ''https://your-project-ref.supabase.co/functions/v1/process-notifications'',
    headers := ''{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'',
    body := ''{}''
  );'
);
```

## Step 5: Testing

1. **Build and run your app:**
   ```bash
   npx expo start
   ```

2. **Test notifications:**
   - Create a new request as a buyer
   - Check if sellers receive notifications
   - Respond to a request as a seller
   - Check if buyer receives notification

## Step 6: Troubleshooting

1. **Check push tokens are saved:**
   ```sql
   SELECT * FROM user_push_tokens;
   ```

2. **Check notification logs:**
   ```sql
   SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 10;
   ```

3. **Test Edge Function manually:**
   ```bash
   curl -X POST https://your-project-ref.supabase.co/functions/v1/process-notifications \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

## Important Notes

- Push notifications only work on physical devices, not simulators
- Make sure to test on both Android and iOS devices
- The Expo push token is different from Firebase FCM token
- Notifications are sent via Expo's push service, not directly through Firebase
- Edge Functions run in Deno environment, not Node.js

## Next Steps

1. Add notification badges
2. Implement notification categories
3. Add notification settings in user profile
4. Implement notification history
5. Add rich notifications with images 