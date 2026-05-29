import { apiClient } from './client';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  period: string;
  rank: number;
  winRate: number;
  totalPnl: number;
  totalTrades: number;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    username: string | null;
    avatarUrl: string | null;
    country: string | null;
  };
}

export interface TopStrategy {
  id: string;
  name: string;
  category: string;
  riskLevel: string;
  creator: { id: string; fullName: string; username: string | null; avatarUrl: string | null };
  subscribers: number;
  latestPerformance: { winRate: number; totalReturn: number; sharpeRatio: number } | null;
  monthlyPrice: number | null;
}

export const leaderboardApi = {
  monthly: (limit = 50) =>
    apiClient
      .get<{ period: string; entries: LeaderboardEntry[] }>('/leaderboard/monthly', { params: { limit } })
      .then((r) => r.data),

  allTime: (limit = 50) =>
    apiClient
      .get<{ period: string; entries: LeaderboardEntry[] }>('/leaderboard/alltime', { params: { limit } })
      .then((r) => r.data),

  topStrategies: (limit = 20) =>
    apiClient.get<TopStrategy[] | { data: TopStrategy[] }>('/leaderboard/strategies', { params: { limit } }).then((r) => {
      const data = r.data;
      return Array.isArray(data) ? data : (data as any)?.data ?? [];
    }),

  myRank: () =>
    apiClient
      .get<{ monthly: LeaderboardEntry | null; allTime: LeaderboardEntry | null }>('/leaderboard/me')
      .then((r) => r.data),
};
