
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Home, User } from 'lucide-react';

const BuyerDashboard = () => {
  const [medicineName, setMedicineName] = useState('');

  // Mock data for latest requests
  const latestRequests = [
    { id: 1, name: 'Aspirin', count: 5 },
    { id: 2, name: 'Paracetamol', count: 3 }
  ];

  const handleCreateRequest = () => {
    console.log('Creating request for:', medicineName);
    // Add request creation logic here
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 text-center">Buyer Home Page</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Seller View Button */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">If Navigated from S then show.</p>
          <Button variant="outline" className="bg-white border-gray-300">
            Seller View
          </Button>
        </div>

        {/* Medicine Name Input */}
        <div className="space-y-2">
          <Input
            placeholder="Medicine Name"
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
            className="bg-white border-gray-300 rounded-lg h-12"
          />
        </div>

        {/* Create Request Button */}
        <div className="text-center">
          <Button 
            onClick={handleCreateRequest}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium"
          >
            Btn::Create Request
          </Button>
        </div>

        {/* Latest Requests */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Latest Requests (2)</h2>
          
          <Card className="bg-white rounded-lg shadow-sm">
            <CardContent className="p-4">
              {/* Header Row */}
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                <span className="font-medium text-gray-900">Name</span>
                <span className="font-medium text-gray-900">Count</span>
              </div>
              
              {/* Request Items */}
              <div className="space-y-3">
                {latestRequests.map((request) => (
                  <div key={request.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{request.name}</span>
                    <span className="text-gray-600">{request.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex justify-around items-center">
          <Button variant="ghost" className="flex flex-col items-center space-y-1 p-2 bg-blue-100">
            <Home size={20} />
            <span className="text-xs font-medium">H</span>
          </Button>
          
          <Button variant="ghost" className="flex flex-col items-center space-y-1 p-2">
            <div className="text-center">
              <div className="text-sm font-medium">Requ</div>
              <div className="text-sm font-medium">ests</div>
            </div>
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

export default BuyerDashboard;
