import { apiClient } from './client';

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export const affiliatesApi = {
  async getMine() {
    const res = await apiClient.get('/affiliates/me');
    return unwrap<any>(res.data);
  },

  async getDashboard() {
    const res = await apiClient.get('/affiliates/dashboard');
    return unwrap<any>(res.data);
  },

  async trackClick(code: string) {
    const res = await apiClient.post(`/affiliates/click/${code}`);
    return unwrap<any>(res.data);
  },

  async capture(code: string) {
    const res = await apiClient.post(`/affiliates/capture/${code}`);
    return unwrap<any>(res.data);
  },
};
