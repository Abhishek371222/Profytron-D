import { apiClient } from './client';

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
  createTicket: (payload: CreateTicketPayload) =>
    apiClient.post<SupportTicket>('/support/tickets', payload).then((r) => r.data),

  getTickets: (status?: string) =>
    apiClient
      .get<SupportTicket[]>('/support/tickets', { params: status ? { status } : undefined })
      .then((r) => r.data),

  getTicket: (id: string) =>
    apiClient.get<SupportTicket>(`/support/tickets/${id}`).then((r) => r.data),

  addResponse: (ticketId: string, message: string) =>
    apiClient
      .post<SupportTicketResponse>(`/support/tickets/${ticketId}/responses`, { message })
      .then((r) => r.data),

  updateStatus: (ticketId: string, status: string) =>
    apiClient
      .patch<SupportTicket>(`/support/tickets/${ticketId}/status`, { status })
      .then((r) => r.data),
};
