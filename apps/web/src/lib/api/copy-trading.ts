import { apiClient, unwrapApiResponse } from './client';

export const copyTradingApi = {
  async getMySubscriptions() {
    const res = await apiClient.get('/trading/subscriptions');
    return unwrapApiResponse<any[]>(res.data);
  },

  async updateSubscription(id: string, data: { lotMultiplier?: number; isPaused?: boolean }) {
    const res = await apiClient.patch(`/trading/subscriptions/${id}`, data);
    return unwrapApiResponse<any>(res.data);
  },

  async getMasterStatus() {
    const res = await apiClient.get('/trading/master-status');
    return unwrapApiResponse<any>(res.data);
  },
};
