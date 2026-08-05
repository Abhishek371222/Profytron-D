/**
 * SceneManager — sole WebGL scene owner.
 *
 * The Spline runtime was removed (no scene URLs were ever configured, so the
 * mount path was unreachable). Budgeting, LOD, degrade handling and the poster
 * lifecycle are kept intact so a future renderer can plug into `mountScene`.
 */

'use client';

import {
  SceneRegistry,
  type SceneKey,
  resolveScenePoster,
} from './scene-registry';
import {
  GpuMemoryLedger,
  gpuMemoryBudgetMb,
} from './gpu-memory-budget';
import { evaluateSceneGate, probeLowPowerMode, setLowPowerCached } from './scene-a11y';
import { scheduleIdleLoad } from './idle-loader';
import { trackScene } from './scene-analytics';
import {
  startFpsMonitor,
  stopFpsMonitor,
  subscribeDegrade,
  type DegradeLevel,
} from './fps-monitor';
import { createLayerStreamer, type StreamPhase } from './layer-streamer';
import { prefetchScenesForRoute } from './scene-prefetch';

export type SlotRole = 'interactive' | 'ambient';

export type SceneSlotRegistration = {
  slotId: string;
  key: SceneKey;
  role: SlotRole;
  container: HTMLElement;
  onPhase?: (phase: StreamPhase) => void;
  onFallback?: (reason: string) => void;
  onMounted?: () => void;
  onDisposed?: () => void;
};

type LiveInstance = {
  reg: SceneSlotRegistration;
  mountedAt: number;
  costMb: number;
  phase: StreamPhase;
  disposeScene: (() => void) | null;
  cancelIdle: (() => void) | null;
  streamer: ReturnType<typeof createLayerStreamer> | null;
};

const INTERACTIVE_CAP = 1;
const AMBIENT_CAP = 1;

class SceneManagerImpl {
  private instances = new Map<string, LiveInstance>();
  private ledger = new GpuMemoryLedger();
  private started = false;
  private unsubDegrade: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;

  start() {
    if (typeof window === 'undefined' || this.started) return;
    this.started = true;
    startFpsMonitor();
    this.unsubDegrade = subscribeDegrade((level) => this.onDegrade(level));
    this.visibilityHandler = () => {
      if (document.hidden) this.pauseAll();
      else this.resumeAll();
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
    void probeLowPowerMode().then((v) => setLowPowerCached(v));
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    stopFpsMonitor();
    this.unsubDegrade?.();
    this.unsubDegrade = null;
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    for (const id of [...this.instances.keys()]) {
      this.dispose(id);
    }
  }

  prefetchRoute(pathname: string) {
    prefetchScenesForRoute(pathname);
  }

  register(reg: SceneSlotRegistration) {
    this.start();
    if (this.instances.has(reg.slotId)) {
      this.dispose(reg.slotId);
    }

    const entry = SceneRegistry[reg.key];
    const gate = evaluateSceneGate(reg.key);
    const live: LiveInstance = {
      reg,
      mountedAt: performance.now(),
      costMb: entry.gpuCostMb,
      phase: 'poster',
      disposeScene: null,
      cancelIdle: null,
      streamer: null,
    };
    this.instances.set(reg.slotId, live);

    if (!gate.allowWebGL) {
      trackScene('scene.fallback', {
        key: reg.key,
        reason: gate.reason,
        slotId: reg.slotId,
      });
      reg.onFallback?.(gate.reason);
      return;
    }

    this.enforceCaps(reg.role, reg.slotId);
    this.enforceMemory(reg.slotId, entry.gpuCostMb);

    live.cancelIdle = scheduleIdleLoad(() => {
      void this.mountScene(reg.slotId);
    });
  }

  unregister(slotId: string) {
    this.dispose(slotId);
  }

  getPhase(slotId: string): StreamPhase {
    return this.instances.get(slotId)?.phase ?? 'poster';
  }

  getPoster(key: SceneKey): string {
    return resolveScenePoster(key);
  }

  /**
   * Mount point for a WebGL renderer.
   *
   * No renderer is currently wired up, so every slot resolves to its poster.
   * The gate/budget checks below are the contract a future renderer must
   * satisfy — keep them, and replace the fallback with the mount call.
   */
  private async mountScene(slotId: string) {
    const live = this.instances.get(slotId);
    if (!live) return;
    const { reg } = live;
    const entry = SceneRegistry[reg.key];
    const gate = evaluateSceneGate(reg.key);

    trackScene('scene.fallback', {
      key: reg.key,
      reason: !gate.allowWebGL ? gate.reason : 'no-renderer',
      slotId,
    });
    reg.onFallback?.(!gate.allowWebGL ? gate.reason : 'no-renderer');
    void entry;
  }

  private enforceCaps(role: SlotRole, keepId: string) {
    const sameRole = [...this.instances.values()].filter(
      (i) => i.reg.role === role && i.reg.slotId !== keepId,
    );
    const cap = role === 'interactive' ? INTERACTIVE_CAP : AMBIENT_CAP;
    const overflow = sameRole.length - (cap - 1);
    if (overflow > 0) {
      const sorted = sameRole.sort((a, b) => a.mountedAt - b.mountedAt);
      for (let i = 0; i < overflow; i++) {
        this.dispose(sorted[i].reg.slotId, true);
      }
    }
  }

  private enforceMemory(incomingId: string, costMb: number) {
    const budget = gpuMemoryBudgetMb();
    if (this.ledger.wouldExceed(costMb, budget)) {
      const evicted = this.ledger.evictUntilUnder(Math.max(0, budget - costMb));
      for (const id of evicted) {
        if (id === incomingId) continue;
        this.dispose(id, true);
        trackScene('scene.evicted', { slotId: id, reason: 'memory' });
      }
    }
  }

  private onDegrade(level: DegradeLevel) {
    trackScene('scene.gpu', { degrade: level });
    if (level >= 2) {
      for (const live of this.instances.values()) {
        if (live.reg.role === 'ambient') {
          this.dispose(live.reg.slotId, true);
          live.reg.onFallback?.('degraded');
        }
      }
    }
  }

  private pauseAll() {
    // Relieve RAF pressure by disposing ambient slots; they re-register on resume.
    for (const live of this.instances.values()) {
      if (live.reg.role === 'ambient') {
        this.dispose(live.reg.slotId, true);
      }
    }
  }

  private resumeAll() {
    /* slots re-register via React effects when visible */
  }

  dispose(slotId: string, keepPoster = false) {
    const live = this.instances.get(slotId);
    if (!live) return;
    live.cancelIdle?.();
    live.disposeScene?.();
    this.ledger.remove(slotId);
    if (!keepPoster) {
      live.reg.container.replaceChildren();
    }
    live.reg.onDisposed?.();
    this.instances.delete(slotId);
  }
}

export const sceneManager = new SceneManagerImpl();

export const sceneManagerApi = {
  start: () => sceneManager.start(),
  stop: () => sceneManager.stop(),
  register: (r: SceneSlotRegistration) => sceneManager.register(r),
  unregister: (id: string) => sceneManager.unregister(id),
  prefetchRoute: (p: string) => sceneManager.prefetchRoute(p),
  getPoster: (k: SceneKey) => sceneManager.getPoster(k),
  getPhase: (id: string) => sceneManager.getPhase(id),
};
