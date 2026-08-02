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
    sceneManagerApi.start();
    return () => {
      /* keep manager alive across soft navigations within same shell */
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
