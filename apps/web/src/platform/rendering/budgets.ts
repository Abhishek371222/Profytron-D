import { metricsApi } from '@/platform/metrics';

/** Soft budgets — warn in metrics mode; never throw in production. */
export const DEFAULT_MODULE_BUDGET_MS = 10;

const budgets = new Map<string, number>();

export function setModuleBudget(id: string, maxCommitMs: number) {
  budgets.set(id, maxCommitMs);
}

export function checkRenderBudget(id: string, commitMs: number) {
  const max = budgets.get(id) ?? DEFAULT_MODULE_BUDGET_MS;
  if (commitMs > max) {
    metricsApi.mark('budget.exceeded', { id, commitMs, max });
  }
}

export function withRenderBudget(
  id: string,
  maxCommitMs: number,
  run: () => void,
) {
  setModuleBudget(id, maxCommitMs);
  const t0 = performance.now();
  try {
    run();
  } finally {
    checkRenderBudget(id, performance.now() - t0);
  }
}

export const budgetsApi = {
  setModuleBudget,
  checkRenderBudget,
  withRenderBudget,
  DEFAULT_MODULE_BUDGET_MS,
};
