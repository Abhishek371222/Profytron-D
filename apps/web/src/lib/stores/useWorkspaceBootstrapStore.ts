import { create } from 'zustand';

export type BootstrapStepId =
  | 'session'
  | 'profile'
  | 'preferences'
  | 'accounts'
  | 'workspace'
  | 'ready';

type WorkspaceBootstrapState = {
  /** Full-screen prep is showing — app shell stays unmounted so loading is visible, not hidden. */
  active: boolean;
  exiting: boolean;
  destination: string | null;
  startedAt: number;
  completedSteps: BootstrapStepId[];
  startBootstrap: (destination?: string | null) => void;
  completeStep: (step: BootstrapStepId) => void;
  beginExit: () => void;
  finish: () => void;
};

const ALL_STEPS: BootstrapStepId[] = [
  'session',
  'profile',
  'preferences',
  'accounts',
  'workspace',
  'ready',
];

export function bootstrapProgress(completed: BootstrapStepId[]): number {
  if (completed.includes('ready')) return 100;
  const unique = new Set(completed);
  return Math.min(96, Math.round((unique.size / (ALL_STEPS.length - 1)) * 92));
}

/** True while the prep screen owns the viewport (app UI should not mount yet). */
export function selectBootstrapBlocksApp(s: WorkspaceBootstrapState) {
  return s.active;
}

export const useWorkspaceBootstrapStore = create<WorkspaceBootstrapState>((set, get) => ({
  active: false,
  exiting: false,
  destination: null,
  startedAt: 0,
  completedSteps: [],
  startBootstrap: (destination = '/dashboard') => {
    set({
      active: true,
      exiting: false,
      destination: destination || '/dashboard',
      startedAt: Date.now(),
      completedSteps: ['session'],
    });
  },
  completeStep: (step) => {
    const { completedSteps, active } = get();
    if (!active) return;
    if (completedSteps.includes(step)) return;
    set({ completedSteps: [...completedSteps, step] });
  },
  beginExit: () => {
    if (!get().active) return;
    set((s) => ({
      exiting: true,
      completedSteps: s.completedSteps.includes('ready')
        ? s.completedSteps
        : [...s.completedSteps, 'ready'],
    }));
  },
  finish: () => {
    set({
      active: false,
      exiting: false,
      destination: null,
      startedAt: 0,
      completedSteps: [],
    });
  },
}));
