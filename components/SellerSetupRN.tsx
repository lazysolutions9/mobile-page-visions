import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

type SellerSetupNavigationProp = StackNavigationProp<RootStackParamList, 'SellerSetup'>;
type SellerSetupRouteProp = RouteProp<RootStackParamList, 'SellerSetup'>;

interface SellerSetupProps {
  navigation: SellerSetupNavigationProp;
  route: SellerSetupRouteProp;
}

const SellerSetup = ({ navigation, route }: SellerSetupProps) => {
  const { user } = route.params;
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveDetails = async () => {
    if (!shopName.trim() || !shopAddress.trim()) {
      Alert.alert('Missing Information', 'Please fill out all required fields.');
      return;
    }

    const pincodeInt = user.pincode ? parseInt(user.pincode, 10) : null;
    if (!pincodeInt) {
      Alert.alert('Missing Pincode', 'Your account does not have a valid pincode. Please update your profile.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('sellerDetails').insert({
        userId: user.id,
        shopName: shopName.trim(),
        category: 'Medical',
        shopAddress: shopAddress.trim(),
        notes: notes.trim(),
        pincode: pincodeInt,
        pendingSaleCredit: 1,
      });

      if (error) {
        Alert.alert('Database Error', 'Could not save your details. Please ensure you have the correct permissions and try again.');
        return;
      }

      Alert.alert('Shop Setup Complete!', 'Your seller profile is now active.', [
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to SellerDashboard
            navigation.navigate('SellerDashboard', { user });
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Setup Your Shop</Text>
            <Text style={styles.subtitle}>Tell us about your business</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shop Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., City Pharmacy"
                value={shopName}
                onChangeText={setShopName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shop Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 123 Main St, Anytown"
                value={shopAddress}
                onChangeText={setShopAddress}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Delivery available within 5km"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoCapitalize="sentences"
                autoCorrect={true}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSaveDetails}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saving...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginVertical: 32,
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
  form: {
    flex: 1,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SellerSetup; 