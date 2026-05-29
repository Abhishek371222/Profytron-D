import { apiClient } from './client';

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  actionUrl?: string | null;
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

export const notificationsApi = {
  async list(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
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
};
