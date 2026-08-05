'use client';

import React from 'react';
import { HeroExecutionEngine } from './hero-execution-engine';
import { HERO_SCENE, type HeroScene } from './hero-scene-config';

/**
 * Canvas host for the Autonomous Execution Core. It deliberately mirrors the
 * particle scene lifecycle: post-LCP mount, viewport pausing and clean teardown.
 */
export function HeroExecutionScene({
  active,
  scene = HERO_SCENE,
}: {
  active: boolean;
  scene?: HeroScene;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!active || scene !== 'execution-core') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: HeroExecutionEngine;
    try {
      engine = new HeroExecutionEngine(canvas);
    } catch {
      return;
    }

    engine.start();

    const onVisibility = () => {
      if (document.hidden) engine.pause();
      else engine.resume();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) engine.resume();
              else engine.pause();
            },
            { rootMargin: '80px' },
          )
        : null;
    io?.observe(canvas);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      io?.disconnect();
      engine.dispose();
    };
  }, [active, scene]);

  if (scene !== 'execution-core') return null;

  return (
    <div className="hero-scene hero-execution-scene" aria-hidden>
      <canvas ref={canvasRef} className="hero-scene-canvas" />
      <div className="hero-scene-scrim" />
    </div>
  );
}
