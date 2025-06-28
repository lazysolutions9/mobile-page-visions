import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from './ui/use-toast';

interface SetNewPasswordPageProps {
  username: string;
  onPasswordSet: () => void;
}

const SetNewPasswordPage = ({ username, onPasswordSet }: SetNewPasswordPageProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSavePassword = async () => {
    if (!password || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in both password fields.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('user')
      .update({ password })
      .eq('username', username);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: 'Could not update password.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Success', description: 'Password updated successfully.' });
    onPasswordSet();
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="text-center my-12">
        <h1 className="text-3xl font-bold">Set New Password</h1>
        <p className="text-muted-foreground">Please enter your new password below.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <Button onClick={handleSavePassword} className="w-full" disabled={loading}>
          {loading ? 'Saving...' : 'Save New Password'}
        </Button>
      </div>
    </div>
  );
};

export default SetNewPasswordPage; 