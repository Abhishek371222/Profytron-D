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
  trialEligible?: boolean;
};

export type BillingCenterPayload = {
  current: any;
  plans: SubscriptionPlan[];
  invoices: Array<{
    id: string;
    invoiceNumber?: string;
    issuedAt?: string;
    amount?: number;
    tax?: number;
    total?: number;
    currency?: string;
    description?: string;
  }>;
  payments: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    currency: string;
    status: string;
    invoiceId?: string;
    invoiceNumber?: string;
    canDownloadInvoice?: boolean;
  }>;
  paymentsTotal: number;
  refunds: {
    refundedPayments: any[];
    walletClawbacks: any[];
  };
  summary: {
    spentThisMonth: number;
    spentThisYear: number;
    completedCount: number;
  };
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

  async getBillingCenter() {
    const res = await apiClient.get('/subscriptions/billing-center');
    return unwrapApiResponse<BillingCenterPayload>(res.data);
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

  async startTrial(planId: string) {
    const res = await apiClient.post('/subscriptions/trial/start', { planId });
    return unwrapApiResponse<any>(res.data);
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

  async getRefunds() {
    const res = await apiClient.get('/subscriptions/refunds');
    return unwrapApiResponse<{
      refundedPayments: any[];
      walletClawbacks: any[];
    }>(res.data);
  },

  /** Authenticated PDF download via API client (blob). */
  async downloadInvoicePdf(invoiceId: string): Promise<Blob> {
    const res = await apiClient.get(
      `/subscriptions/invoices/${encodeURIComponent(invoiceId)}/download`,
      { responseType: 'blob' },
    );
    return res.data as Blob;
  },
};
