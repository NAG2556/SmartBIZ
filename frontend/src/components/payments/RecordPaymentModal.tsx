import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { Customer, Payment } from '../../types';
import { customerApi, paymentApi } from '../../services/api';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSuccess: (payment: Payment) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const currency = user?.currency || '₹';

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      if (customer) {
        setSelectedCustomerId(customer.id);
        setAmount(customer.outstanding_balance > 0 ? customer.outstanding_balance.toString() : '');
      } else {
        setAmount('');
      }
    }
  }, [isOpen, customer]);

  const loadCustomers = async () => {
    try {
      const list = await customerApi.list();
      setCustomers(list);
    } catch (err) {
      console.error(err);
    }
  };

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId) || customer;
  const prevBalance = currentCustomer?.outstanding_balance || 0;
  const payAmount = parseFloat(amount) || 0;
  const newBalance = Math.round((prevBalance - payAmount) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || payAmount <= 0) {
      showToast('Please select a customer and enter a valid amount', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payment = await paymentApi.record({
        customer_id: selectedCustomerId,
        amount: payAmount,
        payment_method: paymentMethod,
        notes: notes || undefined,
      });

      showToast(
        `Payment of ${currency}${payment.amount.toLocaleString()} received from ${payment.customer_name}!`,
        'success'
      );
      onSuccess(payment);
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to record payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Customer Payment"
      subtitle="Reconcile customer ledger and update balance"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Select */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Customer *
          </label>
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => setSelectedCustomerId(parseInt(e.target.value))}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:border-indigo-500 font-medium"
          >
            <option value="">-- Select Customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.customer_serial_number}) — Due: {currency}{c.outstanding_balance.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* Current Balance Preview */}
        {currentCustomer && (
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Balance</span>
              <span className={`font-mono font-bold text-sm ${prevBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {currency}{prevBalance.toLocaleString()}
              </span>
            </div>
            {prevBalance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(prevBalance.toString())}
                className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold rounded-lg transition-all"
              >
                Clear Full Balance
              </button>
            )}
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Payment Amount Received ({currency}) *
          </label>
          <input
            type="number"
            step="any"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-base font-mono font-bold text-white focus:border-indigo-500"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500 font-medium"
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
            <option value="Card">Credit / Debit Card</option>
            <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        {/* Live Balance Impact */}
        {currentCustomer && payAmount > 0 && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs animate-float-in">
            <div className="text-slate-400">
              <span>{currency}{prevBalance.toFixed(2)}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
            <div className="text-emerald-400 font-bold">
              <span>Paid: {currency}{payAmount.toFixed(2)}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
            <div className="font-extrabold text-white">
              <span>New Due: <strong className="text-amber-400">{currency}{newBalance.toFixed(2)}</strong></span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Payment Reference / Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. UPI Ref #12345678, Settled for groceries"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedCustomerId || payAmount <= 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Recording...' : 'Record Payment'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
