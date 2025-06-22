
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface RoleSelectionProps {
  onRoleSelected: (role: 'buyer' | 'seller') => void;
}

const RoleSelection = ({ onRoleSelected }: RoleSelectionProps) => {
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelected(selectedRole);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-12 mt-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h1>
        <p className="text-gray-600">How would you like to use our platform?</p>
      </div>

      {/* Role Selection */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 flex-1">
        <div className="space-y-4">
          {/* Buyer Option */}
          <button
            onClick={() => setSelectedRole('buyer')}
            className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedRole === 'buyer'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-900 mb-2">
                I am a buyer
              </div>
              <p className="text-gray-600 text-sm">
                I want to browse and purchase products
              </p>
            </div>
          </button>

          {/* Seller Option */}
          <button
            onClick={() => setSelectedRole('seller')}
            className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedRole === 'seller'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-900 mb-2">
                I am a seller
              </div>
              <p className="text-gray-600 text-sm">
                I want to list and sell my products
              </p>
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <div className="mt-8">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
