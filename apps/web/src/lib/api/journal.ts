import { apiClient } from './client';

export interface JournalEntry {
  id: string;
  userId: string;
  tradeId: string;
  emotions: string | null;
  lessonLearned: string | null;
  screenshotUrl: string | null;
  aiAnalysis: string | null;
  rating: number | null;
  createdAt: string;
  trade: {
    id: string;
    symbol: string;
    direction: string;
    openPrice: number;
    closePrice: number | null;
    profit: number | null;
    status: string;
    openedAt: string;
    closedAt: string | null;
  };
}

export interface JournalInsights {
  totalEntries: number;
  averageRating: number;
  emotionalPatterns: Record<string, number>;
  lastEntry: JournalEntry | null;
}

export interface CreateJournalEntryPayload {
  tradeId: string;
  emotions?: string;
  lessonLearned?: string;
}

export const journalApi = {
  list: (params?: { limit?: number; skip?: number }) =>
    apiClient.get<JournalEntry[]>('/journal', { params }).then((r) => r.data),

  insights: () => apiClient.get<JournalInsights>('/journal/insights').then((r) => r.data),

  create: (payload: CreateJournalEntryPayload) =>
    apiClient.post<JournalEntry>('/journal', payload).then((r) => r.data),

  update: (id: string, payload: Partial<Pick<JournalEntry, 'emotions' | 'lessonLearned'>>) =>
    apiClient.patch<JournalEntry>(`/journal/${id}`, payload).then((r) => r.data),

  rate: (id: string, rating: number) =>
    apiClient.patch<JournalEntry>(`/journal/${id}/rate`, { rating }).then((r) => r.data),

  analyze: (id: string) =>
    apiClient.post<JournalEntry>(`/journal/${id}/analyze`).then((r) => r.data),
};
