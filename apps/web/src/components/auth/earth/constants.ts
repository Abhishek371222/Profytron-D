/** Locked Earth composition — do not change position/scale in scene. */
export const EARTH_RADIUS = 1.9;
export const EARTH_SEGMENTS = 128;
export const EARTH_ROTATION = 0.00018;
export const CLOUD_ROTATION = EARTH_ROTATION * 1.15;
export const CLOUD_SCALE = 1.003;
export const CLOUD_OPACITY = 0.22;
export const NIGHT_LIGHT_INTENSITY = 0.3;
export const PARTICLE_COUNT = 120;

/** Upper-left sun — drives day/night terminator on night lights. */
export const SUN_DIRECTION = { x: -0.85, y: 0.92, z: 0.38 } as const;

export const BRAND_COLORS = {
  primary: '#348398',
  secondary: '#9FE1F3',
  frost: '#ADFFFC',
  dark: '#1E252B',
  background: '#0B131B',
} as const;

export const TEXTURE_PATHS = {
  day: '/auth/earth/earth_daymap.jpg',
  normal: '/auth/earth/earth_normal.jpg',
  roughness: '/auth/earth/earth_roughness.jpg',
  specular: '/auth/earth/earth_specular.jpg',
  night: '/auth/earth/earth_night.jpg',
  clouds: '/auth/earth/earth_clouds.png',
  hdri: '/auth/earth/env.hdr',
} as const;

export const TEXTURE_FALLBACKS = {
  day: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
  normal: 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
  roughness: 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
  specular: 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
  night: 'https://threejs.org/examples/textures/planets/earth_lights_2048.png',
  clouds: 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
  hdri: 'https://threejs.org/examples/textures/equirectangular/royal_esplanade_1k.hdr',
} as const;
