import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, BackHandler, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import notificationService from './lib/notificationService';
import SignupPage from './components/SignupPageRN';
import LoginPage from './components/LoginPageRN';
import RoleSelection from './components/RoleSelectionRN';
import BuyerDashboard from './components/BuyerDashboardRN';
import SellerDashboard from './components/SellerDashboardRN';
import SellerSetup from './components/SellerSetupRN';
import ProfilePage from './components/ProfilePageRN';
import BuyerRequestsListPage from './components/BuyerRequestsListPageRN';
import BuyerRequestDetailsPage from './components/BuyerRequestDetailsPageRN';
import TestNotificationRN from './components/TestNotificationRN';

// You'll need to create LoginPageRN as well
// import LoginPage from './LoginPageRN';

type RootStackParamList = {
  Signup: undefined;
  Login: undefined;
  RoleSelection: { user: any };
  BuyerDashboard: { user: any };
  SellerDashboard: { user: any };
  SellerSetup: { user: any };
  ProfilePage: { user: any; userType: 'buyer' | 'seller' };
  BuyerRequestsList: { user: any };
  BuyerRequestDetails: { user: any; request: any };
  TestNotification: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Initialize notifications
    const initializeNotifications = async () => {
      try {
        const token = await notificationService.registerForPushNotificationsAsync();
        if (token) {
          console.log('Push token:', token);
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Handle notification responses
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap - navigate to appropriate screen
      const data = response.notification.request.content.data;
      if (data?.request_id) {
        // Navigate to request details
        // You can implement navigation logic here
      }
    });

    const backAction = () => {
      const currentRoute = navigationRef.current?.getCurrentRoute();
      
      // Only show logout dialog on main dashboard screens
      if (currentRoute?.name === 'BuyerDashboard' || currentRoute?.name === 'SellerDashboard') {
        Alert.alert(
          'Logout',
          'Do you want to logout?',
          [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Logout',
              onPress: () => {
                // Navigate back to Signup page (logout)
                navigationRef.current?.reset({
                  index: 0,
                  routes: [{ name: 'Signup' }],
                });
              },
              style: 'destructive',
            },
          ]
        );
        return true; // Prevent default back action
      }
      
      return false; // Allow default back action for other screens
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => {
      backHandler.remove();
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <Stack.Navigator
        initialRouteName="Signup"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Signup" component={SignupPage} />
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="RoleSelection" component={RoleSelection} />
        <Stack.Screen name="BuyerDashboard" component={BuyerDashboard} />
        <Stack.Screen name="SellerDashboard" component={SellerDashboard} />
        <Stack.Screen name="SellerSetup" component={SellerSetup} />
        <Stack.Screen name="ProfilePage" component={ProfilePage} />
        <Stack.Screen name="BuyerRequestsList" component={BuyerRequestsListPage} />
        <Stack.Screen name="BuyerRequestDetails" component={BuyerRequestDetailsPage} />
        <Stack.Screen name="TestNotification" component={TestNotificationRN} />
        
        {/* Add Login screen here when you create LoginPageRN */}
        {/* <Stack.Screen name="Login" component={LoginPage} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App; 