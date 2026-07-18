/**
 * Motion registry — Create → Run → Pause → Resume → Dispose.
 * Bridges lifecycleApi + animationApi. No leaked timelines.
 */

import { lifecycleApi } from '../lifecycle';
import { animationApi } from '../animation';
import {
  timelineCreate,
  timelineTransition,
} from './motion-timeline';
import { registerRecoverable, recoverMotion } from './motion-recovery';
import type { RecoveryMode } from './motion-recovery';

export type MotionHandle = {
  id: string;
  pause: () => void;
  resume: () => void;
  dispose: () => void;
  finish?: () => void;
  cancel?: () => void;
};

const handles = new Map<string, MotionHandle>();

export function registerMotion(handle: MotionHandle): () => void {
  timelineCreate(handle.id);
  timelineTransition(handle.id, 'running');

  handles.set(handle.id, handle);

  const unLife = lifecycleApi.own(
    `motion:${handle.id}`,
    'motion',
    () => {
      try {
        handle.dispose();
      } catch {
        /* ignore */
      }
      handles.delete(handle.id);
      timelineTransition(handle.id, 'disposed');
    },
    { pause: handle.pause, resume: handle.resume },
  );

  const unAnim = animationApi.register({
    pause: handle.pause,
    resume: handle.resume,
  });

  const unRec = registerRecoverable({
    id: handle.id,
    finish: () => handle.finish?.() ?? handle.dispose(),
    cancel: () => handle.cancel?.() ?? handle.dispose(),
    resume: handle.resume,
  });

  return () => {
    unRec();
    unAnim();
    unLife();
    handles.delete(handle.id);
  };
}

export function pauseMotion(id: string) {
  handles.get(id)?.pause();
  timelineTransition(id, 'interrupted');
}

export function resumeMotion(id: string) {
  handles.get(id)?.resume();
  timelineTransition(id, 'running');
}

export function disposeMotion(id: string, recovery: RecoveryMode = 'finish') {
  recoverMotion(id, recovery);
  lifecycleApi.dispose(`motion:${id}`);
  handles.delete(id);
  timelineTransition(id, 'disposed');
}

export function pauseAllMotion() {
  for (const h of handles.values()) h.pause();
}

export function resumeAllMotion() {
  for (const h of handles.values()) h.resume();
}

export function motionCount() {
  return handles.size;
}

export function listMotionIds() {
  return [...handles.keys()];
}

export const motionRegistryApi = {
  register: registerMotion,
  pause: pauseMotion,
  resume: resumeMotion,
  dispose: disposeMotion,
  pauseAll: pauseAllMotion,
  resumeAll: resumeAllMotion,
  count: motionCount,
  list: listMotionIds,
};
