'use client';

/**
 * Loading engine — spinner only on true first load without data.
 */
export function shouldShowSpinner(opts: {
  isInitialLoading: boolean;
  hasData: boolean;
}): boolean {
  return opts.isInitialLoading && !opts.hasData;
}

export function shouldShowRefreshing(opts: {
  isFetching: boolean;
  hasData: boolean;
}): boolean {
  return opts.isFetching && opts.hasData;
}

export const loadingApi = {
  shouldShowSpinner,
  shouldShowRefreshing,
};

export type LoadingApi = typeof loadingApi;
