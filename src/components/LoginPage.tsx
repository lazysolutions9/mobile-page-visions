import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onForgotPasswordContinue: () => void;
}

const LoginPage = ({ onSwitchToSignup, onForgotPasswordContinue }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleLogin = () => {
    console.log('Login attempted with:', { username, password });
    // Handle login logic here
  };

  const handleContinue = () => {
    setForgotPasswordOpen(false);
    onForgotPasswordContinue();
  }

  return (
    <div className="flex flex-col h-full p-6">
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onOpenChange={setForgotPasswordOpen} onContinue={handleContinue} />
      <div className="text-center my-12">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">Sign in to continue</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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

        <div className="text-right">
          <Button variant="link" className="p-0 h-auto" onClick={() => setForgotPasswordOpen(true)}>
            Forgot Password?
          </Button>
        </div>

        <Button onClick={handleLogin} className="w-full">
          Login
        </Button>
      </div>

      <div className="mt-auto text-center pt-6">
        <p className="text-muted-foreground">
          New User?{' '}
          <Button variant="link" onClick={onSwitchToSignup} className="p-0 h-auto">
            Sign Up
          </Button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
