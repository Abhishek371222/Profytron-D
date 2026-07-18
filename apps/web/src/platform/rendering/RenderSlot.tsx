'use client';

import React, { Profiler } from 'react';
import { metricsApi } from '@/platform/metrics';
import { RenderBoundary } from './RenderBoundary';
import { checkRenderBudget } from './budgets';
import { renderSchedulerApi } from './internal/RenderScheduler';

type Props = {
  id: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** When false, render lightweight placeholder (viewport pause). */
  active?: boolean;
  placeholder?: React.ReactNode;
};

/**
 * Per-module render boundary — isolates errors and records commit duration.
 */
export function RenderSlot({
  id,
  children,
  fallback,
  active = true,
  placeholder,
}: Props) {
  const onRender = React.useCallback(
    (
      _id: string,
      _phase: 'mount' | 'update' | 'nested-update',
      actualDuration: number,
    ) => {
      renderSchedulerApi.schedule(`metric:${id}`, 'idle', () => {
        metricsApi.mark(`commit.${id}`, { ms: actualDuration });
        checkRenderBudget(id, actualDuration);
      });
    },
    [id],
  );

  if (!active) {
    return (
      <div data-render-slot={id} data-active="false">
        {placeholder ?? (
          <div className="min-h-[120px] rounded-xl bg-muted/30" aria-hidden />
        )}
      </div>
    );
  }

  return (
    <div data-render-slot={id} data-active="true">
      <RenderBoundary
        fallback={fallback}
        onError={(err) =>
          metricsApi.mark(`render.error.${id}`, { message: err.message })
        }
      >
        <Profiler id={id} onRender={onRender}>
          {children}
        </Profiler>
      </RenderBoundary>
    </div>
  );
}
