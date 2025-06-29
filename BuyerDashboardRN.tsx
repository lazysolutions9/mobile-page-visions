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
  FlatList,
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

type BuyerDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'BuyerDashboard'>;
type BuyerDashboardRouteProp = RouteProp<RootStackParamList, 'BuyerDashboard'>;

interface BuyerDashboardProps {
  navigation: BuyerDashboardNavigationProp;
  route: BuyerDashboardRouteProp;
}

interface Request {
  id: string;
  name: string;
  count: number;
  pincode: string;
  created_at: string;
}

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const BuyerDashboard = ({ navigation, route }: BuyerDashboardProps) => {
  const { user } = route.params;
  const [itemName, setItemName] = useState('');
  const [pincode, setPincode] = useState('');
  const [activeView, setActiveView] = useState('home');
  const [latestRequests, setLatestRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch user's pincode on component mount
  useEffect(() => {
    const fetchUserPincode = async () => {
      if (!user) return;
      const { data: userData, error } = await supabase
        .from('user')
        .select('pincode')
        .eq('id', user.id)
        .single();

      if (!error && userData) {
        setPincode(userData.pincode ? String(userData.pincode) : '');
      }
    };

    fetchUserPincode();
  }, [user]);

  // Fetch user's orders
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user) return;
      const { data: orders, error: ordersError } = await supabase
        .from('order')
        .select('id, itemName, pincode, created_at')
        .eq('userId', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching user orders:', ordersError);
        Alert.alert('Error', 'Could not fetch your requests.');
        return;
      }
      
      const orderIds = orders.map(order => order.id);
      const { data: responses, error: responsesError } = await supabase
        .from('sellerResponse')
        .select('orderId')
        .in('orderId', orderIds);

      if (responsesError) {
        console.error('Error fetching response counts:', responsesError);
      }

      const responseCounts = (responses || []).reduce((acc: any, res) => {
        acc[res.orderId] = (acc[res.orderId] || 0) + 1;
        return acc;
      }, {});

      const formattedRequests = orders.map(order => ({
        id: order.id,
        name: order.itemName,
        count: responseCounts[order.id] || 0,
        pincode: order.pincode,
        created_at: order.created_at,
      }));
      setLatestRequests(formattedRequests);
    };

    fetchUserOrders();

    const interval = setInterval(() => {
      fetchUserOrders();
    }, 40000); // 40 seconds

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setNotifications(data);
      }
    };
    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const handleCreateRequest = async () => {
    if (!itemName.trim()) {
      Alert.alert('Request cannot be empty', 'Please enter an item name.');
      return;
    }

    // Fetch the latest availableRequestCount and usedCreditCount from the user table
    const { data: userData, error: userFetchError } = await supabase
      .from('user')
      .select('availableRequestCount, usedCreditCount')
      .eq('id', user.id)
      .single();

    if (userFetchError || !userData) {
      Alert.alert('Error', 'Could not verify your credits. Please try again.');
      return;
    }

    if (userData.availableRequestCount === 0) {
      Alert.alert('You are out of credits', 'Please purchase more credits to place a request.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('order')
        .insert({
          userId: user.id,
          itemName: itemName.trim(),
          category: 'Medical',
          pincode: pincode ? pincode.trim() : '',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        Alert.alert('Error Creating Request', 'There was a problem submitting your request. Please try again.');
      } else {
        // Decrement availableRequestCount by 1 and increment usedCreditCount by 1
        await supabase
          .from('user')
          .update({ 
            availableRequestCount: userData.availableRequestCount - 1,
            usedCreditCount: userData.usedCreditCount + 1
          })
          .eq('id', user.id);

        Alert.alert('Success', 'Your request has been created successfully!');
        setItemName('');
        
        // Refresh the latest requests
        const { data: orders, error: ordersError } = await supabase
          .from('order')
          .select('id, itemName, pincode, created_at')
          .eq('userId', user.id)
          .order('created_at', { ascending: false });

        if (!ordersError && orders) {
          const orderIds = orders.map(order => order.id);
          const { data: responses } = await supabase
            .from('sellerResponse')
            .select('orderId')
            .in('orderId', orderIds);

          const responseCounts = (responses || []).reduce((acc: any, res) => {
            acc[res.orderId] = (acc[res.orderId] || 0) + 1;
            return acc;
          }, {});

          const formattedRequests = orders.map(order => ({
            id: order.id,
            name: order.itemName,
            count: responseCounts[order.id] || 0,
            pincode: order.pincode,
            created_at: order.created_at,
          }));
          setLatestRequests(formattedRequests);
        }
      }
    } catch (error) {
      console.error('Error creating request:', error);
      Alert.alert('Error', 'There was a problem creating your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequestDetails = (request: Request) => {
    // Navigate to request details page
    navigation.navigate('BuyerRequestDetails', { 
      user, 
      request: {
        id: request.id,
        name: request.name,
        pincode: request.pincode,
        created_at: request.created_at,
      }
    });
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark notification as read
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);
    
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, is_read: true } : n
    ));

    // TODO: Navigate to appropriate page based on notification
    Alert.alert('Notification', notification.message);
  };

  const handleRequestsTabPress = () => {
    navigation.navigate('BuyerRequestsList', { user });
  };

  const renderHomeContent = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome, {user?.username || 'Buyer'}!</Text>
        <Text style={styles.welcomeSubtitle}>Ready to create a new request?</Text>
      </View>

      {/* Create Request Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create a new request</Text>
        <View style={styles.cardContent}>
          <TextInput
            style={styles.input}
            placeholder="Enter item name..."
            value={itemName}
            onChangeText={setItemName}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter pincode..."
            value={pincode}
            onChangeText={setPincode}
            keyboardType="numeric"
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreateRequest}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating...' : 'Create Request'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Latest Requests */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Latest Requests</Text>
        <View style={styles.cardContent}>
          {latestRequests.length > 0 ? (
            latestRequests.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestItem}
                onPress={() => handleViewRequestDetails(request)}
              >
                <Text style={styles.requestName}>{request.name}</Text>
                <Text style={styles.requestCount}>{request.count}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>You haven't made any requests yet.</Text>
          )}
        </View>
      </View>
    </ScrollView>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
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
          style={[styles.navItem, activeView === 'requests' && styles.activeNavItem]}
          onPress={handleRequestsTabPress}
        >
          <Ionicons 
            name="search" 
            size={24} 
            color={activeView === 'requests' ? '#3B82F6' : '#6B7280'} 
          />
          <Text style={[styles.navText, activeView === 'requests' && styles.activeNavText]}>
            Requests
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('ProfilePage', { user, userType: 'buyer' })}
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
    paddingVertical: 12,
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
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
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
    top: 50,
    right: 0,
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: 400,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  notificationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  markAllRead: {
    fontSize: 14,
    color: '#3B82F6',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  unreadNotification: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  notificationText: {
    fontSize: 14,
    color: '#374151',
  },
  unreadText: {
    fontWeight: '600',
    color: '#1E40AF',
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  cardContent: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
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
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  requestCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingVertical: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
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
    fontWeight: '500',
  },
  activeNavText: {
    color: '#3B82F6',
  },
});

export default BuyerDashboard; 