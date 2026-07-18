'use client';

import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { createCacheApi } from '@/platform/cache';

type AnyQueryOptions = UseQueryOptions<any, any, any, any> & {
  persistKey?: QueryKey;
};

/**
 * Standard workspace query: persistent placeholder, no flash on refresh.
 */
export function useWorkspaceQuery(options: AnyQueryOptions) {
  const cache = createCacheApi();
  const { persistKey, queryFn, ...rest } = options;

  const wrappedFn =
    typeof queryFn === 'function'
      ? async (ctx: any) => {
          const data = await queryFn(ctx);
          if (persistKey && data != null) {
            cache.persist(persistKey as readonly unknown[], data);
          }
          return data;
        }
      : queryFn;

  const query = useQuery({
    ...rest,
    queryFn: wrappedFn,
    placeholderData: (previous: unknown) => previous,
  });

  const hasData = query.data !== undefined;
  const isInitialLoading = query.isPending && !hasData;
  const isRefreshing = query.isFetching && hasData;

  return {
    ...query,
    isInitialLoading,
    isRefreshing,
  };
}
