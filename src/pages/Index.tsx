import { useState } from 'react';
import LoginPage from '../components/LoginPage';
import SignupPage from '../components/SignupPage';
import RoleSelection from '../components/RoleSelection';
import SellerSetup from '../components/SellerSetup';
import SellerDashboard from '../components/SellerDashboard';
import BuyerDashboard from '../components/BuyerDashboard';
import SetNewPasswordPage from '../components/SetNewPasswordPage';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'signup' | 'roleSelection' | 'sellerSetup' | 'sellerDashboard' | 'buyerDashboard' | 'setNewPassword'>('login');
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | null>(null);

  const handleSignupComplete = () => {
    setCurrentPage('roleSelection');
  };

  const handleLogout = () => {
    setCurrentPage('login');
    setUserRole(null);
  };

  const handleForgotPasswordContinue = () => {
    setCurrentPage('setNewPassword');
  };

  const handleSellWithUs = () => {
    setUserRole('seller');
    setCurrentPage('sellerSetup');
  };

  const handleRoleSelected = (role: 'buyer' | 'seller') => {
    console.log('User selected role:', role);
    setUserRole(role);
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
        <LoginPage 
          onSwitchToSignup={() => setCurrentPage('signup')}
          onForgotPasswordContinue={handleForgotPasswordContinue}
        />
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
        <SellerDashboard 
          onLogout={handleLogout}
          onSwitchToBuyer={() => setCurrentPage('buyerDashboard')}
        />
      )}
      {currentPage === 'buyerDashboard' && (
        <BuyerDashboard 
          onLogout={handleLogout}
          userRole={userRole}
          onSwitchToSeller={userRole === 'seller' ? () => setCurrentPage('sellerDashboard') : undefined}
          onSellWithUs={handleSellWithUs}
        />
      )}
      {currentPage === 'setNewPassword' && (
        <SetNewPasswordPage onPasswordSet={() => setCurrentPage('login')} />
      )}
    </div>
  );
};

export default Index;
