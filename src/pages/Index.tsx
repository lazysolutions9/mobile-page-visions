import { useState, useEffect } from 'react';
import LoginPage from '../components/LoginPage';
import SignupPage from '../components/SignupPage';
import RoleSelection from '../components/RoleSelection';
import SellerSetup from '../components/SellerSetup';
import SellerDashboard from '../components/SellerDashboard';
import BuyerDashboard from '../components/BuyerDashboard';
import SetNewPasswordPage from '../components/SetNewPasswordPage';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '../lib/supabase';

const Index = () => {
  const { toast } = useToast();
  const [loggedInUser, setLoggedInUser] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<'login' | 'signup' | 'roleSelection' | 'sellerSetup' | 'setNewPassword' | 'buyerDashboard' | 'sellerDashboard'>('login');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setLoggedInUser(user);
        if (user.isSeller === null) {
          setCurrentPage('roleSelection');
        } else if (user.isSeller) {
          setCurrentPage('sellerDashboard');
        } else {
          setCurrentPage('buyerDashboard');
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('loggedInUser');
    }
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (user: any) => {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    setLoggedInUser(user);
    if (user.isSeller === null) {
      setCurrentPage('roleSelection');
    } else if (user.isSeller) {
      setCurrentPage('sellerDashboard');
    } else {
      setCurrentPage('buyerDashboard');
    }
  };

  const handleSignupComplete = (user: any) => {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    setLoggedInUser(user);
    setCurrentPage('roleSelection');
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setLoggedInUser(null);
    setCurrentPage('login');
  };

  const handleForgotPasswordContinue = () => {
    setCurrentPage('setNewPassword');
  };

  const handleSellWithUs = () => {
    setCurrentPage('sellerSetup');
  };

  const handleRoleSelected = async (role: 'buyer' | 'seller') => {
    const isSeller = role === 'seller';
    const { data, error } = await supabase
      .from('user')
      .update({ isSeller })
      .eq('id', loggedInUser.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Database Error",
        description: "Could not update your role. Please check your database permissions and try again.",
        variant: "destructive",
      });
    } else {
      localStorage.setItem('loggedInUser', JSON.stringify(data));
      setLoggedInUser(data);
      if (isSeller) {
        setCurrentPage('sellerSetup');
      } else {
        setCurrentPage('buyerDashboard');
      }
    }
  };

  const handleSellerSetupComplete = () => {
    setCurrentPage('sellerDashboard');
  };

  const renderContent = () => {
    if (isInitializing) {
      return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    if (!loggedInUser) {
      switch (currentPage) {
        case 'signup':
          return <SignupPage onSwitchToLogin={() => setCurrentPage('login')} onSignupComplete={handleSignupComplete} />;
        case 'setNewPassword':
          return <SetNewPasswordPage onPasswordSet={() => setCurrentPage('login')} />;
        default:
          return <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignup={() => setCurrentPage('signup')} onForgotPasswordContinue={() => setCurrentPage('setNewPassword')} />;
      }
    }

    // User is logged in
    switch (currentPage) {
      case 'roleSelection':
        return <RoleSelection onRoleSelected={handleRoleSelected} />;
      case 'sellerSetup':
        return <SellerSetup user={loggedInUser} onSetupComplete={handleSellerSetupComplete} />;
      case 'sellerDashboard':
        return <SellerDashboard user={loggedInUser} onLogout={handleLogout} onSwitchToBuyer={() => setCurrentPage('buyerDashboard')} />;
      case 'buyerDashboard':
        return <BuyerDashboard user={loggedInUser} onLogout={handleLogout} onSellWithUs={() => setCurrentPage('sellerSetup')} onSwitchToSeller={() => setCurrentPage('sellerDashboard')} />;
      default:
        // Fallback to a default view based on role if currentPage is somehow invalid
        if (loggedInUser.isSeller) {
          return <SellerDashboard user={loggedInUser} onLogout={handleLogout} onSwitchToBuyer={() => setCurrentPage('buyerDashboard')} />;
        }
        return <BuyerDashboard user={loggedInUser} onLogout={handleLogout} onSellWithUs={() => setCurrentPage('sellerSetup')} onSwitchToSeller={() => setCurrentPage('sellerDashboard')} />;
    }
  };

  return (
    <div className="h-full">
      {renderContent()}
    </div>
  );
};

export default Index;
