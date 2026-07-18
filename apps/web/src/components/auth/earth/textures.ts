import type * as THREE from 'three';
import { TEXTURE_FALLBACKS, TEXTURE_PATHS } from './constants';

export type EarthTextureSet = {
  day: THREE.Texture;
  normal: THREE.Texture;
  roughness: THREE.Texture;
  specular: THREE.Texture;
  night: THREE.Texture;
  clouds: THREE.Texture;
  environment: THREE.Texture | null;
};

type ColorSpace = 'srgb' | 'linear';

function configureTexture(
  texture: THREE.Texture,
  THREE: typeof import('three'),
  renderer: THREE.WebGLRenderer,
  colorSpace: ColorSpace = 'srgb',
) {
  texture.colorSpace = colorSpace === 'srgb' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;
  return texture;
}

function loadImageTexture(
  loader: THREE.TextureLoader,
  url: string,
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

async function loadWithFallback(
  THREE: typeof import('three'),
  loader: THREE.TextureLoader,
  renderer: THREE.WebGLRenderer,
  local: string,
  remote: string,
  colorSpace: ColorSpace = 'srgb',
) {
  try {
    return configureTexture(await loadImageTexture(loader, local), THREE, renderer, colorSpace);
  } catch {
    return configureTexture(await loadImageTexture(loader, remote), THREE, renderer, colorSpace);
  }
}

async function loadEnvironmentMap(
  THREE: typeof import('three'),
  renderer: THREE.WebGLRenderer,
): Promise<THREE.Texture | null> {
  const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js');
  const urls = [TEXTURE_PATHS.hdri, TEXTURE_FALLBACKS.hdri];

  for (const url of urls) {
    try {
      const hdr = await new Promise<THREE.DataTexture>((resolve, reject) => {
        new RGBELoader().load(url, resolve, undefined, reject);
      });
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      configureTexture(hdr, THREE, renderer, 'linear');
      return hdr;
    } catch {
      continue;
    }
  }
  return null;
}

export async function loadEarthTextures(
  THREE: typeof import('three'),
  renderer: THREE.WebGLRenderer,
): Promise<EarthTextureSet> {
  const loader = new THREE.TextureLoader();

  const [day, normal, roughness, specular, night, clouds, environment] = await Promise.all([
    loadWithFallback(THREE, loader, renderer, TEXTURE_PATHS.day, TEXTURE_FALLBACKS.day, 'srgb'),
    loadWithFallback(THREE, loader, renderer, TEXTURE_PATHS.normal, TEXTURE_FALLBACKS.normal, 'linear'),
    loadWithFallback(THREE, loader, renderer, TEXTURE_PATHS.roughness, TEXTURE_FALLBACKS.roughness, 'linear'),
    loadWithFallback(THREE, loader, renderer, TEXTURE_PATHS.specular, TEXTURE_FALLBACKS.specular, 'linear'),
    loadWithFallback(THREE, loader, renderer, TEXTURE_PATHS.night, TEXTURE_FALLBACKS.night, 'srgb'),
    loadWithFallback(THREE, loader, renderer, TEXTURE_PATHS.clouds, TEXTURE_FALLBACKS.clouds, 'srgb'),
    loadEnvironmentMap(THREE, renderer),
  ]);

  return { day, normal, roughness, specular, night, clouds, environment };
}

export function disposeTextures(textures: EarthTextureSet) {
  textures.day.dispose();
  textures.normal.dispose();
  textures.roughness.dispose();
  textures.specular.dispose();
  textures.night.dispose();
  textures.clouds.dispose();
  textures.environment?.dispose();
}
