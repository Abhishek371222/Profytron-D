/**
 * Experience Budget Manager — soft budgets per system.
 */

import { metricsApi } from '../metrics';

export type ExperienceBudgetSystem =
  | 'hero'
  | 'coach'
  | 'marketing'
  | 'surfaces'
  | 'shaders';

export type BudgetDims = {
  gpuMsPerFrame?: number;
  memoryMb?: number;
  loadToInteractiveMs?: number;
  cpuMs?: number;
  paintMs?: number;
};

export const EXPERIENCE_BUDGETS: Record<ExperienceBudgetSystem, BudgetDims> = {
  hero: { gpuMsPerFrame: 8, memoryMb: 64, loadToInteractiveMs: 1000 },
  coach: { gpuMsPerFrame: 2, cpuMs: 4 },
  marketing: { paintMs: 16 },
  surfaces: { paintMs: 12 },
  shaders: { gpuMsPerFrame: 6 },
};

function metricsOn() {
  return process.env.NEXT_PUBLIC_PLATFORM_METRICS === '1';
}

export function checkExperienceBudget(
  system: ExperienceBudgetSystem,
  actual: BudgetDims,
) {
  const budget = EXPERIENCE_BUDGETS[system];
  const exceeded: string[] = [];
  for (const key of Object.keys(actual) as (keyof BudgetDims)[]) {
    const a = actual[key];
    const b = budget[key];
    if (a != null && b != null && a > b) exceeded.push(String(key));
  }
  if (exceeded.length && metricsOn()) {
    metricsApi.mark('experience.budget.exceeded', { system, actual, budget, exceeded });
  }
  return exceeded.length === 0;
}

export const experienceBudgetsApi = {
  budgets: EXPERIENCE_BUDGETS,
  check: checkExperienceBudget,
};
