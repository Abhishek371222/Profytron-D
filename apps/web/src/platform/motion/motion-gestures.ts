/**
 * Gesture motion helpers — use presets, not ad-hoc springs.
 */

import { motionPresets } from './motion-presets';
import { getMotionQuality } from './motion-quality';

export function gestureHoverProps() {
  if (getMotionQuality() === 'minimal') {
    return {
      whileHover: undefined,
      transition: motionPresets.hover(),
    };
  }
  return {
    whileHover: motionPresets.hoverTransform(),
    whileTap: motionPresets.pressTransform(),
    transition: motionPresets.hover(),
  };
}

export function gestureTapProps() {
  return {
    whileTap: motionPresets.pressTransform(),
    transition: motionPresets.press(),
  };
}

export const motionGesturesApi = {
  hover: gestureHoverProps,
  tap: gestureTapProps,
};
