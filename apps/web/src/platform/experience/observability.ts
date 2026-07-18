/**
 * Experience observability — development only.
 */

import { metricsApi } from '../metrics';
import { getGpuQuality, gpuDpr } from './gpu-quality';
import { lodFromQuality } from './lod-manager';
import { assetQueueSize } from './asset-streaming';
import { textureCount, textureMemoryBytes } from './texture-manager';
import { listShaders } from './shader-manager';
import { heroSnapshot } from './hero-runtime';
import { getCoachEmotion } from './coach-visual';
import { experienceCount } from './experience-registry';
import { listExperienceMachines } from './experience-state';

function metricsOn() {
  return process.env.NEXT_PUBLIC_PLATFORM_METRICS === '1';
}

export function experienceSnapshot() {
  return {
    quality: getGpuQuality(),
    dpr: gpuDpr(),
    lod: lodFromQuality(),
    assetQueue: assetQueueSize(),
    textures: textureCount(),
    textureBytes: textureMemoryBytes(),
    shaders: listShaders(),
    hero: heroSnapshot(),
    coachEmotion: getCoachEmotion(),
    registered: experienceCount(),
    machines: listExperienceMachines(),
  };
}

export function markExperienceLoad(id: string, ms: number) {
  if (!metricsOn()) return;
  metricsApi.mark('experience.load', { id, ms });
}

export function markWebGLContext(event: 'lost' | 'restored') {
  if (!metricsOn()) return;
  metricsApi.mark('experience.webgl', { event });
}

export const experienceObservabilityApi = {
  snapshot: experienceSnapshot,
  markLoad: markExperienceLoad,
  markWebGL: markWebGLContext,
};
