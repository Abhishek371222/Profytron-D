/**
 * Asset streaming — priority lanes; only manifest entries.
 */

import {
  ASSET_MANIFEST,
  type AssetEntry,
  type AssetPriority,
} from './asset-manifest';

const LANE_ORDER: AssetPriority[] = [
  'critical',
  'interactive',
  'hero',
  'background',
  'decorative',
];

type StreamJob = {
  entry: AssetEntry;
  run: () => Promise<void> | void;
};

const queue: StreamJob[] = [];
let pumping = false;
const loaded = new Set<string>();

async function pump() {
  if (pumping) return;
  pumping = true;
  for (const lane of LANE_ORDER) {
    const jobs = queue.filter((j) => j.entry.priority === lane);
    for (const job of jobs) {
      const idx = queue.indexOf(job);
      if (idx >= 0) queue.splice(idx, 1);
      try {
        await job.run();
        loaded.add(job.entry.id);
      } catch {
        /* ignore */
      }
    }
  }
  pumping = false;
  if (queue.length) void pump();
}

export function enqueueAsset(
  assetId: string,
  run: () => Promise<void> | void,
) {
  const entry = ASSET_MANIFEST.find((a) => a.id === assetId);
  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[experience.stream] Unknown asset "${assetId}" — not in manifest`);
    }
    return;
  }
  if (loaded.has(assetId)) return;
  queue.push({ entry, run });
  void pump();
}

export function isAssetLoaded(id: string) {
  return loaded.has(id);
}

export function assetQueueSize() {
  return queue.length;
}

export function markAssetLoaded(id: string) {
  loaded.add(id);
}

export const assetStreamingApi = {
  enqueue: enqueueAsset,
  isLoaded: isAssetLoaded,
  queueSize: assetQueueSize,
  markLoaded: markAssetLoaded,
  lanes: LANE_ORDER,
};
