import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
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

type BuyerRequestDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'BuyerRequestDetails'>;
type BuyerRequestDetailsRouteProp = RouteProp<RootStackParamList, 'BuyerRequestDetails'>;

interface BuyerRequestDetailsProps {
  navigation: BuyerRequestDetailsNavigationProp;
  route: BuyerRequestDetailsRouteProp;
}

interface Response {
  id: string;
  orderId: string;
  userId: string;
  notes: string;
  seller?: {
    shopName: string;
    userId: string;
  };
}

const BuyerRequestDetailsPage = ({ navigation, route }: BuyerRequestDetailsProps) => {
  const { user, request } = route.params;
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [sellerLoading, setSellerLoading] = useState(false);

  useEffect(() => {
    fetchResponses();
  }, [request]);

  const fetchResponses = async () => {
    if (!request?.id) return;
    
    try {
      const { data: responseData, error: responseError } = await supabase
        .from('sellerResponse')
        .select('*')
        .eq('orderId', request.id);

      if (responseError) {
        Alert.alert('Error', 'Could not fetch seller responses.');
        return;
      }
      
      if (responseData && responseData.length > 0) {
        const sellerIds = responseData.map(res => res.userId);
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellerDetails')
          .select('*')
          .in('userId', sellerIds);

        if (sellerError) {
          setResponses(responseData.map(res => ({
            ...res,
            seller: { shopName: 'Unknown Seller', userId: res.userId }
          })));
        } else {
          const sellersMap = new Map(sellerData.map(seller => [seller.userId, seller]));
          const combinedResponses = responseData.map(response => ({
            ...response,
            seller: sellersMap.get(response.userId)
          }));
          setResponses(combinedResponses);
        }
      } else {
        setResponses([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not fetch seller responses.');
    } finally {
      setLoading(false);
    }
  };

  const handleFooterAction = (action: 'resend' | 'close') => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleViewSeller = async (seller: any) => {
    if (!seller?.userId) {
      Alert.alert('Error', 'Seller information not available.');
      return;
    }

    setSellerLoading(true);
    try {
      const { data: sellerDetails, error } = await supabase
        .from('sellerDetails')
        .select('*')
        .eq('userId', seller.userId)
        .single();
      
      if (!error && sellerDetails) {
        setSelectedSeller({ ...sellerDetails, userId: seller.userId });
        setShowSellerModal(true);
      } else {
        Alert.alert('Error', 'Could not fetch seller details.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not fetch seller details.');
    } finally {
      setSellerLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{request.name}</Text>
          <Text style={styles.requestDate}>
            Submitted {request.created_at ? new Date(request.created_at).toLocaleString() : ''}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pincode</Text>
          <Text style={styles.sectionContent}>{request.pincode || "N/A"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Responses ({responses.length})</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading responses...</Text>
            </View>
          ) : responses.length > 0 ? (
            <View style={styles.responsesContainer}>
              {responses.map((response) => (
                <TouchableOpacity
                  key={response.id}
                  style={styles.responseCard}
                  onPress={() => handleViewSeller(response.seller)}
                >
                  <View style={styles.responseContent}>
                    <Text style={styles.sellerName}>
                      {response.seller?.shopName || 'Awaiting response'}
                    </Text>
                    <Text style={styles.responseNotes}>
                      {response.notes || 'No notes provided.'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No sellers have responded yet.</Text>
              <Text style={styles.emptySubtext}>Check back later for responses</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => handleFooterAction('resend')}
        >
          <Text style={styles.outlineButtonText}>Resend Request</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handleFooterAction('close')}
        >
          <Text style={styles.primaryButtonText}>Close Request</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSellerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSellerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sellerModalContent}>
            <View style={styles.sellerModalHeader}>
              <Text style={styles.sellerModalTitle}>Shop Details</Text>
              <TouchableOpacity
                onPress={() => setShowSellerModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {sellerLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading seller details...</Text>
              </View>
            ) : selectedSeller ? (
              <View style={styles.sellerDetails}>
                <View style={styles.sellerDetailItem}>
                  <Text style={styles.sellerDetailLabel}>Shop Name</Text>
                  <Text style={styles.sellerDetailValue}>{selectedSeller.shopName || 'N/A'}</Text>
                </View>
                
                <View style={styles.sellerDetailItem}>
                  <Text style={styles.sellerDetailLabel}>Shop Address</Text>
                  <Text style={styles.sellerDetailValue}>{selectedSeller.shopAddress || 'No address provided'}</Text>
                </View>
                
                <View style={styles.sellerDetailItem}>
                  <Text style={styles.sellerDetailLabel}>Pincode</Text>
                  <Text style={styles.sellerDetailValue}>{selectedSeller.pincode || 'No pincode provided'}</Text>
                </View>
                
                <View style={styles.sellerDetailItem}>
                  <Text style={styles.sellerDetailLabel}>Description/Notes</Text>
                  <Text style={styles.sellerDetailValue}>{selectedSeller.notes || 'No notes provided'}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Could not load seller details</Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.sellerModalButton}
              onPress={() => setShowSellerModal(false)}
            >
              <Text style={styles.sellerModalButtonText}>Close</Text>
            </TouchableOpacity>
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
  requestInfo: {
    marginBottom: 24,
  },
  requestName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  responsesContainer: {
    gap: 12,
  },
  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  responseContent: {
    padding: 16,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  responseNotes: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  outlineButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerModalContent: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    maxHeight: '80%',
  },
  sellerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  sellerDetails: {
    marginBottom: 16,
  },
  sellerDetailItem: {
    marginBottom: 12,
  },
  sellerDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sellerDetailValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  sellerModalButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  sellerModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BuyerRequestDetailsPage; 