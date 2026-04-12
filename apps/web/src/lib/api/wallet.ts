import { apiClient } from './client';

export interface WalletBalance {
  total: number;
  available: number;
  pendingIn: number;
  pendingOut: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  status: string;
  direction: 'IN' | 'OUT';
  amount: number;
  balanceAfter: number;
  description?: string | null;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  nextCursor: string | null;
  total: number;
}

export interface WalletTransactionsParams {
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

export const walletApi = {
  async getBalance() {
    const res = await apiClient.get<WalletBalance>('/wallet/balance');
    return res.data;
  },

  async getTransactions(params?: WalletTransactionsParams) {
    const res = await apiClient.get<WalletTransactionsResponse>('/wallet/transactions', {
      params,
    });
    return res.data;
  },

  async initiateDeposit(data: { amount: number }) {
    const res = await apiClient.post<{
      clientSecret: string;
      paymentIntentId: string;
      transactionId: string;
    }>('/wallet/deposit', data);
    return res.data;
  },

  async initiateWithdrawal(data: { amount: number; bankAccount?: string; otp?: string }) {
    const res = await apiClient.post('/wallet/withdraw', data);
    return res.data;
  },

  async getStatement(year: number, month: number) {
    const res = await apiClient.get(`/wallet/statement/${year}/${month}`, {
      responseType: 'blob',
    });
    return res.data as Blob;
  },

  async getTransaction(id: string) {
    const res = await apiClient.get<WalletTransaction>(`/wallet/transaction/${id}`);
    return res.data;
  },
};
