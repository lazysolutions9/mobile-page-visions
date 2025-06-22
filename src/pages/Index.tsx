
import { useState } from 'react';
import LoginPage from '../components/LoginPage';
import SignupPage from '../components/SignupPage';
import RoleSelection from '../components/RoleSelection';
import SellerSetup from '../components/SellerSetup';
import SellerDashboard from '../components/SellerDashboard';
import BuyerDashboard from '../components/BuyerDashboard';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'signup' | 'roleSelection' | 'sellerSetup' | 'sellerDashboard' | 'buyerDashboard'>('login');

  const handleSignupComplete = () => {
    setCurrentPage('roleSelection');
  };

  const handleRoleSelected = (role: 'buyer' | 'seller') => {
    console.log('User selected role:', role);
    if (role === 'seller') {
      setCurrentPage('sellerSetup');
    } else {
      setCurrentPage('buyerDashboard');
    }
  };

  const handleSellerSetupComplete = () => {
    console.log('Seller setup completed');
    setCurrentPage('sellerDashboard');
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
      {currentPage === 'sellerSetup' && (
        <SellerSetup onSetupComplete={handleSellerSetupComplete} />
      )}
      {currentPage === 'sellerDashboard' && (
        <SellerDashboard />
      )}
      {currentPage === 'buyerDashboard' && (
        <BuyerDashboard />
      )}
    </div>
  );
};

export default Index;
