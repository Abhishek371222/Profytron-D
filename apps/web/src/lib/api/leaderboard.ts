import { apiClient, unwrapApiResponse } from './client';

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
  creator: {
    id: string;
    fullName: string;
    username: string | null;
    avatarUrl: string | null;
  };
  subscribers: number;
  latestPerformance: {
    winRate: number;
    netPnl: number;
    sharpeRatio: number;
    totalTrades: number;
    winningTrades: number;
  } | null;
  monthlyPrice: number | null;
  profitRate: number;
}

export const leaderboardApi = {
  monthly: async (limit = 50) => {
    const response = await apiClient.get('/leaderboard/monthly', {
      params: { limit },
    });
    return unwrapApiResponse<{
      period: string;
      entries: LeaderboardEntry[];
    }>(response.data);
  },

  allTime: async (limit = 50) => {
    const response = await apiClient.get('/leaderboard/alltime', {
      params: { limit },
    });
    return unwrapApiResponse<{
      period: string;
      entries: LeaderboardEntry[];
    }>(response.data);
  },

  topStrategies: async (limit = 20) => {
    const response = await apiClient.get('/leaderboard/strategies', {
      params: { limit },
    });
    return unwrapApiResponse<TopStrategy[]>(response.data);
  },

  myRank: async () => {
    const response = await apiClient.get('/leaderboard/me');
    return unwrapApiResponse<{
      monthly: LeaderboardEntry | null;
      allTime: LeaderboardEntry | null;
    }>(response.data);
  },
};
