
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SellerSetupProps {
  onSetupComplete: () => void;
}

const SellerSetup = ({ onSetupComplete }: SellerSetupProps) => {
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [mobileNotes, setMobileNotes] = useState('');

  const handleSaveAddress = () => {
    console.log('Seller setup:', { shopName, category, address, mobileNotes });
    // Handle seller setup logic here
    onSetupComplete();
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-8 mt-8">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-4 mx-auto">
          <span className="text-lg font-bold text-gray-600">4</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Your Shop</h1>
        <p className="text-gray-600">Tell us about your business</p>
      </div>

      {/* Setup Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 flex-1">
        <div className="space-y-6">
          {/* Shop Name Field */}
          <div className="space-y-2">
            <Label htmlFor="shop-name" className="text-sm font-medium text-gray-700">
              Shop Name
            </Label>
            <Input
              id="shop-name"
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              placeholder="Enter your shop name"
            />
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              Category
            </Label>
            <Input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              placeholder="What do you sell?"
            />
          </div>

          {/* Address Field */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium text-gray-700">
              Address
            </Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              placeholder="Your business address"
            />
          </div>

          {/* Mobile No/Notes Field */}
          <div className="space-y-2">
            <Label htmlFor="mobile-notes" className="text-sm font-medium text-gray-700">
              Mobile No/Notes
            </Label>
            <Input
              id="mobile-notes"
              type="text"
              value={mobileNotes}
              onChange={(e) => setMobileNotes(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              placeholder="Contact number or additional notes"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <Button
            onClick={handleSaveAddress}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            Save Address
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SellerSetup;
