import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import SignupPage from './SignupPageRN';
import LoginPage from './LoginPageRN';
import RoleSelection from './RoleSelectionRN';
import BuyerDashboard from './BuyerDashboardRN';
import SellerDashboard from './SellerDashboardRN';
import SellerSetup from './SellerSetupRN';
import ProfilePage from './ProfilePageRN';
import BuyerRequestsListPage from './BuyerRequestsListPageRN';
import BuyerRequestDetailsPage from './BuyerRequestDetailsPageRN';

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
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
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
        
        {/* Add Login screen here when you create LoginPageRN */}
        {/* <Stack.Screen name="Login" component={LoginPage} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App; 