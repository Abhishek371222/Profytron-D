'use client';

import { useEffect, useRef } from 'react';
import { CLOUD_ROTATION, EARTH_ROTATION } from '@/components/auth/earth/constants';
import { useReducedMotion, useThemeDark } from '@/components/auth/earth/hooks';
import {
  createParticleSystem,
  updateParticleSystem,
  type AuthParticleSystem,
} from '@/components/auth/earth/particles';
import { buildEarthMeshes, rotateEarthMeshes } from '@/components/auth/earth/scene';
import { disposeTextures, loadEarthTextures } from '@/components/auth/earth/textures';

type AuthGlobeWebGLProps = {
  rotationSpeed?: number;
  showParticles?: boolean;
};

export function AuthGlobeWebGL({
  rotationSpeed = EARTH_ROTATION,
  showParticles = true,
}: AuthGlobeWebGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = useThemeDark();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let raf = 0;
    let resizeObserver: ResizeObserver | undefined;
    let visibilityCleanup: (() => void) | undefined;
    let renderer: import('three').WebGLRenderer | null = null;
    let earthMeshes: ReturnType<typeof buildEarthMeshes> | null = null;
    let particles: AuthParticleSystem | null = null;
    let textures: Awaited<ReturnType<typeof loadEarthTextures>> | null = null;
    let isPageVisible = !document.hidden;
    let earthRotation = 0;
    let cloudRotation = 0;
    const cloudSpeed = rotationSpeed * 1.15;

    const mount = async () => {
      const THREE = await import('three');
      if (disposed || !container) return;

      const width = container.clientWidth || 640;
      const height = container.clientHeight || 640;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0, 7.5);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = isDark ? 1.02 : 0.98;
      container.appendChild(renderer.domElement);

      textures = await loadEarthTextures(THREE, renderer);
      earthMeshes = buildEarthMeshes(THREE, textures, isDark, scene);
      scene.add(earthMeshes.group);

      if (showParticles) {
        particles = createParticleSystem(THREE);
        scene.add(particles);
      }

      scene.add(new THREE.AmbientLight(0xffffff, 0.16));
      scene.add(new THREE.HemisphereLight(0xf0f4f8, 0x0a1218, 0.22));

      const sun = new THREE.DirectionalLight(0xffffff, 1.7);
      sun.position.set(-8.5, 9, 3.8);
      scene.add(sun);

      const render = () => {
        if (disposed) return;
        raf = requestAnimationFrame(render);

        if (isPageVisible && !reducedMotion && earthMeshes) {
          earthRotation += rotationSpeed;
          cloudRotation += cloudSpeed;
          rotateEarthMeshes(earthMeshes, earthRotation, cloudRotation);
          if (particles) updateParticleSystem(particles);
        }

        renderer?.render(scene, camera);
      };
      render();

      const onVisibility = () => {
        isPageVisible = !document.hidden;
      };
      document.addEventListener('visibilitychange', onVisibility);
      visibilityCleanup = () => document.removeEventListener('visibilitychange', onVisibility);

      const onResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        const mat = particles?.material as import('three').ShaderMaterial | undefined;
        if (mat?.uniforms?.uPixelRatio) {
          mat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
        }
      };

      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(container);
    };

    mount();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      visibilityCleanup?.();

      if (earthMeshes) {
        earthMeshes.geometries.forEach((g) => g.dispose());
        earthMeshes.materials.forEach((m) => m.dispose());
      }
      particles?.geometry.dispose();
      (particles?.material as import('three').Material | undefined)?.dispose();
      if (textures) disposeTextures(textures);

      renderer?.dispose();
      if (renderer?.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      container.replaceChildren();
    };
  }, [isDark, reducedMotion, rotationSpeed, showParticles]);

  return (
    <div
      ref={containerRef}
      className="auth-globe-webgl"
      aria-hidden
      data-theme={isDark ? 'dark' : 'light'}
    />
  );
}
