import { apiClient, unwrapApiResponse } from './client';

export const usersApi = {
  async getMe() {
    const res = await apiClient.get('/users/me');
    return unwrapApiResponse<any>(res.data);
  },

  async updateProfile(data: any) {
    const res = await apiClient.patch('/users/me', data);
    return unwrapApiResponse<any>(res.data);
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Override default JSON headers for this request
    const res = await apiClient.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return unwrapApiResponse<any>(res.data);
  },

  async updateRiskProfile(data: any) {
    const res = await apiClient.patch('/users/me/risk-profile', data);
    return unwrapApiResponse<any>(res.data);
  },

  async getSessions() {
    const res = await apiClient.get('/users/me/sessions');
    return unwrapApiResponse<any>(res.data);
  },

  async revokeSession(id: string) {
    const res = await apiClient.delete(`/users/me/sessions/${id}`);
    return unwrapApiResponse<any>(res.data);
  },

  async revokeAllOtherSessions() {
    const res = await apiClient.delete('/users/me/sessions');
    return unwrapApiResponse<any>(res.data);
  },

  async changePassword(data: any) {
    const res = await apiClient.post('/users/me/change-password', data);
    return unwrapApiResponse<any>(res.data);
  },

  async deleteAccount(confirmText: string) {
    const res = await apiClient.delete('/users/me', { data: { confirmText } });
    return unwrapApiResponse<any>(res.data);
  },
  
  async checkUsername(username: string) {
     // A mock endpoint or logic right now just simulating
     return { available: true };
  }
};
