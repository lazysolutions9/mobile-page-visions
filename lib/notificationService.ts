import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
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
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: '5530d726-4651-4b1d-8c4f-0d5eb8e7a521', // Your Expo project ID
      })).data;
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    this.expoPushToken = token || null;
    return token || null;
  }

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

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

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

export default NotificationService.getInstance(); 