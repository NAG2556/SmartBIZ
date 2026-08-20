import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const RootContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-bold text-white tracking-wide">Initializing SmartBiz AI...</div>
        <div className="text-xs text-slate-500 mt-1">Connecting to business ledger</div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onNavigateLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateRegister={() => setAuthView('register')} />;
  }

  return <AppLayout />;
};

export const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
