/**
 * Experience state machine: Idle → Loading → Streaming → Interactive → Paused → Disposed
 */

import { metricsApi } from '../metrics';

export type ExperienceLifecycleState =
  | 'idle'
  | 'loading'
  | 'streaming'
  | 'interactive'
  | 'paused'
  | 'disposed';

const ALLOWED: Record<ExperienceLifecycleState, ExperienceLifecycleState[]> = {
  idle: ['loading', 'disposed'],
  loading: ['streaming', 'interactive', 'paused', 'disposed'],
  streaming: ['interactive', 'paused', 'disposed'],
  interactive: ['paused', 'disposed', 'loading'],
  paused: ['interactive', 'loading', 'disposed'],
  disposed: [],
};

type Machine = {
  id: string;
  state: ExperienceLifecycleState;
  updatedAt: number;
};

const machines = new Map<string, Machine>();

function metricsOn() {
  return process.env.NEXT_PUBLIC_PLATFORM_METRICS === '1';
}

export function createExperienceMachine(id: string): Machine {
  const m: Machine = { id, state: 'idle', updatedAt: performance.now() };
  machines.set(id, m);
  return m;
}

export function transitionExperience(
  id: string,
  next: ExperienceLifecycleState,
): Machine | undefined {
  let m = machines.get(id);
  if (!m) m = createExperienceMachine(id);
  if (!ALLOWED[m.state].includes(next)) return m;
  m.state = next;
  m.updatedAt = performance.now();
  if (metricsOn()) {
    metricsApi.mark('experience.state', { id, state: next });
  }
  return m;
}

export function getExperienceState(id: string) {
  return machines.get(id)?.state ?? 'idle';
}

export function disposeExperienceMachine(id: string) {
  transitionExperience(id, 'disposed');
  machines.delete(id);
}

export function listExperienceMachines() {
  return [...machines.values()];
}

export const experienceStateApi = {
  create: createExperienceMachine,
  transition: transitionExperience,
  get: getExperienceState,
  dispose: disposeExperienceMachine,
  list: listExperienceMachines,
};
