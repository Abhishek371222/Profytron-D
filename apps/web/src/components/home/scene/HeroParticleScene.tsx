'use client';

/**
 * HeroParticleScene — mounts the particle stage behind the hero copy.
 *
 * Deliberately inert until `active` is true. HeroSection passes that from the
 * same post-LCP gate the ambient visual already used, so nothing here loads,
 * samples, or paints during the critical window.
 *
 * Pauses whenever the tab is hidden or the hero scrolls out of view.
 */

import React from 'react';
import { HeroParticleEngine } from './hero-particle-engine';
import { CREATURE_SRC, HERO_SCENE, type HeroScene } from './hero-scene-config';

export function HeroParticleScene({
  active,
  scene = HERO_SCENE,
}: {
  /** Post-LCP gate — the engine does nothing until this flips true. */
  active: boolean;
  scene?: HeroScene;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!active || scene === 'off') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let engine: HeroParticleEngine;

    try {
      engine = new HeroParticleEngine(canvas);
    } catch {
      return; // no 2d context — the hero simply keeps its flat dark stage
    }

    void engine.load(CREATURE_SRC).then(() => {
      if (disposed) return;
      engine.start();
    });

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
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      io?.disconnect();
      engine.dispose();
    };
  }, [active, scene]);

  if (scene === 'off') return null;

  return (
    <div className="hero-scene" aria-hidden>
      <canvas ref={canvasRef} className="hero-scene-canvas" />
      <div className="hero-scene-scrim" />
    </div>
  );
}
