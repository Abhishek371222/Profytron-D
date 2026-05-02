'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';

/**
 * CinematicCursor – Profytron premium cursor.
 *
 * Three-layer system:
 *  1. Ambient orb  – 500px, ~4 % opacity, screen blend → atmospheric glow
 *                    that enriches dark backgrounds without touching UI.
 *  2. Precision dot – 10px solid indigo, instantaneous follow.
 *  3. Ring          – 22px indigo border, slight lag for a springy feel.
 *
 * No goo filter; no large semi-transparent blobs – those were washing
 * out text and cards.  Renders only on pointer (non-touch) devices.
 */
export function CinematicCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  // Element refs: [0] ambient, [1] dot, [2] ring
  const orbRef  = useRef<HTMLDivElement>(null);
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;

    // Ambient orb – slow, dreamy drift
    gsap.to(orbRef.current, {
      x, y,
      duration: 0.9,
      ease: 'power1.out',
      overwrite: 'auto',
    });

    // Precision dot – near-instant
    gsap.to(dotRef.current, {
      x, y,
      duration: 0.04,
      ease: 'power4.out',
      overwrite: 'auto',
    });

    // Ring – light spring lag
    gsap.to(ringRef.current, {
      x, y,
      duration: 0.18,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  }, []);

  useEffect(() => {
    const isChromium = /Chrome|Chromium/.test(navigator.userAgent) && !/Edg|OPR|Firefox/i.test(navigator.userAgent);
    if (!isChromium) {
      setIsTouchDevice(true);
      return;
    }

    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    setIsTouchDevice(!hasPointer);
    if (!hasPointer) return;

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [handleMove]);

  if (isTouchDevice) return null;

  return (
    <>
      {/* ── 1. Ambient orb ─────────────────────────────────────────────
           Very large, nearly transparent. Screen blend = additive light
           on dark bg only; has zero visual impact on text or UI cards
           because it's only 4 % opacity.                              ── */}
      <div
        ref={orbRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none will-change-transform rounded-full"
        style={{
          zIndex: 9990,
          width: 500,
          height: 500,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, rgba(6,182,212,0.06) 50%, transparent 70%)',
          mixBlendMode: 'screen',
          // No filter — keeps it smooth & GPU-friendly
        }}
      />

      {/* ── 2. Precision dot ───────────────────────────────────────────
           Solid small circle. Sits above everything, always readable. ── */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none will-change-transform rounded-full"
        style={{
          zIndex: 9999,
          width: 8,
          height: 8,
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#818cf8', // p-light — slightly lighter for visibility
          boxShadow: '0 0 6px 2px rgba(99,102,241,0.8)',
          mixBlendMode: 'screen',
        }}
      />

      {/* ── 3. Ring ────────────────────────────────────────────────────
           Slightly lagged ring — springy, premium feel. On hover over
           interactive elements you could expand this (future enhancement). ── */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none will-change-transform rounded-full"
        style={{
          zIndex: 9998,
          width: 26,
          height: 26,
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(129, 140, 248, 0.55)',
          mixBlendMode: 'screen',
        }}
      />
    </>
  );
}
