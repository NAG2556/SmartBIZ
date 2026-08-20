import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  Users,
  CreditCard,
  History,
  Bot,
  PlusCircle,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { DashboardStats, SalesTrendItem, TopCustomerItem, Transaction } from '../types';
import { analyticsApi, transactionApi, reminderApi } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { SalesTrendsChart } from '../components/analytics/SalesTrendsChart';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenRecordPayment: () => void;
  onOpenNewCustomer: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenRecordPayment,
  onOpenNewCustomer,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const currency = user?.currency || '₹';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<SalesTrendItem[]>([]);
  const [topDebtors, setTopDebtors] = useState<TopCustomerItem[]>([]);
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggeringReminders, setTriggeringReminders] = useState<boolean>(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsData, trendsData, debtorsData, txData] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getSalesTrends(7),
        analyticsApi.getTopCustomers(5),
        transactionApi.list({ limit: 5 }),
      ]);
      setStats(statsData);
      setTrends(trendsData);
      setTopDebtors(debtorsData.filter((d) => d.outstanding_balance > 0));
      setRecentTxs(txData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerMorningReminders = async () => {
    setTriggeringReminders(true);
    try {
      const res = await reminderApi.triggerNow();
      showToast(
        `Morning reminders dispatched to ${res.reminders_sent} customer(s)! Total credit reminded: ${currency}${res.total_outstanding_reminded.toLocaleString()}`,
        'success'
      );
    } catch (err) {
      showToast('Failed to trigger reminders', 'error');
    } finally {
      setTriggeringReminders(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. AI BUSINESS INSIGHTS HERO BANNER */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-indigo-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                AI Business Agent Active
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              Good day, {user?.name}! Here is your business pulse.
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Today you generated <strong className="text-emerald-400 font-mono">{currency}{stats?.today_sales.toLocaleString() || '0'}</strong> in sales.
              {stats && stats.total_outstanding_credit > 0 && (
                <> You have <strong className="text-amber-400 font-mono">{currency}{stats.total_outstanding_credit.toLocaleString()}</strong> in outstanding customer credit.</>
              )}
            </p>
          </div>

          {/* Quick Action Button in Banner */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleTriggerMorningReminders}
              disabled={triggeringReminders}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>{triggeringReminders ? 'Dispatching...' : 'Dispatch Daily Reminders'}</span>
            </button>

            <button
              onClick={() => onNavigate('billing')}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Open POS Billing</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={`${currency}${stats?.today_sales.toLocaleString() || '0'}`}
          subtitle="New invoices today"
          icon={Receipt}
          colorScheme="indigo"
          onClick={() => onNavigate('billing')}
        />

        <StatCard
          title="Today's Collection"
          value={`${currency}${stats?.today_collection.toLocaleString() || '0'}`}
          subtitle="Cash & UPI collected"
          icon={CreditCard}
          colorScheme="emerald"
          onClick={() => onNavigate('payments')}
        />

        <StatCard
          title="Outstanding Credit"
          value={`${currency}${stats?.total_outstanding_credit.toLocaleString() || '0'}`}
          subtitle="Money customers owe you"
          icon={TrendingUp}
          colorScheme="amber"
          onClick={() => onNavigate('customers')}
        />

        <StatCard
          title="Active Customers"
          value={stats?.total_customers.toString() || '0'}
          subtitle={`${stats?.total_products || 0} catalog products`}
          icon={Users}
          colorScheme="sky"
          onClick={() => onNavigate('customers')}
        />
      </div>

      {/* 3. CHARTS & DEBTORS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart (7 cols) */}
        <div className="lg:col-span-7 glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <SalesTrendsChart data={trends} />
        </div>

        {/* Right Top Debtors List (5 cols) */}
        <div className="lg:col-span-5 glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Customers with Pending Credit
              </h4>
              <button
                onClick={() => onNavigate('customers')}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
              >
                View All
              </button>
            </div>

            {topDebtors.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center">
                🎉 No customers currently owe money!
              </div>
            ) : (
              <div className="space-y-2.5">
                {topDebtors.map((d) => (
                  <div
                    key={d.customer_id}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white">{d.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {d.serial_number} • 📞 {d.phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-amber-400 text-sm">
                        {currency}{d.outstanding_balance.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400">Due balance</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Outstanding Credit:</span>
            <span className="font-mono font-black text-amber-400">
              {currency}{stats?.total_outstanding_credit.toLocaleString() || '0'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. RECENT TRANSACTIONS FEED */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            Recent Business Transactions (Source of Truth)
          </h4>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
          >
            View Full Ledger
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No transactions recorded yet.</div>
        ) : (
          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            {recentTxs.map((tx) => (
              <div key={tx.id} className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl border ${
                      tx.transaction_type === 'PURCHASE'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {tx.transaction_type === 'PURCHASE' ? <Receipt className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{tx.customer_name}</span>
                      <Badge variant={tx.transaction_type === 'PURCHASE' ? 'warning' : 'success'}>
                        {tx.transaction_type}
                      </Badge>
                      {tx.bill_number && <span className="text-[10px] text-slate-400 font-mono">{tx.bill_number}</span>}
                    </div>
                    <div className="text-[11px] text-slate-400">{tx.description}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold font-mono text-white">
                    {tx.transaction_type === 'PURCHASE' ? (
                      <span className="text-amber-400">+{currency}{tx.debit.toFixed(2)}</span>
                    ) : (
                      <span className="text-emerald-400">-{currency}{tx.credit.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Bal: {currency}{tx.running_balance.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
