import { apiClient } from './client';

export const brokerApi = {
  async connectBroker(data: any) {
    const res = await apiClient.post('/broker/accounts/connect', data);
    return res.data;
  },

  async getBrokerAccounts() {
    const res = await apiClient.get('/broker/accounts');
    return res.data;
  },

  async disconnectBroker(accountId: string) {
    const res = await apiClient.delete(`/broker/accounts/${accountId}`);
    return res.data;
  },

  async testConnection(accountId: string) {
    const res = await apiClient.post(`/broker/accounts/${accountId}/test`);
    return res.data;
  }
};
