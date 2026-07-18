'use client';

import React from 'react';
import { RenderSlot, useRenderVisible } from '@/platform/rendering';

/** Below-fold modules — pause when offscreen. */
export function ViewportModule({
  id,
  children,
  minHeight = 160,
}: {
  id: string;
  children: React.ReactNode;
  minHeight?: number;
}) {
  const { ref, visible } = useRenderVisible({
    rootMargin: '180px',
    initialVisible: false,
  });
  return (
    <div ref={ref}>
      <RenderSlot
        id={id}
        active={visible}
        placeholder={
          <div
            className="rounded-xl bg-muted/30"
            style={{ minHeight }}
            aria-hidden
          />
        }
      >
        {children}
      </RenderSlot>
    </div>
  );
}
