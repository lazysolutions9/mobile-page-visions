import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignupPageProps {
  onSwitchToLogin: () => void;
  onSignupComplete: () => void;
}

const SignupPage = ({ onSwitchToLogin, onSignupComplete }: SignupPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = () => {
    console.log('Signup attempted with:', { username, password });
    // Handle signup logic here
    // For now, we'll simulate successful signup
    onSignupComplete();
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="text-center my-12">
        <h1 className="text-3xl font-bold">Create Account</h1>
        <p className="text-muted-foreground">Sign up to get started</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="signup-username">Username</Label>
          <Input
            id="signup-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
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

        <Button onClick={handleSignup} className="w-full">
          Sign Up
        </Button>
      </div>

      <div className="mt-auto text-center pt-6">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Button variant="link" onClick={onSwitchToLogin} className="p-0 h-auto">
            Login
          </Button>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
