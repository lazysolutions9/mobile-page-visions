
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginPageProps {
  onSwitchToSignup: () => void;
}

const LoginPage = ({ onSwitchToSignup }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    console.log('Login attempted with:', { username, password });
    // Handle login logic here
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-12 mt-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-600">Sign in to continue</p>
      </div>

      {/* Login Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
              placeholder="Enter your username"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
                placeholder="Enter your password"
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

          {/* Forgot Password */}
          <div className="text-right">
            <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            Login
          </Button>
        </div>
      </div>

      {/* Switch to Signup */}
      <div className="text-center">
        <p className="text-gray-600">
          New User?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
