import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { Customer } from '../../types';
import { customerApi } from '../../services/api';
import { Modal } from '../common/Modal';
import { useNotification } from '../../context/NotificationContext';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  prefilledPhone?: string;
  onSuccess: (savedCustomer: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  prefilledPhone = '',
  onSuccess,
}) => {
  const { showToast } = useNotification();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
    } else {
      setName('');
      setPhone(prefilledPhone || '');
      setEmail('');
      setAddress('');
      setNotes('');
    }
  }, [customer, prefilledPhone, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast('Name and Phone number are required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (customer) {
        const updated = await customerApi.update(customer.id, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        showToast('Customer profile updated', 'success');
        onSuccess(updated);
      } else {
        const created = await customerApi.create({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        showToast(`Customer ${created.name} (${created.customer_serial_number}) registered!`, 'success');
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save customer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer Details' : 'Register New Customer'}
      subtitle={customer ? `ID: ${customer.customer_serial_number}` : 'Add customer to business directory'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Customer Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ravi Kumar"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white font-mono focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. ravi@example.com"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Address / Location
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Indiranagar, Bengaluru"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Internal Store Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Regular monthly buyer"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:border-indigo-500"
          />
        </div>

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
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            {submitting ? 'Saving...' : customer ? 'Update Profile' : 'Create Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
