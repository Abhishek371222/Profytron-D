import { apiClient } from './client';

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data as T;
  return payload as T;
};

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  category: string;
  priority: string;
  isRead: boolean;
  isSeen: boolean;
  actionUrl?: string | null;
  icon?: string | null;
  metadata?: any;
  createdAt: string;
}

export interface NotificationsListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface NotificationPreferences {
  id: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  securityAlerts: boolean;
  tradingAlerts: boolean;
  paymentAlerts: boolean;
  systemAlerts: boolean;
  marketingAlerts: boolean;
  accountAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export const notificationsApi = {
  async list(params?: { page?: number; limit?: number; unreadOnly?: boolean; category?: string }) {
    const res = await apiClient.get('/notifications', { params });
    return unwrap<NotificationsListResponse>(res.data);
  },

  async unreadCount() {
    const res = await apiClient.get('/notifications/unread-count');
    return unwrap<{ count: number }>(res.data);
  },

  async markRead(id: string) {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return unwrap<any>(res.data);
  },

  async markAllRead() {
    const res = await apiClient.patch('/notifications/mark-all-read');
    return unwrap<{ updated: number }>(res.data);
  },

  async markSeen() {
    const res = await apiClient.patch('/notifications/mark-seen');
    return unwrap<{ success: boolean }>(res.data);
  },

  async deleteOne(id: string) {
    const res = await apiClient.delete(`/notifications/${id}`);
    return unwrap<{ success: boolean }>(res.data);
  },

  async deleteAll() {
    const res = await apiClient.delete('/notifications');
    return unwrap<{ deleted: number }>(res.data);
  },

  async getPreferences() {
    const res = await apiClient.get('/notifications/preferences');
    return unwrap<NotificationPreferences>(res.data);
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>) {
    const res = await apiClient.patch('/notifications/preferences', prefs);
    return unwrap<NotificationPreferences>(res.data);
  },

  async registerFcmToken(token: string, platform = 'web') {
    const res = await apiClient.post('/notifications/fcm-token', { token, platform });
    return unwrap<{ success: boolean }>(res.data);
  },
};
