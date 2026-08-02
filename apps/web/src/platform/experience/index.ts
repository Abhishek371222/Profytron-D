/**
 * Public Experience API — platform.experience()
 */

export { isExperienceEngineEnabled } from './index-flag';
export { experienceBudgetsApi, EXPERIENCE_BUDGETS } from './experience-budgets';
export { experienceStateApi } from './experience-state';
export type { ExperienceLifecycleState } from './experience-state';
export { gpuQualityApi } from './gpu-quality';
export type { GpuQuality } from './gpu-quality';
export { assetManifestApi, ASSET_MANIFEST } from './asset-manifest';
export { shaderContractsApi, SHADER_CONTRACTS } from './shader-contracts';
export { shaderManagerApi } from './shader-manager';
export { textureManagerApi } from './texture-manager';
export { assetStreamingApi } from './asset-streaming';
export { lodManagerApi } from './lod-manager';
export { environmentLightingApi } from './environment-lighting';
export { heroRuntimeApi } from './hero-runtime';
export { coachVisualApi } from './coach-visual';
export type { CoachEmotion } from './coach-visual';
export { experienceRegistryApi } from './experience-registry';
export { experienceObservabilityApi } from './observability';
export { experienceEngineApi, startExperienceEngine } from './experience-engine';
export { ExperienceDevPanel } from './experience-dev-panel';

export { sceneRegistryApi, SceneRegistry } from './scene-registry';
export type { SceneKey, SceneRegistryEntry } from './scene-registry';
export { sceneManagerApi } from './scene-manager';
export { gpuMemoryBudgetApi } from './gpu-memory-budget';
export { brandLightingApi } from './brand-lighting';
export { fpsMonitorApi } from './fps-monitor';
export { scenePrefetchApi } from './scene-prefetch';
export { sceneAnalyticsApi } from './scene-analytics';
export { sceneA11yApi } from './scene-a11y';
export { idleLoaderApi } from './idle-loader';
export { layerStreamerApi } from './layer-streamer';

import { isExperienceEngineEnabled } from './index-flag';
import { experienceBudgetsApi } from './experience-budgets';
import { experienceStateApi } from './experience-state';
import { gpuQualityApi } from './gpu-quality';
import { assetManifestApi } from './asset-manifest';
import { shaderContractsApi } from './shader-contracts';
import { shaderManagerApi } from './shader-manager';
import { textureManagerApi } from './texture-manager';
import { assetStreamingApi } from './asset-streaming';
import { lodManagerApi } from './lod-manager';
import { environmentLightingApi } from './environment-lighting';
import { heroRuntimeApi } from './hero-runtime';
import { coachVisualApi } from './coach-visual';
import { experienceRegistryApi } from './experience-registry';
import { experienceObservabilityApi } from './observability';
import { experienceEngineApi } from './experience-engine';
import { sceneRegistryApi } from './scene-registry';
import { sceneManagerApi } from './scene-manager';
import { gpuMemoryBudgetApi } from './gpu-memory-budget';
import { brandLightingApi } from './brand-lighting';
import { fpsMonitorApi } from './fps-monitor';
import { scenePrefetchApi } from './scene-prefetch';
import { sceneAnalyticsApi } from './scene-analytics';
import { sceneA11yApi } from './scene-a11y';
import { idleLoaderApi } from './idle-loader';
import { layerStreamerApi } from './layer-streamer';

export const experienceApi = {
  enabled: isExperienceEngineEnabled,
  budgets: experienceBudgetsApi,
  state: experienceStateApi,
  gpu: gpuQualityApi,
  assets: assetManifestApi,
  shaders: shaderManagerApi,
  shaderContracts: shaderContractsApi,
  textures: textureManagerApi,
  stream: assetStreamingApi,
  lod: lodManagerApi,
  lighting: environmentLightingApi,
  hero: heroRuntimeApi,
  coach: coachVisualApi,
  registry: experienceRegistryApi,
  observability: experienceObservabilityApi,
  engine: experienceEngineApi,
  /** SceneManager stack — sole WebGL owner for Spline scenes. */
  scenes: {
    registry: sceneRegistryApi,
    manager: sceneManagerApi,
    memory: gpuMemoryBudgetApi,
    brandLighting: brandLightingApi,
    fps: fpsMonitorApi,
    prefetch: scenePrefetchApi,
    analytics: sceneAnalyticsApi,
    a11y: sceneA11yApi,
    idle: idleLoaderApi,
    layers: layerStreamerApi,
  },
};

export type ExperienceApi = typeof experienceApi;
