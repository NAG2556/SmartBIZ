import React, { useState, useEffect } from 'react';
import { CreditCard, PlusCircle, Search, CheckCircle2, User } from 'lucide-react';
import { Payment } from '../types';
import { paymentApi } from '../services/api';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    loadPayments();
  }, [refreshKey]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentApi.list({ limit: 100 });
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-white">Payment Collections & Receipts</h3>
          <p className="text-xs text-slate-400">All customer payment inflows (Cash, UPI, Card, NetBanking)</p>
        </div>

        <button
          type="button"
          onClick={() => setIsRecordModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Customer Payment</span>
        </button>
      </div>

      {/* Payments History Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading payments history...
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No Payments Recorded Yet"
            description="When customers pay cash or UPI for pending balances or invoices, they will appear here."
            actionLabel="+ Record First Payment"
            onAction={() => setIsRecordModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Remarks / Note</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      PAY-#{p.id.toString().padStart(4, '0')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{p.customer_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.customer_serial} • 📞 {p.customer_phone}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="success">{p.payment_method}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {p.notes || 'Payment against customer ledger'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                      +{currency}{p.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono">
                      {new Date(p.payment_date).toLocaleDateString()} {new Date(p.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};
