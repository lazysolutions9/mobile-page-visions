import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Home, User, Bell, ShoppingCart } from 'lucide-react';
import ProfilePage from './ProfilePage';
import { BuyerRequestDetailsPage } from './BuyerRequestDetailsPage';
import { SellerDetailsModal } from './SellerDetailsModal';
import { BuyerRequestsListPage } from './BuyerRequestsListPage';
import { useToast } from '@/components/ui/use-toast';

interface BuyerDashboardProps {
  userRole: 'buyer' | 'seller' | null;
  onLogout: () => void;
  onSwitchToSeller?: () => void;
  onSellWithUs?: () => void;
}

const BuyerDashboard = ({ userRole, onLogout, onSwitchToSeller, onSellWithUs }: BuyerDashboardProps) => {
  const { toast } = useToast();
  const [medicineName, setMedicineName] = useState('');
  const [activeView, setActiveView] = useState('home');
  const [latestRequests, setLatestRequests] = useState([
    { id: 1, name: 'Aspirin', count: 5 },
    { id: 2, name: 'Paracetamol', count: 3 }
  ]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [isSellerModalOpen, setSellerModalOpen] = useState(false);

  const handleCreateRequest = () => {
    if (!medicineName.trim()) {
      toast({
        title: "Request cannot be empty",
        description: "Please enter a medicine name.",
        variant: "destructive",
      });
      return;
    }

    const newRequest = {
      id: Date.now(),
      name: medicineName,
      count: 0,
    };
    
    setLatestRequests(prev => [newRequest, ...prev]);
    setMedicineName('');
    toast({
      title: "Request Created",
      description: `Your request for "${medicineName}" has been sent.`,
    })
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
          userType="buyer"
          onLogout={onLogout}
          onChangePassword={() => console.log('change password')}
          onSellWithUs={onSellWithUs}
        />
      );
    }
    
    if (activeView === 'requests') {
      return (
        <BuyerRequestsListPage
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
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Create Request Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create a new request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Medicine Name"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
            />
            <Button onClick={handleCreateRequest} className="w-full">
              Create Request
            </Button>
          </CardContent>
        </Card>
        
        {userRole === 'seller' && onSwitchToSeller && (
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
              {latestRequests.map((request) => (
                <div key={request.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => handleViewRequestDetails(request)}>
                  <span className="font-medium">{request.name}</span>
                  <span className="text-muted-foreground">{request.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <SellerDetailsModal isOpen={isSellerModalOpen} onOpenChange={setSellerModalOpen} seller={selectedSeller} />
      {/* Header */}
      <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Buyer Dashboard</h1>
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
          <Button
            variant="ghost"
            className={`flex flex-col items-center h-full space-y-1 ${activeView === 'requests' ? 'text-primary' : ''}`}
            onClick={() => setActiveView('requests')}
          >
            <ShoppingCart size={24} />
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
