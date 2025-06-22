import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useToast } from './ui/use-toast';

interface SellerSetupProps {
  user: any;
  onSetupComplete: () => void;
}

const SellerSetup = ({ user, onSetupComplete }: SellerSetupProps) => {
  const { toast } = useToast();
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSaveDetails = async () => {
    if (!shopName || !shopAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from('sellerDetails').insert({
      userId: user.id,
      shopName,
      category: 'Medical',
      shopAddress,
      notes,
    });

    if (error) {
      console.error('Error saving seller details:', error);
      toast({
        title: "Database Error",
        description: "Could not save your details. Please ensure you have the correct permissions and try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Shop Setup Complete!",
        description: "Your seller profile is now active.",
      });
      onSetupComplete();
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="text-center my-8">
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
            placeholder="e.g., City Pharmacy"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Shop Address</Label>
          <Input
            id="address"
            type="text"
            value={shopAddress}
            onChange={(e) => setShopAddress(e.target.value)}
            placeholder="e.g., 123 Main St, Anytown"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Delivery available within 5km"
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button
          onClick={handleSaveDetails}
          className="w-full"
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );
};

export default SellerSetup;
