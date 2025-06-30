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
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './src/lib/supabase';
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

type SellerDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'SellerDashboard'>;
type SellerDashboardRouteProp = RouteProp<RootStackParamList, 'SellerDashboard'>;

interface SellerDashboardProps {
  navigation: SellerDashboardNavigationProp;
  route: SellerDashboardRouteProp;
}

const SellerDashboard = ({ navigation, route }: SellerDashboardProps) => {
  const { user } = route.params;
  const [activeView, setActiveView] = useState('home');
  const [activeTab, setActiveTab] = useState('incoming');
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchNotifications();
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    if (!user) {
      Alert.alert('Authentication Error', 'Could not authenticate user.');
      setLoading(false);
      return;
    }

    try {
      // Get the seller's pincode
      const { data: sellerData, error: sellerError } = await supabase
        .from('user')
        .select('pincode')
        .eq('id', user.id)
        .single();

      if (sellerError || !sellerData) {
        Alert.alert('Error', 'Could not fetch seller information.');
        setLoading(false);
        return;
      }

      const sellerPincode = sellerData.pincode ? String(sellerData.pincode).trim() : '';
      const sellerPincodeInt = sellerPincode ? parseInt(sellerPincode, 10) : null;

      const [ordersResult, responsesResult] = await Promise.all([
        supabase.from('order').select('id, itemName, pincode, created_at').eq('pincode', sellerPincodeInt).order('created_at', { ascending: false }),
        supabase.from('sellerResponse').select('*').eq('userId', user.id)
      ]);

      const { data: allOrders, error: ordersError } = ordersResult;
      const { data: sellerResponses, error: responsesError } = responsesResult;

      if (responsesError) {
        Alert.alert('Error', 'Could not fetch your accepted requests.');
        setAcceptedRequests([]);
      } else {
        if (allOrders && sellerResponses) {
          const acceptedOrderIds = new Set(sellerResponses.map((res: any) => res.orderId));
          const acceptedOrders = allOrders.filter((order: any) => acceptedOrderIds.has(order.id));

          const acceptedMap = new Map(sellerResponses.map((res: any) => [res.orderId, res]));
          const formattedAccepted = acceptedOrders.map((order: any) => ({
            ...order,
            notes: acceptedMap.get(order.id)?.notes || '',
            status: 'accepted',
            pincode: order.pincode,
          }));
          setAcceptedRequests(formattedAccepted);
        } else {
          setAcceptedRequests([]);
        }
      }

      if (ordersError) {
        Alert.alert('Error', 'Could not fetch orders.');
        setIncomingRequests([]);
      } else {
        if (allOrders) {
          const respondedOrderIds = new Set((sellerResponses || []).map((res: any) => res.orderId));
          const incoming = allOrders.filter((order: any) => !respondedOrderIds.has(order.id));
          setIncomingRequests(incoming.map(req => ({ ...req, status: 'incoming', pincode: req.pincode })));
        } else {
          setIncomingRequests([]);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Could not fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleRequestClick = (request: any) => {
    setSelectedRequest(request);
    setRequestNotes(request.notes || '');
    setShowRequestModal(true);
  };

  const handleAcceptRequest = async () => {
    if (!user || !selectedRequest) {
      Alert.alert('Error', 'Could not process request.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('sellerResponse').insert([
        { orderId: selectedRequest.id, userId: user.id, notes: requestNotes }
      ]);

      if (error) {
        Alert.alert('Error', 'Could not accept the request. Please try again.');
        return;
      }

      // Update order status to accepted
      await supabase.from('order').update({ status: 'accepted' }).eq('id', selectedRequest.id);

      Alert.alert('Success', `Request for "${selectedRequest.itemName}" has been accepted.`);
      setShowRequestModal(false);
      fetchOrders(); // Refresh the lists
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Could not accept the request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRequest = async () => {
    if (!user || !selectedRequest) {
      Alert.alert('Error', 'Could not update request.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('sellerResponse')
        .update({ notes: requestNotes })
        .eq('orderId', selectedRequest.id)
        .eq('userId', user.id);

      if (error) {
        Alert.alert('Error', 'Could not update the request. Please try again.');
        return;
      }

      Alert.alert('Success', `Request for "${selectedRequest.itemName}" has been updated.`);
      setShowRequestModal(false);
      fetchOrders(); // Refresh the lists
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Could not update the request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Find the request in incoming or accepted
    const allRequests = [...incomingRequests, ...acceptedRequests];
    const req = allRequests.find(r => r.id === notification.order_id);
    if (req) {
      setSelectedRequest(req);
      setRequestNotes(req.notes || '');
      setShowRequestModal(true);
      setShowNotifications(false);
    } else {
      Alert.alert('Request not found', 'This request is not available.');
    }
    // Optionally mark as read
    if (!notification.is_read) {
      supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
      setNotifications(notifications.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    }
  };

  const RequestList = ({ requests, actionText, emptyMessage }: { requests: any[], actionText: string, emptyMessage: string }) => (
    <View style={styles.requestList}>
      {requests.length === 0 ? (
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      ) : (
        requests.map((request) => (
          <TouchableOpacity
            key={request.id}
            style={styles.requestItem}
            onPress={() => handleRequestClick(request)}
          >
            <View style={styles.requestContent}>
              <Text style={styles.requestName}>{request.itemName}</Text>
              <Text style={styles.requestDate}>
                Requested on: {new Date(request.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.actionButton}>
              <Text style={styles.actionButtonText}>{actionText}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderHomeContent = () => (
    <View style={styles.content}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome, {user?.username || 'Seller'}!</Text>
        <Text style={styles.welcomeSubtitle}>Manage your incoming requests</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incoming' && styles.activeTab]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>
            Incoming ({incomingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'accepted' && styles.activeTab]}
          onPress={() => setActiveTab('accepted')}
        >
          <Text style={[styles.tabText, activeTab === 'accepted' && styles.activeTabText]}>
            Accepted ({acceptedRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loadingText}>Loading requests...</Text>
        ) : activeTab === 'incoming' ? (
          <RequestList 
            requests={incomingRequests} 
            actionText="View" 
            emptyMessage="You have no incoming requests." 
          />
        ) : (
          <RequestList 
            requests={acceptedRequests} 
            actionText="Update" 
            emptyMessage="You have no accepted requests." 
          />
        )}
      </ScrollView>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.notificationsPanel}>
      <View style={styles.notificationsHeader}>
        <Text style={styles.notificationsTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={markAllAsRead}
          disabled={unreadCount === 0}
        >
          <Text style={[styles.markAllRead, unreadCount === 0 && styles.disabledText]}>
            Mark all as read
          </Text>
        </TouchableOpacity>
      </View>
      {notifications.length === 0 ? (
        <Text style={styles.emptyText}>No notifications</Text>
      ) : (
        notifications.map(n => (
          <TouchableOpacity
            key={n.id}
            style={[styles.notificationItem, !n.is_read && styles.unreadNotification]}
            onPress={() => handleNotificationClick(n)}
          >
            <Text style={[styles.notificationText, !n.is_read && styles.unreadText]}>
              {n.message}
            </Text>
            <Text style={styles.notificationTime}>
              {new Date(n.created_at).toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Seller Dashboard</Text>
        <View style={styles.notificationButton}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <Ionicons name="notifications" size={24} color="#374151" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          {showNotifications && renderNotifications()}
        </View>
      </View>

      {/* Main Content */}
      {renderHomeContent()}

      {/* Request Details Modal */}
      <Modal
        visible={showRequestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.requestModalContent}>
            <View style={styles.requestModalHeader}>
              <Text style={styles.requestModalTitle}>Request Details</Text>
              <TouchableOpacity
                onPress={() => setShowRequestModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedRequest && (
              <View style={styles.requestDetails}>
                <View style={styles.requestDetailItem}>
                  <Text style={styles.requestDetailLabel}>Item Name</Text>
                  <Text style={styles.requestDetailValue}>{selectedRequest.itemName}</Text>
                </View>
                
                <View style={styles.requestDetailItem}>
                  <Text style={styles.requestDetailLabel}>Date</Text>
                  <Text style={styles.requestDetailValue}>
                    {new Date(selectedRequest.created_at).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.requestDetailItem}>
                  <Text style={styles.requestDetailLabel}>Time</Text>
                  <Text style={styles.requestDetailValue}>
                    {new Date(selectedRequest.created_at).toLocaleTimeString()}
                  </Text>
                </View>
                
                <View style={styles.requestDetailItem}>
                  <Text style={styles.requestDetailLabel}>Pincode</Text>
                  <Text style={styles.requestDetailValue}>{selectedRequest.pincode || 'N/A'}</Text>
                </View>
                
                <View style={styles.requestDetailItem}>
                  <Text style={styles.requestDetailLabel}>Notes</Text>
                  {selectedRequest.status === 'incoming' || selectedRequest.status === 'accepted' ? (
                    <TextInput
                      style={styles.notesInput}
                      value={requestNotes}
                      onChangeText={setRequestNotes}
                      placeholder="Add a note for the buyer..."
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  ) : (
                    <Text style={styles.requestDetailValue}>
                      {requestNotes || 'No notes provided.'}
                    </Text>
                  )}
                </View>
              </View>
            )}
            
            <View style={styles.requestModalButtons}>
              {selectedRequest?.status === 'incoming' ? (
                <TouchableOpacity
                  style={[styles.requestModalButton, styles.acceptButton, isSubmitting && styles.disabledButton]}
                  onPress={handleAcceptRequest}
                  disabled={isSubmitting}
                >
                  <Text style={styles.requestModalButtonText}>
                    {isSubmitting ? 'Accepting...' : 'Accept'}
                  </Text>
                </TouchableOpacity>
              ) : selectedRequest?.status === 'accepted' ? (
                <>
                  <TouchableOpacity
                    style={[styles.requestModalButton, styles.cancelButton]}
                    onPress={() => setShowRequestModal(false)}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestModalButton, styles.updateButton, isSubmitting && styles.disabledButton]}
                    onPress={handleUpdateRequest}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.requestModalButtonText}>
                      {isSubmitting ? 'Updating...' : 'Update'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.requestModalButton}
                  onPress={() => setShowRequestModal(false)}
                >
                  <Text style={styles.requestModalButtonText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeView === 'home' && styles.activeNavItem]}
          onPress={() => setActiveView('home')}
        >
          <Ionicons 
            name="home" 
            size={24} 
            color={activeView === 'home' ? '#3B82F6' : '#6B7280'} 
          />
          <Text style={[styles.navText, activeView === 'home' && styles.activeNavText]}>
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('BuyerDashboard', { user })}
        >
          <Ionicons 
            name="repeat" 
            size={24} 
            color="#6B7280"
          />
          <Text style={styles.navText}>
            Buyer View
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('ProfilePage', { user, userType: 'seller' })}
        >
          <Ionicons 
            name="person" 
            size={24} 
            color="#6B7280"
          />
          <Text style={styles.navText}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  notificationButton: {
    position: 'absolute',
    right: 16,
  },
  bellButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationsPanel: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    minWidth: 300,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  markAllRead: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  notificationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadNotification: {
    backgroundColor: '#F0F9FF',
  },
  notificationText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  requestList: {
    gap: 12,
  },
  requestItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  requestContent: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    // Active state styling
  },
  navText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  activeNavText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  requestModalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  requestModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  requestDetails: {
    marginBottom: 20,
  },
  requestDetailItem: {
    marginBottom: 8,
  },
  requestDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  requestDetailValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  requestModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  requestModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});

export default SellerDashboard; 