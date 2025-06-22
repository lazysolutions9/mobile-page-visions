
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, User } from 'lucide-react';

const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState('incoming');

  // Mock data for demonstration
  const incomingRequests = [
    { id: 1, type: 'New Request', customer: 'John Doe' },
    { id: 2, type: 'Urgent Request', customer: 'Jane Smith' },
    { id: 3, type: 'Standard Request', customer: 'Mike Johnson' },
    { id: 4, type: 'Express Request', customer: 'Sarah Wilson' },
    { id: 5, type: 'Regular Request', customer: 'Tom Brown' }
  ];

  const acceptedRequests = [
    { id: 1, type: 'Confirmed Order', customer: 'Alice Cooper' },
    { id: 2, type: 'In Progress', customer: 'Bob Dylan' },
    { id: 3, type: 'Ready for Pickup', customer: 'Carol King' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 text-center">Seller Home Page</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="incoming" className="text-sm">
              Incoming ({incomingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="text-sm">
              Accepted ({acceptedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="space-y-4">
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">New Incoming Requests (IR)</h3>
                  <span className="text-sm text-gray-500">5,1</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Top Three</p>
                
                <div className="space-y-3">
                  {incomingRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">{request.type}</p>
                        <p className="text-sm text-gray-600">{request.customer}</p>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
                
                {incomingRequests.length > 3 && (
                  <Button variant="outline" className="w-full mt-4">
                    View All ({incomingRequests.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">Accepted Requests (AR)</h3>
                  <span className="text-sm text-gray-500">5,2</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Top Three</p>
                
                <div className="space-y-3">
                  {acceptedRequests.map((request) => (
                    <div key={request.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">{request.type}</p>
                        <p className="text-sm text-gray-600">{request.customer}</p>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        Update
                      </Button>
                    </div>
                  ))}
                </div>
                
                {acceptedRequests.length > 0 && (
                  <Button variant="outline" className="w-full mt-4">
                    View All ({acceptedRequests.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex justify-around items-center">
          <Button variant="ghost" className="flex flex-col items-center space-y-1 p-2">
            <Home size={20} />
            <span className="text-xs">H</span>
          </Button>
          
          <Button variant="ghost" className="flex flex-col items-center space-y-1 p-2 bg-blue-100">
            <User size={20} />
            <span className="text-xs font-medium">Buyer View</span>
          </Button>
          
          <Button variant="ghost" className="flex flex-col items-center space-y-1 p-2">
            <span className="text-lg font-bold">P</span>
            <span className="text-xs">P</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
