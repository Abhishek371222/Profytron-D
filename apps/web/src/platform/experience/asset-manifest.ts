/**
 * Single asset manifest — no arbitrary assets.
 */

export type AssetOwner = 'hero' | 'coach' | 'marketing' | 'dashboard' | 'admin';
export type AssetKind = 'model' | 'texture' | 'shader' | 'font' | 'icon' | 'spline' | 'poster';
export type AssetPriority =
  | 'critical'
  | 'interactive'
  | 'hero'
  | 'background'
  | 'decorative';

export type AssetEntry = {
  id: string;
  kind: AssetKind;
  owner: AssetOwner;
  version: string;
  size: number;
  compression: 'none' | 'ktx2' | 'webp' | 'gzip' | 'inline';
  priority: AssetPriority;
  path?: string;
  description?: string;
};

/** Declared assets only. FloatingLines shaders are inline (compression: inline). */
export const ASSET_MANIFEST: AssetEntry[] = [
  {
    id: 'hero.shader.floating-lines.vert',
    kind: 'shader',
    owner: 'hero',
    version: '1.0.0',
    size: 256,
    compression: 'inline',
    priority: 'hero',
    description: 'FloatingLines vertex',
  },
  {
    id: 'hero.shader.floating-lines.frag',
    kind: 'shader',
    owner: 'hero',
    version: '1.0.0',
    size: 8192,
    compression: 'inline',
    priority: 'hero',
    description: 'FloatingLines fragment',
  },
  {
    id: 'hero.fallback.mesh',
    kind: 'icon',
    owner: 'hero',
    version: '1.0.0',
    size: 0,
    compression: 'none',
    priority: 'critical',
    description: 'CSS/SVG static + animated background (no network)',
  },
  {
    id: 'coach.orb.css',
    kind: 'icon',
    owner: 'coach',
    version: '1.0.0',
    size: 0,
    compression: 'none',
    priority: 'interactive',
    description: 'Coach orb CSS visual',
  },
  {
    id: 'marketing.features.icons',
    kind: 'icon',
    owner: 'marketing',
    version: '1.0.0',
    size: 0,
    compression: 'none',
    priority: 'background',
    description: 'Features section lucide icons',
  },
  {
    id: 'spline.heroTrading.poster',
    kind: 'poster',
    owner: 'hero',
    version: '1.0.0',
    size: 120_000,
    compression: 'webp',
    priority: 'critical',
    path: '/3d/posters/hero-trading.webp',
    description: 'Hero trading LCP poster',
  },
  {
    id: 'spline.heroTrading.scene',
    kind: 'spline',
    owner: 'hero',
    version: '1.0.0',
    size: 3_000_000,
    compression: 'gzip',
    priority: 'hero',
    description: 'Spline heroTrading scene (env URL)',
  },
  {
    id: 'spline.pricingHero.poster',
    kind: 'poster',
    owner: 'marketing',
    version: '1.0.0',
    size: 100_000,
    compression: 'webp',
    priority: 'hero',
    path: '/3d/posters/pricing-hero.webp',
  },
  {
    id: 'spline.productMarketplace.poster',
    kind: 'poster',
    owner: 'dashboard',
    version: '1.0.0',
    size: 100_000,
    compression: 'webp',
    priority: 'interactive',
    path: '/3d/posters/marketplace.webp',
  },
  {
    id: 'spline.productCoach.poster',
    kind: 'poster',
    owner: 'coach',
    version: '1.0.0',
    size: 80_000,
    compression: 'webp',
    priority: 'interactive',
    path: '/3d/posters/coach.webp',
  },
  {
    id: 'spline.brandLogo.poster',
    kind: 'poster',
    owner: 'marketing',
    version: '1.0.0',
    size: 40_000,
    compression: 'webp',
    priority: 'decorative',
    path: '/3d/posters/brand-logo.webp',
  },
  {
    id: 'spline.adminOps.poster',
    kind: 'poster',
    owner: 'admin',
    version: '1.0.0',
    size: 80_000,
    compression: 'webp',
    priority: 'decorative',
    path: '/3d/posters/admin-ops.webp',
  },
];

export function getAsset(id: string) {
  return ASSET_MANIFEST.find((a) => a.id === id);
}

export function assetsByOwner(owner: AssetOwner) {
  return ASSET_MANIFEST.filter((a) => a.owner === owner);
}

export function assetsByPriority(priority: AssetPriority) {
  return ASSET_MANIFEST.filter((a) => a.priority === priority);
}

export const assetManifestApi = {
  all: ASSET_MANIFEST,
  get: getAsset,
  byOwner: assetsByOwner,
  byPriority: assetsByPriority,
};
