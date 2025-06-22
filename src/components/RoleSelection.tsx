import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col h-full p-6">
      <div className="text-center my-12">
        <h1 className="text-3xl font-bold">Choose Your Role</h1>
        <p className="text-muted-foreground">How would you like to use our platform?</p>
      </div>

      <div className="space-y-4">
        <Card
          onClick={() => setSelectedRole('buyer')}
          className={cn(
            'cursor-pointer transition-all',
            selectedRole === 'buyer' && 'border-primary ring-2 ring-primary'
          )}
        >
          <CardHeader>
            <CardTitle>I am a buyer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              I want to browse and purchase products
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setSelectedRole('seller')}
          className={cn(
            'cursor-pointer transition-all',
            selectedRole === 'seller' && 'border-primary ring-2 ring-primary'
          )}
        >
          <CardHeader>
            <CardTitle>I am a seller</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              I want to list and sell my products
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-auto pt-6">
        <Button
          onClick={handleContinue}
          disabled={!selectedRole}
          className="w-full"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default RoleSelection;
