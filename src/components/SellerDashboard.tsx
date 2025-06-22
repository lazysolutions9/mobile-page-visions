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

  const fetchOrders = async () => {
    setLoading(true);
    if (!user) {
      toast({ title: "Authentication Error", description: "Could not authenticate user.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const [ordersResult, responsesResult] = await Promise.all([
      supabase.from('order').select('*'),
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

  const handleAccept = () => {
    fetchOrders();
    setIsModalOpen(false);
  };

  const handleRequestClick = (request: any) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
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
      <main className="flex-1 overflow-y-auto">
        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sticky top-0 bg-white z-10">
            <TabsTrigger value="incoming">
              Incoming ({incomingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({acceptedRequests.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="incoming" className="p-6 space-y-4">
            <RequestList requests={incomingRequests} actionText="View" />
          </TabsContent>
          <TabsContent value="accepted" className="p-6 space-y-4">
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Seller Dashboard</h1>
        <Button variant="ghost" size="icon" onClick={() => {
          toast({
            title: "No new notifications",
            description: "You're all caught up!",
          })
        }}>
          <Bell size={20} />
        </Button>
      </header>

      {/* Main Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <footer className="bg-white border-t p-2">
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
