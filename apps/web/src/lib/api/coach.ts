import { apiClient, unwrapApiResponse } from './client';
import { useAuthStore } from '../stores/useAuthStore';

export type CoachMessageRole = 'USER' | 'ASSISTANT' | 'EXECUTIVE' | 'SYSTEM';
export type CoachMessageSource = 'FAQ' | 'AI' | 'HUMAN' | 'SYSTEM';
export type CoachConversationStatus = 'ACTIVE' | 'ESCALATED' | 'CLOSED';
export type CoachEscalationStatus = 'OPEN' | 'CLAIMED' | 'RESOLVED';

export interface CoachMessage {
  id: string;
  conversationId: string;
  role: CoachMessageRole;
  content: string;
  source: CoachMessageSource;
  faqAnswerId?: string | null;
  senderId?: string | null;
  createdAt: string;
}

export interface CoachConversationSummary {
  id: string;
  userId: string;
  title: string;
  status: CoachConversationStatus;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    content: string;
    createdAt: string;
    role: CoachMessageRole;
  }>;
  escalations: Array<{ id: string; status: CoachEscalationStatus }>;
}

export interface CoachConversationDetail {
  id: string;
  userId: string;
  title: string;
  status: CoachConversationStatus;
  createdAt: string;
  updatedAt: string;
  messages: CoachMessage[];
  escalations: Array<{
    id: string;
    status: CoachEscalationStatus;
    claimedById?: string | null;
    slaDeadline?: string | null;
    claimedAt?: string | null;
    createdAt?: string;
    claimedBy?: {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
    } | null;
  }>;
  user?: { id: string; fullName: string; email: string };
}

export interface CoachEscalation {
  id: string;
  conversationId: string;
  userId: string;
  status: CoachEscalationStatus;
  claimedById?: string | null;
  slaDeadline?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  user?: { id: string; fullName: string; email: string };
  claimedBy?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
  conversation?: {
    id: string;
    title: string;
    status?: CoachConversationStatus;
    messages?: Array<{ content: string; createdAt: string; role: CoachMessageRole }>;
  };
}

export const coachApi = {
  async listConversations() {
    const res = await apiClient.get('/coach/conversations');
    return unwrapApiResponse<CoachConversationSummary[]>(res.data);
  },

  async createConversation(title?: string) {
    const res = await apiClient.post('/coach/conversations', { title });
    const created = unwrapApiResponse<{
      id: string;
      title: string;
      status: CoachConversationStatus;
    }>(res.data);
    if (!created?.id) {
      throw new Error('Coach session create returned no id');
    }
    return created;
  },

  async getConversation(id: string) {
    const res = await apiClient.get(`/coach/conversations/${id}`);
    return unwrapApiResponse<CoachConversationDetail>(res.data);
  },

  async deleteConversation(id: string) {
    const res = await apiClient.delete(`/coach/conversations/${id}`);
    return unwrapApiResponse<{ ok: boolean; id: string }>(res.data);
  },

  async sendMessage(conversationId: string, content: string) {
    const res = await apiClient.post(
      `/coach/conversations/${conversationId}/messages`,
      { content },
      { timeout: 90_000 },
    );
    return unwrapApiResponse<{
      userMessage: CoachMessage;
      assistantMessage: CoachMessage;
    }>(res.data);
  },

  async sendMessageStream(
    conversationId: string,
    content: string,
    onEvent: (event: {
      type: string;
      text?: string;
      message?: CoachMessage;
    }) => void,
  ) {
    const token = useAuthStore.getState().accessToken;
    const base = apiClient.defaults.baseURL || '/api';
    const url = `${base}/coach/conversations/${conversationId}/messages/stream`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `Stream failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          const line = part
            .split('\n')
            .map((l) => l.trim())
            .find((l) => l.startsWith('data:'));
          if (!line) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === 'close') continue;
            onEvent(event);
          } catch {
          }
        }
      }
    } catch {
      try {
        const result = await coachApi.sendMessage(conversationId, content);
        onEvent({ type: 'user', message: result.userMessage });
        if (result.assistantMessage.source === 'FAQ') {
          onEvent({
            type: 'faq',
            message: result.assistantMessage,
            text: result.assistantMessage.content,
          });
        }
        onEvent({
          type: 'done',
          message: result.assistantMessage,
          text: result.assistantMessage.content,
        });
      } catch (fallbackErr: unknown) {
        const ax = fallbackErr as {
          response?: { data?: { message?: string; error?: string } };
          message?: string;
        };
        onEvent({
          type: 'error',
          text:
            ax?.response?.data?.error ||
            ax?.response?.data?.message ||
            ax?.message ||
            'Reply failed',
        });
      }
    }
  },

  async escalate(conversationId: string) {
    const res = await apiClient.post(`/coach/conversations/${conversationId}/escalate`);
    return unwrapApiResponse<CoachEscalation>(res.data);
  },

  async listEscalations(status?: CoachEscalationStatus) {
    const res = await apiClient.get('/coach/admin/escalations', {
      params: status ? { status } : undefined,
    });
    return unwrapApiResponse<CoachEscalation[]>(res.data);
  },

  async getConversationAdmin(id: string) {
    const res = await apiClient.get(`/coach/admin/conversations/${id}`);
    return unwrapApiResponse<CoachConversationDetail>(res.data);
  },

  async claimEscalation(id: string) {
    const res = await apiClient.post(`/coach/admin/escalations/${id}/claim`);
    return unwrapApiResponse<CoachEscalation>(res.data);
  },

  async replyEscalation(id: string, content: string) {
    const res = await apiClient.post(`/coach/admin/escalations/${id}/reply`, { content });
    return unwrapApiResponse<CoachMessage>(res.data);
  },

  async resolveEscalation(id: string) {
    const res = await apiClient.post(`/coach/admin/escalations/${id}/resolve`);
    return unwrapApiResponse<CoachEscalation>(res.data);
  },
};
