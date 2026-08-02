'use client';

/**
 * Progressive hero ambient visual.
 * Layers: Poster/CSS → Animated SVG → SceneSlot (SceneManager / Spline) → Interactive
 */

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { isExperienceEngineEnabled } from '@/platform/experience/index-flag';
import { heroRuntimeApi } from '@/platform/experience/hero-runtime';
import { durationSeconds, MOTION_EASING } from '@/platform/motion/motion-tokens';
import { SceneSlot } from '@/components/3d/SceneSlot';
import { evaluateSceneGate } from '@/platform/experience/scene-a11y';

const PRIMARY_PATH =
  'M 0 210 C 45 198, 95 182, 145 162 S 215 118, 275 88 S 335 52, 400 28';
const SECONDARY_PATH =
  'M 0 225 C 55 210, 115 195, 165 178 S 235 145, 295 122 S 355 92, 400 72';
const GHOST_PATH =
  'M 0 198 C 38 186, 78 174, 128 160 S 188 128, 248 102 S 308 68, 400 44';

const NODES = [
  { cx: 145, cy: 162, delay: 0.2 },
  { cx: 275, cy: 88, delay: 0.5 },
  { cx: 355, cy: 38, delay: 0.8 },
] as const;

const VOLUME_BARS = [
  { x: 32, h: 28 },
  { x: 58, h: 42 },
  { x: 84, h: 35 },
  { x: 110, h: 52 },
  { x: 136, h: 38 },
  { x: 162, h: 48 },
  { x: 188, h: 32 },
  { x: 214, h: 55 },
  { x: 240, h: 40 },
  { x: 266, h: 58 },
  { x: 292, h: 44 },
  { x: 318, h: 50 },
] as const;

const LIVE_CHIPS = [
  { label: 'BTC/USDT', value: '+2.84%', top: '22%', left: '52%', delay: 0 },
  { label: 'AI Signal', value: 'Active', top: '38%', left: '68%', delay: 0.4 },
  { label: 'Portfolio', value: '+12.6%', top: '58%', left: '44%', delay: 0.8 },
] as const;

const CTA_CHIPS = [
  { label: 'Win Rate', value: '73.4%', top: '28%', left: '55%', delay: 0 },
  { label: 'Sharpe', value: '2.14', top: '52%', left: '62%', delay: 0.5 },
] as const;

export function HeroAmbientVisual({
  variant = 'hero',
}: {
  variant?: 'hero' | 'cta';
}) {
  const reduceMotion = useReducedMotion();
  const chips = variant === 'cta' ? CTA_CHIPS : LIVE_CHIPS;
  const showScan = variant === 'hero';
  const engineOn = isExperienceEngineEnabled();
  const [mountScene, setMountScene] = useState(false);
  const [layer, setLayer] = useState<'static' | 'animated' | 'scene3d' | 'interactive'>(
    'static',
  );

  useEffect(() => {
    if (reduceMotion) {
      setMountScene(false);
      setLayer('animated');
      return;
    }

    let cancelled = false;
    let idleId: number | undefined;
    let po: PerformanceObserver | undefined;

    const mountWhenReady = () => {
      if (cancelled) return;
      const gate = evaluateSceneGate('heroTrading');
      if (engineOn) {
        heroRuntimeApi.start({
          webglReady: gate.allowWebGL,
          onLayer: (l) => {
            setLayer(l);
            if (l === 'scene3d' || l === 'interactive') {
              setMountScene(true);
            }
          },
        });
      }
      setLayer('animated');
      setMountScene(true);
      if (gate.allowWebGL) setLayer('scene3d');
    };

    const scheduleIdle = () => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(() => mountWhenReady(), { timeout: 1800 });
      } else {
        setTimeout(mountWhenReady, 400);
      }
    };

    try {
      po = new PerformanceObserver((list) => {
        if (list.getEntries().length === 0) return;
        po?.disconnect();
        scheduleIdle();
      });
      po.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      scheduleIdle();
    }

    const hardFallbackId = setTimeout(mountWhenReady, 2800);

    return () => {
      cancelled = true;
      po?.disconnect();
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      clearTimeout(hardFallbackId);
    };
  }, [engineOn, reduceMotion]);

  useEffect(() => {
    if (!engineOn) return;
    const onVis = () => {
      if (document.visibilityState === 'hidden') heroRuntimeApi.pause();
      else heroRuntimeApi.resume();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [engineOn]);

  const enterMs = durationSeconds('Hero');
  const ease = MOTION_EASING.Smooth;

  return (
    <motion.div
      className={variant === 'cta' ? 'hero-ambient hero-ambient-cta' : 'hero-ambient'}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: enterMs, delay: 0.1, ease: ease as unknown as number[] }}
      aria-hidden
      data-hero-layer={layer}
    >
      <div className="hero-ambient-core exp-hero-surface">
        <div className="hero-ambient-mesh" />
        {!reduceMotion && (
          <div className="hero-ambient-mesh hero-ambient-mesh-b" />
        )}

        {mountScene && (
          <div className="hero-ambient-lines absolute inset-0">
            <SceneSlot
              sceneKey="heroTrading"
              role="interactive"
              priority
              className="h-full w-full min-h-[16rem]"
            />
          </div>
        )}

        <svg
          viewBox="0 0 400 260"
          className="hero-ambient-svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="heroLineMain" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
              <stop offset="20%" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="75%" stopColor="var(--primary)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--chart-3)" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="heroLineGhost" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--chart-3)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--chart-3)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="heroVolumeFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
            <filter id="heroLineGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g opacity={reduceMotion ? 0.35 : 0.55}>
            {VOLUME_BARS.map((b) => (
              <rect
                key={b.x}
                x={b.x}
                y={230 - b.h}
                width="10"
                height={b.h}
                rx="2"
                fill="url(#heroVolumeFill)"
              />
            ))}
          </g>

          <path
            d={GHOST_PATH}
            fill="none"
            stroke="url(#heroLineGhost)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d={SECONDARY_PATH}
            fill="none"
            stroke="url(#heroLineGhost)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d={PRIMARY_PATH}
            fill="none"
            stroke="url(#heroLineMain)"
            strokeWidth="2.75"
            strokeLinecap="round"
            filter="url(#heroLineGlow)"
          />

          {NODES.map((n) => (
            <circle
              key={`${n.cx}-${n.cy}`}
              cx={n.cx}
              cy={n.cy}
              r="3.5"
              fill="var(--primary)"
              opacity="0.85"
            />
          ))}
        </svg>

        {showScan && !reduceMotion && <div className="hero-ambient-scan" />}

        {!reduceMotion &&
          chips.map((c) => (
            <motion.div
              key={c.label}
              className="hero-ambient-chip"
              style={{ top: c.top, left: c.left }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + c.delay, duration: 0.45 }}
            >
              <span className="hero-ambient-chip-label">{c.label}</span>
              <span className="hero-ambient-chip-value">{c.value}</span>
            </motion.div>
          ))}
      </div>
    </motion.div>
  );
}
