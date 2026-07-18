import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../auth/redis.service';
import type { EquitySnapshot, PositionSnapshot } from './sync-diff';

export type SyncEntity = 'equity' | 'positions' | 'history' | 'status';

export type SyncWatermark = {
  version: number;
  syncedAt: number;
  equity?: EquitySnapshot | null;
  positions?: PositionSnapshot[];
  positionsFp?: string;
  status?: string;
};

const TTL_SEC = 60 * 60 * 24; // 24h
const KEY = (accountId: string, entity: SyncEntity) =>
  `sync:acct:${accountId}:${entity}`;
const VER_KEY = (accountId: string) => `sync:acct:${accountId}:version`;

@Injectable()
export class SyncStateService {
  private readonly logger = new Logger(SyncStateService.name);

  constructor(private readonly redis: RedisService) {}

  async getWatermark(
    accountId: string,
    entity: SyncEntity,
  ): Promise<SyncWatermark | null> {
    try {
      const raw = await this.redis.get(KEY(accountId, entity));
      if (!raw) return null;
      return JSON.parse(raw) as SyncWatermark;
    } catch (err) {
      this.logger.warn(
        `sync watermark read failed: ${(err as Error).message}`,
      );
      return null;
    }
  }

  async setWatermark(
    accountId: string,
    entity: SyncEntity,
    watermark: SyncWatermark,
  ): Promise<number> {
    const t0 = Date.now();
    await this.redis.set(
      KEY(accountId, entity),
      JSON.stringify(watermark),
      TTL_SEC,
    );
    return Date.now() - t0;
  }

  /** Monotonic account-level sync version. Never clears on soft failure. */
  async bumpVersion(accountId: string): Promise<number> {
    const raw = await this.redis.get(VER_KEY(accountId));
    const next = (Number(raw) || 0) + 1;
    await this.redis.set(VER_KEY(accountId), String(next), TTL_SEC);
    return next;
  }

  async getVersion(accountId: string): Promise<number> {
    const raw = await this.redis.get(VER_KEY(accountId));
    return Number(raw) || 0;
  }
}
