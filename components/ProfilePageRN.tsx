import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
  Linking,
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

type ProfilePageNavigationProp = StackNavigationProp<RootStackParamList, 'ProfilePage'>;
type ProfilePageRouteProp = RouteProp<RootStackParamList, 'ProfilePage'>;

interface ProfilePageProps {
  navigation: ProfilePageNavigationProp;
  route: ProfilePageRouteProp;
}

const ProfilePage = ({ navigation, route }: ProfilePageProps) => {
  const { user, userType } = route.params;
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [pincode, setPincode] = useState('');
  const [credits, setCredits] = useState<number | null>(null);
  const [discountItems, setDiscountItems] = useState('');
  const [pendingSaleCredit, setPendingSaleCredit] = useState<number | null>(null);
  const [showBuyCreditPopup, setShowBuyCreditPopup] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoadingPincode, setIsLoadingPincode] = useState(true);

  // Fetch seller details for seller users
  useEffect(() => {
    if (userType === 'seller' && user) {
      const fetchSellerDetails = async () => {
        const { data, error } = await supabase
          .from('sellerDetails')
          .select('*')
          .eq('userId', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching seller details:', error);
        } else if (data) {
          setShopName(data.shopName || '');
          setShopAddress(data.shopAddress || '');
          setNotes(data.notes || '');
          setPendingSaleCredit(typeof data.pendingSaleCredit === 'number' ? data.pendingSaleCredit : 0);
        }
      };
      fetchSellerDetails();
    }
  }, [user, userType]);

  // Fetch user credits
  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user')
        .select('availableRequestCount')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setCredits(data.availableRequestCount);
      }
    };
    fetchCredits();
  }, [user]);

  // Fetch user pincode
  useEffect(() => {
    const fetchUserPincode = async () => {
      if (!user) return;
      
      setIsLoadingPincode(true);
      
      try {
        const { data, error } = await supabase
          .from('user')
          .select('pincode')
          .eq('id', user.id)
          .single();

        if (!error && data && data.pincode) {
          console.log('Setting pincode to:', data.pincode);
          setPincode(String(data.pincode));
        } else {
          console.log('No pincode found');
          setPincode('');
        }
      } catch (error) {
        console.error('Error fetching pincode:', error);
        setPincode('');
      } finally {
        setIsLoadingPincode(false);
      }
    };

    fetchUserPincode();
  }, [user]);

  const handleUpdateDetails = async () => {
    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to update details.');
      return;
    }

    const details = {
      userId: user.id,
      shopName,
      shopAddress,
      notes,
      category: 'Medical',
    };

    const { error } = await supabase
      .from('sellerDetails')
      .upsert(details, { onConflict: 'userId' });

    if (error) {
      console.error("Error upserting seller details:", error);
      Alert.alert('Error', 'Could not update shop details. Please check your database permissions.');
    } else {
      Alert.alert('Success', 'Shop details updated.');
      setIsEditing(false);
    }
  };

  const handleUpdatePincode = async () => {
    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to update pincode.');
      return;
    }

    if (!pincode.trim()) {
      Alert.alert('Missing Pincode', 'Please enter a pincode.');
      return;
    }

    // Validate pincode format - exactly 6 digits
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      Alert.alert('Invalid Pincode', 'Pincode must contain exactly 6 digits.');
      return;
    }

    const { error } = await supabase
      .from('user')
      .update({ pincode: pincode.trim() })
      .eq('id', user.id);

    if (error) {
      console.error("Error updating pincode:", error);
      Alert.alert('Error', 'Could not update pincode. Please try again.');
    } else {
      Alert.alert('Success', 'Pincode updated successfully.');
      setIsEditingPincode(false);
    }
  };

  const handleMakeSaleLive = async () => {
    if (!discountItems.trim()) {
      Alert.alert('Missing Items', 'Please enter items for discount.');
      return;
    }

    // Fetch seller's pincode
    const { data: sellerDetails, error: sellerError } = await supabase
      .from('sellerDetails')
      .select('pincode, pendingSaleCredit')
      .eq('userId', user.id)
      .single();

    if (sellerError || !sellerDetails || !sellerDetails.pincode) {
      Alert.alert('Error', 'Could not fetch your pincode.');
      return;
    }

    if (sellerDetails.pendingSaleCredit === 0) {
      Alert.alert('No Sale Credit', 'You have no sale credits left. Please buy more.');
      return;
    }

    // Fetch all buyers with matching pincode
    const { data: buyers, error } = await supabase
      .from('user')
      .select('id')
      .eq('isSeller', false)
      .eq('pincode', sellerDetails.pincode);

    if (error) {
      Alert.alert('Error', 'Could not fetch buyers.');
      return;
    }

    if (buyers && buyers.length > 0) {
      const notifications = buyers.map((buyer: any) => ({
        user_id: buyer.id,
        seller_id: user.id,
        message: `Sale Live! Discount on: ${discountItems}`,
      }));

      const { error: notifError } = await supabase.from('notifications').insert(notifications);
      if (notifError) {
        Alert.alert('Error', notifError.message);
        return;
      }

      // Decrement pendingSaleCredit by 1
      await supabase
        .from('sellerDetails')
        .update({ pendingSaleCredit: (sellerDetails.pendingSaleCredit || 1) - 1 })
        .eq('userId', user.id);

      setPendingSaleCredit((prev) => (prev !== null ? prev - 1 : null));
      Alert.alert('Sale Live!', 'Notification sent to buyers in your area.');
      setDiscountItems('');
    } else {
      Alert.alert('No Buyers', 'No buyers found in your area.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            // Navigate back to signup page
            navigation.reset({
              index: 0,
              routes: [{ name: 'Signup' }],
            });
          }
        }
      ]
    );
  };

  const handleContactEmail = () => {
    Linking.openURL('mailto:lazysolutions9@gmail.com');
  };

  const handleContactPhone = () => {
    Linking.openURL('tel:+919888386663');
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    
    if (!newPassword) {
      Alert.alert('Error', 'Password cannot be empty.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase
        .from('user')
        .update({ password: newPassword })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating password:', error);
        Alert.alert('Error', 'Could not update password. Please try again.');
      } else {
        Alert.alert('Success', 'Your password has been changed.');
        setNewPassword('');
        setConfirmPassword('');
        setShowChangePasswordModal(false);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderCard = (title: string, children: React.ReactNode, icon?: string) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          {icon && <Ionicons name={icon as any} size={20} color="#374151" />}
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Username Card */}
        {renderCard('Username', (
          <Text style={styles.usernameText}>{user?.username || 'N/A'}</Text>
        ), 'person')}

        {/* Pincode Card */}
        {renderCard('Pincode', (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pincode</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, !isEditingPincode && styles.disabledInput]}
                value={pincode}
                onChangeText={setPincode}
                placeholder={isLoadingPincode ? "Loading..." : "Enter 6-digit pincode"}
                maxLength={6}
                keyboardType="numeric"
                editable={isEditingPincode}
              />
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditingPincode(!isEditingPincode)}
              >
                <Ionicons name="create" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            {isEditingPincode && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdatePincode}
              >
                <Text style={styles.saveButtonText}>Save Pincode</Text>
              </TouchableOpacity>
            )}
          </View>
        ), 'shield-checkmark')}

        {/* Credits Card for Buyers */}
        {userType === 'buyer' && renderCard('Credits Remaining', (
          <View style={styles.creditsContainer}>
            <Text style={styles.creditsText}>{credits !== null ? credits : '...'}</Text>
          </View>
        ))}

        {/* Shop Details Card for Sellers */}
        {userType === 'seller' && renderCard('Shop Details', (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shop Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Enter shop name"
              editable={isEditing}
            />
            
            <Text style={styles.label}>Shop Address</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={shopAddress}
              onChangeText={setShopAddress}
              placeholder="Enter shop address"
              editable={isEditing}
            />
            
            <Text style={styles.label}>Notes/Mobile No</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Enter notes or mobile number"
              editable={isEditing}
            />
            
            <View style={styles.editRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(!isEditing)}
              >
                <Ionicons name="create" size={20} color="#3B82F6" />
              </TouchableOpacity>
              {isEditing && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleUpdateDetails}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ), 'storefront')}

        {/* Make Sale Live Card for Sellers */}
        {userType === 'seller' && renderCard('Make Sale Live', (
          <View style={styles.inputGroup}>
            <View style={styles.creditRow}>
              <Text style={styles.label}>Discount Items</Text>
              <Text style={styles.creditText}>
                Available Sale Credit: {pendingSaleCredit !== null ? pendingSaleCredit : '...'}
              </Text>
            </View>
            
            <TextInput
              style={[styles.input, pendingSaleCredit === 0 && styles.disabledInput]}
              value={discountItems}
              onChangeText={setDiscountItems}
              placeholder="e.g., Paracetamol, Vitamin C, ..."
              editable={pendingSaleCredit !== 0}
            />
            
            <TouchableOpacity
              style={[styles.saleButton, pendingSaleCredit === 0 && styles.disabledButton]}
              onPress={pendingSaleCredit === 0 ? () => setShowBuyCreditPopup(true) : handleMakeSaleLive}
              disabled={pendingSaleCredit === 0}
            >
              <Text style={styles.saleButtonText}>
                {pendingSaleCredit === 0 ? 'Buy Credit' : 'Make Sale Live'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Actions Card */}
        {renderCard('Actions', (
          <View style={styles.actionsContainer}>
            {userType === 'buyer' && user?.isSeller && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('SellerDashboard', { user })}
              >
                <Ionicons name="repeat" size={20} color="#374151" />
                <Text style={styles.actionText}>Seller View</Text>
              </TouchableOpacity>
            )}
            
            {userType === 'buyer' && !user?.isSeller && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('SellerSetup', { user })}
              >
                <Ionicons name="storefront" size={20} color="#374151" />
                <Text style={styles.actionText}>Sell with Us</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowChangePasswordModal(true)}
            >
              <Ionicons name="key" size={20} color="#374151" />
              <Text style={styles.actionText}>Change Password</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={20} color="#EF4444" />
              <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Contact Us Card */}
        {renderCard('Contact Us', (
          <View style={styles.contactContainer}>
            <Text style={styles.contactText}>For any query contact us on mail or phone</Text>
            
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactEmail}
            >
              <Ionicons name="mail" size={16} color="#3B82F6" />
              <Text style={styles.contactLink}>lazysolutions9@gmail.com</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactPhone}
            >
              <Ionicons name="call" size={16} color="#3B82F6" />
              <Text style={styles.contactLink}>+91 9888386663</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Buy Credit Popup Modal */}
      <Modal
        visible={showBuyCreditPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBuyCreditPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contact</Text>
            <Text style={styles.modalText}>+91 9888386663</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowBuyCreditPopup(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.modalDescription}>Enter your new password below.</Text>
            
            <View style={styles.passwordForm}>
              <Text style={styles.passwordLabel}>New Password</Text>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <Text style={styles.passwordLabel}>Confirm Password</Text>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowChangePasswordModal(false);
                }}
                disabled={isChangingPassword}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, isChangingPassword && styles.disabledButton]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                <Text style={styles.modalButtonText}>
                  {isChangingPassword ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cardContent: {
    padding: 16,
  },
  usernameText: {
    fontSize: 16,
    color: '#6B7280',
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  editButton: {
    padding: 8,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  creditsContainer: {
    alignItems: 'center',
  },
  creditsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  saleButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  saleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#374151',
  },
  logoutText: {
    color: '#EF4444',
  },
  contactContainer: {
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactLink: {
    fontSize: 14,
    color: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  passwordForm: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfilePage; 