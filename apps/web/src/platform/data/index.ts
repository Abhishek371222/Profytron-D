import { QueryKeys } from './query-keys';
import { useWorkspaceQuery } from './hooks/useWorkspaceQuery';
import { marketApi } from '@/lib/api/market';

export const dataApi = {
  keys: QueryKeys,
  useWorkspaceQuery,
  market: {
    getNews: marketApi.getNews,
    getEconomicCalendar: marketApi.getEconomicCalendar,
  },
};

export type DataApi = typeof dataApi;
