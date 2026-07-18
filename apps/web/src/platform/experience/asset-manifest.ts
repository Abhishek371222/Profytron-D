/**
 * Single asset manifest — no arbitrary assets.
 */

export type AssetOwner = 'hero' | 'coach' | 'marketing';
export type AssetKind = 'model' | 'texture' | 'shader' | 'font' | 'icon';
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
