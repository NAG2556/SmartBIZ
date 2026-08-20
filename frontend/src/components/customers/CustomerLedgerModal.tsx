import React, { useState, useEffect } from 'react';
import { CreditCard, MessageSquare, History, CheckCircle2, ArrowDownRight, ArrowUpRight, PlusCircle, RefreshCw } from 'lucide-react';
import { Customer, CustomerLedgerSummary } from '../../types';
import { customerApi, messagingApi } from '../../services/api';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number | null;
  onOpenRecordPayment: (customer: Customer) => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  isOpen,
  onClose,
  customerId,
  onOpenRecordPayment,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const currency = user?.currency || '₹';

  const [ledger, setLedger] = useState<CustomerLedgerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      loadLedger();
    }
  }, [isOpen, customerId]);

  const loadLedger = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const data = await customerApi.getLedger(customerId);
      setLedger(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!ledger) return;
    setSendingReminder(true);
    try {
      const msgBody =
        `Good morning ${ledger.customer.name},\n\n` +
        `This is a gentle reminder from *${user?.business_name}* regarding your outstanding balance of *${currency}${ledger.current_outstanding_balance.toLocaleString()}*.\n\n` +
        `Please make the payment at your convenience.\n\nThank you!`;

      await messagingApi.send({
        customer_id: ledger.customer.id,
        recipient_phone: ledger.customer.phone,
        recipient_name: ledger.customer.name,
        message_content: msgBody,
        channel: 'WHATSAPP',
      });

      showToast(`Reminder dispatched to ${ledger.customer.name} on WhatsApp`, 'success');
    } catch (err) {
      showToast('Failed to send reminder', 'error');
    } finally {
      setSendingReminder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ledger ? `Ledger: ${ledger.customer.name}` : 'Customer Ledger'}
      subtitle={ledger ? `Serial: ${ledger.customer.customer_serial_number} • 📞 ${ledger.customer.phone}` : ''}
      maxWidth="3xl"
    >
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading ledger transactions...
        </div>
      ) : ledger ? (
        <div className="space-y-6">
          {/* Top KPI Cards for this Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Purchases
              </span>
              <span className="text-lg font-mono font-bold text-white block mt-1">
                {currency}{ledger.total_purchases.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Payments
              </span>
              <span className="text-lg font-mono font-bold text-emerald-400 block mt-1">
                {currency}{ledger.total_payments.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                Current Outstanding Balance
              </span>
              <span className="text-xl font-mono font-black text-amber-400 block mt-1">
                {currency}{ledger.current_outstanding_balance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-300">
              Transactions Count: <strong className="text-white font-mono">{ledger.transactions.length}</strong>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(ledger.customer);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>

              {ledger.current_outstanding_balance > 0 && (
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{sendingReminder ? 'Sending...' : 'Send WhatsApp Reminder'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Complete Financial Ledger Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type / Description</th>
                    <th className="py-2.5 px-3 text-right">Debit (Purchase)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Payment)</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ledger.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No financial transactions recorded for this customer yet.
                      </td>
                    </tr>
                  ) : (
                    ledger.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {new Date(tx.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            {tx.transaction_type === 'PURCHASE' ? (
                              <ArrowDownRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span>{tx.transaction_type}</span>
                            {tx.bill_number && (
                              <Badge variant="neutral">{tx.bill_number}</Badge>
                            )}
                          </div>
                          {tx.description && (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">{tx.description}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-semibold">
                          {tx.debit > 0 ? `${currency}${tx.debit.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                          {tx.credit > 0 ? `${currency}${tx.credit.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          {currency}{tx.running_balance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
