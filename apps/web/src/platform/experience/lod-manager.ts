/**
 * LOD manager — geometry/effect level from GPU quality.
 */

import { getGpuQuality, type GpuQuality } from './gpu-quality';

export type LodLevel = 0 | 1 | 2 | 3;

/** 0 = off, 3 = fullest. */
export function lodFromQuality(q: GpuQuality = getGpuQuality()): LodLevel {
  switch (q) {
    case 'ultra':
      return 3;
    case 'high':
      return 2;
    case 'medium':
      return 1;
    case 'low':
    case 'minimal':
      return 0;
  }
}

export function lodLineCounts(base: [number, number, number], lod: LodLevel = lodFromQuality()): [number, number, number] {
  const scale = lod === 3 ? 1 : lod === 2 ? 0.85 : lod === 1 ? 0.55 : 0;
  return [
    Math.max(0, Math.round(base[0] * scale)),
    Math.max(0, Math.round(base[1] * scale)),
    Math.max(0, Math.round(base[2] * scale)),
  ];
}

export const lodManagerApi = {
  fromQuality: lodFromQuality,
  lineCounts: lodLineCounts,
};
