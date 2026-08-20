import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { DashboardPage } from '../../pages/DashboardPage';
import { BillingPage } from '../../pages/BillingPage';
import { CustomersPage } from '../../pages/CustomersPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { PaymentsPage } from '../../pages/PaymentsPage';
import { TransactionsPage } from '../../pages/TransactionsPage';
import { AIAssistantPage } from '../../pages/AIAssistantPage';
import { CampaignsPage } from '../../pages/CampaignsPage';
import { MessagesPage } from '../../pages/MessagesPage';
import { ReportsPage } from '../../pages/ReportsPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { CustomerModal } from '../customers/CustomerModal';
import { RecordPaymentModal } from '../payments/RecordPaymentModal';
import { Customer } from '../../types';

export const AppLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Global modal state
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState<boolean>(false);

  const handleOpenNewCustomer = (phone: string = '') => {
    setNewCustomerPhone(phone);
    setIsNewCustomerModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenAI={() => setCurrentTab('ai')}
          onQuickBill={() => setCurrentTab('billing')}
          currentTab={currentTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-float-in">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentTab}
              onOpenRecordPayment={() => setIsRecordPaymentModalOpen(true)}
              onOpenNewCustomer={() => handleOpenNewCustomer()}
            />
          )}
          {currentTab === 'billing' && (
            <BillingPage onOpenNewCustomerModal={handleOpenNewCustomer} />
          )}
          {currentTab === 'customers' && <CustomersPage />}
          {currentTab === 'products' && <ProductsPage />}
          {currentTab === 'payments' && <PaymentsPage />}
          {currentTab === 'transactions' && <TransactionsPage />}
          {currentTab === 'ai' && <AIAssistantPage />}
          {currentTab === 'campaigns' && <CampaignsPage />}
          {currentTab === 'messages' && <MessagesPage />}
          {currentTab === 'reports' && <ReportsPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global New Customer Modal */}
      <CustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => {
          setIsNewCustomerModalOpen(false);
          setNewCustomerPhone('');
        }}
        prefilledPhone={newCustomerPhone}
        onSuccess={() => {
          // Handled inside component
        }}
      />

      {/* Global Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => setIsRecordPaymentModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
};
