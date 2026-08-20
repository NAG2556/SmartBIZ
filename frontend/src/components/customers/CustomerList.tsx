import React, { useState, useEffect } from 'react';
import { Search, UserPlus, FileText, CreditCard, MessageSquare, Edit3, Trash2, Phone, AlertTriangle, Users } from 'lucide-react';
import { Customer } from '../../types';
import { customerApi, messagingApi } from '../../services/api';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface CustomerListProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (customer: Customer) => void;
  onOpenLedgerModal: (customerId: number) => void;
  onOpenRecordPaymentModal: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onOpenLedgerModal,
  onOpenRecordPaymentModal,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const currency = user?.currency || '₹';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [onlyOutstanding, setOnlyOutstanding] = useState<boolean>(false);

  useEffect(() => {
    loadCustomers();
  }, [search, onlyOutstanding]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerApi.list({
        search: search.trim() || undefined,
        only_outstanding: onlyOutstanding,
      });
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReminder = async (customer: Customer) => {
    if (customer.outstanding_balance <= 0) {
      showToast(`${customer.name} has no outstanding balance`, 'info');
      return;
    }
    try {
      const msg =
        `Good morning ${customer.name},\n\n` +
        `This is a friendly payment reminder from *${user?.business_name}* for your pending balance of *${currency}${customer.outstanding_balance.toLocaleString()}*.\n\n` +
        `Please settle at your convenience. Thank you!`;

      await messagingApi.send({
        customer_id: customer.id,
        recipient_phone: customer.phone,
        recipient_name: customer.name,
        message_content: msg,
        channel: 'WHATSAPP',
      });

      // Launch real WhatsApp Web / App directly
      const cleanPhone = customer.phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone : (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone);
      window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');

      showToast(`Reminder logged & opened in WhatsApp for ${customer.name}!`, 'success');
    } catch (err) {
      showToast('Failed to send reminder', 'error');
    }
  };


  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or CUST-ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500"
          />
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOnlyOutstanding(!onlyOutstanding)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              onlyOutstanding
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900 text-slate-400 border-slate-700/80 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Only Outstanding</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading customer records...
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Customers Found"
            description="Start registering customers or search with a different name or phone number."
            actionLabel="+ Register First Customer"
            onAction={onOpenAddModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Serial ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Total Purchases</th>
                  <th className="py-3 px-4 text-right">Total Payments</th>
                  <th className="py-3 px-4 text-right">Outstanding Due</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {c.customer_serial_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{c.name}</div>
                      {c.address && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.address}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      📞 {c.phone}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300 font-medium">
                      {currency}{c.total_purchases.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-medium">
                      {currency}{c.total_payments.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold">
                      <span className={c.outstanding_balance > 0 ? 'text-amber-400' : 'text-slate-400'}>
                        {currency}{c.outstanding_balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Ledger View */}
                        <button
                          type="button"
                          onClick={() => onOpenLedgerModal(c.id)}
                          title="View Complete Financial Ledger"
                          className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Record Payment */}
                        <button
                          type="button"
                          onClick={() => onOpenRecordPaymentModal(c)}
                          title="Record Customer Payment"
                          className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Reminder */}
                        {c.outstanding_balance > 0 && (
                          <button
                            type="button"
                            onClick={() => handleQuickReminder(c)}
                            title="Send WhatsApp Reminder"
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/20 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(c)}
                          title="Edit Customer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
