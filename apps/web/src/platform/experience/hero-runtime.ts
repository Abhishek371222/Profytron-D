/**
 * Hero runtime — progressive layers: Static → Animated → 3D → Interactive.
 */

import {
  createExperienceMachine,
  transitionExperience,
  getExperienceState,
} from './experience-state';
import { gpuAllowsWebGL, gpuDpr, getGpuQuality } from './gpu-quality';
import { lodFromQuality } from './lod-manager';
import { checkExperienceBudget } from './experience-budgets';
import { markAssetLoaded, enqueueAsset } from './asset-streaming';
import { registerShader } from './shader-manager';
import { isExperienceEngineEnabled } from './index-flag';

export type HeroLayer = 'static' | 'animated' | 'scene3d' | 'interactive';

const HERO_ID = 'hero';

export function getHeroLayer(): HeroLayer {
  const state = getExperienceState(HERO_ID);
  if (state === 'idle') return 'static';
  if (state === 'loading') return 'animated';
  if (state === 'streaming') return 'scene3d';
  if (state === 'interactive') return 'interactive';
  if (state === 'paused') return 'animated';
  return 'static';
}

export function shouldMountWebGLHero(): boolean {
  if (!isExperienceEngineEnabled()) return true; // legacy FloatingLines path
  if (!gpuAllowsWebGL()) return false;
  return lodFromQuality() > 0;
}

export function heroDpr(): number {
  return gpuDpr();
}

/** Call from HeroAmbientVisual on mount — advances progressive layers. */
export function startHeroProgression(opts?: {
  onLayer?: (layer: HeroLayer) => void;
  webglReady?: boolean;
}) {
  const t0 = performance.now();
  createExperienceMachine(HERO_ID);
  transitionExperience(HERO_ID, 'loading');
  opts?.onLayer?.('static');
  opts?.onLayer?.('animated');

  enqueueAsset('hero.fallback.mesh', () => {
    markAssetLoaded('hero.fallback.mesh');
  });

  const allow3d = shouldMountWebGLHero() && opts?.webglReady !== false;

  if (!allow3d) {
    transitionExperience(HERO_ID, 'interactive');
    opts?.onLayer?.('interactive');
    checkExperienceBudget('hero', {
      loadToInteractiveMs: performance.now() - t0,
    });
    return;
  }

  transitionExperience(HERO_ID, 'streaming');
  opts?.onLayer?.('scene3d');

  enqueueAsset('hero.shader.floating-lines.frag', () => {
    registerShader({ id: 'floating-lines' });
    markAssetLoaded('hero.shader.floating-lines.frag');
    markAssetLoaded('hero.shader.floating-lines.vert');
    transitionExperience(HERO_ID, 'interactive');
    opts?.onLayer?.('interactive');
    checkExperienceBudget('hero', {
      loadToInteractiveMs: performance.now() - t0,
    });
  });
}

export function pauseHero() {
  transitionExperience(HERO_ID, 'paused');
}

export function resumeHero() {
  if (shouldMountWebGLHero()) {
    transitionExperience(HERO_ID, 'interactive');
  } else {
    transitionExperience(HERO_ID, 'loading');
  }
}

export function heroSnapshot() {
  return {
    state: getExperienceState(HERO_ID),
    layer: getHeroLayer(),
    quality: getGpuQuality(),
    dpr: heroDpr(),
    lod: lodFromQuality(),
    webgl: shouldMountWebGLHero(),
  };
}

export const heroRuntimeApi = {
  start: startHeroProgression,
  pause: pauseHero,
  resume: resumeHero,
  layer: getHeroLayer,
  shouldMountWebGL: shouldMountWebGLHero,
  dpr: heroDpr,
  snapshot: heroSnapshot,
};
