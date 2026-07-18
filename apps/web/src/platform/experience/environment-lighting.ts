/**
 * Shared environment lighting language for hero / cards / coach / marketing.
 */

export const ENVIRONMENT_LIGHTING = {
  keyLight: 'var(--primary)',
  fill: 'color-mix(in srgb, var(--card) 80%, transparent)',
  ambient: 'var(--glow-hero)',
  rim: 'color-mix(in srgb, var(--chart-2) 35%, transparent)',
  shadow: 'var(--shadow-card)',
  surface: 'var(--exp-surface)',
  depth1: 'var(--exp-depth-1)',
  depth2: 'var(--exp-depth-2)',
  depth3: 'var(--exp-depth-3)',
} as const;

export function lightingCssVars(): Record<string, string> {
  return {
    '--exp-key-light': ENVIRONMENT_LIGHTING.keyLight,
    '--exp-fill': ENVIRONMENT_LIGHTING.fill,
    '--exp-ambient': ENVIRONMENT_LIGHTING.ambient,
    '--exp-rim': ENVIRONMENT_LIGHTING.rim,
  };
}

export const environmentLightingApi = {
  tokens: ENVIRONMENT_LIGHTING,
  cssVars: lightingCssVars,
};
