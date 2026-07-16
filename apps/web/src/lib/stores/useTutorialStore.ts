import { create } from 'zustand';
import { tutorialApi, type TutorialStatus } from '@/lib/api/tutorial';
import { mainTourSteps, MAIN_TOUR_ID, type TourStep } from '@/lib/tours/mainTour';
import { trackEvent } from '@/lib/analytics/track';

function persist(tourId: string, status: TutorialStatus, currentStepId?: string | null) {
  tutorialApi.updateProgress(tourId, status, currentStepId ?? null).catch(() => {
    /* best-effort — tour still runs client-side even if this fails */
  });
}

type TutorialState = {
  active: boolean;
  tourId: string;
  steps: TourStep[];
  currentIndex: number;
  actionSatisfied: boolean;
  start: () => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  notifyAction: (actionId: string) => void;
};

export const useTutorialStore = create<TutorialState>((set, get) => ({
  active: false,
  tourId: MAIN_TOUR_ID,
  steps: mainTourSteps,
  currentIndex: 0,
  actionSatisfied: false,

  start: () => {
    const { tourId, steps } = get();
    set({ active: true, currentIndex: 0, actionSatisfied: false });
    trackEvent('tour_started', { tourId });
    persist(tourId, 'IN_PROGRESS', steps[0]?.id ?? null);
  },

  next: () => {
    const { currentIndex, steps, tourId } = get();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= steps.length) {
      set({ active: false });
      trackEvent('tour_completed', { tourId });
      persist(tourId, 'COMPLETED', steps[steps.length - 1]?.id ?? null);
      return;
    }
    set({ currentIndex: nextIndex, actionSatisfied: false });
    trackEvent('tour_step_viewed', { tourId, stepId: steps[nextIndex].id });
    persist(tourId, 'IN_PROGRESS', steps[nextIndex].id);
  },

  back: () => {
    const { currentIndex } = get();
    if (currentIndex === 0) return;
    set({ currentIndex: currentIndex - 1, actionSatisfied: false });
  },

  skip: () => {
    const { tourId, currentIndex, steps } = get();
    set({ active: false });
    trackEvent('tour_skipped', { tourId, stepId: steps[currentIndex]?.id });
    persist(tourId, 'SKIPPED', steps[currentIndex]?.id ?? null);
  },

  notifyAction: (actionId: string) => {
    const { active, steps, currentIndex } = get();
    if (!active) return;
    const step = steps[currentIndex];
    if (step?.waitForAction === actionId) {
      set({ actionSatisfied: true });
    }
  },
}));
