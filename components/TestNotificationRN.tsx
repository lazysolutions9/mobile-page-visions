import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import notificationService from '../lib/notificationService';

const TestNotificationRN = () => {
  const testLocalNotification = async () => {
    try {
      await notificationService.sendLocalNotification(
        'Test Notification',
        'This is a test local notification that works in Expo Go!',
        { test: true, timestamp: Date.now() }
      );
      Alert.alert('Success', 'Local notification sent!');
    } catch (error) {
      Alert.alert('Error', `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testRequestNotification = async () => {
    try {
      await notificationService.sendLocalNotification(
        'New Service Request',
        'A buyer has posted a new service request that matches your profile.',
        { 
          request_id: 'test-123',
          request_title: 'Test Plumbing Request',
          buyer_id: 'test-buyer-id'
        }
      );
      Alert.alert('Success', 'Request notification sent!');
    } catch (error) {
      Alert.alert('Error', `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testMultipleNotifications = async () => {
    try {
      // Send multiple notifications with delays
      await notificationService.sendLocalNotification(
        'First Notification',
        'This is the first test notification',
        { order: 1 }
      );

      setTimeout(async () => {
        await notificationService.sendLocalNotification(
          'Second Notification',
          'This is the second test notification',
          { order: 2 }
        );
      }, 2000);

      setTimeout(async () => {
        await notificationService.sendLocalNotification(
          'Third Notification',
          'This is the third test notification',
          { order: 3 }
        );
      }, 4000);

      Alert.alert('Success', 'Multiple notifications scheduled!');
    } catch (error) {
      Alert.alert('Error', `Failed to send notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Testing</Text>
      <Text style={styles.subtitle}>
        Test local notifications that work in Expo Go
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={testLocalNotification}
        >
          <Text style={styles.buttonText}>Test Basic Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.requestButton]}
          onPress={testRequestNotification}
        >
          <Text style={styles.buttonText}>Test Request Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.multipleButton]}
          onPress={testMultipleNotifications}
        >
          <Text style={styles.buttonText}>Test Multiple Notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>What this tests:</Text>
        <Text style={styles.infoText}>
          • Local notification display{'\n'}
          • Notification content and styling{'\n'}
          • Notification tap handling{'\n'}
          • Data payload passing{'\n'}
          • Multiple notification timing
        </Text>
      </View>

      <View style={styles.noteContainer}>
        <Text style={styles.noteTitle}>Note:</Text>
        <Text style={styles.noteText}>
          These are local notifications that work in Expo Go. 
          For push notifications (when app is closed), you'll need a development build.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  requestButton: {
    backgroundColor: '#34C759',
  },
  multipleButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  noteContainer: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#856404',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#856404',
  },
});

export default TestNotificationRN; 