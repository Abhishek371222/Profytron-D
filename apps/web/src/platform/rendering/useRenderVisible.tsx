'use client';

import React from 'react';
import { metricsApi } from '@/platform/metrics';

type Options = {
  rootMargin?: string;
  threshold?: number | number[];
  /** Start assuming visible (above fold). Set false for below-fold defaults. */
  initialVisible?: boolean;
};

/**
 * Viewport-aware gate — offscreen modules skip expensive children.
 */
export function useRenderVisible(
  options: Options = {},
): {
  ref: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
} {
  const {
    rootMargin = '160px',
    threshold = 0,
    initialVisible = true,
  } = options;
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(initialVisible);

  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const next = entry.isIntersecting;
        setVisible((prev) => {
          if (prev !== next) {
            metricsApi.mark(next ? 'viewport.enter' : 'viewport.leave', {
              ratio: entry.intersectionRatio,
            });
          }
          return next;
        });
      },
      { rootMargin, threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin, threshold]);

  return { ref, visible };
}
