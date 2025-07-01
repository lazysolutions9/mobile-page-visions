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
  Modal,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import notificationService from '../lib/notificationService';

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

type LoginNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
type LoginRouteProp = RouteProp<RootStackParamList, 'Login'>;

interface LoginProps {
  navigation: LoginNavigationProp;
  route: LoginRouteProp;
}

// Move modals outside the main component to prevent re-rendering
const ForgotPasswordModal = ({ 
  visible, 
  onClose, 
  resetUsername, 
  setResetUsername, 
  onContinue 
}: {
  visible: boolean;
  onClose: () => void;
  resetUsername: string;
  setResetUsername: (value: string) => void;
  onContinue: (username: string) => void;
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Forgot Password</Text>
          <Text style={styles.modalDescription}>
            Enter your username and we'll help you reset your password.
          </Text>
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="your_username"
            value={resetUsername}
            onChangeText={setResetUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={onClose}
          >
            <Text style={styles.outlineButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => onContinue(resetUsername)}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const SetNewPasswordModal = ({ 
  visible, 
  onClose, 
  resetUsername, 
  onPasswordSet 
}: {
  visible: boolean;
  onClose: () => void;
  resetUsername: string;
  onPasswordSet: () => void;
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Set New Password</Text>
          <Text style={styles.modalDescription}>
            Please enter your new password below.
          </Text>
        </View>

        <SetNewPasswordContent
          username={resetUsername}
          onPasswordSet={onPasswordSet}
          onCancel={onClose}
        />
      </View>
    </View>
  </Modal>
);

const LoginPage = ({ navigation }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isSetNewPasswordOpen, setIsSetNewPasswordOpen] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Dismiss keyboard on login button press
    Keyboard.dismiss();

    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      // WARNING: This is a highly insecure way to handle login.
      // It is for demonstration purposes only and should not be used in production.
      const { data: user, error } = await supabase
        .from('user')
        .select('*')
        .ilike('username', username.trim())
        .single();

      if (error || !user) {
        Alert.alert('Login Error', 'Invalid username or password.');
        return;
      }

      if (user.password === password) {
        // Save push token for the user
        const pushToken = notificationService.getExpoPushToken();
        console.log('Push token for user:', user.username, ':', pushToken);
        if (pushToken) {
          await notificationService.saveTokenToDatabase(user.id, pushToken);
          console.log('Push token saved successfully for user:', user.username);
        } else {
          console.log('No push token available for user:', user.username);
        }

        // Check if user is a seller or buyer and navigate accordingly
        if (user.isSeller === true) {
          // User is a seller, navigate to seller dashboard
          navigation.navigate('SellerDashboard', { user });
        } else {
          // User is a buyer (isSeller is false or null), navigate to buyer dashboard
          navigation.navigate('BuyerDashboard', { user });
        }
      } else {
        Alert.alert('Login Error', 'Invalid username or password.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordContinue = async (username: string) => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username.');
      return;
    }

    try {
      // Check if username exists in the database (case insensitive)
      const { data: user, error } = await supabase
        .from('user')
        .select('username')
        .ilike('username', username.trim())
        .single();

      if (error || !user) {
        Alert.alert('Error', 'Username not found. Please check your username and try again.');
        return;
      }

      // Username exists, proceed to password reset
      setIsForgotPasswordOpen(false);
      setResetUsername(username);
      setIsSetNewPasswordOpen(true);
    } catch (error) {
      Alert.alert('Error', 'Username not found. Please check your username and try again.');
    }
  };

  const handlePasswordSet = () => {
    setIsSetNewPasswordOpen(false);
    Alert.alert('Password Reset', 'Your password has been updated. Please login with your new password.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              blurOnSubmit={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={true}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => setIsForgotPasswordOpen(true)}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPressIn={handleLogin}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <View style={styles.signupSection}>
            <Text style={styles.signupText}>
              New User?{' '}
              <Text
                style={styles.signupLink}
                onPress={() => navigation.navigate('Signup')}
              >
                Sign Up
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      <ForgotPasswordModal 
        visible={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        resetUsername={resetUsername}
        setResetUsername={setResetUsername}
        onContinue={handleForgotPasswordContinue}
      />
      <SetNewPasswordModal 
        visible={isSetNewPasswordOpen}
        onClose={() => setIsSetNewPasswordOpen(false)}
        resetUsername={resetUsername}
        onPasswordSet={handlePasswordSet}
      />
    </SafeAreaView>
  );
};

// SetNewPasswordContent component
interface SetNewPasswordContentProps {
  username: string;
  onPasswordSet: () => void;
  onCancel: () => void;
}

const SetNewPasswordContent = ({ username, onPasswordSet, onCancel }: SetNewPasswordContentProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSavePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('user')
        .update({ 
          password,
          updated_at: new Date().toISOString()
        })
        .eq('username', username);

      if (error) {
        Alert.alert('Error', 'Could not update password.');
        return;
      }

      Alert.alert('Success', 'Password updated successfully.');
      onPasswordSet();
    } catch (error) {
      Alert.alert('Error', 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.modalBody}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>New Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your new password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm New Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={onCancel}
        >
          <Text style={styles.outlineButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSavePassword}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Saving...' : 'Save New Password'}
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
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    gap: 20,
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 44,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signupLink: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalBody: {
    gap: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginPage; 