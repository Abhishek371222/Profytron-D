type Disposer = () => void;

type Owned = {
  id: string;
  kind: string;
  dispose: Disposer;
  pause?: () => void;
  resume?: () => void;
};

const registry = new Map<string, Owned>();

export const lifecycleApi = {
  /**
   * Create → Own. Returns dispose (Dispose). Pause/Resume optional.
   */
  own(
    id: string,
    kind: string,
    dispose: Disposer,
    hooks?: { pause?: () => void; resume?: () => void },
  ): Disposer {
    this.dispose(id);
    registry.set(id, {
      id,
      kind,
      dispose,
      pause: hooks?.pause,
      resume: hooks?.resume,
    });
    return () => this.dispose(id);
  },

  pause(id: string) {
    registry.get(id)?.pause?.();
  },

  resume(id: string) {
    registry.get(id)?.resume?.();
  },

  pauseAll() {
    for (const o of registry.values()) o.pause?.();
  },

  resumeAll() {
    for (const o of registry.values()) o.resume?.();
  },

  dispose(id: string) {
    const o = registry.get(id);
    if (!o) return;
    try {
      o.dispose();
    } catch {
      /* ignore */
    }
    registry.delete(id);
  },

  disposeByKind(kind: string) {
    for (const [id, o] of registry) {
      if (o.kind === kind) this.dispose(id);
    }
  },

  /** Own a timer/interval with deterministic clear. */
  ownInterval(id: string, fn: () => void, ms: number): Disposer {
    const handle = setInterval(fn, ms);
    return this.own(id, 'interval', () => clearInterval(handle));
  },

  ownTimeout(id: string, fn: () => void, ms: number): Disposer {
    const handle = setTimeout(fn, ms);
    return this.own(id, 'timeout', () => clearTimeout(handle));
  },
};

export type LifecycleApi = typeof lifecycleApi;
