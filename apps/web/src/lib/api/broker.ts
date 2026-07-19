import { apiClient, unwrapApiResponse } from './client';

export const brokerApi = {
  async connectBroker(data: any) {
    const res = await apiClient.post('/broker/accounts/connect', data, {
      timeout: 90_000,
    });
    return unwrapApiResponse<any>(res.data);
  },

  async getBrokerAccounts() {
    const res = await apiClient.get('/broker/accounts');
    return unwrapApiResponse<any>(res.data);
  },

  async refreshBrokerAccount(accountId: string) {
    const res = await apiClient.post(
      `/broker/accounts/${accountId}/refresh`,
      {},
      { timeout: 45_000 },
    );
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

  async shareAccount(accountId: string, email: string) {
    const res = await apiClient.post(`/broker/accounts/${accountId}/share`, {
      email,
    });
    return unwrapApiResponse<{ shared: boolean; shareId: string; status: string }>(
      res.data,
    );
  },

  async listShares() {
    const res = await apiClient.get('/broker/shares');
    return unwrapApiResponse<{ owned: any[]; received: any[] }>(res.data);
  },

  async acceptShare(shareId: string) {
    const res = await apiClient.post(`/broker/shares/${shareId}/accept`);
    return unwrapApiResponse<any>(res.data);
  },

  async declineShare(shareId: string) {
    const res = await apiClient.post(`/broker/shares/${shareId}/decline`);
    return unwrapApiResponse<any>(res.data);
  },

  async revokeShare(shareId: string) {
    const res = await apiClient.delete(`/broker/shares/${shareId}`);
    return unwrapApiResponse<any>(res.data);
  },
};
