import type * as THREE from 'three';
import { BRAND_COLORS, NIGHT_LIGHT_INTENSITY } from './constants';

export function createNightLightsMaterial(
  THREE: typeof import('three'),
  nightMap: THREE.Texture,
  sunDirection: THREE.Vector3,
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      nightTexture: { value: nightMap },
      sunDirection: { value: sunDirection.clone() },
      intensity: { value: NIGHT_LIGHT_INTENSITY },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D nightTexture;
      uniform vec3 sunDirection;
      uniform float intensity;
      varying vec2 vUv;
      varying vec3 vWorldNormal;

      void main() {
        float sunDot = dot(normalize(vWorldNormal), normalize(sunDirection));
        float nightFactor = smoothstep(0.12, -0.4, sunDot);
        vec3 lights = texture2D(nightTexture, vUv).rgb;
        lights *= vec3(1.0, 0.86, 0.62);
        float luminance = max(max(lights.r, lights.g), lights.b);
        float alpha = nightFactor * intensity * luminance;
        gl_FragColor = vec4(lights * intensity * nightFactor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function createAtmosphereRimMaterial(THREE: typeof import('three'), isDark: boolean) {
  const secondary = new THREE.Color(BRAND_COLORS.secondary);
  return new THREE.ShaderMaterial({
    uniforms: {
      rimColor: { value: secondary },
      rimOpacity: { value: isDark ? 0.038 : 0.028 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 rimColor;
      uniform float rimOpacity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.2);
        gl_FragColor = vec4(rimColor, fresnel * rimOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
}
