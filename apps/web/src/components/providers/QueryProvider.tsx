'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { registerQueryClient } from '@/lib/queries/query-client-registry';

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 422]);

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: (failureCount, error: unknown) => {
              const status = (error as { response?: { status?: number } })?.response?.status;
              if (status && NON_RETRYABLE_STATUSES.has(status)) return false;
              return failureCount < 1;
            },
            // Refetch stale queries on mount; avoid "always" stampedes that race token refresh.
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  useEffect(() => {
    registerQueryClient(queryClient);
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
