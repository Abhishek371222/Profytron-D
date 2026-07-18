/**
 * Public Motion Engine API — features import via platform.motion().
 */

export { isMotionEngineEnabled } from './index-flag';

export { motionTokensApi, MOTION_DURATION, MOTION_EASING, MOTION_TRANSITION, durationSeconds, resolveTransition } from './motion-tokens';
export type { MotionDurationToken, MotionTransitionToken } from './motion-tokens';

export { motionSpringsApi, MOTION_SPRINGS } from './motion-springs';
export { motionPresets, motionPresetsApi } from './motion-presets';
export { motionQualityApi } from './motion-quality';
export type { MotionQuality } from './motion-quality';
export { motionQueueApi } from './motion-queue';
export type { MotionQueueLane } from './motion-queue';
export { motionConflictsApi } from './motion-conflicts';
export type { MotionIntent } from './motion-conflicts';
export { motionTimelineApi } from './motion-timeline';
export type { MotionTimelineState } from './motion-timeline';
export { motionRecoveryApi } from './motion-recovery';
export { motionRegistryApi } from './motion-registry';
export { motionAccessibilityApi } from './motion-accessibility';
export { motionObservabilityApi } from './motion-observability';
export { motionNumberApi } from './motion-number';
export { motionTransitionsApi } from './motion-transitions';
export { motionGesturesApi } from './motion-gestures';
export { motionLayoutApi } from './motion-layout';
export { motionContractsApi, MOTION_CONTRACTS } from './motion-contracts';
export { motionEngineApi, startMotionEngine } from './motion-engine';
export { MotionProfilerOverlay } from './motion-profiler';
export { useAnimatedNumber } from './useAnimatedNumber';
export { useModalMotionProps } from './useModalMotionProps';

import { motionTokensApi } from './motion-tokens';
import { motionSpringsApi } from './motion-springs';
import { motionPresetsApi } from './motion-presets';
import { motionQualityApi } from './motion-quality';
import { motionQueueApi } from './motion-queue';
import { motionConflictsApi } from './motion-conflicts';
import { motionTimelineApi } from './motion-timeline';
import { motionRecoveryApi } from './motion-recovery';
import { motionRegistryApi } from './motion-registry';
import { motionAccessibilityApi } from './motion-accessibility';
import { motionObservabilityApi } from './motion-observability';
import { motionNumberApi } from './motion-number';
import { motionTransitionsApi } from './motion-transitions';
import { motionGesturesApi } from './motion-gestures';
import { motionLayoutApi } from './motion-layout';
import { motionContractsApi } from './motion-contracts';
import { motionEngineApi } from './motion-engine';
import { isMotionEngineEnabled } from './index-flag';

export const motionApi = {
  enabled: isMotionEngineEnabled,
  tokens: motionTokensApi,
  springs: motionSpringsApi,
  presets: motionPresetsApi,
  quality: motionQualityApi,
  queue: motionQueueApi,
  conflicts: motionConflictsApi,
  timeline: motionTimelineApi,
  recovery: motionRecoveryApi,
  registry: motionRegistryApi,
  a11y: motionAccessibilityApi,
  observability: motionObservabilityApi,
  number: motionNumberApi,
  transitions: motionTransitionsApi,
  gestures: motionGesturesApi,
  layout: motionLayoutApi,
  contracts: motionContractsApi,
  engine: motionEngineApi,
};

export type MotionApi = typeof motionApi;
