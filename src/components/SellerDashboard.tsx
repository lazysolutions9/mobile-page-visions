import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, User, Bell, Package, Repeat } from 'lucide-react';
import ProfilePage from './ProfilePage';
import { SellerRequestDetailsModal } from './SellerRequestDetailsModal';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface SellerDashboardProps {
  user: any;
  onLogout: () => void;
  onSwitchToBuyer: () => void;
}

const SellerDashboard = ({ user, onLogout, onSwitchToBuyer }: SellerDashboardProps) => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('home');
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    if (!user) {
      toast({ title: "Authentication Error", description: "Could not authenticate user.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const [ordersResult, responsesResult] = await Promise.all([
      supabase.from('order').select('*').order('created_at', { ascending: false }),
      supabase.from('sellerResponse').select('*').eq('userId', user.id)
    ]);

    const { data: allOrders, error: ordersError } = ordersResult;
    const { data: sellerResponses, error: responsesError } = responsesResult;

    if (responsesError) {
      toast({ title: "Error", description: "Could not fetch your accepted requests.", variant: "destructive" });
      setAcceptedRequests([]);
    } else {
      if (allOrders && sellerResponses) {
        const acceptedOrderIds = new Set(sellerResponses.map((res: any) => res.orderId));
        const acceptedOrders = allOrders.filter((order: any) => acceptedOrderIds.has(order.id));

        const acceptedMap = new Map(sellerResponses.map((res: any) => [res.orderId, res]));
        const formattedAccepted = acceptedOrders.map((order: any) => ({
          ...order,
          notes: acceptedMap.get(order.id)?.notes || '',
          status: 'accepted'
        }));
        setAcceptedRequests(formattedAccepted);
      } else {
        setAcceptedRequests([]);
      }
    }

    if (ordersError) {
      toast({ title: "Error", description: "Could not fetch orders.", variant: "destructive" });
      setIncomingRequests([]);
    } else {
      if (allOrders) {
        const respondedOrderIds = new Set((sellerResponses || []).map((res: any) => res.orderId));
        const incoming = allOrders.filter((order: any) => !respondedOrderIds.has(order.id));
        setIncomingRequests(incoming.map(req => ({ ...req, status: 'incoming' })));
      } else {
        setIncomingRequests([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

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

  const handleAccept = () => {
    fetchOrders();
    setIsModalOpen(false);
  };

  const handleRequestClick = (request: any) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleNotificationClick = (notification: any) => {
    // Find the request in incoming or accepted
    const allRequests = [...incomingRequests, ...acceptedRequests];
    const req = allRequests.find(r => r.id === notification.order_id);
    if (req) {
      setSelectedRequest(req);
      setIsModalOpen(true);
      setShowNotifications(false);
    } else {
      toast({ title: 'Request not found', description: 'This request is not available.' });
    }
    // Optionally mark as read
    if (!notification.is_read) {
      supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
      setNotifications(notifications.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    }
  };

  const RequestList = ({ requests, actionText }: { requests: any[], actionText: string }) => (
    <div className="space-y-3">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{request.itemName}</p>
              <p className="text-sm text-muted-foreground">
                Requested on: {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button size="sm" onClick={() => handleRequestClick(request)}>{actionText}</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderContent = () => {
    if (activeView === 'profile') {
      return (
        <ProfilePage
          user={user}
          userType="seller"
          onLogout={onLogout}
        />
      );
    }

    return (
      <main>
        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sticky top-0 bg-white z-10">
            <TabsTrigger value="incoming">
              Incoming ({incomingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({acceptedRequests.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="incoming" className="p-6 space-y-4 pb-24">
            <RequestList requests={incomingRequests} actionText="View" />
          </TabsContent>
          <TabsContent value="accepted" className="p-6 space-y-4 pb-24">
            <RequestList requests={acceptedRequests} actionText="Update" />
          </TabsContent>
        </Tabs>
      </main>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <SellerRequestDetailsModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        request={selectedRequest}
        onAccept={handleAccept}
        user={user}
      />
      
      {/* Headers for different views */}
      {activeView === 'home' && (
        <header className="bg-white shadow-sm border-b p-4 flex items-center justify-center relative">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="relative inline-block">
              <Button variant="ghost" size="icon" onClick={() => setShowNotifications(v => !v)}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">{unreadCount}</span>
                )}
              </Button>
              {showNotifications && (
                <div className="fixed right-4 top-20 w-80 bg-white border rounded-xl shadow-2xl z-[1050] max-h-96 overflow-y-auto animate-fade-in">
                  <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-xl">
                    <span className="font-semibold text-base">Notifications</span>
                    <Button variant="link" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>Mark all as read</Button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        className={`w-full text-left p-4 border-b last:border-b-0 transition-colors flex flex-col gap-1 focus:outline-none hover:bg-gray-100 ${n.is_read ? 'bg-white' : 'bg-blue-50 border-l-4 border-blue-500'}`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <span className={`text-sm ${n.is_read ? '' : 'font-semibold text-blue-900'}`}>{n.message}</span>
                        <span className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      
      {activeView === 'profile' && (
        <header className="bg-white shadow-sm border-b p-4 text-center">
          <h1 className="text-xl font-bold">Profile</h1>
        </header>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      {/* Bottom Navigation - Always visible */}
      <footer className="fixed bottom-0 w-full max-w-sm bg-white border-t p-2 z-40">
        <div className="flex justify-around items-center">
          <Button
            variant="ghost"
            className={`flex flex-col items-center h-full space-y-1 ${activeView === 'home' ? 'text-primary' : ''}`}
            onClick={() => setActiveView('home')}
          >
            <Home size={24} />
            <span className="text-xs font-medium">Home</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center h-full space-y-1" onClick={onSwitchToBuyer}>
            <Repeat size={24} />
            <span className="text-xs font-medium">Buyer View</span>
          </Button>
          <Button
            variant="ghost"
            className={`flex flex-col items-center h-full space-y-1 ${activeView === 'profile' ? 'text-primary' : ''}`}
            onClick={() => setActiveView('profile')}
          >
            <User size={24} />
            <span className="text-xs font-medium">Profile</span>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default SellerDashboard;
