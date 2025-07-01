import { supabase } from './supabase';

interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

export class PushNotificationService {
  private static instance: PushNotificationService;

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async sendNotificationToUser(userId: string, notification: NotificationData): Promise<boolean> {
    try {
      // Get user's push token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('get_user_push_token', { user_uuid: userId });

      if (tokenError || !tokenData) {
        console.error('Error getting user push token:', tokenError);
        return false;
      }

      // Send notification via Expo
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: tokenData,
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
          priority: 'high',
        }),
      });

      if (!response.ok) {
        console.error('Failed to send notification:', response.statusText);
        return false;
      }

      console.log('Notification sent successfully to user:', userId);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async sendNotificationToMultipleUsers(userIds: string[], notification: NotificationData): Promise<void> {
    const promises = userIds.map(userId => this.sendNotificationToUser(userId, notification));
    await Promise.allSettled(promises);
  }

  async sendNotificationToSellers(notification: NotificationData, excludeUserId?: string): Promise<void> {
    try {
      let query = supabase
        .from('users')
        .select('id')
        .eq('role', 'seller')
        .eq('is_active', true);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data: sellers, error } = await query;

      if (error) {
        console.error('Error fetching sellers:', error);
        return;
      }

      const sellerIds = sellers?.map(seller => seller.id) || [];
      await this.sendNotificationToMultipleUsers(sellerIds, notification);
    } catch (error) {
      console.error('Error sending notification to sellers:', error);
    }
  }

  async processPendingNotifications(): Promise<void> {
    try {
      // Get pending notifications
      const { data: notifications, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('status', 'pending')
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending notifications:', error);
        return;
      }

      for (const notification of notifications || []) {
        const success = await this.sendNotificationToUser(
          notification.receiver_id,
          {
            title: notification.title,
            body: notification.body,
            data: notification.data,
          }
        );

        // Update notification status
        await supabase
          .from('notification_logs')
          .update({ status: success ? 'sent' : 'failed' })
          .eq('id', notification.id);
      }
    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }
}

export default PushNotificationService.getInstance(); 