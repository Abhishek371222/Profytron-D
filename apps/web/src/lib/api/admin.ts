import { apiClient } from './client';

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export const adminApi = {
  async getDashboardMetrics() {
    const res = await apiClient.get('/admin/dashboard');
    return unwrap<any>(res.data);
  },

  async getDashboard() {
    return this.getDashboardMetrics();
  },

  async getStats() {
    const res = await apiClient.get('/admin/stats');
    return unwrap<any>(res.data);
  },

  async getUsers() {
    const res = await apiClient.get('/admin/users');
    return unwrap<any[]>(res.data) ?? [];
  },

  async getUserById(id: string) {
    const res = await apiClient.get(`/admin/users/${id}`);
    return unwrap<any>(res.data);
  },

  async getUserDetail(id: string) {
    return this.getUserById(id);
  },

  async updateUserStatus(id: string, isSuspended: boolean) {
    const res = await apiClient.patch(`/admin/users/${id}/status`, { isSuspended });
    return unwrap<any>(res.data);
  },

  async suspendUser(id: string) {
    return this.updateUserStatus(id, true);
  },

  async unsuspendUser(id: string) {
    return this.updateUserStatus(id, false);
  },

  async getVerificationQueue() {
    const res = await apiClient.get('/admin/verifications');
    return unwrap<any[]>(res.data) ?? [];
  },

  async handleVerification(id: string, approve: boolean, notes?: string) {
    const res = await apiClient.post(`/admin/verifications/${id}/handle`, { approve, notes });
    return unwrap<any>(res.data);
  },

  async approveStrategy(id: string, notes?: string) {
    return this.handleVerification(id, true, notes);
  },

  async rejectStrategy(id: string, notes?: string) {
    return this.handleVerification(id, false, notes);
  },

  async getPaymentsOverview() {
    const res = await apiClient.get('/admin/payments/overview');
    return unwrap<any>(res.data);
  },

  async getPaymentOverview() {
    return this.getPaymentsOverview();
  },

  async getSystemMetrics() {
    const res = await apiClient.get('/admin/system/metrics');
    return unwrap<any>(res.data);
  },

  async getSystemHealth() {
    const dashboard = await this.getDashboardMetrics();
    return {
      systemHealth: dashboard?.systemHealth ?? 'UNKNOWN',
      activeServices: dashboard?.activeServices ?? {},
      lastUpdated: dashboard?.lastUpdated ?? new Date().toISOString(),
    };
  },
};
