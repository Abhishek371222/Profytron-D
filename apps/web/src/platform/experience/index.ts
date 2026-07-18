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
};

export type ExperienceApi = typeof experienceApi;
