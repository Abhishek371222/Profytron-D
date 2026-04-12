import { apiClient } from './client';

// Inline until workspace types are resolved
type User = any;

export const authApi = {
  async register(data: any) {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  async verifyEmail(data: { email: string; otp: string }) {
    const res = await apiClient.post<{ accessToken: string; user: User }>('/auth/verify-email', data);
    return res.data;
  },

  async login(data: any) {
    const res = await apiClient.post<{ accessToken: string; user: User }>('/auth/login', data);
    return res.data;
  },

  async logout() {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data: any) {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },

  async resendOtp(email: string) {
    const res = await apiClient.post('/auth/resend-otp', { email });
    return res.data;
  },
};
