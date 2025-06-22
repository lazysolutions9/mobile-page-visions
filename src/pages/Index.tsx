
import { useState } from 'react';
import LoginPage from '../components/LoginPage';
import SignupPage from '../components/SignupPage';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {currentPage === 'login' ? (
        <LoginPage onSwitchToSignup={() => setCurrentPage('signup')} />
      ) : (
        <SignupPage onSwitchToLogin={() => setCurrentPage('login')} />
      )}
    </div>
  );
};

export default Index;
