export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  business_name: string;
  business_type: string;
  business_phone?: string;
  business_email?: string;
  address?: string;
  currency: string;
  invoice_prefix: string;
  sms_reminder_enabled: boolean;
  whatsapp_reminder_enabled: boolean;
  min_reminder_amount: number;
  reminder_time: string;
  created_at: string;
}

export interface Customer {
  id: number;
  customer_serial_number: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  outstanding_balance: number;
  total_purchases: number;
  total_payments: number;
  bills_count: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerLookupResponse {
  found: boolean;
  customer: Customer | null;
  normalized_phone: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  selling_price: number;
  cost_price?: number;
  stock_quantity: number;
  unit: string;
  is_service: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillItem {
  id?: number;
  product_id?: number;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Bill {
  id: number;
  bill_number: string;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_serial?: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  credit_amount: number;
  payment_method: string;
  notes?: string;
  bill_date: string;
  created_at: string;
  items: BillItem[];
  previous_balance?: number;
  new_outstanding_balance?: number;
}

export interface Payment {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_serial?: string;
  bill_id?: number;
  amount: number;
  payment_method: string;
  notes?: string;
  payment_date: string;
  created_at: string;
  previous_balance?: number;
  new_balance?: number;
}

export interface Transaction {
  id: number;
  customer_id: number;
  customer_name?: string;
  bill_id?: number;
  bill_number?: string;
  payment_id?: number;
  transaction_type: 'PURCHASE' | 'PAYMENT' | 'OPENING_BALANCE' | 'ADJUSTMENT' | string;
  amount: number;
  debit: number;
  credit: number;
  running_balance: number;
  description?: string;
  transaction_date: string;
  created_at: string;
}

export interface CustomerLedgerSummary {
  customer: Customer;
  total_purchases: number;
  total_payments: number;
  current_outstanding_balance: number;
  transactions: Transaction[];
}

export interface DashboardStats {
  today_sales: number;
  today_collection: number;
  today_credit: number;
  total_outstanding_credit: number;
  total_customers: number;
  total_products: number;
  total_transactions_count: number;
  currency: string;
}

export interface SalesTrendItem {
  date: string;
  sales: number;
  collection: number;
  credit: number;
}

export interface TopCustomerItem {
  customer_id: number;
  name: string;
  phone: string;
  serial_number: string;
  total_spent: number;
  outstanding_balance: number;
  bills_count: number;
}

export interface TopProductItem {
  product_id?: number;
  name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

export interface MessageLog {
  id: number;
  customer_id?: number;
  recipient_phone: string;
  recipient_name?: string;
  message_type: string;
  channel: 'WHATSAPP' | 'SMS';
  message_content: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
  provider_message_id?: string;
  created_at: string;
  sent_at: string;
}

export interface Campaign {
  id: number;
  title: string;
  campaign_type: string;
  channel: string;
  audience_type: string;
  message_template: string;
  discount_percentage?: number;
  target_product_id?: number;
  target_product_name?: string;
  status: string;
  recipient_count: number;
  created_at: string;
}

export interface PersonalizedOfferCustomer {
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  frequent_product_name: string;
  frequent_product_id?: number;
  purchase_count: number;
  suggested_discount: number;
  personalized_message: string;
}

export interface PriceHikeNotificationPreview {
  product_name: string;
  old_price: number;
  new_price: number;
  target_customers_count: number;
  customers: { id: number; name: string; phone: string }[];
  sample_message: string;
}

export interface AIToolExecuted {
  tool_name: string;
  tool_input: Record<string, any>;
  tool_output: any;
}

export interface AIChatResponse {
  reply: string;
  tools_executed: AIToolExecuted[];
  action_type?: string;
  action_data?: any;
}
