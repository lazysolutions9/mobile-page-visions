import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

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

type RoleSelectionNavigationProp = StackNavigationProp<RootStackParamList, 'RoleSelection'>;
type RoleSelectionRouteProp = RouteProp<RootStackParamList, 'RoleSelection'>;

interface RoleSelectionProps {
  navigation: RoleSelectionNavigationProp;
  route: RoleSelectionRouteProp;
}

const RoleSelection = ({ navigation, route }: RoleSelectionProps) => {
  const { user } = route.params;

  const handleRoleSelection = async (isSeller: boolean) => {
    try {
      const { error } = await supabase
        .from('user')
        .update({ isSeller })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', 'Could not update your role. Please try again.');
        return;
      }

      if (isSeller) {
        navigation.navigate('SellerSetup', { user: { ...user, isSeller } });
      } else {
        navigation.navigate('BuyerDashboard', { user: { ...user, isSeller } });
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>Select how you want to use the app</Text>
      </View>

      <View style={styles.options}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => handleRoleSelection(false)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="person" size={32} color="#3B82F6" />
          </View>
          <Text style={styles.optionTitle}>Buyer</Text>
          <Text style={styles.optionDescription}>
            I want to place requests for items I need
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => handleRoleSelection(true)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="storefront" size={32} color="#10B981" />
          </View>
          <Text style={styles.optionTitle}>Seller</Text>
          <Text style={styles.optionDescription}>
            I want to respond to buyer requests and sell items
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  options: {
    flex: 1,
    gap: 16,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minHeight: 160,
  },
  iconContainer: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RoleSelection; 