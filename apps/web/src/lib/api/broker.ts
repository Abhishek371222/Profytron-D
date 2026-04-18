import { apiClient, unwrapApiResponse } from './client';

export const brokerApi = {
  async connectBroker(data: any) {
    const res = await apiClient.post('/broker/accounts/connect', data);
    return unwrapApiResponse<any>(res.data);
  },

  async getBrokerAccounts() {
    const res = await apiClient.get('/broker/accounts');
    return unwrapApiResponse<any>(res.data);
  },

  async disconnectBroker(accountId: string) {
    const res = await apiClient.delete(`/broker/accounts/${accountId}`);
    return unwrapApiResponse<any>(res.data);
  },

  async testConnection(accountId: string) {
    const res = await apiClient.post(`/broker/accounts/${accountId}/test`);
    return unwrapApiResponse<any>(res.data);
  }
};
