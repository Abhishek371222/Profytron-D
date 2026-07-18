/**
 * Layout motion helpers — layoutId / layout animations gated by quality.
 */

import { getMotionQuality, qualityAllowsDecorative } from './motion-quality';
import { motionPresets } from './motion-presets';

export function layoutMotionEnabled(): boolean {
  return getMotionQuality() !== 'minimal' && qualityAllowsDecorative();
}

export function layoutTransition() {
  return motionPresets.panel();
}

/** Safe layoutId — undefined when layout motion disabled. */
export function layoutId(id: string): string | undefined {
  return layoutMotionEnabled() ? id : undefined;
}

export const motionLayoutApi = {
  enabled: layoutMotionEnabled,
  transition: layoutTransition,
  layoutId,
};
