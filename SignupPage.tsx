import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface SignupPageProps {
  onSwitchToLogin: () => void;
  onSignupComplete: (user: any) => void;
}

const SignupPage = ({ onSwitchToLogin, onSignupComplete }: SignupPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pincode, setPincode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username.trim()) {
      Alert.alert('Username Required', 'Please enter a username.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter a password.');
      return;
    }
    if (!pincode.trim()) {
      Alert.alert('Pincode Required', 'Please enter your pincode.');
      return;
    }

    // Validate pincode format - exactly 6 digits
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      Alert.alert('Invalid Pincode', 'Pincode must contain exactly 6 digits.');
      return;
    }

    setLoading(true);

    try {
      // 1. Check if username already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('user')
        .select('username')
        .eq('username', username)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        Alert.alert('Signup Error', 'An unexpected error occurred. Please try again.');
        setLoading(false);
        return;
      }
      
      if (existingUser) {
        Alert.alert('Username Taken', 'This username is already in use. Please choose another one.');
        setLoading(false);
        return;
      }

      // 2. If username is available, proceed with signup
      const { data, error } = await supabase
        .from('user')
        .insert([{ 
          username, 
          password, 
          pincode, 
          isSeller: null, 
          availableRequestCount: 30, 
          usedCreditCount: 0 
        }])
        .select()
        .single();

      if (error) {
        Alert.alert('Signup Error', error.message);
        setLoading(false);
        return;
      }

      if (data) {
        Alert.alert('Signup Successful!', 'Please choose your role to continue.');
        onSignupComplete(data);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={setPincode}
              placeholder="Enter your pincode"
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing Up...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.linkText} onPress={onSwitchToLogin}>
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginVertical: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    flex: 1,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
});

export default SignupPage; 