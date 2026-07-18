/**
 * Texture manager — compression, streaming, disposal.
 */

type TexHandle = {
  id: string;
  url?: string;
  bytes: number;
  dispose: () => void;
};

const textures = new Map<string, TexHandle>();
let totalBytes = 0;

export function registerTexture(handle: TexHandle) {
  const prev = textures.get(handle.id);
  if (prev) {
    prev.dispose();
    totalBytes -= prev.bytes;
  }
  textures.set(handle.id, handle);
  totalBytes += handle.bytes;
  return () => disposeTexture(handle.id);
}

export function disposeTexture(id: string) {
  const t = textures.get(id);
  if (!t) return;
  try {
    t.dispose();
  } catch {
    /* ignore */
  }
  totalBytes -= t.bytes;
  textures.delete(id);
}

export function disposeAllTextures() {
  for (const id of [...textures.keys()]) disposeTexture(id);
}

export function textureMemoryBytes() {
  return totalBytes;
}

export function textureCount() {
  return textures.size;
}

export const textureManagerApi = {
  register: registerTexture,
  dispose: disposeTexture,
  disposeAll: disposeAllTextures,
  memoryBytes: textureMemoryBytes,
  count: textureCount,
};
