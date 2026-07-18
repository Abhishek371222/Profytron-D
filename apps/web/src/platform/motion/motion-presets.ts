/**
 * Reusable motion presets — Navigation, Card, Hover, Chart, Modal, Toast, etc.
 * Every animation must reuse these; no arbitrary easing curves.
 */

import {
  durationSeconds,
  resolveTransition,
  MOTION_EASING,
} from './motion-tokens';
import { getSpring } from './motion-springs';
import {
  getMotionQuality,
  qualityAllowsSpring,
  qualityDurationScale,
  qualityAllowsDecorative,
} from './motion-quality';

export type FramerTransition = {
  type?: 'spring' | 'tween';
  duration?: number;
  ease?: readonly number[] | string;
  stiffness?: number;
  damping?: number;
  mass?: number;
  delay?: number;
};

function scaleDuration(seconds: number): number {
  const scale = qualityDurationScale();
  if (scale === 0) return 0;
  return seconds * scale;
}

function maybeSpring(
  springToken: Parameters<typeof getSpring>[0],
  fallback: FramerTransition,
): FramerTransition {
  if (getMotionQuality() === 'minimal') {
    return { duration: 0, ease: 'linear' };
  }
  if (qualityAllowsSpring()) {
    return { ...getSpring(springToken) };
  }
  return fallback;
}

export const motionPresets = {
  navigation: (): FramerTransition => {
    const t = resolveTransition('Navigation');
    return {
      duration: scaleDuration(t.duration),
      ease: t.ease as FramerTransition['ease'],
    };
  },

  card: (): FramerTransition =>
    maybeSpring('gentle', {
      duration: scaleDuration(durationSeconds('Standard')),
      ease: MOTION_EASING.Smooth as unknown as FramerTransition['ease'],
    }),

  hover: (): FramerTransition => {
    if (!qualityAllowsDecorative()) {
      return { duration: scaleDuration(durationSeconds('Instant')) };
    }
    return maybeSpring('hover', {
      duration: scaleDuration(durationSeconds('Fast')),
      ease: MOTION_EASING.Out as unknown as FramerTransition['ease'],
    });
  },

  chart: (): FramerTransition => ({
    duration: scaleDuration(durationSeconds('Fast')),
    ease: MOTION_EASING.Out as unknown as FramerTransition['ease'],
  }),

  modal: (): FramerTransition =>
    maybeSpring('modal', {
      duration: scaleDuration(durationSeconds('Standard')),
      ease: MOTION_EASING.Smooth as unknown as FramerTransition['ease'],
    }),

  toast: (): FramerTransition => {
    const t = resolveTransition('Toast');
    return {
      duration: scaleDuration(t.duration),
      ease: t.ease as FramerTransition['ease'],
    };
  },

  drawer: (): FramerTransition =>
    maybeSpring('drawer', {
      duration: scaleDuration(durationSeconds('Slow')),
      ease: MOTION_EASING.Smooth as unknown as FramerTransition['ease'],
    }),

  panel: (): FramerTransition => ({
    duration: scaleDuration(durationSeconds('Standard')),
    ease: MOTION_EASING.Smooth as unknown as FramerTransition['ease'],
  }),

  counter: (): FramerTransition =>
    maybeSpring('counter', {
      duration: scaleDuration(durationSeconds('Standard')),
      ease: MOTION_EASING.Smooth as unknown as FramerTransition['ease'],
    }),

  expansion: (): FramerTransition => {
    const t = resolveTransition('Expansion');
    return {
      duration: scaleDuration(t.duration),
      ease: t.ease as FramerTransition['ease'],
    };
  },

  press: (): FramerTransition => ({
    duration: scaleDuration(durationSeconds('Instant')),
    ease: MOTION_EASING.Out as unknown as FramerTransition['ease'],
  }),

  focus: (): FramerTransition => {
    const t = resolveTransition('Focus');
    return {
      duration: scaleDuration(t.duration),
      ease: t.ease as FramerTransition['ease'],
    };
  },

  /** Modal enter/exit variants for framer-motion. */
  modalVariants: () => {
    const minimal = getMotionQuality() === 'minimal';
    return {
      backdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: {
          duration: scaleDuration(durationSeconds('Fast')),
          ease: MOTION_EASING.Out,
        },
      },
      panel: {
        initial: minimal
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.95, y: 12 },
        animate: minimal
          ? { opacity: 1 }
          : { opacity: 1, scale: 1, y: 0 },
        exit: minimal
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.95, y: 12 },
        transition: motionPresets.modal(),
      },
    };
  },

  /** Toast enter/exit. */
  toastVariants: () => {
    const minimal = getMotionQuality() === 'minimal';
    return {
      initial: minimal ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 },
      animate: minimal ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 },
      exit: minimal ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 },
      transition: motionPresets.toast(),
    };
  },

  /** Hover elevation + subtle scale (design language). */
  hoverTransform: () => {
    if (!qualityAllowsDecorative()) return { scale: 1, y: 0 };
    return { scale: 1.02, y: -1 };
  },

  /** Press compression. */
  pressTransform: () => ({ scale: 0.97, y: 0 }),
};

export const motionPresetsApi = motionPresets;
