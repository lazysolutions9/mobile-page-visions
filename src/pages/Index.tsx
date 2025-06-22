
import { useState } from 'react';
import LoginPage from '../components/LoginPage';
import SignupPage from '../components/SignupPage';
import RoleSelection from '../components/RoleSelection';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'signup' | 'roleSelection'>('login');

  const handleSignupComplete = () => {
    setCurrentPage('roleSelection');
  };

  const handleRoleSelected = (role: 'buyer' | 'seller') => {
    console.log('User selected role:', role);
    // Handle role selection - you can navigate to the main app or save the role
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {currentPage === 'login' && (
        <LoginPage onSwitchToSignup={() => setCurrentPage('signup')} />
      )}
      {currentPage === 'signup' && (
        <SignupPage 
          onSwitchToLogin={() => setCurrentPage('login')}
          onSignupComplete={handleSignupComplete}
        />
      )}
      {currentPage === 'roleSelection' && (
        <RoleSelection onRoleSelected={handleRoleSelected} />
      )}
    </div>
  );
};

export default Index;
