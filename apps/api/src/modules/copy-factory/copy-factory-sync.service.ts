import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

export type CopyFactoryJobAction = 'link' | 'unlink' | 'provision_provider';

export interface CopyFactorySyncJob {
  action: CopyFactoryJobAction;
  subscriptionId?: string;
  strategyId?: string;
  userId?: string;
}

@Injectable()
export class CopyFactorySyncService {
  private readonly logger = new Logger(CopyFactorySyncService.name);

  constructor(
    @InjectQueue('copyfactory_sync') private readonly queue: Queue,
  ) {}

  async enqueueLinkSubscription(subscriptionId: string): Promise<void> {
    await this.addJob({
      action: 'link',
      subscriptionId,
    });
  }

  async enqueueUnlinkSubscription(subscriptionId: string): Promise<void> {
    await this.addJob({
      action: 'unlink',
      subscriptionId,
    });
  }

  async enqueueProvisionProvider(strategyId: string): Promise<void> {
    await this.addJob({
      action: 'provision_provider',
      strategyId,
    });
  }

  async enqueueLinkUserSubscriptions(userId: string): Promise<void> {
    await this.addJob({
      action: 'link',
      userId,
    });
  }

  private async addJob(payload: CopyFactorySyncJob): Promise<void> {
    const jobId = [
      payload.action,
      payload.subscriptionId ?? '',
      payload.strategyId ?? '',
      payload.userId ?? '',
    ].join(':');

    try {
      await this.queue.add('sync_copyfactory', payload, {
        jobId: jobId || undefined,
        removeOnComplete: true,
        removeOnFail: 50,
        attempts: 4,
        backoff: { type: 'exponential', delay: 5000 },
      });
    } catch (err) {
      this.logger.warn(`CopyFactory queue skipped: ${(err as Error).message}`);
    }
  }
}
