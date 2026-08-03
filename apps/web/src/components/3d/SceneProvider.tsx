/**
 * SceneProvider — mounts SceneManager lifecycle + route prefetch.
 * Place in PublicPageLayout / AppShell trees only.
 */

'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { sceneManagerApi } from '@/platform/experience/scene-manager';
import { brandLightingCssVars } from '@/platform/experience/brand-lighting';
import type { SceneKey } from '@/platform/experience/scene-registry';
import type { SlotRole } from '@/platform/experience/scene-manager';
import type { StreamPhase } from '@/platform/experience/layer-streamer';

type SceneContextValue = {
  register: typeof sceneManagerApi.register;
  unregister: typeof sceneManagerApi.unregister;
  getPoster: (key: SceneKey) => string;
};

const SceneContext = createContext<SceneContextValue | null>(null);

export function SceneProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (!cancelled) sceneManagerApi.start();
    };
    // Prefer idle so landing LCP/TBT is not competing with scene manager boot.
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 3500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(start, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (pathname) sceneManagerApi.prefetchRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    const vars = brandLightingCssVars();
    const root = document.documentElement;
    for (const [k, v] of Object.entries(vars)) {
      root.style.setProperty(k, v);
    }
  }, []);

  const value = useMemo<SceneContextValue>(
    () => ({
      register: sceneManagerApi.register,
      unregister: sceneManagerApi.unregister,
      getPoster: sceneManagerApi.getPoster,
    }),
    [],
  );

  return (
    <SceneContext.Provider value={value}>{children}</SceneContext.Provider>
  );
}

export function useSceneManager() {
  const ctx = useContext(SceneContext);
  if (!ctx) {
    return {
      register: sceneManagerApi.register,
      unregister: sceneManagerApi.unregister,
      getPoster: sceneManagerApi.getPoster,
    };
  }
  return ctx;
}

export type { SceneKey, SlotRole, StreamPhase };
