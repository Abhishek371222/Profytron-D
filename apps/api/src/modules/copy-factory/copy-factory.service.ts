import { Injectable, Logger } from '@nestjs/common';
import CopyFactory from 'metaapi.cloud-copyfactory-sdk';
import { MetaTraderAdapter } from '../broker/adapters/metatrader.adapter';
import { isMasterOnlyExecution } from '../../common/utils/execution-mode.util';

export type CopyFactoryRole = 'PROVIDER' | 'SUBSCRIBER';

@Injectable()
export class CopyFactoryService {
  private readonly logger = new Logger(CopyFactoryService.name);
  private readonly client: CopyFactory | null;

  constructor(private readonly mtAdapter: MetaTraderAdapter) {
    const token = process.env.METAAPI_TOKEN;
    this.client = token ? new CopyFactory(token) : null;
  }

  isEnabled(): boolean {
    // Architecture 2 default: CopyFactory subscriber linking is off unless
    // explicitly forced (expensive). Master detection uses MasterSync instead.
    if (process.env.ALLOW_METAAPI_SUBSCRIBERS === 'true') {
      return (
        !!this.client &&
        this.mtAdapter.isLive &&
        process.env.COPYFACTORY_ENABLED !== 'false'
      );
    }
    if (isMasterOnlyExecution()) return false;
    return (
      !!this.client &&
      this.mtAdapter.isLive &&
      process.env.COPYFACTORY_ENABLED !== 'false'
    );
  }

  private get configurationApi() {
    if (!this.client) {
      throw new Error('CopyFactory is not configured (missing METAAPI_TOKEN)');
    }
    return this.client.configurationApi;
  }

  async ensureAccountRole(
    metaApiAccountId: string,
    role: CopyFactoryRole,
  ): Promise<void> {
    if (!this.isEnabled()) return;
    await this.mtAdapter.ensureCopyFactoryRoles(metaApiAccountId, [role]);
    await this.mtAdapter.waitForDeployed(metaApiAccountId);
  }

  /**
   * Register the admin MetaAPI account as a CopyFactory provider strategy.
   * Returns the CopyFactory strategy id (e.g. "AbCd").
   */
  async provisionProviderStrategy(input: {
    profytronStrategyId: string;
    providerMetaApiAccountId: string;
    name: string;
    description: string;
    existingCopyFactoryStrategyId?: string | null;
  }): Promise<string> {
    if (!this.isEnabled()) {
      this.logger.warn(
        'CopyFactory disabled — skipping provider strategy provision',
      );
      return input.existingCopyFactoryStrategyId ?? '';
    }

    await this.ensureAccountRole(input.providerMetaApiAccountId, 'PROVIDER');

    const strategyId =
      input.existingCopyFactoryStrategyId ||
      (await this.configurationApi.generateStrategyId()).id;

    await this.configurationApi.updateStrategy(strategyId, {
      name: input.name,
      description: input.description,
      accountId: input.providerMetaApiAccountId,
      // 1:1 lots — required for ~$100 accounts when master trades 0.01.
      // Balance scaling rounds 0.01*(120/300) below min lot and skips the copy.
      tradeSizeScaling: { mode: 'none' },
      copyStopLoss: true,
      copyTakeProfit: true,
      skipPendingOrders: false,
    });

    this.logger.log(
      `CopyFactory provider strategy ${strategyId} linked to account ${input.providerMetaApiAccountId}`,
    );
    return strategyId;
  }

  async linkSubscriber(input: {
    subscriberMetaApiAccountId: string;
    copyFactoryStrategyId: string;
    multiplier?: number;
    subscriberName?: string;
  }): Promise<void> {
    if (!this.isEnabled() || !input.copyFactoryStrategyId) return;

    await this.ensureAccountRole(
      input.subscriberMetaApiAccountId,
      'SUBSCRIBER',
    );

    const existing = await this.safeGetSubscriber(
      input.subscriberMetaApiAccountId,
    );
    const subscriptions = existing?.subscriptions ?? [];
    const without = subscriptions.filter(
      (s: { strategyId: string }) =>
        s.strategyId !== input.copyFactoryStrategyId,
    );

    await this.configurationApi.updateSubscriber(
      input.subscriberMetaApiAccountId,
      {
        name:
          input.subscriberName ||
          existing?.name ||
          `Profytron ${input.subscriberMetaApiAccountId.slice(0, 8)}`,
        subscriptions: [
          ...without,
          {
            strategyId: input.copyFactoryStrategyId,
            multiplier: input.multiplier ?? 1,
            skipPendingOrders: false,
          },
        ],
      },
    );

    this.logger.log(
      `CopyFactory subscriber ${input.subscriberMetaApiAccountId} linked to strategy ${input.copyFactoryStrategyId}`,
    );
  }

  async unlinkSubscriber(input: {
    subscriberMetaApiAccountId: string;
    copyFactoryStrategyId: string;
  }): Promise<void> {
    if (!this.isEnabled() || !input.copyFactoryStrategyId) return;

    const existing = await this.safeGetSubscriber(
      input.subscriberMetaApiAccountId,
    );
    if (!existing?.subscriptions?.length) return;

    const remaining = existing.subscriptions.filter(
      (s: { strategyId: string }) =>
        s.strategyId !== input.copyFactoryStrategyId,
    );

    await this.configurationApi.updateSubscriber(
      input.subscriberMetaApiAccountId,
      {
        name: existing.name,
        subscriptions: remaining,
      },
    );

    this.logger.log(
      `CopyFactory subscriber ${input.subscriberMetaApiAccountId} unlinked from ${input.copyFactoryStrategyId}`,
    );
  }

  private async safeGetSubscriber(subscriberId: string) {
    try {
      return await this.configurationApi.getSubscriber(subscriberId);
    } catch {
      return null;
    }
  }
}
