/**
 * AmbientDepthBackground — shared 3D-first chrome (no WebGL by default).
 * Uses brand lighting + depth/glass/fog tokens. Optional ambient scene on desktop high+.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { SceneSlot } from './SceneSlot';
import { evaluateSceneGate } from '@/platform/experience/scene-a11y';

export function AmbientDepthBackground({
  variant = 'marketing',
  position = 'fixed',
  enableAmbientScene = false,
  className,
}: {
  variant?: 'marketing' | 'dashboard' | 'auth' | 'admin';
  position?: 'fixed' | 'absolute';
  /** Desktop high+ only; SceneManager still gates mobile/memory. */
  enableAmbientScene?: boolean;
  className?: string;
}) {
  const [allowAmbient, setAllowAmbient] = useState(false);

  useEffect(() => {
    if (!enableAmbientScene) {
      setAllowAmbient(false);
      return;
    }
    setAllowAmbient(evaluateSceneGate('ambientDepth').allowWebGL);
  }, [enableAmbientScene]);

  return (
    <div
      aria-hidden
      className={cn('ambient-depth-bg inset-0 overflow-hidden pointer-events-none', className)}
      style={{ position, zIndex: 0 }}
      data-variant={variant}
    >
      <div className="ambient-depth-base absolute inset-0" />
      <div className="ambient-depth-key absolute inset-0" />
      <div className="ambient-depth-fill absolute inset-0" />
      <div className="ambient-depth-rim absolute inset-0" />
      <div className="ambient-depth-fog absolute inset-0" />
      <div className="ambient-depth-noise absolute inset-0 opacity-[0.035] mix-blend-overlay" />

      {allowAmbient ? (
        <div className="absolute inset-0 opacity-40">
          <SceneSlot
            sceneKey="ambientDepth"
            role="ambient"
            className="h-full w-full"
            showCssDepth={false}
          />
        </div>
      ) : null}
    </div>
  );
}
