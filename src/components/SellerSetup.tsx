import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

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
    <div className="flex flex-col h-full p-6">
      <div className="text-center my-8">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4 mx-auto">
          <span className="text-xl font-bold text-gray-600">4</span>
        </div>
        <h1 className="text-2xl font-bold">Setup Your Shop</h1>
        <p className="text-muted-foreground">Tell us about your business</p>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <Label htmlFor="shop-name">Shop Name</Label>
          <Input
            id="shop-name"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Enter your shop name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="What do you sell?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Your business address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile-notes">Mobile No/Notes</Label>
          <Input
            id="mobile-notes"
            type="text"
            value={mobileNotes}
            onChange={(e) => setMobileNotes(e.target.value)}
            placeholder="Contact number or additional notes"
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button
          onClick={handleSaveAddress}
          className="w-full"
        >
          Save Address
        </Button>
      </div>
    </div>
  );
};

export default SellerSetup;
