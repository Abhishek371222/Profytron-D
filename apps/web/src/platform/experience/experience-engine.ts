/**
 * Experience engine orchestrator.
 */

import { wireGpuQualityFromMotion, syncGpuFromMotion } from './gpu-quality';
import { pauseAllExperience, resumeAllExperience } from './experience-registry';
import { isExperienceEngineEnabled } from './index-flag';

let started = false;

export function startExperienceEngine() {
  if (started || typeof window === 'undefined') return;
  if (!isExperienceEngineEnabled()) return;
  started = true;
  wireGpuQualityFromMotion();
  syncGpuFromMotion();

  const onVis = () => {
    if (document.visibilityState === 'hidden') pauseAllExperience();
    else {
      resumeAllExperience();
      syncGpuFromMotion();
    }
  };
  document.addEventListener('visibilitychange', onVis);

  return () => {
    document.removeEventListener('visibilitychange', onVis);
    started = false;
  };
}

export function isExperienceEngineStarted() {
  return started;
}

export const experienceEngineApi = {
  start: startExperienceEngine,
  isStarted: isExperienceEngineStarted,
};
