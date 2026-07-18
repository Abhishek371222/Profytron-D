'use client';

import { motionPresets } from './motion-presets';
import { isMotionEngineEnabled } from './index-flag';

/** Shared modal enter/exit props from Motion Engine (with legacy fallback). */
export function useModalMotionProps() {
  if (!isMotionEngineEnabled()) {
    return {
      backdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      },
      panel: {
        initial: { opacity: 0, scale: 0.95, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 12 },
        transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as const },
      },
    };
  }
  return motionPresets.modalVariants();
}
