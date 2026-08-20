import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, UserPlus, Phone, CreditCard, Sparkles, Check } from 'lucide-react';
import { Customer } from '../../types';
import { customerApi } from '../../services/api';
import { Badge } from '../common/Badge';

interface PhoneLookupCardProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onOpenNewCustomerModal: (prefilledPhone: string) => void;
  currency?: string;
}

export const PhoneLookupCard: React.FC<PhoneLookupCardProps> = ({
  selectedCustomer,
  onSelectCustomer,
  onOpenNewCustomerModal,
  currency = '₹',
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);

  useEffect(() => {
    // Auto search when user types 10 digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      handleSearch(cleaned);
    } else if (cleaned.length === 0) {
      setSearched(false);
      if (!selectedCustomer) {
        onSelectCustomer(null);
      }
    }
  }, [phoneNumber]);

  const handleSearch = async (phoneToSearch?: string) => {
    const p = phoneToSearch || phoneNumber;
    if (!p.trim()) return;
    setLoading(true);
    try {
      const res = await customerApi.lookup(p);
      setSearched(true);
      if (res.found && res.customer) {
        onSelectCustomer(res.customer);
      } else {
        onSelectCustomer(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPhoneNumber('');
    setSearched(false);
    onSelectCustomer(null);
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-indigo-400" />
          Step 1: Enter Customer Phone Number
        </label>
        {selectedCustomer && (
          <button
            onClick={handleClear}
            className="text-[11px] font-semibold text-slate-400 hover:text-rose-400 transition-colors"
          >
            Change Customer
          </button>
        )}
      </div>

      {/* Phone Input Box */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <span className="text-xs font-bold text-slate-400">+91</span>
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. 9876543210"
            maxLength={13}
            className="w-full pl-12 pr-10 py-3 bg-slate-900 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white font-mono text-base placeholder-slate-500 transition-all"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleSearch()}
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>Identify</span>
        </button>
      </div>

      {/* STATE 1: CUSTOMER FOUND (Highlight Card) */}
      {selectedCustomer && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/40 animate-float-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-white">{selectedCustomer.name}</h4>
                  <Badge variant="success">Customer Found ✓</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>ID: <strong className="text-indigo-300 font-mono">{selectedCustomer.customer_serial_number}</strong></span>
                  <span>•</span>
                  <span>📞 {selectedCustomer.phone}</span>
                </div>
              </div>
            </div>

            {/* Outstanding Balance Badge */}
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Outstanding Balance</div>
              <div className={`text-lg font-black font-mono ${selectedCustomer.outstanding_balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {currency}{selectedCustomer.outstanding_balance.toLocaleString()}
              </div>
              {selectedCustomer.outstanding_balance > 0 && (
                <span className="text-[10px] text-amber-400/80 font-medium">Pending Credit</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: CUSTOMER NOT FOUND */}
      {searched && !selectedCustomer && !loading && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 animate-float-in flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">Customer Not Found</div>
              <div className="text-[11px] text-slate-400">No previous records exist for phone {phoneNumber}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenNewCustomerModal(phoneNumber)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add New Customer</span>
          </button>
        </div>
      )}
    </div>
  );
};
