/**
 * Layer streamer — progressive reveal: poster → background → logo → particles → glass → interactive.
 */

import type { SceneLayerId, SceneRegistryEntry } from './scene-registry';
import { trackScene } from './scene-analytics';
import type { DegradeLevel } from './fps-monitor';
import { degradePolicy } from './fps-monitor';

export type StreamPhase =
  | 'poster'
  | 'background'
  | 'logo'
  | 'particles'
  | 'glass'
  | 'interactive';

const PHASE_ORDER: StreamPhase[] = [
  'poster',
  'background',
  'logo',
  'particles',
  'glass',
  'interactive',
];

/** Map registry layer ids onto stream phases. */
function layerToPhase(id: SceneLayerId): StreamPhase {
  switch (id) {
    case 'background':
    case 'fog':
      return 'background';
    case 'logo':
    case 'product':
    case 'glow':
      return 'logo';
    case 'particles':
      return 'particles';
    case 'glass':
      return 'glass';
    default:
      return 'logo';
  }
}

export function phasesForEntry(
  entry: SceneRegistryEntry,
  degrade: DegradeLevel = 0,
): StreamPhase[] {
  const policy = degradePolicy(degrade);
  const wanted = new Set<StreamPhase>(['poster']);
  for (const layer of entry.layers) {
    const phase = layerToPhase(layer.id);
    if (phase === 'particles' && policy.particles <= 0) continue;
    if (phase === 'glass' && !policy.reflection) continue;
    wanted.add(phase);
  }
  wanted.add('interactive');
  return PHASE_ORDER.filter((p) => wanted.has(p));
}

export type LayerStreamerState = {
  phase: StreamPhase;
  index: number;
  phases: StreamPhase[];
  done: boolean;
};

export function createLayerStreamer(
  entry: SceneRegistryEntry,
  degrade: DegradeLevel,
  onPhase: (phase: StreamPhase) => void,
): { advance: () => void; state: () => LayerStreamerState; reset: () => void } {
  const phases = phasesForEntry(entry, degrade);
  let index = 0;

  const state = (): LayerStreamerState => ({
    phase: phases[index] ?? 'poster',
    index,
    phases,
    done: index >= phases.length - 1,
  });

  const advance = () => {
    if (index >= phases.length - 1) return;
    index += 1;
    const phase = phases[index];
    trackScene('scene.layer', { phase, index });
    onPhase(phase);
  };

  const reset = () => {
    index = 0;
    onPhase('poster');
  };

  onPhase(phases[0] ?? 'poster');
  return { advance, state, reset };
}

export const layerStreamerApi = {
  phasesForEntry,
  create: createLayerStreamer,
};
