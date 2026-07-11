import { apiClient, unwrapApiResponse } from './client';

type User = any;

export type LoginResponse =
  | { accessToken: string; user: User }
  | { requiresTwoFa: true; challengeToken: string };

export const authApi = {
  async register(data: any) {
    const res = await apiClient.post('/auth/register', data);
    return unwrapApiResponse<any>(res.data);
  },

  async verifyEmail(data: { email: string; otp: string }) {
    const res = await apiClient.post<{ accessToken: string; user: User; selectedPlan?: string | null }>('/auth/verify-email', data);
    return unwrapApiResponse<{ accessToken: string; user: User; selectedPlan?: string | null }>(res.data);
  },

  async login(data: any): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/auth/login', data);
    return unwrapApiResponse<LoginResponse>(res.data);
  },

  async completeTwoFactorLogin(data: { challengeToken: string; code: string }) {
    const res = await apiClient.post<{ accessToken: string; user: User }>(
      '/auth/2fa/complete-login',
      data,
    );
    return unwrapApiResponse<{ accessToken: string; user: User }>(res.data);
  },

  async setupTwoFactor() {
    const res = await apiClient.post('/auth/2fa/setup');
    return unwrapApiResponse<{ secret: string; qrCode: string; otpUri?: string }>(
      res.data,
    );
  },

  async cancelTwoFactorSetup() {
    const res = await apiClient.post('/auth/2fa/cancel-setup');
    return unwrapApiResponse<{ cancelled: boolean }>(res.data);
  },

  async verifyTwoFactorSetup(token: string) {
    const res = await apiClient.post('/auth/2fa/verify-setup', { token });
    return unwrapApiResponse<{ success: boolean; backupCodes: string[] }>(res.data);
  },

  async disableTwoFactor(token: string) {
    const res = await apiClient.post('/auth/2fa/disable', { token });
    return unwrapApiResponse<{ success: boolean }>(res.data);
  },

  async regenerateBackupCodes(token: string) {
    const res = await apiClient.post('/auth/2fa/backup-codes', { token });
    return unwrapApiResponse<{ backupCodes: string[] }>(res.data);
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
