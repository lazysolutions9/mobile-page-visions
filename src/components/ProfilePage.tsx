import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Edit, LogOut, KeyRound, Store, ShieldCheck, Repeat, Mail, Phone } from 'lucide-react';
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
  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [pincode, setPincode] = useState('');
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [discountItems, setDiscountItems] = useState('');
  const [pendingSaleCredit, setPendingSaleCredit] = useState<number | null>(null);
  const [showBuyCreditPopup, setShowBuyCreditPopup] = useState(false);

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
          setPendingSaleCredit(typeof data.pendingSaleCredit === 'number' ? data.pendingSaleCredit : 0);
        }
      };
      fetchSellerDetails();
    }
  }, [user, userType]);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user')
        .select('availableRequestCount')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setCredits(data.availableRequestCount);
      }
    };
    fetchCredits();
  }, [user]);

  useEffect(() => {
    const fetchUserPincode = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user')
        .select('pincode')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setPincode(data.pincode || '');
      }
    };

    fetchUserPincode();
  }, [user]);

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

  const handleUpdatePincode = async () => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to update pincode.', variant: 'destructive' });
      return;
    }

    if (!pincode.trim()) {
      toast({ title: 'Missing Pincode', description: 'Please enter a pincode.', variant: 'destructive' });
      return;
    }

    // Validate pincode format - exactly 6 digits
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      toast({ title: 'Invalid Pincode', description: 'Pincode must contain exactly 6 digits.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('user')
      .update({ pincode: pincode.trim() })
      .eq('id', user.id);

    if (error) {
      console.error("Error updating pincode:", error);
      toast({ title: 'Error', description: 'Could not update pincode. Please try again.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Pincode updated successfully.' });
      setIsEditingPincode(false);
    }
  };

  const handleMakeSaleLive = async () => {
    if (!discountItems.trim()) {
      toast({ title: 'Missing Items', description: 'Please enter items for discount.', variant: 'destructive' });
      return;
    }
    // Fetch seller's pincode
    const { data: sellerDetails, error: sellerError } = await supabase
      .from('sellerDetails')
      .select('pincode, pendingSaleCredit')
      .eq('userId', user.id)
      .single();
    if (sellerError || !sellerDetails || !sellerDetails.pincode) {
      toast({ title: 'Error', description: 'Could not fetch your pincode.', variant: 'destructive' });
      return;
    }
    if (sellerDetails.pendingSaleCredit === 0) {
      toast({ title: 'No Sale Credit', description: 'You have no sale credits left. Please buy more.', variant: 'destructive' });
      return;
    }
    // Fetch all buyers with matching pincode
    const { data: buyers, error } = await supabase
      .from('user')
      .select('id')
      .eq('isSeller', false)
      .eq('pincode', sellerDetails.pincode);
    if (error) {
      toast({ title: 'Error', description: 'Could not fetch buyers.', variant: 'destructive' });
      return;
    }
    if (buyers && buyers.length > 0) {
      const notifications = buyers.map((buyer: any) => ({
        user_id: buyer.id, // recipient
        seller_id: user.id, // sender (the seller)
        message: `Sale Live! Discount on: ${discountItems}`,
      }));
      const { error: notifError } = await supabase.from('notifications').insert(notifications);
      if (notifError) {
        toast({ title: 'Error', description: notifError.message, variant: 'destructive' });
        return;
      }
      // Decrement pendingSaleCredit by 1 in sellerDetails table
      await supabase
        .from('sellerDetails')
        .update({ pendingSaleCredit: (sellerDetails.pendingSaleCredit || 1) - 1 })
        .eq('userId', user.id);
      setPendingSaleCredit((prev) => (prev !== null ? prev - 1 : null));
      toast({ title: 'Sale Live!', description: 'Notification sent to buyers in your area.' });
      setDiscountItems('');
    } else {
      toast({ title: 'No Buyers', description: 'No buyers found in your area.', variant: 'destructive' });
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

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck /> Pincode
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsEditingPincode(!isEditingPincode)}>
                <Edit size={20} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input 
                id="pincode" 
                value={pincode} 
                onChange={e => setPincode(e.target.value)} 
                disabled={!isEditingPincode}
                placeholder="Enter 6-digit pincode"
                maxLength={6}
              />
            </div>
            {isEditingPincode && <Button className="w-full" onClick={handleUpdatePincode}>Save Pincode</Button>}
          </CardContent>
        </Card>

        {userType === 'buyer' && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="font-semibold">Credits Remaining</div>
              <div className="text-2xl font-bold text-primary">{credits !== null ? credits : '...'}</div>
            </CardContent>
          </Card>
        )}

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

        {userType === 'seller' && (
          <Card>
            <CardHeader>
              <CardTitle>Make Sale Live</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="discount-items">Discount Items</Label>
                <span className="text-sm font-semibold">Available Sale Credit: {pendingSaleCredit !== null ? pendingSaleCredit : '...'}</span>
              </div>
              <Input
                id="discount-items"
                value={discountItems}
                onChange={e => setDiscountItems(e.target.value)}
                placeholder="e.g., Paracetamol, Vitamin C, ..."
                disabled={pendingSaleCredit === 0}
              />
              <Button
                className="w-full"
                onClick={pendingSaleCredit === 0 ? () => setShowBuyCreditPopup(true) : handleMakeSaleLive}
              >
                {pendingSaleCredit === 0 ? 'Buy Credit' : 'Make Sale Live'}
              </Button>
              {showBuyCreditPopup && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                  <div className="bg-white p-6 rounded-lg shadow-lg text-center space-y-4">
                    <div className="text-lg font-semibold">Contact : 9888386663</div>
                    <Button onClick={() => setShowBuyCreditPopup(false)} className="w-full">Close</Button>
                  </div>
                </div>
              )}
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

        {/* Contact Us Cell */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="font-semibold">Contact Us</div>
            <div className="text-sm text-muted-foreground">For any query contact us on mail or phone</div>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=lazysolutions9@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-2 mt-1"
            >
              <Mail size={16} /> lazysolutions9@gmail.com
            </a>
            <a
              href="tel:+919888386663"
              className="text-blue-600 hover:underline flex items-center gap-2 mt-1"
            >
              <Phone size={16} /> +91 9888386663
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProfilePage; 