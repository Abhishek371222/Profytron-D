import { apiClient, unwrapApiResponse } from './client';

export type TutorialStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export type TutorialProgress = {
  id: string;
  userId: string;
  tourId: string;
  status: TutorialStatus;
  currentStepId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export const tutorialApi = {
  async getProgress(tourId: string = 'main') {
    const res = await apiClient.get('/tutorial/progress', { params: { tourId } });
    return unwrapApiResponse<TutorialProgress>(res.data);
  },

  async updateProgress(
    tourId: string,
    status: TutorialStatus,
    currentStepId?: string | null,
  ) {
    const res = await apiClient.post('/tutorial/progress', {
      tourId,
      status,
      currentStepId,
    });
    return unwrapApiResponse<TutorialProgress>(res.data);
  },
};
