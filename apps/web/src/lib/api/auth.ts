import { apiClient, unwrapApiResponse } from './client';
import { mockUser } from '@/lib/mocks/data';

// Inline until workspace types are resolved
type User = any;

export const authApi = {
  async register(data: any) {
    const res = await apiClient.post('/auth/register', data);
    return unwrapApiResponse<any>(res.data);
  },

  async verifyEmail(data: { email: string; otp: string }) {
    const res = await apiClient.post<{ accessToken: string; user: User }>('/auth/verify-email', data);
    return unwrapApiResponse<{ accessToken: string; user: User }>(res.data);
  },

  async login(data: any) {
    if (data?.email === 'demo@profytron.com' && data?.password === 'Demo@123') {
      return {
        accessToken: `mock_token_${Date.now()}`,
        user: mockUser,
      };
    }

    const res = await apiClient.post<{ accessToken: string; user: User }>('/auth/login', data);
    return unwrapApiResponse<{ accessToken: string; user: User }>(res.data);
  },

  async logout() {
    const res = await apiClient.post('/auth/logout');
    return unwrapApiResponse<any>(res.data);
  },

  async forgotPassword(email: string) {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return unwrapApiResponse<any>(res.data);
  },

  async resetPassword(data: any) {
    const res = await apiClient.post('/auth/reset-password', data);
    return unwrapApiResponse<any>(res.data);
  },

  async resendOtp(email: string) {
    const res = await apiClient.post('/auth/resend-otp', { email });
    return unwrapApiResponse<any>(res.data);
  },
};
