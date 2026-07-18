import { schedulerApi } from './internal/RequestScheduler';

export function createSchedulerApi() {
  return schedulerApi;
}

export type { SchedulerApi, SchedulePriority } from './internal/RequestScheduler';
