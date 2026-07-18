export {
  RenderBoundary,
  AppRenderingShell,
} from './RenderBoundary';
export { RenderSlot } from './RenderSlot';
export { useRenderVisible } from './useRenderVisible';
export { DASHBOARD_RENDER_GRAPH } from './render-graph';
export { budgetsApi, withRenderBudget, setModuleBudget } from './budgets';
export { renderSchedulerApi } from './internal/RenderScheduler';
export type { RenderPriority } from './internal/RenderScheduler';

import { RenderBoundary, AppRenderingShell } from './RenderBoundary';
import { RenderSlot } from './RenderSlot';
import { useRenderVisible } from './useRenderVisible';
import { DASHBOARD_RENDER_GRAPH } from './render-graph';
import { budgetsApi } from './budgets';
import { renderSchedulerApi } from './internal/RenderScheduler';

export const renderingApi = {
  RenderBoundary,
  AppRenderingShell,
  RenderSlot,
  useRenderVisible,
  scheduler: renderSchedulerApi,
  budgets: budgetsApi,
  graph: DASHBOARD_RENDER_GRAPH,
};

export type RenderingApi = typeof renderingApi;

/** Feature flag — set NEXT_PUBLIC_RENDER_ENGINE=0 to disable isolation helpers. */
export function isRenderEngineEnabled(): boolean {
  return process.env.NEXT_PUBLIC_RENDER_ENGINE !== '0';
}
