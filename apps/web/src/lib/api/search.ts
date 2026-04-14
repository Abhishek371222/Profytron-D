import { apiClient } from './client';

export type GlobalSearchType = 'strategy' | 'marketplace' | 'creator' | 'page';

export interface GlobalSearchItem {
  id: string;
  type: GlobalSearchType;
  title: string;
  subtitle?: string;
  href: string;
  score: number;
}

export const searchApi = {
  async globalSearch(query: string, limit = 8): Promise<GlobalSearchItem[]> {
    const res = await apiClient.get('/search/global', {
      params: {
        q: query,
        limit,
      },
    });
    return res.data.data;
  },
};
