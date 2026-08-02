/**
 * Bytes-only scene prefetch — never instantiates WebGL.
 * Route affinity: Home → Pricing → Marketplace → Dashboard.
 */

import {
  SceneRegistry,
  type SceneKey,
  resolveScenePoster,
} from './scene-registry';
import { trackScene } from './scene-analytics';

const prefetched = new Set<string>();

const ROUTE_PREFETCH: Record<string, SceneKey[]> = {
  '/': ['pricingHero', 'productMarketplace'],
  '/pricing': ['productMarketplace', 'ambientDepth'],
  '/marketplace': ['ambientDepth'],
  '/dashboard': ['productMarketplace'],
};

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

async function prefetchUrl(url: string, kind: 'scene' | 'poster') {
  if (!url || prefetched.has(url)) return;
  // Never prefetch empty / javascript: / data: — Cache API throws TypeError
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) return;
  prefetched.add(url);
  try {
    const absolute =
      typeof window !== 'undefined' && url.startsWith('/')
        ? new URL(url, window.location.origin).href
        : url;
    // Prefer fetch over caches.add — Cache API can fail on opaque/CORS and
    // must not compete with App Router RSC navigations.
    await fetch(absolute, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'force-cache',
      priority: 'low',
    } as RequestInit);
    trackScene('scene.prefetch', { url: absolute, kind, cached: false });
  } catch {
    prefetched.delete(url);
    trackScene('scene.failed', { url, kind, phase: 'prefetch' });
  }
}

/** Prefetch posters + splinecode bytes for likely next routes. No WebGL. */
export function prefetchScenesForRoute(pathname: string) {
  if (typeof window === 'undefined') return;
  const path = normalizePath(pathname);
  const keys = ROUTE_PREFETCH[path] ?? [];
  for (const key of keys) {
    const entry = SceneRegistry[key];
    if (!entry) continue;
    void prefetchUrl(resolveScenePoster(key), 'poster');
    if (entry.url?.trim()) {
      void prefetchUrl(entry.url.trim(), 'scene');
    }
  }
}

export function prefetchSceneKey(key: SceneKey) {
  const entry = SceneRegistry[key];
  if (!entry) return;
  void prefetchUrl(resolveScenePoster(key), 'poster');
  if (entry.url?.trim()) void prefetchUrl(entry.url.trim(), 'scene');
}

export const scenePrefetchApi = {
  forRoute: prefetchScenesForRoute,
  key: prefetchSceneKey,
  routeMap: ROUTE_PREFETCH,
};
