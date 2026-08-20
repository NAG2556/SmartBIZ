import React, { useState, useEffect } from 'react';
import { History, ArrowDownRight, ArrowUpRight, Search, Filter } from 'lucide-react';
import { Transaction } from '../types';
import { transactionApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    loadTransactions();
  }, [filterType]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionApi.list({
        transaction_type: filterType === 'ALL' ? undefined : filterType,
        limit: 200,
      });
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Chips */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-white">Global Business Ledger (Source of Truth)</h3>
          <p className="text-xs text-slate-400">
            Immutable log of all purchases, bills, credit generations, and customer payments
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Ledger Logs
          </button>
          <button
            type="button"
            onClick={() => setFilterType('PURCHASE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'PURCHASE' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Purchases & Invoices
          </button>
          <button
            type="button"
            onClick={() => setFilterType('PAYMENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'PAYMENT' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Payments & Collections
          </button>
        </div>
      </div>

      {/* Global Ledger Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading transaction ledger...
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Transactions Found"
            description="All billing purchases and payments will record transparent ledger entries here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description / Reference</th>
                  <th className="py-3 px-4 text-right">Debit (Purchase)</th>
                  <th className="py-3 px-4 text-right">Credit (Payment)</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(t.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {t.customer_name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {t.transaction_type === 'PURCHASE' ? (
                          <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <Badge variant={t.transaction_type === 'PURCHASE' ? 'warning' : 'success'}>
                          {t.transaction_type}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {t.description || 'Ledger entry'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400 font-bold">
                      {t.debit > 0 ? `+${currency}${t.debit.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                      {t.credit > 0 ? `-${currency}${t.credit.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-white">
                      {currency}{t.running_balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
