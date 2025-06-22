
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
    <div className="flex flex-col min-h-screen px-6 py-8 max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-12 mt-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p className="text-gray-600">Sign up to get started</p>
      </div>

      {/* Signup Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="signup-username" className="text-sm font-medium text-gray-700">
              Username
            </Label>
            <Input
              id="signup-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              placeholder="Choose a username"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Signup Button */}
          <Button
            onClick={handleSignup}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            Sign Up
          </Button>
        </div>
      </div>

      {/* Switch to Login */}
      <div className="text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
