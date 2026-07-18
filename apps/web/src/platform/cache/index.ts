import { cacheApi } from './internal/CacheEngine';

export function createCacheApi() {
  return cacheApi;
}

export type { CacheApi } from './internal/CacheEngine';
