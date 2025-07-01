# 🔥 Firebase Cloud Messaging (FCM) - Complete Explanation

## 📋 **Overview**
Your app uses **Expo Push Notifications** (which uses FCM under the hood) to send real-time notifications between buyers and sellers. Here's how the entire system works:

---

## 🗄️ **Database Layer**

### **1. User Push Tokens Table**
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

### **2. Notification Logs Table**
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

### **3. Database Triggers**
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

---

## 📱 **React Native Code Layer**

### **1. Notification Service (`lib/notificationService.ts`)**

```typescript
export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  // Singleton pattern
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 🔑 KEY FUNCTION: Register device for push notifications
  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token;

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      // Get Expo push token (this is what gets sent to FCM)
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: '5530d726-4651-4b1d-8c4f-0d5eb8e7a521', // Your Expo project ID
      })).data;
    }

    this.expoPushToken = token || null;
    return token || null;
  }

  // 💾 Save token to database when user logs in
  async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert(
          { 
            user_id: userId, 
            push_token: token,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // 🗑️ Remove token when user logs out
  async removeTokenFromDatabase(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_push_tokens')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing push token:', error);
      } else {
        console.log('Push token removed successfully');
      }
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }

  // 📤 Send local notification (for immediate feedback)
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null, // Send immediately
    });
  }
}
```

### **2. App Initialization (`App.tsx`)**

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

  // 📨 Handle incoming notifications (when app is open)
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    // You can show a toast or update UI here
  });

  // 👆 Handle notification taps (when user taps notification)
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (data?.request_id) {
      // Navigate to request details
      navigation.navigate('BuyerRequestDetails', { requestId: data.request_id });
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}, []);
```

### **3. Login Integration**

```typescript
// In LoginPageRN.tsx or wherever login happens
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

---

## ⚡ **Edge Function Layer (Supabase)**

### **Process Notifications Function (`supabase/functions/process-notifications/index.ts`)**

```typescript
serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 🔍 Step 1: Get all pending notifications
    const { data: notifications, error: fetchError } = await supabaseClient
      .from('notification_logs')
      .select('*')
      .eq('status', 'pending')
      .order('sent_at', { ascending: true })

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0
    let failedCount = 0

    // 📤 Step 2: Process each notification
    for (const notification of notifications) {
      try {
        // Get user's push token from database
        const { data: tokenData, error: tokenError } = await supabaseClient
          .rpc('get_user_push_token', { user_uuid: notification.receiver_id })

        if (tokenError || !tokenData) {
          console.error('Error getting user push token:', tokenError)
          await supabaseClient
            .from('notification_logs')
            .update({ status: 'failed' })
            .eq('id', notification.id)
          failedCount++
          continue
        }

        // 🚀 Step 3: Send via Expo Push Service (which uses FCM)
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: tokenData,                    // User's push token
            title: notification.title,        // "New Service Request"
            body: notification.body,          // "A buyer has posted..."
            data: notification.data || {},    // { request_id: "123" }
            sound: 'default',
            priority: 'high',
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to send notification: ${response.statusText}`)
        }

        // ✅ Step 4: Mark as sent
        await supabaseClient
          .from('notification_logs')
          .update({ status: 'sent' })
          .eq('id', notification.id)

        processedCount++
      } catch (error) {
        console.error('Error processing notification:', error)
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

---

## ⏰ **Cron Job (Automation)**

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

---

## 🔄 **Complete Flow Example**

### **Step 1: Buyer Creates Request**
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

### **Step 2: Database Trigger Fires**
```sql
-- Automatically creates notification logs for all sellers
INSERT INTO notification_logs (sender_id, receiver_id, notification_type, title, body, data)
VALUES 
  ('buyer-uuid', 'seller1-uuid', 'new_request', 'New Service Request', 'A buyer has posted...', '{"request_id": "req-123"}'),
  ('buyer-uuid', 'seller2-uuid', 'new_request', 'New Service Request', 'A buyer has posted...', '{"request_id": "req-123"}');
```

### **Step 3: Edge Function Processes (Every Minute)**
```typescript
// Every minute, Edge Function:
// 1. Fetches pending notifications
// 2. Gets push tokens for each receiver
// 3. Sends via Expo Push Service (FCM)
// 4. Updates status to 'sent' or 'failed'
```

### **Step 4: Seller Receives Notification**
```typescript
// On seller's device:
// 1. Notification appears even if app is closed
// 2. Seller taps notification
// 3. App opens to request details
// 4. Seller can respond
```

---

## 🎯 **Key Benefits**

1. **Real-time**: Notifications sent within 1 minute
2. **Reliable**: Database tracks all notifications
3. **Scalable**: Handles multiple sellers per request
4. **Offline**: Works even when app is closed
5. **Trackable**: Full history of sent/failed notifications

---

## 🛠️ **Error Handling**

- **Failed tokens**: Marked as 'failed' in database
- **Retry logic**: Can be implemented in Edge Function
- **Token cleanup**: Remove invalid tokens on login
- **Fallback**: Local notifications for immediate feedback

---

## 🔧 **Technical Details**

### **Expo Push Token Format**
```
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

### **FCM Integration**
- Expo handles FCM integration automatically
- Your app doesn't need direct FCM setup
- Expo Push Service converts Expo tokens to FCM messages

### **Notification Priority**
- `high`: Shows immediately, even with Do Not Disturb
- `normal`: Respects user's notification settings

### **Data Payload**
```json
{
  "request_id": "123",
  "request_title": "Need Plumber",
  "buyer_id": "buyer-uuid"
}
```

This data is used to navigate to the correct screen when the user taps the notification. 