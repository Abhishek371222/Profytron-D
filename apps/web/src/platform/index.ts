import { renderingApi } from './rendering';
import { createCacheApi } from './cache';
import { createSchedulerApi } from './scheduler';
import { metricsApi } from './metrics';
import { animationApi } from './animation';
import { dataApi } from './data';
import { lifecycleApi } from './lifecycle';
import { mt5SyncApi } from './mt5-sync';
import { loadingApi } from './loading';
import { motionApi } from './motion';
import { experienceApi } from './experience';

/**
 * Public Platform API — features and Application Core import only this surface.
 * Do not import platform internal modules from app or components.
 */
export const platform = {
  render: () => renderingApi,
  cache: () => createCacheApi(),
  scheduler: () => createSchedulerApi(),
  metrics: () => metricsApi,
  animation: () => animationApi,
  data: () => dataApi,
  lifecycle: () => lifecycleApi,
  mt5: () => mt5SyncApi,
  loading: () => loadingApi,
  motion: () => motionApi,
  experience: () => experienceApi,
};

export type Platform = typeof platform;

export { useDashboardModel } from './dashboard/useDashboardModel';
