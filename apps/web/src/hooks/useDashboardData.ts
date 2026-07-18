/**
 * Legacy facade — prefer `platform` / `useDashboardModel` for new code.
 * Kept for one-release rollback compatibility.
 */
export {
  useDashboardModel as useDashboardData,
  type AnalyticsRange,
} from '@/platform/dashboard/useDashboardModel';
