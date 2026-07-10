import { apiClient, unwrapApiResponse } from './client';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  responses?: SupportTicketResponse[];
}

export interface SupportTicketResponse {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  user?: { fullName: string; avatarUrl: string | null };
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
  category: string;
}

export const supportApi = {
  createTicket: async (payload: CreateTicketPayload) => {
    const res = await apiClient.post('/support/tickets', {
      ...payload,
      category: payload.category.trim().toLowerCase(),
      subject: payload.subject.trim(),
      description: payload.description.trim(),
    });
    return unwrapApiResponse<SupportTicket>(res.data);
  },

  getTickets: async (status?: string) => {
    const res = await apiClient.get('/support/tickets', {
      params: status ? { status } : undefined,
    });
    const raw = unwrapApiResponse<SupportTicket[] | { items?: SupportTicket[] }>(
      res.data,
    );
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray((raw as { items?: SupportTicket[] }).items)) {
      return (raw as { items: SupportTicket[] }).items;
    }
    return [];
  },

  getTicket: async (id: string) => {
    const res = await apiClient.get(`/support/tickets/${id}`);
    return unwrapApiResponse<SupportTicket>(res.data);
  },

  addResponse: async (ticketId: string, message: string) => {
    const res = await apiClient.post(`/support/tickets/${ticketId}/responses`, {
      message,
    });
    return unwrapApiResponse<SupportTicketResponse>(res.data);
  },

  updateStatus: async (ticketId: string, status: string) => {
    const res = await apiClient.patch(`/support/tickets/${ticketId}/status`, {
      status,
    });
    return unwrapApiResponse<SupportTicket>(res.data);
  },
};
