/**
 * Brand lighting contract — applied to every mounted scene.
 * Apple / Nothing OS subtlety — not cyberpunk bloom.
 */

export const BRAND_LIGHTING = {
  key: {
    color: '#5FB2C4',
    intensity: 1.05,
    position: [2.4, 3.2, 2.0] as const,
  },
  fill: {
    color: '#348398',
    intensity: 0.45,
    position: [-2.0, 1.2, -1.5] as const,
  },
  rim: {
    color: '#9FE1F3',
    intensity: 0.35,
    position: [0, 1.5, -3] as const,
  },
  ambient: {
    color: '#1E252B',
    intensity: 0.28,
  },
  exposure: 1.05,
  /** Subtle bloom — Nothing/Apple, not neon. */
  bloom: {
    enabled: true,
    intensity: 0.18,
    threshold: 0.82,
  },
  fog: {
    color: '#1E252B',
    near: 8,
    far: 28,
    density: 0.02,
  },
  /** CSS mirrors for AmbientDepthBackground / posters. */
  css: {
    key: 'color-mix(in srgb, var(--primary) 55%, white 20%)',
    fill: 'color-mix(in srgb, var(--primary) 25%, transparent)',
    rim: 'color-mix(in srgb, var(--accent) 40%, transparent)',
    ambient: 'var(--glow-hero)',
    fog: 'color-mix(in srgb, var(--background) 70%, var(--primary) 8%)',
  },
} as const;

export function brandLightingCssVars(): Record<string, string> {
  return {
    '--brand-light-key': BRAND_LIGHTING.css.key,
    '--brand-light-fill': BRAND_LIGHTING.css.fill,
    '--brand-light-rim': BRAND_LIGHTING.css.rim,
    '--brand-light-ambient': BRAND_LIGHTING.css.ambient,
    '--brand-light-fog': BRAND_LIGHTING.css.fog,
    '--brand-exposure': String(BRAND_LIGHTING.exposure),
    '--brand-bloom': String(BRAND_LIGHTING.bloom.intensity),
  };
}

export type BrandLightingSnapshot = typeof BRAND_LIGHTING;

/**
 * Apply brand lighting knobs onto a Spline application when available.
 * Spline APIs vary; we best-effort set known props without throwing.
 */
export function applyBrandLightingToSpline(app: unknown) {
  if (!app || typeof app !== 'object') return;
  const a = app as Record<string, unknown>;
  try {
    if (typeof a.setZoom === 'function') {
      // no-op placeholder — keep API stable for authoring contract docs
    }
    // Emit contract for tooling / future Spline event hooks
    (a as { __brandLighting?: BrandLightingSnapshot }).__brandLighting =
      BRAND_LIGHTING;
  } catch {
    /* ignore */
  }
}

export const brandLightingApi = {
  tokens: BRAND_LIGHTING,
  cssVars: brandLightingCssVars,
  apply: applyBrandLightingToSpline,
};
