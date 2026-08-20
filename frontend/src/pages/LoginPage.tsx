import React, { useState } from 'react';
import { Sparkles, Lock, Mail, ArrowRight, Store, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface LoginPageProps {
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateRegister }) => {
  const { login, demoLogin, loading } = useAuth();
  const { showToast } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please enter your email and password', 'warning');
      return;
    }
    try {
      await login({ email: email.trim(), password: password.trim() });
      showToast('Welcome back to SmartBiz AI!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Invalid login credentials', 'error');
    }
  };

  const handleDemoLogin = async () => {
    try {
      await demoLogin();
      showToast('Logged in as Ravi Sharma (Sharma SuperStore)', 'success');
    } catch (err: any) {
      showToast('Demo login failed. Make sure backend is running.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-xl shadow-indigo-600/30 text-white mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            SmartBiz <span className="text-indigo-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            AI-Powered Business Assistant for Small & Medium Enterprises
          </p>
        </div>

        {/* Demo Fast Login Banner */}
        <div className="glass-card p-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/30 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-xs font-bold text-indigo-300 block">Instant Demo Access</span>
            <span className="text-[11px] text-slate-400 block">Preloaded with realistic customers, bills & ledgers</span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            1-Click Demo Login
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 shadow-2xl">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              Email or Phone
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ravi@smartbiz.ai or 9876500001"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors"
            >
              Don't have an account? <span className="text-indigo-400 font-bold underline">Register Store</span>
            </button>
          </div>
        </form>

        <div className="text-center text-[11px] text-slate-500 italic">
          “Your business remembers everything, so you don't have to.”
        </div>
      </div>
    </div>
  );
};
