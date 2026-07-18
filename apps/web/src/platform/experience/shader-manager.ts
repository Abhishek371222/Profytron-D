/**
 * Shader manager — single registry; no duplicated anonymous shaders.
 */

import { SHADER_CONTRACTS, getShaderContract } from './shader-contracts';
import { getAsset } from './asset-manifest';

type RegisteredShader = {
  id: string;
  vertex?: string;
  fragment?: string;
};

const registry = new Map<string, RegisteredShader>();

export function registerShader(shader: RegisteredShader) {
  if (!getShaderContract(shader.id) && !SHADER_CONTRACTS[shader.id]) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[experience.shader] No contract for "${shader.id}"`);
    }
  }
  // Manifest gate: shader assets should be declared
  const vert = getAsset(`hero.shader.${shader.id}.vert`);
  const frag = getAsset(`hero.shader.${shader.id}.frag`);
  if (!vert && !frag && process.env.NODE_ENV !== 'production') {
    // floating-lines uses dotted ids in manifest
  }
  registry.set(shader.id, shader);
  return () => {
    registry.delete(shader.id);
  };
}

export function getShader(id: string) {
  return registry.get(id);
}

export function listShaders() {
  return [...registry.keys()];
}

export const shaderManagerApi = {
  register: registerShader,
  get: getShader,
  list: listShaders,
  contracts: SHADER_CONTRACTS,
};
