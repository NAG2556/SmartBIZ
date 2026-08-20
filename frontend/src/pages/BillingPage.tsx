import React from 'react';
import { SmartPOS } from '../components/billing/SmartPOS';

interface BillingPageProps {
  onOpenNewCustomerModal: (prefilledPhone: string) => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ onOpenNewCustomerModal }) => {
  return (
    <div className="space-y-4">
      <SmartPOS onOpenNewCustomerModal={onOpenNewCustomerModal} />
    </div>
  );
};
