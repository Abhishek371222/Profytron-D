import { Injectable } from '@nestjs/common';
import { TutorialStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActivationService,
  ACTIVATION_EVENTS,
} from '../growth/activation.service';

const DEFAULT_TOUR_ID = 'main';

@Injectable()
export class TutorialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activation: ActivationService,
  ) {}

  async getProgress(userId: string, tourId: string = DEFAULT_TOUR_ID) {
    const existing = await this.prisma.tutorialProgress.findUnique({
      where: { userId_tourId: { userId, tourId } },
    });
    if (existing) return existing;

    return this.prisma.tutorialProgress.create({
      data: { userId, tourId },
    });
  }

  async updateProgress(
    userId: string,
    tourId: string = DEFAULT_TOUR_ID,
    data: { status: TutorialStatus; currentStepId?: string | null },
  ) {
    const existing = await this.prisma.tutorialProgress.findUnique({
      where: { userId_tourId: { userId, tourId } },
    });
    const now = new Date();
    const isFreshStart =
      data.status === 'IN_PROGRESS' && existing?.status !== 'IN_PROGRESS';

    const progress = await this.prisma.tutorialProgress.upsert({
      where: { userId_tourId: { userId, tourId } },
      create: {
        userId,
        tourId,
        status: data.status,
        currentStepId: data.currentStepId ?? null,
        startedAt: data.status === 'IN_PROGRESS' ? now : null,
        completedAt: data.status === 'COMPLETED' ? now : null,
      },
      update: {
        status: data.status,
        currentStepId: data.currentStepId ?? null,
        ...(isFreshStart ? { startedAt: now } : {}),
        ...(data.status === 'COMPLETED' ? { completedAt: now } : {}),
      },
    });

    if (isFreshStart) {
      await this.activation.track(userId, ACTIVATION_EVENTS.TUTORIAL_STARTED, {
        tourId,
      });
    }
    if (data.status === 'COMPLETED') {
      await this.activation.track(
        userId,
        ACTIVATION_EVENTS.TUTORIAL_COMPLETED,
        {
          tourId,
        },
      );
    }

    return progress;
  }
}
