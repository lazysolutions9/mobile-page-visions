import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Edit, LogOut, KeyRound, Store, ShieldCheck } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

interface ProfilePageProps {
  userType: 'buyer' | 'seller';
  onLogout: () => void;
  onChangePassword: () => void;
  onSellWithUs?: () => void;
}

const ProfilePage = ({ userType, onLogout, onChangePassword, onSellWithUs }: ProfilePageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [shopName, setShopName] = useState('My Awesome Shop');
  const [shopAddress, setShopAddress] = useState('123 Market St, San Francisco');
  const [mobileNotes, setMobileNotes] = useState('555-123-4567');
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <ChangePasswordModal isOpen={isChangePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User /> Username
          </CardTitle>
          <CardDescription>johndoe</CardDescription>
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
              <Input id="mobileNotes" value={mobileNotes} onChange={e => setMobileNotes(e.target.value)} disabled={!isEditing} />
            </div>
            {isEditing && <Button className="w-full" onClick={() => setIsEditing(false)}>Save</Button>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-2">
          {userType === 'buyer' && (
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={onSellWithUs}>
              <Store /> Sell With Us
            </Button>
          )}
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setChangePasswordOpen(true)}>
            <KeyRound /> Change Password
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-red-500" onClick={onLogout}>
            <LogOut /> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage; 