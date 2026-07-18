/**
 * Shader contracts — every shader documents purpose/inputs/outputs/quality/fallback.
 */

export type ShaderContract = {
  id: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  qualityScaling: string;
  fallback: string;
};

export const SHADER_CONTRACTS: Record<string, ShaderContract> = {
  'floating-lines': {
    id: 'floating-lines',
    purpose: 'Animated line-wave hero background with optional mouse bend',
    inputs: [
      'iTime',
      'iResolution',
      'animationSpeed',
      'line counts/distances',
      'iMouse',
      'lineGradient',
      'parallaxOffset',
    ],
    outputs: ['RGBA fragment color on fullscreen quad'],
    qualityScaling:
      'Reduce lineCount and DPR at Medium/Low; disable interactive bend at Low; skip WebGL at Minimal',
    fallback: 'CSS mesh + SVG paths in HeroAmbientVisual (static/animated layers)',
  },
  'background-gradient': {
    id: 'background-gradient',
    purpose: 'Soft brand gradient wash behind hero (CSS, not GLSL)',
    inputs: ['--glow-hero', '--gradient-hero', 'theme class'],
    outputs: ['DOM background'],
    qualityScaling: 'Always on; opacity reduced under Minimal',
    fallback: 'Solid --bg-secondary',
  },
};

export function getShaderContract(id: string) {
  return SHADER_CONTRACTS[id];
}

export const shaderContractsApi = {
  all: SHADER_CONTRACTS,
  get: getShaderContract,
};
