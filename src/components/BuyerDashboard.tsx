import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Home, User, Bell, ShoppingCart, Search, ArrowLeft } from 'lucide-react';
import ProfilePage from './ProfilePage';
import { BuyerRequestDetailsPage } from './BuyerRequestDetailsPage';
import { SellerDetailsModal } from './SellerDetailsModal';
import { BuyerRequestsListPage } from './BuyerRequestsListPage';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface BuyerDashboardProps {
  user: any;
  onLogout: () => void;
  onSwitchToSeller?: () => void;
  onSellWithUs?: () => void;
}

const BuyerDashboard = ({ user, onLogout, onSwitchToSeller, onSellWithUs }: BuyerDashboardProps) => {
  const { toast } = useToast();
  const [itemName, setItemName] = useState('');
  const [activeView, setActiveView] = useState('home');
  const [latestRequests, setLatestRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [isSellerModalOpen, setSellerModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user) return;
      const { data: orders, error: ordersError } = await supabase
        .from('order')
        .select('*')
        .eq('userId', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching user orders:', ordersError);
        toast({
          title: "Error",
          description: "Could not fetch your requests.",
          variant: "destructive",
        });
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
      }));
      setLatestRequests(formattedRequests);
    };

    fetchUserOrders();
  }, [user, toast]);

  const handleCreateRequest = async () => {
    if (!itemName.trim()) {
      toast({
        title: "Request cannot be empty",
        description: "Please enter an item name.",
        variant: "destructive",
      });
      return;
    }

    // Fetch the latest availableRequestCount and usedCreditCount from the user table
    const { data: userData, error: userFetchError } = await supabase
      .from('user')
      .select('availableRequestCount, usedCreditCount')
      .eq('id', user.id)
      .single();

    if (userFetchError || !userData) {
      toast({
        title: "Error",
        description: "Could not verify your credits. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (userData.availableRequestCount === 0) {
      toast({
        title: "You are out of credits",
        description: "Please purchase more credits to place a request.",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from('order')
      .insert({
        userId: user.id,
        itemName: itemName.trim(),
        category: 'Medical',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error Creating Request",
        description: "There was a problem submitting your request. Please try again.",
        variant: "destructive",
      });
    } else {
      // Decrement availableRequestCount by 1 and increment usedCreditCount by 1 using the latest values
      await supabase
        .from('user')
        .update({ 
          availableRequestCount: userData.availableRequestCount - 1,
          usedCreditCount: userData.usedCreditCount + 1
        })
        .eq('id', user.id);

      const newRequest = {
        id: data.id,
        name: data.itemName,
        count: 0, // This can be updated later if needed
      };
      setLatestRequests(prev => [newRequest, ...prev]);
      setItemName('');
      toast({
        title: "Request Created",
        description: `Your request for "${itemName}" has been sent.`,
      });

      // Notify all sellers
      const { data: sellers, error: sellersError } = await supabase
        .from('user')
        .select('id')
        .eq('isSeller', true);
      if (!sellersError && sellers && sellers.length > 0) {
        const notifications = sellers.map((seller: any) => ({
          user_id: seller.id,
          order_id: data.id,
          message: `A new request for '${itemName}' has been posted.`,
        }));
        await supabase.from('notifications').insert(notifications);
      }
    }
  };

  const handleViewRequestDetails = (request: any) => {
    setSelectedRequest(request);
    setActiveView('request-details');
  };

  const handleViewSeller = (seller: any) => {
    setSelectedSeller(seller);
    setSellerModalOpen(true);
  }

  const renderContent = () => {
    if (activeView === 'profile') {
      return (
        <ProfilePage
          user={user}
          userType="buyer"
          onLogout={onLogout}
          onSellWithUs={onSellWithUs}
          onSwitchToSeller={onSwitchToSeller}
        />
      );
    }
    
    if (activeView === 'requests') {
      return (
        <BuyerRequestsListPage
          user={user}
          onBack={() => setActiveView('home')}
          onViewRequestDetails={handleViewRequestDetails}
        />
      );
    }

    if (activeView === 'request-details') {
      return (
        <BuyerRequestDetailsPage 
          request={selectedRequest}
          onBack={() => setActiveView('requests')}
          onViewSeller={handleViewSeller}
        />
      );
    }

    return (
      <main className="p-6 space-y-6 pb-24">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Welcome, {user?.username || 'Buyer'}!</h2>
          <p className="text-muted-foreground">Ready to create a new request?</p>
        </div>
        {/* Create Request Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create a new request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter item name..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button onClick={handleCreateRequest} className="w-full">
              Create Request
            </Button>
          </CardContent>
        </Card>
        
        {user.isSeller && onSwitchToSeller && (
          <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">You are viewing as a buyer.</p>
              <Button variant="outline" onClick={onSwitchToSeller} className="bg-white border-gray-300">
                  Switch to Seller View
              </Button>
          </div>
        )}

        {/* Latest Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-muted-foreground pb-2 border-b">
                <span>Name</span>
                <span>Count</span>
              </div>
              {latestRequests.length > 0 ? (
                latestRequests.map((request) => (
                  <div key={request.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => handleViewRequestDetails(request)}>
                    <span className="font-medium">{request.name}</span>
                    <span className="text-muted-foreground">{request.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">You haven't made any requests yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <SellerDetailsModal isOpen={isSellerModalOpen} onOpenChange={setSellerModalOpen} seller={selectedSeller} />
      
      {/* Headers for different views */}
      {activeView === 'home' && (
        <header className="bg-white shadow-sm border-b p-4 flex items-center justify-center relative">
          <h1 className="text-xl font-bold">Home</h1>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Button variant="ghost" size="icon" onClick={() => {
              toast({
                title: "No new notifications",
                description: "You're all caught up!",
              })
            }}>
              <Bell size={20} />
            </Button>
          </div>
        </header>
      )}
      
      {activeView === 'profile' && (
        <header className="bg-white shadow-sm border-b p-4 text-center">
          <h1 className="text-xl font-bold">Profile</h1>
        </header>
      )}
      
      {activeView === 'requests' && (
        <header className="bg-white shadow-sm border-b p-4 text-center">
          <h1 className="text-xl font-bold">Requests</h1>
        </header>
      )}
      
      {activeView === 'request-details' && (
        <header className="bg-white shadow-sm border-b p-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setActiveView('requests')}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Request Details</h1>
          </div>
        </header>
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      {/* Bottom Navigation - Always visible */}
      <footer className="fixed bottom-0 w-full max-w-sm bg-white border-t p-2 z-50">
        <div className="flex justify-around items-center">
          <Button
            variant="ghost"
            className={`flex flex-col items-center h-full space-y-1 ${activeView === 'home' ? 'text-primary' : ''}`}
            onClick={() => setActiveView('home')}
          >
            <Home size={24} />
            <span className="text-xs font-medium">Home</span>
          </Button>
          <Button
            variant="ghost"
            className={`flex flex-col items-center h-full space-y-1 ${activeView === 'requests' ? 'text-primary' : ''}`}
            onClick={() => setActiveView('requests')}
          >
            <Search size={24} />
            <span className="text-xs font-medium">Requests</span>
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

export default BuyerDashboard;