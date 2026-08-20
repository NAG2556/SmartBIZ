import React from 'react';
import { Printer, Share2, CheckCircle2, MessageSquare, Download, X } from 'lucide-react';
import { Bill } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, bill }) => {
  const { user } = useAuth();
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!bill.customer_phone) return;
    const phone = bill.customer_phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('91') && phone.length === 12 ? phone : `91${phone}`;

    const text = `🧾 *Invoice from ${user?.business_name}*\n` +
      `Invoice No: *${bill.bill_number}*\n` +
      `Customer: ${bill.customer_name}\n` +
      `---------------------------\n` +
      `Total Amount: *${user?.currency || '₹'}${bill.total_amount.toLocaleString()}*\n` +
      `Amount Paid: *${user?.currency || '₹'}${bill.amount_paid.toLocaleString()}*\n` +
      (bill.credit_amount > 0 ? `Credit Due: *${user?.currency || '₹'}${bill.credit_amount.toLocaleString()}*\n` : '') +
      `---------------------------\n` +
      `New Outstanding Balance: *${user?.currency || '₹'}${bill.new_outstanding_balance?.toLocaleString() || '0'}*\n\n` +
      `Thank you for your business!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice #${bill.bill_number}`} maxWidth="2xl">
      <div id="printable-invoice" className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-slate-100">
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-5 mb-5">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">{user?.business_name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user?.address || 'Retail & Services'}</p>
            <p className="text-xs text-slate-400">Phone: {user?.business_phone || user?.phone || 'N/A'}</p>
          </div>
          <div className="text-right">
            <Badge variant="success">PAID & GENERATED ✓</Badge>
            <div className="text-xs font-mono text-slate-400 mt-2">
              Date: {new Date(bill.bill_date).toLocaleDateString()}
            </div>
            <div className="text-xs font-mono text-indigo-400 font-bold">
              Invoice #{bill.bill_number}
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 mb-5 flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Billed To</span>
            <span className="text-sm font-bold text-white block mt-0.5">{bill.customer_name}</span>
            <span className="text-slate-400 block">{bill.customer_serial} • 📞 {bill.customer_phone}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Mode</span>
            <span className="font-semibold text-indigo-300">{bill.payment_method}</span>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-xs text-left mb-5">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <th className="py-2.5">Item Description</th>
              <th className="py-2.5 text-center">Qty</th>
              <th className="py-2.5 text-right">Unit Price</th>
              <th className="py-2.5 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {bill.items?.map((item, idx) => (
              <tr key={idx} className="text-slate-200">
                <td className="py-2.5 font-medium">{item.product_name}</td>
                <td className="py-2.5 text-center font-mono">{item.quantity} {item.unit}</td>
                <td className="py-2.5 text-right font-mono">{user?.currency}{item.unit_price.toFixed(2)}</td>
                <td className="py-2.5 text-right font-mono font-bold">{user?.currency}{item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Summary Breakdown */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono">{user?.currency}{bill.subtotal.toFixed(2)}</span>
          </div>
          {bill.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount</span>
              <span className="font-mono">-{user?.currency}{bill.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-white border-t border-slate-800 pt-2">
            <span>Total Bill Amount</span>
            <span className="font-mono text-base">{user?.currency}{bill.total_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Amount Paid Now</span>
            <span className="font-mono text-emerald-400 font-bold">{user?.currency}{bill.amount_paid.toFixed(2)}</span>
          </div>
          {bill.credit_amount > 0 && (
            <div className="flex justify-between text-amber-400 font-semibold">
              <span>Credit Due from this Bill</span>
              <span className="font-mono">+{user?.currency}{bill.credit_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-bold text-indigo-300 border-t border-slate-800/60 pt-2">
            <span>Customer New Outstanding Balance</span>
            <span className="font-mono text-amber-400">{user?.currency}{bill.new_outstanding_balance?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {bill.notes && (
          <div className="mt-4 text-[11px] text-slate-400 italic">
            Note: {bill.notes}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          onClick={handlePrint}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>

        <button
          onClick={handleShareWhatsApp}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Share on WhatsApp</span>
        </button>
      </div>
    </Modal>
  );
};
