/**
 * SceneSlot — declarative poster host + portal target for SceneManager.
 * Pages never import Spline; they only render SceneSlot with a registry key.
 */

'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useSceneManager, type SceneKey, type SlotRole } from './SceneProvider';
import type { StreamPhase } from '@/platform/experience/layer-streamer';
import { resolveScenePoster, SceneRegistry } from '@/platform/experience/scene-registry';
import { evaluateSceneGate } from '@/platform/experience/scene-a11y';

export function SceneSlot({
  sceneKey,
  role = 'interactive',
  className,
  alt = '',
  priority = false,
  showCssDepth = true,
}: {
  sceneKey: SceneKey;
  role?: SlotRole;
  className?: string;
  alt?: string;
  /** LCP: set true for above-fold heroes. */
  priority?: boolean;
  showCssDepth?: boolean;
}) {
  const slotId = useId();
  const mountRef = useRef<HTMLDivElement>(null);
  const { register, unregister } = useSceneManager();
  const [phase, setPhase] = useState<StreamPhase>('poster');
  const [fallback, setFallback] = useState(false);
  const poster = resolveScenePoster(sceneKey);
  const entry = SceneRegistry[sceneKey];

  // Prefer PNG hero when webp may 404 during bootstrap
  const [imgSrc, setImgSrc] = useState(poster);
  useEffect(() => {
    setImgSrc(poster);
  }, [poster]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const gate = evaluateSceneGate(sceneKey);
    if (!gate.allowWebGL) {
      setFallback(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;
        io.disconnect();
        register({
          slotId,
          key: sceneKey,
          role,
          container: el,
          onPhase: setPhase,
          onFallback: () => setFallback(true),
          onMounted: () => setFallback(false),
        });
      },
      { rootMargin: '80px', threshold: 0.05 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      unregister(slotId);
    };
  }, [slotId, sceneKey, role, register, unregister]);

  const interactive = phase === 'interactive' && !fallback;

  return (
    <div
      className={cn(
        'scene-slot relative overflow-hidden isolate',
        className,
      )}
      data-scene={sceneKey}
      data-phase={phase}
      data-fallback={fallback ? '1' : '0'}
      aria-hidden={alt ? undefined : true}
    >
      {/* Poster — always present for LCP / fallback */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          interactive ? 'opacity-0 pointer-events-none' : 'opacity-100',
        )}
      >
        <Image
          src={imgSrc}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover"
          onError={() => setImgSrc('/hero/hero-trading-3d.png')}
        />
      </div>

      {showCssDepth ? (
        <div
          className={cn(
            'scene-css-depth pointer-events-none absolute inset-0 transition-opacity duration-700',
            phase === 'poster' || fallback ? 'opacity-100' : 'opacity-40',
          )}
          aria-hidden
        />
      ) : null}

      {/* SceneManager mounts canvas here */}
      <div
        ref={mountRef}
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          interactive ? 'opacity-100' : 'opacity-0',
        )}
      />

      <span className="sr-only">
        {entry?.description ?? '3D scene'}
      </span>
    </div>
  );
}
