/**
 * Experience registry — Create → Run → Pause → Resume → Dispose.
 */

import { lifecycleApi } from '../lifecycle';
import { animationApi } from '../animation';
import {
  createExperienceMachine,
  transitionExperience,
  disposeExperienceMachine,
} from './experience-state';

export type ExperienceHandle = {
  id: string;
  pause: () => void;
  resume: () => void;
  dispose: () => void;
};

const handles = new Map<string, ExperienceHandle>();

export function registerExperience(handle: ExperienceHandle) {
  createExperienceMachine(handle.id);
  transitionExperience(handle.id, 'loading');
  handles.set(handle.id, handle);

  const unLife = lifecycleApi.own(
    `experience:${handle.id}`,
    'experience',
    () => {
      try {
        handle.dispose();
      } catch {
        /* ignore */
      }
      handles.delete(handle.id);
      disposeExperienceMachine(handle.id);
    },
    {
      pause: () => {
        handle.pause();
        transitionExperience(handle.id, 'paused');
      },
      resume: () => {
        handle.resume();
        transitionExperience(handle.id, 'interactive');
      },
    },
  );

  const unAnim = animationApi.register({
    pause: handle.pause,
    resume: handle.resume,
  });

  return () => {
    unAnim();
    unLife();
    handles.delete(handle.id);
  };
}

export function pauseAllExperience() {
  for (const h of handles.values()) h.pause();
}

export function resumeAllExperience() {
  for (const h of handles.values()) h.resume();
}

export function experienceCount() {
  return handles.size;
}

export const experienceRegistryApi = {
  register: registerExperience,
  pauseAll: pauseAllExperience,
  resumeAll: resumeAllExperience,
  count: experienceCount,
};
