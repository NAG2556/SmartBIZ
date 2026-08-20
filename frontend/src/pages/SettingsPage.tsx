import React, { useState, useEffect } from 'react';
import { Settings, Store, Clock, ShieldCheck, CheckCircle2, Bot, MessageSquare } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Badge } from '../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useNotification();

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('General Store');
  const [phone, setPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [smsReminders, setSmsReminders] = useState(true);
  const [minAmount, setMinAmount] = useState('100');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setBusinessName(user.business_name || '');
      setBusinessType(user.business_type || 'General Store');
      setPhone(user.business_phone || user.phone || '');
      setBusinessEmail(user.business_email || user.email || '');
      setAddress(user.address || '');
      setCurrency(user.currency || '₹');
      setInvoicePrefix(user.invoice_prefix || 'INV');
      setWhatsappReminders(user.whatsapp_reminder_enabled ?? true);
      setSmsReminders(user.sms_reminder_enabled ?? true);
      setMinAmount(user.min_reminder_amount?.toString() || '100');
      setReminderTime(user.reminder_time || '09:00');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        business_name: businessName.trim(),
        business_type: businessType.trim(),
        business_phone: phone.trim() || undefined,
        business_email: businessEmail.trim() || undefined,
        address: address.trim() || undefined,
        currency: currency.trim() || '₹',
        invoice_prefix: invoicePrefix.trim().toUpperCase() || 'INV',
        whatsapp_reminder_enabled: whatsappReminders,
        sms_reminder_enabled: smsReminders,
        min_reminder_amount: parseFloat(minAmount) || 100,
        reminder_time: reminderTime,
      });

      updateUser(updated);
      showToast('Store settings saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      {/* 1. STORE PROFILE */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Store className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Business Profile & Store Identity
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Business / Store Name *
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Business Type (Industry-Independent)
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500 font-medium"
            >
              <option value="General Store">General / Departmental Store</option>
              <option value="Grocery Store">Grocery & Kirana Store</option>
              <option value="Electronics & Mobile">Electronics & Mobile Shop</option>
              <option value="Clothing & Apparel">Clothing & Apparel Boutique</option>
              <option value="Hardware & Sanitary">Hardware & Sanitary Store</option>
              <option value="Stationery & Books">Stationery & Book Store</option>
              <option value="Services & Repair">Repair & Maintenance Services</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Business Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white font-mono focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Business Email
            </label>
            <input
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Store Address (Printed on Invoices)
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Store Currency Symbol
            </label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="₹"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono font-bold text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Invoice Prefix
            </label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="INV"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono font-bold text-white focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 2. AUTOMATED REMINDERS CONFIGURATION */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Clock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Automated Morning Payment Reminders
          </h3>
        </div>

        <p className="text-xs text-slate-400">
          The background scheduler scans your customer balances every morning and dispatches polite payment reminder messages automatically.
        </p>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappReminders}
              onChange={(e) => setWhatsappReminders(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 focus:ring-0"
            />
            <span className="text-xs text-white font-medium">
              Enable Daily WhatsApp Payment Reminders
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={smsReminders}
              onChange={(e) => setSmsReminders(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 focus:ring-0"
            />
            <span className="text-xs text-white font-medium">
              Enable Daily SMS Payment Reminders
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Minimum Outstanding Due for Reminder ({currency})
            </label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Daily Reminder Dispatch Time
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono text-white focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="submit"
        disabled={saving}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
      >
        <CheckCircle2 className="w-4 h-4" />
        <span>{saving ? 'Saving...' : 'Save Store Configuration'}</span>
      </button>
    </form>
  );
};
