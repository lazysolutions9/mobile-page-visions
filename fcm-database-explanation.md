# FCM Database Structure & Flow Explanation

## Database Tables

### 1. `user_push_tokens` Table
```sql
CREATE TABLE user_push_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,           -- Expo push token for the device
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)                     -- One token per user
);
```

**Purpose:** Stores the unique push token for each user's device
- When user logs in → token is saved
- When user logs out → token is removed
- Used to send notifications to specific devices

### 2. `notification_logs` Table
```sql
CREATE TABLE notification_logs (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES "user"(id),    -- Who triggered the notification
  receiver_id UUID REFERENCES "user"(id),  -- Who receives the notification
  notification_type TEXT NOT NULL,         -- 'new_request', 'seller_response', etc.
  title TEXT NOT NULL,                     -- Notification title
  body TEXT NOT NULL,                      -- Notification message
  data JSONB,                              -- Additional data (request_id, etc.)
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending'            -- 'pending', 'sent', 'failed'
);
```

**Purpose:** Tracks all notifications that need to be sent
- Created by database triggers
- Processed by Edge Function
- Status updated after sending

### 3. Database Triggers
```sql
-- Trigger: When a new request is created
CREATE TRIGGER trigger_notify_sellers_new_request
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_sellers_new_request();

-- Function: Creates notification logs for all sellers
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
```

## Database Flow

### Step 1: Request Creation
```sql
-- Buyer creates a request
INSERT INTO requests (buyer_id, title, description, ...) 
VALUES ('buyer-uuid', 'Need Plumber', 'Urgent plumbing work', ...);
```

### Step 2: Trigger Fires
- Database trigger automatically fires
- Creates notification logs for all sellers
- Each seller gets a notification record

### Step 3: Notification Processing
- Edge Function runs every minute (cron job)
- Fetches pending notifications
- Sends them via Expo Push Service
- Updates status to 'sent' or 'failed'

## Code Layer (React Native)

### 1. Notification Service (`lib/notificationService.ts`)
```typescript
export class NotificationService {
  // Register device for push notifications
  async registerForPushNotificationsAsync(): Promise<string | null> {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status === 'granted') {
      // Get Expo push token
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id',
      })).data;
      
      this.expoPushToken = token;
      return token;
    }
    return null;
  }

  // Save token to database
  async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    await supabase
      .from('user_push_tokens')
      .upsert({ user_id: userId, push_token: token });
  }
}
```

### 2. App Initialization (`App.tsx`)
```typescript
useEffect(() => {
  // Initialize notifications when app starts
  const initializeNotifications = async () => {
    const token = await notificationService.registerForPushNotificationsAsync();
    if (token) {
      console.log('Push token:', token);
    }
  };

  initializeNotifications();

  // Handle incoming notifications
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Handle notification taps
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (data?.request_id) {
      // Navigate to request details
    }
  });
}, []);
```

### 3. Login Integration (`LoginPageRN.tsx`)
```typescript
const handleLogin = async () => {
  // ... authentication logic ...
  
  if (user.password === password) {
    // Save push token for the user
    const pushToken = notificationService.getExpoPushToken();
    if (pushToken) {
      await notificationService.saveTokenToDatabase(user.id, pushToken);
    }
    
    // Navigate to dashboard
    navigation.navigate('BuyerDashboard', { user });
  }
};
```

## Edge Function Layer (Supabase)

### Process Notifications Function
```typescript
serve(async (req) => {
  // Get pending notifications
  const { data: notifications } = await supabaseClient
    .from('notification_logs')
    .select('*')
    .eq('status', 'pending')
    .order('sent_at', { ascending: true });

  for (const notification of notifications) {
    // Get user's push token
    const { data: tokenData } = await supabaseClient
      .rpc('get_user_push_token', { user_uuid: notification.receiver_id });

    if (tokenData) {
      // Send via Expo Push Service
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
      });

      // Update status
      await supabaseClient
        .from('notification_logs')
        .update({ status: response.ok ? 'sent' : 'failed' })
        .eq('id', notification.id);
    }
  }
});
```

## Cron Job (Automation)
```sql
-- Run every minute to process notifications
SELECT cron.schedule(
  'process-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/process-notifications',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}',
    body := '{}'
  );
  $$
);
```

## Complete Flow Example

### 1. Buyer Creates Request
```typescript
// BuyerDashboardRN.tsx
const handleCreateRequest = async () => {
  const { data, error } = await supabase
    .from('requests')
    .insert({
      buyer_id: user.id,
      title: itemName,
      description: 'Need urgent service',
      // ... other fields
    });
};
```

### 2. Database Trigger Fires
```sql
-- Automatically creates notification logs for all sellers
INSERT INTO notification_logs (sender_id, receiver_id, notification_type, title, body, data)
VALUES 
  ('buyer-uuid', 'seller1-uuid', 'new_request', 'New Service Request', 'A buyer has posted...', '{"request_id": "req-123"}'),
  ('buyer-uuid', 'seller2-uuid', 'new_request', 'New Service Request', 'A buyer has posted...', '{"request_id": "req-123"}');
```

### 3. Edge Function Processes
```typescript
// Every minute, Edge Function:
// 1. Fetches pending notifications
// 2. Gets push tokens for each receiver
// 3. Sends via Expo Push Service
// 4. Updates status
```

### 4. Seller Receives Notification
```typescript
// On seller's device:
// 1. Notification appears even if app is closed
// 2. Seller taps notification
// 3. App opens to request details
// 4. Seller can respond
```

## Key Benefits

1. **Real-time**: Notifications sent within 1 minute
2. **Reliable**: Database tracks all notifications
3. **Scalable**: Handles multiple sellers per request
4. **Offline**: Works even when app is closed
5. **Trackable**: Full history of sent/failed notifications

## Error Handling

- **Failed tokens**: Marked as 'failed' in database
- **Retry logic**: Can be implemented in Edge Function
- **Token cleanup**: Remove invalid tokens on login
- **Fallback**: Local notifications for immediate feedback 