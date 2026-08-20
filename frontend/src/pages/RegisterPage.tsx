import React, { useState } from 'react';
import { Sparkles, Lock, Mail, Store, User, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface RegisterPageProps {
  onNavigateLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateLogin }) => {
  const { register, loading } = useAuth();
  const { showToast } = useNotification();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Grocery Store');
  const [currency, setCurrency] = useState('₹');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !businessName.trim()) {
      showToast('Please fill all required fields', 'warning');
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password: password.trim(),
        business_name: businessName.trim(),
        business_type: businessType,
        currency: currency.trim() || '₹',
      });
      showToast(`Store ${businessName} registered successfully!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Registration failed', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]">
      <div className="w-full max-w-lg space-y-6 my-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-xl shadow-indigo-600/30 text-white mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Register on SmartBiz <span className="text-indigo-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400">
            Set up your store, customer ledger, and AI business assistant in seconds
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Owner Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white font-mono focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@store.com"
                  className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Business / Store Name *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Patel SuperMarket"
                  className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Business Category
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500 font-medium"
              >
                <option value="Grocery Store">Grocery / Kirana Store</option>
                <option value="Electronics Store">Electronics & Mobile Store</option>
                <option value="Clothing Store">Clothing & Apparel Store</option>
                <option value="Hardware Store">Hardware & Sanitary Store</option>
                <option value="Stationery Store">Stationery & Book Store</option>
                <option value="Service Business">Repair & Maintenance Services</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-3"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Store Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors"
            >
              Already registered? <span className="text-indigo-400 font-bold underline">Sign In</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
