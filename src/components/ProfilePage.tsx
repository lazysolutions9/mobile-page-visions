import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Edit, LogOut, KeyRound, Store, ShieldCheck, Repeat } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { supabase } from '@/lib/supabase';
import { useToast } from './ui/use-toast';

interface ProfilePageProps {
  user: any;
  userType: 'buyer' | 'seller';
  onLogout: () => void;
  onSellWithUs?: () => void;
  onSwitchToSeller?: () => void;
}

const ProfilePage = ({ user, userType, onLogout, onSellWithUs, onSwitchToSeller }: ProfilePageProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (userType === 'seller' && user) {
      const fetchSellerDetails = async () => {
        const { data, error } = await supabase
          .from('sellerDetails')
          .select('*')
          .eq('userId', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error if no details exist
          console.error('Error fetching seller details:', error);
        } else if (data) {
          setShopName(data.shopName);
          setShopAddress(data.shopAddress);
          setNotes(data.notes);
        }
      };
      fetchSellerDetails();
    }
  }, [user, userType]);

  const handleUpdateDetails = async () => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to update details.', variant: 'destructive' });
      return;
    }

    const details = {
      userId: user.id,
      shopName,
      shopAddress,
      notes,
      category: 'Medical', // Assuming this is constant
    };

    const { error } = await supabase
      .from('sellerDetails')
      .upsert(details, { onConflict: 'userId' });

    if (error) {
      console.error("Error upserting seller details:", error);
      toast({ title: 'Error', description: 'Could not update shop details. Please check your database permissions.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Shop details updated.' });
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-gray-50">
      <main className="p-6 space-y-6 pb-24">
        <ChangePasswordModal isOpen={isChangePasswordOpen} onOpenChange={setChangePasswordOpen} user={user} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User /> Username
            </CardTitle>
            <CardDescription>{user?.username || user?.email || 'N/A'}</CardDescription>
          </CardHeader>
        </Card>

        {userType === 'seller' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Store /> Shop Details
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
                  <Edit size={20} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shopName">Shop Name</Label>
                <Input id="shopName" value={shopName} onChange={e => setShopName(e.target.value)} disabled={!isEditing} />
              </div>
              <div>
                <Label htmlFor="shopAddress">Shop Address</Label>
                <Input id="shopAddress" value={shopAddress} onChange={e => setShopAddress(e.target.value)} disabled={!isEditing} />
              </div>
              <div>
                <Label htmlFor="mobileNotes">Notes/Mobile No</Label>
                <Input id="mobileNotes" value={notes} onChange={e => setNotes(e.target.value)} disabled={!isEditing} />
              </div>
              {isEditing && <Button className="w-full" onClick={handleUpdateDetails}>Save</Button>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 space-y-2">
            {userType === 'buyer' && (
              user?.isSeller ? (
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={onSwitchToSeller}>
                  <Repeat /> Seller View
                </Button>
              ) : (
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={onSellWithUs}>
                  <Store /> Sell With Us
                </Button>
              )
            )}
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setChangePasswordOpen(true)}>
              <KeyRound /> Change Password
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={onLogout}>
              <LogOut /> Logout
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProfilePage; 