/**
 * GPU memory budgets — hard caps by device tier.
 * On exceed: destroy oldest scene, keep poster, emit analytics.
 */

import { getGpuQuality, type GpuQuality } from './gpu-quality';

export type GpuMemoryTier = 'desktopHigh' | 'medium' | 'low' | 'mobile';

/** Max GPU memory in MB by tier. Mobile = 0 → never mount WebGL. */
export const GPU_MEMORY_BUDGETS_MB: Record<GpuMemoryTier, number> = {
  desktopHigh: 120,
  medium: 60,
  low: 20,
  mobile: 0,
};

export function detectIsMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

export function gpuMemoryTier(q: GpuQuality = getGpuQuality()): GpuMemoryTier {
  if (detectIsMobileViewport()) return 'mobile';
  switch (q) {
    case 'ultra':
    case 'high':
      return 'desktopHigh';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    case 'minimal':
      return 'mobile';
  }
}

export function gpuMemoryBudgetMb(q: GpuQuality = getGpuQuality()): number {
  return GPU_MEMORY_BUDGETS_MB[gpuMemoryTier(q)];
}

/** Whether any WebGL mount is allowed under current budget tier. */
export function gpuMemoryAllowsWebGL(q: GpuQuality = getGpuQuality()): boolean {
  return gpuMemoryBudgetMb(q) > 0;
}

export type MemoryLedgerEntry = {
  key: string;
  slotId: string;
  costMb: number;
  mountedAt: number;
};

export class GpuMemoryLedger {
  private entries: MemoryLedgerEntry[] = [];

  totalMb(): number {
    return this.entries.reduce((s, e) => s + e.costMb, 0);
  }

  list(): MemoryLedgerEntry[] {
    return [...this.entries];
  }

  add(entry: MemoryLedgerEntry) {
    this.entries.push(entry);
  }

  remove(slotId: string) {
    this.entries = this.entries.filter((e) => e.slotId !== slotId);
  }

  /** Oldest first for eviction. */
  oldest(): MemoryLedgerEntry | undefined {
    return [...this.entries].sort((a, b) => a.mountedAt - b.mountedAt)[0];
  }

  /** Evict until under budget; returns evicted slot ids. */
  evictUntilUnder(budgetMb: number): string[] {
    const evicted: string[] = [];
    while (this.totalMb() > budgetMb && this.entries.length > 0) {
      const old = this.oldest();
      if (!old) break;
      this.remove(old.slotId);
      evicted.push(old.slotId);
    }
    return evicted;
  }

  wouldExceed(costMb: number, budgetMb: number): boolean {
    return this.totalMb() + costMb > budgetMb;
  }
}

export const gpuMemoryBudgetApi = {
  budgets: GPU_MEMORY_BUDGETS_MB,
  tier: gpuMemoryTier,
  budgetMb: gpuMemoryBudgetMb,
  allowsWebGL: gpuMemoryAllowsWebGL,
  isMobile: detectIsMobileViewport,
  Ledger: GpuMemoryLedger,
};
