import { apiClient, unwrapApiResponse } from './client';

export const brokerApi = {
  async connectBroker(data: any) {
    // Real MetaAPI provisioning + broker connection can take up to ~60s for a
    // fresh demo account, so override the default 30s client timeout here.
    const res = await apiClient.post('/broker/accounts/connect', data, {
      timeout: 90_000,
    });
    return unwrapApiResponse<any>(res.data);
  },

  async getBrokerAccounts() {
    const res = await apiClient.get('/broker/accounts');
    return unwrapApiResponse<any>(res.data);
  },

  async disconnectBroker(accountId: string) {
    const res = await apiClient.delete(`/broker/accounts/${accountId}`, {
      timeout: 15_000,
    });
    return unwrapApiResponse<any>(res.data);
  },

  async testConnection(accountId: string) {
    const res = await apiClient.post(`/broker/accounts/${accountId}/test`);
    return unwrapApiResponse<any>(res.data);
  },

  async rotateBridgeToken(accountId: string) {
    const res = await apiClient.post(
      `/broker/accounts/${accountId}/bridge-token`,
    );
    return unwrapApiResponse<any>(res.data);
  },
};
