import React, { useState } from 'react';
import { Customer } from '../types';
import { CustomerList } from '../components/customers/CustomerList';
import { CustomerModal } from '../components/customers/CustomerModal';
import { CustomerLedgerModal } from '../components/customers/CustomerLedgerModal';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';

export const CustomersPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [ledgerCustomerId, setLedgerCustomerId] = useState<number | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
  };

  const handleOpenLedger = (id: number) => {
    setLedgerCustomerId(id);
  };

  const handleOpenPayment = (cust: Customer) => {
    setPaymentCustomer(cust);
  };

  return (
    <div className="space-y-6">
      <CustomerList
        key={refreshKey}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenEditModal={handleOpenEdit}
        onOpenLedgerModal={handleOpenLedger}
        onOpenRecordPaymentModal={handleOpenPayment}
      />

      {/* Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={isAddModalOpen || !!editingCustomer}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {/* Customer 360 Ledger Modal */}
      <CustomerLedgerModal
        isOpen={!!ledgerCustomerId}
        onClose={() => setLedgerCustomerId(null)}
        customerId={ledgerCustomerId}
        onOpenRecordPayment={(cust) => setPaymentCustomer(cust)}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!paymentCustomer}
        onClose={() => setPaymentCustomer(null)}
        customer={paymentCustomer}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};
