'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';

export function CinematicCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  const orbRef  = useRef<HTMLDivElement>(null);
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;

    if (orbRef.current) {
      gsap.to(orbRef.current, {
        x,
        y,
        duration: 0.9,
        ease: 'power1.out',
        overwrite: 'auto',
      });
    }

    if (dotRef.current) {
      gsap.to(dotRef.current, {
        x,
        y,
        duration: 0.04,
        ease: 'power4.out',
        overwrite: 'auto',
      });
    }

    if (ringRef.current) {
      gsap.to(ringRef.current, {
        x,
        y,
        duration: 0.18,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }
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
      { }
      <div
        ref={orbRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none will-change-transform rounded-full"
        style={{
          zIndex: 9990,
          width: 500,
          height: 500,
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--primary) 13%, transparent) 0%, color-mix(in srgb, var(--chart-5) 6%, transparent) 50%, transparent 70%)',
          mixBlendMode: 'screen',
        }}
      />

      { }
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none will-change-transform rounded-full"
        style={{
          zIndex: 9999,
          width: 8,
          height: 8,
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--primary)',
          boxShadow: '0 0 6px 2px color-mix(in srgb, var(--primary) 80%, transparent)',
          mixBlendMode: 'screen',
        }}
      />

      { }
      <div
        ref={ringRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none will-change-transform rounded-full"
        style={{
          zIndex: 9998,
          width: 26,
          height: 26,
          transform: 'translate(-50%, -50%)',
          border: '1px solid color-mix(in srgb, var(--primary) 55%, transparent)',
          mixBlendMode: 'screen',
        }}
      />
    </>
  );
}
