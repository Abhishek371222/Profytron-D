/**
 * AI Coach emotion system — professional states only.
 */

import {
  createExperienceMachine,
  transitionExperience,
  getExperienceState,
} from './experience-state';

export type CoachEmotion =
  | 'idle'
  | 'thinking'
  | 'tool'
  | 'streaming'
  | 'speaking'
  | 'success'
  | 'error';

const COACH_ID = 'coach';

let emotion: CoachEmotion = 'idle';
const listeners = new Set<(e: CoachEmotion) => void>();

export function getCoachEmotion(): CoachEmotion {
  return emotion;
}

export function setCoachEmotion(next: CoachEmotion) {
  emotion = next;
  if (!getExperienceState(COACH_ID) || getExperienceState(COACH_ID) === 'idle') {
    createExperienceMachine(COACH_ID);
  }
  if (next === 'idle') {
    transitionExperience(COACH_ID, 'interactive');
  } else if (next === 'thinking' || next === 'tool') {
    transitionExperience(COACH_ID, 'loading');
  } else if (next === 'streaming' || next === 'speaking') {
    transitionExperience(COACH_ID, 'streaming');
  } else if (next === 'success' || next === 'error') {
    transitionExperience(COACH_ID, 'interactive');
  }
  for (const l of listeners) l(next);
}

export function subscribeCoachEmotion(fn: (e: CoachEmotion) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Map chatbot UI flags → emotion. */
export function coachEmotionFromFlags(flags: {
  loading?: boolean;
  streaming?: boolean;
  error?: boolean;
  success?: boolean;
  speaking?: boolean;
  tool?: boolean;
}): CoachEmotion {
  if (flags.error) return 'error';
  if (flags.success) return 'success';
  if (flags.speaking) return 'speaking';
  if (flags.tool) return 'tool';
  if (flags.streaming) return 'streaming';
  if (flags.loading) return 'thinking';
  return 'idle';
}

export const coachVisualApi = {
  get: getCoachEmotion,
  set: setCoachEmotion,
  subscribe: subscribeCoachEmotion,
  fromFlags: coachEmotionFromFlags,
};
