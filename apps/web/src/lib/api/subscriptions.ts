import { apiClient, unwrapApiResponse } from './client';

export type SubscriptionPlan = {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice?: number;
  features: string[] | unknown;
  maxStrategies: number;
  maxCopyTrades: number;
  prioritySupport: boolean;
};

export const subscriptionsApi = {
  async getPlans() {
    const res = await apiClient.get('/subscriptions/plans');
    return unwrapApiResponse<SubscriptionPlan[]>(res.data);
  },

  async getCurrent() {
    const res = await apiClient.get('/subscriptions/current');
    return unwrapApiResponse<any>(res.data);
  },

  async checkout(planId: string, billingCycle: 'MONTHLY' | 'ANNUAL' = 'MONTHLY') {
    const res = await apiClient.post('/subscriptions/checkout', {
      planId,
      billingCycle,
    });
    return unwrapApiResponse<{
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }>(res.data);
  },

  async cancel() {
    const res = await apiClient.post('/subscriptions/cancel');
    return unwrapApiResponse<any>(res.data);
  },

  async getInvoices() {
    const res = await apiClient.get('/subscriptions/invoices');
    return unwrapApiResponse<any[]>(res.data);
  },

  async getPayments() {
    const res = await apiClient.get('/subscriptions/payments');
    return unwrapApiResponse<{ payments: any[]; total: number }>(res.data);
  },
};
