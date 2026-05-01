'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 422]);

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: (failureCount, error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (status && NON_RETRYABLE_STATUSES.has(status)) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
