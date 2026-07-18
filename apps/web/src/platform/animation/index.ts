'use client';

import React from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let visible = true;
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
  });
}

const handles = new Set<{ pause: () => void; resume: () => void }>();
const changedKeys = new Set<string>();

export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = React.useState(() => !prefersReducedMotion());
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setAllowed(!mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return allowed && visible;
}

export const animationApi = {
  useMotionAllowed,
  isDocumentVisible: () => visible,
  register(handle: { pause: () => void; resume: () => void }) {
    handles.add(handle);
    return () => {
      handles.delete(handle);
    };
  },
  pauseAll() {
    for (const h of handles) h.pause();
  },
  resumeAll() {
    if (!prefersReducedMotion()) for (const h of handles) h.resume();
  },
  /** Mark a value key as changed for selective UI emphasis (no remount). */
  markChanged(key: string) {
    changedKeys.add(key);
    if (changedKeys.size > 50) {
      const first = changedKeys.values().next().value;
      if (first) changedKeys.delete(first);
    }
  },
  consumeChanged(key: string): boolean {
    if (!changedKeys.has(key)) return false;
    changedKeys.delete(key);
    return true;
  },
};

export type AnimationApi = typeof animationApi;
