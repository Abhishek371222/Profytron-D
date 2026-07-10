import type * as THREE from 'three';
import { BRAND_COLORS, PARTICLE_COUNT } from './constants';

export type AuthParticleSystem = THREE.Points & {
  userData: THREE.Object3D['userData'] & {
    velocities: Float32Array;
    baseOpacities: Float32Array;
    sizes: Float32Array;
  };
};

/**
 * Drifting particles that fade as they approach the login side (positive X).
 * Uses a shader for per-particle opacity and soft circular points.
 */
export function createParticleSystem(THREE: typeof import('three'), count = PARTICLE_COUNT) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const baseOpacities = new Float32Array(count);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.55) * 9;
    positions[i3 + 1] = (Math.random() - 0.5) * 5.5;
    positions[i3 + 2] = (Math.random() - 0.5) * 4;

    velocities[i3] = (Math.random() - 0.15) * 0.0007;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.00035;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.00025;

    baseOpacities[i] = 0.25 + Math.random() * 0.45;
    sizes[i] = 0.025 + Math.random() * 0.02;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aOpacity', new THREE.BufferAttribute(baseOpacities, 1));

  const frost = new THREE.Color(BRAND_COLORS.frost);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: frost },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: `
      attribute float aSize;
      attribute float aOpacity;
      varying float vOpacity;
      uniform float uPixelRatio;
      void main() {
        vOpacity = aOpacity;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * (280.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vOpacity;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float dist = length(uv);
        if (dist > 0.5) discard;
        float soft = smoothstep(0.5, 0.08, dist);
        gl_FragColor = vec4(uColor, soft * vOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.userData.velocities = velocities;
  points.userData.baseOpacities = baseOpacities;
  points.userData.sizes = sizes;

  return points as unknown as AuthParticleSystem;
}

export function updateParticleSystem(particles: AuthParticleSystem) {
  const positions = particles.geometry.attributes.position.array as Float32Array;
  const opacities = particles.geometry.attributes.aOpacity.array as Float32Array;
  const velocities = particles.userData.velocities;
  const baseOpacities = particles.userData.baseOpacities;
  const count = baseOpacities.length;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] += velocities[i3];
    positions[i3 + 1] += velocities[i3 + 1];
    positions[i3 + 2] += velocities[i3 + 2];

    if (positions[i3] > 5.2) {
      positions[i3] = -4.8 - Math.random() * 1.8;
      positions[i3 + 1] = (Math.random() - 0.5) * 5;
      positions[i3 + 2] = (Math.random() - 0.5) * 4;
    }

    const loginFade = positions[i3] > 3.6 ? Math.max(0, 1 - (positions[i3] - 3.6) / 1.8) : 1;
    opacities[i] = baseOpacities[i] * loginFade;
  }

  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.aOpacity.needsUpdate = true;
}
