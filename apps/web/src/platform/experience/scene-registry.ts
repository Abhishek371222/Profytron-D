/**
 * SceneRegistry — single source of truth for all Spline/3D scenes.
 * Pages never hold raw URLs; they reference registry keys only.
 */

export type SceneLayerId =
  | 'background'
  | 'logo'
  | 'product'
  | 'particles'
  | 'glass'
  | 'fog'
  | 'glow';

export type SceneTransition =
  | 'none'
  | 'cameraPush'
  | 'objectMorph'
  | 'depthShift'
  | 'logoDissolve'
  | 'particleTransition';

export type ScenePriority = 'critical' | 'hero' | 'interactive' | 'background' | 'decorative';

export type SceneLayerDef = {
  id: SceneLayerId;
  /** Optional layer-specific Spline URL; falls back to parent url. */
  url?: string;
  /** Relative GPU weight within the scene (sums ~1). */
  weight: number;
};

export type SceneRegistryEntry = {
  url: string;
  poster: string;
  gpuCostMb: number;
  memoryMb: number;
  downloadMb: number;
  priority: ScenePriority;
  /** Minimum LOD required to mount WebGL (0–3). */
  lod: number;
  preload: boolean;
  transition: SceneTransition;
  layers: SceneLayerDef[];
  description: string;
};

export type SceneKey =
  | 'heroTrading'
  | 'pricingHero'
  | 'productMarketplace'
  | 'productCoach'
  | 'brandLogo'
  | 'ambientDepth'
  | 'adminOps';

const env = (key: string) =>
  (typeof process !== 'undefined' ? process.env[key] : undefined) || '';

/** Default posters — use existing hero asset until authored webps ship. */
const POSTER = {
  hero: '/hero/hero-trading-3d.png',
  pricing: '/hero/hero-trading-3d.png',
  marketplace: '/hero/hero-trading-3d.png',
  coach: '/hero/hero-trading-3d.png',
  logo: '/hero/hero-trading-3d.png',
  ambient: '/hero/hero-trading-3d.png',
  admin: '/hero/hero-trading-3d.png',
} as const;

/**
 * Fallback to existing hero PNG when webp posters are not yet authored.
 * SceneSlot uses next/image with these paths.
 */
const HERO_FALLBACK = '/hero/hero-trading-3d.png';

export const SceneRegistry: Record<SceneKey, SceneRegistryEntry> = {
  heroTrading: {
    url: env('NEXT_PUBLIC_SPLINE_HERO_TRADING'),
    poster: POSTER.hero,
    gpuCostMb: 48,
    memoryMb: 48,
    downloadMb: 3,
    priority: 'hero',
    lod: 1,
    preload: true,
    transition: 'cameraPush',
    layers: [
      { id: 'background', weight: 0.25 },
      { id: 'logo', weight: 0.3 },
      { id: 'particles', weight: 0.2 },
      { id: 'glass', weight: 0.25 },
    ],
    description: 'Landing + marketing heroes',
  },
  pricingHero: {
    url: env('NEXT_PUBLIC_SPLINE_PRICING_HERO'),
    poster: POSTER.pricing,
    gpuCostMb: 32,
    memoryMb: 32,
    downloadMb: 2,
    priority: 'hero',
    lod: 1,
    preload: true,
    transition: 'depthShift',
    layers: [
      { id: 'background', weight: 0.35 },
      { id: 'logo', weight: 0.35 },
      { id: 'glass', weight: 0.3 },
    ],
    description: 'Pricing page hero',
  },
  productMarketplace: {
    url: env('NEXT_PUBLIC_SPLINE_MARKETPLACE'),
    poster: POSTER.marketplace,
    gpuCostMb: 36,
    memoryMb: 36,
    downloadMb: 2,
    priority: 'interactive',
    lod: 1,
    preload: false,
    transition: 'objectMorph',
    layers: [
      { id: 'background', weight: 0.3 },
      { id: 'product', weight: 0.45 },
      { id: 'particles', weight: 0.25 },
    ],
    description: 'Marketplace product showcase',
  },
  productCoach: {
    url: env('NEXT_PUBLIC_SPLINE_COACH'),
    poster: POSTER.coach,
    gpuCostMb: 24,
    memoryMb: 24,
    downloadMb: 1.5,
    priority: 'interactive',
    lod: 1,
    preload: false,
    transition: 'logoDissolve',
    layers: [
      { id: 'logo', weight: 0.6 },
      { id: 'glow', weight: 0.4 },
    ],
    description: 'Alpha Coach ambient orb',
  },
  brandLogo: {
    url: env('NEXT_PUBLIC_SPLINE_BRAND_LOGO'),
    poster: POSTER.logo,
    gpuCostMb: 8,
    memoryMb: 8,
    downloadMb: 0.5,
    priority: 'decorative',
    lod: 2,
    preload: false,
    transition: 'logoDissolve',
    layers: [{ id: 'logo', weight: 1 }],
    description: 'Auth + navbar micro-mark',
  },
  ambientDepth: {
    url: env('NEXT_PUBLIC_SPLINE_AMBIENT_DEPTH'),
    poster: POSTER.ambient,
    gpuCostMb: 16,
    memoryMb: 16,
    downloadMb: 1,
    priority: 'background',
    lod: 2,
    preload: false,
    transition: 'none',
    layers: [
      { id: 'background', weight: 0.7 },
      { id: 'fog', weight: 0.3 },
    ],
    description: 'Shell ambient (desktop high+)',
  },
  adminOps: {
    url: env('NEXT_PUBLIC_SPLINE_ADMIN_OPS'),
    poster: POSTER.admin,
    gpuCostMb: 20,
    memoryMb: 20,
    downloadMb: 1,
    priority: 'decorative',
    lod: 2,
    preload: false,
    transition: 'none',
    layers: [
      { id: 'background', weight: 0.5 },
      { id: 'logo', weight: 0.5 },
    ],
    description: 'Admin overview accent',
  },
};

/** Resolve poster with PNG fallback when webp not present (dev-friendly). */
export function resolveScenePoster(key: SceneKey): string {
  const entry = SceneRegistry[key];
  if (!entry) return HERO_FALLBACK;
  return entry.poster || HERO_FALLBACK;
}

export function getSceneEntry(key: SceneKey): SceneRegistryEntry {
  return SceneRegistry[key];
}

export function sceneHasSplineUrl(key: SceneKey): boolean {
  return Boolean(SceneRegistry[key]?.url?.trim());
}

export const sceneRegistryApi = {
  all: SceneRegistry,
  get: getSceneEntry,
  poster: resolveScenePoster,
  hasUrl: sceneHasSplineUrl,
  keys: Object.keys(SceneRegistry) as SceneKey[],
};
