import axios from 'axios';
import {
  User, Customer, CustomerLookupResponse, Product, Bill, Payment,
  Transaction, CustomerLedgerSummary, DashboardStats, SalesTrendItem,
  TopCustomerItem, TopProductItem, MessageLog, Campaign,
  PersonalizedOfferCustomer, PriceHikeNotificationPreview, AIChatResponse
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartbiz_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear and optionally redirect
      localStorage.removeItem('smartbiz_token');
      localStorage.removeItem('smartbiz_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', credentials);
    return data;
  },
  register: async (payload: any) => {
    const { data } = await api.post<{ access_token: string; token_type: string; user: User }>('/auth/register', payload);
    return data;
  },
  getProfile: async () => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
  updateProfile: async (payload: Partial<User>) => {
    const { data } = await api.put<User>('/auth/me', payload);
    return data;
  },
};

export const customerApi = {
  lookup: async (phone: string) => {
    const { data } = await api.get<CustomerLookupResponse>(`/customers/lookup?phone=${encodeURIComponent(phone)}`);
    return data;
  },
  list: async (params?: { search?: string; only_outstanding?: boolean }) => {
    const { data } = await api.get<Customer[]>('/customers/', { params });
    return data;
  },
  create: async (customer: { name: string; phone: string; email?: string; address?: string; notes?: string }) => {
    const { data } = await api.post<Customer>('/customers/', customer);
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get<Customer>(`/customers/${id}`);
    return data;
  },
  update: async (id: number, payload: Partial<Customer>) => {
    const { data } = await api.put<Customer>(`/customers/${id}`, payload);
    return data;
  },
  delete: async (id: number) => {
    const { data } = await api.delete(`/customers/${id}`);
    return data;
  },
  getLedger: async (id: number) => {
    const { data } = await api.get<CustomerLedgerSummary>(`/customers/${id}/ledger`);
    return data;
  },
};

export const productApi = {
  list: async (params?: { category?: string; search?: string }) => {
    const { data } = await api.get<Product[]>('/products/', { params });
    return data;
  },
  listCategories: async () => {
    const { data } = await api.get<string[]>('/products/categories');
    return data;
  },
  create: async (product: Partial<Product>) => {
    const { data } = await api.post<Product>('/products/', product);
    return data;
  },
  update: async (id: number, product: Partial<Product>) => {
    const { data } = await api.put<Product>(`/products/${id}`, product);
    return data;
  },
  delete: async (id: number) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },
  previewPriceHike: async (id: number, newPrice: number) => {
    const { data } = await api.get<PriceHikeNotificationPreview>(`/products/${id}/price-hike-preview?new_price=${newPrice}`);
    return data;
  },
};

export const billingApi = {
  create: async (bill: any) => {
    const { data } = await api.post<Bill>('/bills/', bill);
    return data;
  },
  list: async (params?: { customer_id?: number; limit?: number }) => {
    const { data } = await api.get<Bill[]>('/bills/', { params });
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get<Bill>(`/bills/${id}`);
    return data;
  },
};

export const paymentApi = {
  record: async (payment: { customer_id: number; amount: number; payment_method?: string; notes?: string }) => {
    const { data } = await api.post<Payment>('/payments/', payment);
    return data;
  },
  list: async (params?: { customer_id?: number; limit?: number }) => {
    const { data } = await api.get<Payment[]>('/payments/', { params });
    return data;
  },
};

export const transactionApi = {
  list: async (params?: { customer_id?: number; transaction_type?: string; limit?: number }) => {
    const { data } = await api.get<Transaction[]>('/transactions/', { params });
    return data;
  },
};

export const analyticsApi = {
  getDashboard: async () => {
    const { data } = await api.get<DashboardStats>('/analytics/dashboard');
    return data;
  },
  getSalesTrends: async (days: number = 7) => {
    const { data } = await api.get<SalesTrendItem[]>(`/analytics/sales-trends?days=${days}`);
    return data;
  },
  getTopCustomers: async (limit: number = 5) => {
    const { data } = await api.get<TopCustomerItem[]>(`/analytics/top-customers?limit=${limit}`);
    return data;
  },
  getTopProducts: async (limit: number = 5) => {
    const { data } = await api.get<TopProductItem[]>(`/analytics/top-products?limit=${limit}`);
    return data;
  },
  getCreditAging: async () => {
    const { data } = await api.get<any[]>('/analytics/credit-aging');
    return data;
  },
};

export const aiApi = {
  chat: async (message: string) => {
    const { data } = await api.post<AIChatResponse>('/ai/chat', { message });
    return data;
  },
};

export const campaignApi = {
  list: async () => {
    const { data } = await api.get<Campaign[]>('/campaigns/');
    return data;
  },
  create: async (campaign: any) => {
    const { data } = await api.post<Campaign>('/campaigns/', campaign);
    return data;
  },
  getPersonalizedOffers: async (discount: number = 10) => {
    const { data } = await api.get<PersonalizedOfferCustomer[]>(`/campaigns/ai-personalized-offers?discount=${discount}`);
    return data;
  },
};

export const messagingApi = {
  send: async (payload: { recipient_phone: string; message_content: string; channel?: string; customer_id?: number; recipient_name?: string }) => {
    const { data } = await api.post<MessageLog>('/messages/send', payload);
    return data;
  },
  getLogs: async (params?: { customer_id?: number; channel?: string; limit?: number }) => {
    const { data } = await api.get<MessageLog[]>('/messages/logs', { params });
    return data;
  },
};

export const reminderApi = {
  triggerNow: async () => {
    const { data } = await api.post<any>('/reminders/trigger-now');
    return data;
  },
};

export default api;
