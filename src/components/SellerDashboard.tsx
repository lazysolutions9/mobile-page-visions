import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, User, Bell, Package, Repeat } from 'lucide-react';
import ProfilePage from './ProfilePage';
import { SellerRequestDetailsModal } from './SellerRequestDetailsModal';
import { useToast } from '@/components/ui/use-toast';

interface SellerDashboardProps {
  onLogout: () => void;
  onSwitchToBuyer: () => void;
}

const SellerDashboard = ({ onLogout, onSwitchToBuyer }: SellerDashboardProps) => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('home');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for demonstration
  const incomingRequests = [
    { id: 1, type: 'New Request', customer: 'John Doe' },
    { id: 2, type: 'Urgent Request', customer: 'Jane Smith' },
    { id: 3, type: 'Standard Request', customer: 'Mike Johnson' },
    { id: 4, type: 'Express Request', customer: 'Sarah Wilson', status: 'incoming', notes: 'Need this ASAP please.' },
    { id: 5, type: 'Regular Request', customer: 'Tom Brown', status: 'incoming', notes: '' }
  ];

  const acceptedRequests = [
    { id: 1, type: 'Confirmed Order', customer: 'Alice Cooper', status: 'accepted', notes: 'Will be ready by 5pm.', date: '2023-10-27', time: '14:30' },
    { id: 2, type: 'In Progress', customer: 'Bob Dylan', status: 'accepted', notes: '', date: '2023-10-27', time: '15:00' },
    { id: 3, type: 'Ready for Pickup', customer: 'Carol King', status: 'accepted', notes: 'Ready for pickup at counter 3.', date: '2023-10-26', time: '18:00' }
  ];

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
              <p className="font-medium">{request.type}</p>
              <p className="text-sm text-muted-foreground">{request.customer}</p>
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
          userType="seller"
          onLogout={onLogout}
          onChangePassword={() => console.log('change password')}
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
      <SellerRequestDetailsModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} request={selectedRequest} />
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
