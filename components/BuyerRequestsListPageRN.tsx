import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
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

type BuyerRequestsListNavigationProp = StackNavigationProp<RootStackParamList, 'BuyerRequestsList'>;
type BuyerRequestsListRouteProp = RouteProp<RootStackParamList, 'BuyerRequestsList'>;

interface BuyerRequestsListProps {
  navigation: BuyerRequestsListNavigationProp;
  route: BuyerRequestsListRouteProp;
}

interface Request {
  id: string;
  name: string;
  status: string;
  responses: number;
  pincode: string;
  created_at: string;
}

const BuyerRequestsListPage = ({ navigation, route }: BuyerRequestsListProps) => {
  const { user } = route.params;
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequestsAndCounts();
  }, [user]);

  const fetchRequestsAndCounts = async () => {
    if (!user) return;

    try {
      const { data: userOrders, error: ordersError } = await supabase
        .from('order')
        .select('id, itemName, created_at, pincode')
        .eq('userId', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        return;
      }
      
      const orderIds = userOrders.map(order => order.id);
      
      const { data: responses, error: responsesError } = await supabase
        .from('sellerResponse')
        .select('orderId')
        .in('orderId', orderIds);

      if (responsesError) {
        // Continue without response counts
      }

      const responseCounts = (responses || []).reduce((acc: any, res) => {
        acc[res.orderId] = (acc[res.orderId] || 0) + 1;
        return acc;
      }, {});

      const combinedData = userOrders.map(order => ({
        id: order.id,
        name: order.itemName,
        status: 'Active', // This can be updated if you add a status to your order table
        responses: responseCounts[order.id] || 0,
        pincode: order.pincode,
        created_at: order.created_at,
      }));

      setRequests(combinedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequestDetails = (request: Request) => {
    navigation.navigate('BuyerRequestDetails', { user, request });
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
        <Text style={styles.headerTitle}>Requests</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>You have not made any requests.</Text>
            <Text style={styles.emptySubtext}>Create your first request from the home screen</Text>
          </View>
        ) : (
          <View style={styles.requestsContainer}>
            {requests.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestCard}
                onPress={() => handleViewRequestDetails(request)}
              >
                <View style={styles.requestContent}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{request.name}</Text>
                    <Text style={styles.requestStatus}>
                      {request.status} - {request.responses} responses
                    </Text>
                    <Text style={styles.requestDate}>
                      {new Date(request.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  requestsContainer: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  requestContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  requestStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default BuyerRequestsListPage; 