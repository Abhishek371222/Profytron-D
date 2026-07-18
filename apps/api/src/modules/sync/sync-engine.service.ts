import { Injectable } from '@nestjs/common';
import { SyncStateService } from './sync-state.service';
import {
  diffEquity,
  diffPositions,
  positionFingerprint,
  type EquitySnapshot,
  type PositionSnapshot,
} from './sync-diff';

export type SyncStatusPhase =
  | 'idle'
  | 'synchronizing'
  | 'fresh'
  | 'degraded'
  | 'recovering';

export type SyncDeltaPayload = {
  entity: 'equity' | 'positions' | 'history' | 'status';
  brokerAccountId: string;
  version: number;
  syncedAt: number;
  upserts: unknown[];
  removes: string[];
  status?: SyncStatusPhase;
  durationMs?: number;
  /** When false, callers should skip WS emit (no change). */
  changed: boolean;
};

/** Feature flag — set SYNC_ENGINE_ENABLED=0 to disable watermark/delta path. */
export function isSyncEngineEnabled(): boolean {
  return process.env.SYNC_ENGINE_ENABLED !== '0';
}

@Injectable()
export class SyncEngineService {
  private readonly timings: Array<Record<string, unknown>> = [];

  constructor(private readonly state: SyncStateService) {}

  private recordTiming(entry: Record<string, unknown>) {
    this.timings.push({ at: new Date().toISOString(), ...entry });
    if (this.timings.length > 100) this.timings.shift();
  }

  getRecentTimings() {
    return [...this.timings];
  }

  async commitEquity(
    brokerAccountId: string,
    equity: EquitySnapshot,
  ): Promise<SyncDeltaPayload> {
    const t0 = Date.now();
    if (!isSyncEngineEnabled()) {
      return {
        entity: 'equity',
        brokerAccountId,
        version: Date.now(),
        syncedAt: Date.now(),
        upserts: [equity],
        removes: [],
        changed: true,
        durationMs: 0,
      };
    }

    const prev = await this.state.getWatermark(brokerAccountId, 'equity');
    const diff = diffEquity(prev?.equity ?? null, equity);
    if (!diff.changed) {
      return {
        entity: 'equity',
        brokerAccountId,
        version: prev?.version ?? (await this.state.getVersion(brokerAccountId)),
        syncedAt: prev?.syncedAt ?? Date.now(),
        upserts: [],
        removes: [],
        changed: false,
        durationMs: Date.now() - t0,
      };
    }

    const version = await this.state.bumpVersion(brokerAccountId);
    const syncedAt = Date.now();
    const redisMs = await this.state.setWatermark(brokerAccountId, 'equity', {
      version,
      syncedAt,
      equity,
    });
    this.recordTiming({
      entity: 'equity',
      brokerAccountId,
      redisMs,
      durationMs: Date.now() - t0,
      version,
    });

    return {
      entity: 'equity',
      brokerAccountId,
      version,
      syncedAt,
      upserts: diff.upserts,
      removes: [],
      changed: true,
      durationMs: Date.now() - t0,
    };
  }

  async commitPositions(
    brokerAccountId: string,
    positions: PositionSnapshot[],
  ): Promise<SyncDeltaPayload> {
    const t0 = Date.now();
    if (!isSyncEngineEnabled()) {
      return {
        entity: 'positions',
        brokerAccountId,
        version: Date.now(),
        syncedAt: Date.now(),
        upserts: positions,
        removes: [],
        changed: true,
        durationMs: 0,
      };
    }

    const prev = await this.state.getWatermark(brokerAccountId, 'positions');
    const prevPositions = prev?.positions ?? [];
    const fp = positionFingerprint(positions);
    if (prev?.positionsFp === fp) {
      return {
        entity: 'positions',
        brokerAccountId,
        version: prev.version,
        syncedAt: prev.syncedAt,
        upserts: [],
        removes: [],
        changed: false,
        durationMs: Date.now() - t0,
      };
    }

    const diff = diffPositions(prevPositions, positions);
    const version = await this.state.bumpVersion(brokerAccountId);
    const syncedAt = Date.now();
    const redisMs = await this.state.setWatermark(brokerAccountId, 'positions', {
      version,
      syncedAt,
      positions,
      positionsFp: fp,
    });
    this.recordTiming({
      entity: 'positions',
      brokerAccountId,
      redisMs,
      durationMs: Date.now() - t0,
      version,
      upserts: diff.upserts.length,
      removes: diff.removes.length,
    });

    return {
      entity: 'positions',
      brokerAccountId,
      version,
      syncedAt,
      upserts: diff.upserts,
      removes: diff.removes,
      changed: diff.changed,
      durationMs: Date.now() - t0,
    };
  }

  async commitStatus(
    brokerAccountId: string,
    status: SyncStatusPhase,
  ): Promise<SyncDeltaPayload> {
    const version = isSyncEngineEnabled()
      ? await this.state.bumpVersion(brokerAccountId)
      : Date.now();
    const syncedAt = Date.now();
    if (isSyncEngineEnabled()) {
      await this.state.setWatermark(brokerAccountId, 'status', {
        version,
        syncedAt,
        status,
      });
    }
    return {
      entity: 'status',
      brokerAccountId,
      version,
      syncedAt,
      upserts: [],
      removes: [],
      status,
      changed: true,
    };
  }
}
