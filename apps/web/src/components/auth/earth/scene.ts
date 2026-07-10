import type * as THREE from 'three';
import type { EarthTextureSet } from './textures';
import {
  CLOUD_OPACITY,
  CLOUD_SCALE,
  EARTH_RADIUS,
  EARTH_SEGMENTS,
  SUN_DIRECTION,
} from './constants';
import { createAtmosphereRimMaterial, createNightLightsMaterial } from './shaders';

export type EarthMeshes = {
  group: THREE.Group;
  earth: THREE.Mesh;
  night: THREE.Mesh;
  clouds: THREE.Mesh;
  rim: THREE.Mesh;
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
};

/** Builds the Earth mesh stack — position/scale locked to existing composition. */
export function buildEarthMeshes(
  THREE: typeof import('three'),
  textures: EarthTextureSet,
  isDark: boolean,
  scene: THREE.Scene,
): EarthMeshes {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  if (textures.environment) {
    scene.environment = textures.environment;
  }

  const sunDirection = new THREE.Vector3(
    SUN_DIRECTION.x,
    SUN_DIRECTION.y,
    SUN_DIRECTION.z,
  ).normalize();

  const group = new THREE.Group();

  const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, EARTH_SEGMENTS, EARTH_SEGMENTS);
  geometries.push(earthGeometry);

  const earthMaterial = new THREE.MeshPhysicalMaterial({
    map: textures.day,
    normalMap: textures.normal,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: textures.roughness,
    roughness: 0.78,
    metalness: 0,
    specularIntensity: 0.32,
    specularColor: new THREE.Color(0xffffff),
    specularIntensityMap: textures.specular,
    clearcoat: 0.06,
    clearcoatRoughness: 0.92,
    envMapIntensity: isDark ? 0.18 : 0.14,
  });
  materials.push(earthMaterial);

  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  group.add(earth);

  const nightGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.001, EARTH_SEGMENTS, EARTH_SEGMENTS);
  geometries.push(nightGeometry);

  const nightMaterial = createNightLightsMaterial(THREE, textures.night, sunDirection);
  materials.push(nightMaterial);

  const night = new THREE.Mesh(nightGeometry, nightMaterial);
  group.add(night);

  const cloudGeometry = new THREE.SphereGeometry(EARTH_RADIUS * CLOUD_SCALE, EARTH_SEGMENTS, EARTH_SEGMENTS);
  geometries.push(cloudGeometry);

  const cloudMaterial = new THREE.MeshStandardMaterial({
    map: textures.clouds,
    transparent: true,
    opacity: CLOUD_OPACITY,
    depthWrite: false,
    roughness: 1,
    metalness: 0,
  });
  materials.push(cloudMaterial);

  const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
  group.add(clouds);

  const rimGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.006, 72, 72);
  geometries.push(rimGeometry);

  const rimMaterial = createAtmosphereRimMaterial(THREE, isDark);
  materials.push(rimMaterial);

  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  group.add(rim);

  return { group, earth, night, clouds, rim, geometries, materials };
}

export function rotateEarthMeshes(
  meshes: EarthMeshes,
  earthRotation: number,
  cloudRotation: number,
) {
  meshes.earth.rotation.y = earthRotation;
  meshes.night.rotation.y = earthRotation;
  meshes.clouds.rotation.y = cloudRotation;
  meshes.rim.rotation.y = earthRotation;
}
