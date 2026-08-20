import React from 'react';
import { Menu, Bot, PlusCircle, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenAI: () => void;
  onQuickBill: () => void;
  currentTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenAI,
  onQuickBill,
  currentTab,
}) => {
  const { user } = useAuth();

  const titleMap: Record<string, { title: string; desc: string }> = {
    dashboard: { title: 'Executive Dashboard', desc: 'Real-time sales, collections & AI insights' },
    billing: { title: 'Smart Billing POS', desc: 'Fast phone identification, item cart & credit generation' },
    customers: { title: 'Customer Management', desc: 'Customer profiles, credit tracking & complete 360° ledger' },
    products: { title: 'Products & Services', desc: 'Manage inventory, services & price change alerts' },
    payments: { title: 'Payments & Collections', desc: 'Record customer settlements and update balances' },
    transactions: { title: 'Financial Transactions Feed', desc: 'Immutable source-of-truth ledger log' },
    ai: { title: 'AI Business Assistant', desc: 'Conversational agent executing operations via tool calling' },
    campaigns: { title: 'Campaign & Marketing Studio', desc: 'Broadcast offers, AI personalized deals & price notifications' },
    messages: { title: 'Twilio WhatsApp & SMS Center', desc: 'Message delivery history and live simulator' },
    reports: { title: 'Reports & Credit Aging', desc: 'Deep financial analytics & customer aging breakdown' },
    settings: { title: 'Business Profile & Settings', desc: 'Manage store parameters, currencies & automated schedules' },
  };

  const currentInfo = titleMap[currentTab] || { title: 'SmartBiz AI', desc: 'AI-Powered Business Assistant' };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3.5 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base lg:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            {currentInfo.title}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">{currentInfo.desc}</p>
        </div>
      </div>

      {/* Right section: Quick Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onQuickBill}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">New Bill</span>
        </button>

        <button
          onClick={onOpenAI}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 border border-indigo-400/30"
        >
          <Bot className="w-4 h-4 text-indigo-200" />
          <span>Ask AI</span>
        </button>
      </div>
    </header>
  );
};
