'use client';

/**
 * Progressive hero ambient visual.
 * Layers: Static → Animated Background → 3D Scene → Interactive
 */

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'framer-motion';
import {
  isExperienceEngineEnabled,
  heroRuntimeApi,
  lodManagerApi,
} from '@/platform/experience';
import { durationSeconds, MOTION_EASING } from '@/platform/motion';

const FloatingLines = dynamic(() => import('@/components/ui/FloatingLines'), {
  ssr: false,
  loading: () => null,
});

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

const DARK_GRADIENT = ['#5FB2C4', '#348398', '#71C0D1', '#1E6D48', '#2D7284'];
const LIGHT_GRADIENT = ['#348398', '#2D7284', '#1E6D48', '#255F6C', '#5FB2C4'];

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export function HeroAmbientVisual({
  variant = 'hero',
}: {
  variant?: 'hero' | 'cta';
}) {
  const reduceMotion = useReducedMotion();
  const isDark = useIsDark();
  const chips = variant === 'cta' ? CTA_CHIPS : LIVE_CHIPS;
  const showScan = variant === 'hero';
  const engineOn = isExperienceEngineEnabled();
  const [mount3d, setMount3d] = useState(false);
  const [layer, setLayer] = useState<'static' | 'animated' | 'scene3d' | 'interactive'>(
    'static',
  );

  useEffect(() => {
    if (reduceMotion) {
      setMount3d(false);
      setLayer('animated');
      return;
    }

    let cancelled = false;
    let idleId: number | undefined;
    let po: PerformanceObserver | undefined;

    const mountWhenReady = () => {
      if (cancelled) return;
      if (!engineOn) {
        setMount3d(true);
        setLayer('interactive');
        return;
      }
      const webgl = detectWebGL();
      heroRuntimeApi.start({
        webglReady: webgl,
        onLayer: (l) => {
          setLayer(l);
          if (l === 'scene3d' || l === 'interactive') {
            if (webgl && heroRuntimeApi.shouldMountWebGL()) setMount3d(true);
          }
        },
      });
      setLayer('animated');
      if (webgl && heroRuntimeApi.shouldMountWebGL()) setMount3d(true);
      else setMount3d(false);
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

  const lineCounts = lodManagerApi.lineCounts([5, 7, 4]);
  const interactive = layer === 'interactive' && !reduceMotion;
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
      {/* Layer 1: static */}
      <div className="hero-ambient-core exp-hero-surface">
        <div className="hero-ambient-mesh" />
        {/* Layer 2: animated mesh */}
        {!reduceMotion && (
          <div className="hero-ambient-mesh hero-ambient-mesh-b" />
        )}

        {/* Layer 3–4: WebGL when allowed */}
        {mount3d && lineCounts.some((n) => n > 0) && (
          <div
            className={`hero-ambient-lines ${isDark ? 'hero-ambient-lines-dark' : 'hero-ambient-lines-light'}`}
          >
            <FloatingLines
              transparent
              linesGradient={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
              enabledWaves={['top', 'middle', 'bottom']}
              lineCount={lineCounts}
              lineDistance={[4, 3, 5]}
              animationSpeed={0.85}
              interactive={interactive}
              parallax={interactive}
              parallaxStrength={0.14}
              bendRadius={6}
              bendStrength={-0.35}
              mouseDamping={0.04}
              topWavePosition={{ x: 8, y: 0.4, rotate: -0.35 }}
              middleWavePosition={{ x: 4, y: -0.1, rotate: 0.15 }}
              bottomWavePosition={{ x: 1.5, y: -0.65, rotate: 0.3 }}
              mixBlendMode={isDark ? 'screen' : 'multiply'}
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
            <pattern id="heroDotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.65" className="hero-ambient-grid-dot" />
            </pattern>
          </defs>

          <rect width="400" height="260" fill="url(#heroDotGrid)" className="hero-ambient-grid" />

          {VOLUME_BARS.map((bar, i) => (
            <motion.rect
              key={bar.x}
              x={bar.x}
              y={240 - bar.h}
              width={14}
              height={bar.h}
              rx={2}
              fill="url(#heroVolumeFill)"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{
                scaleY: reduceMotion ? 0.6 : 1,
                opacity: reduceMotion ? 0.15 : 0.35,
              }}
              style={{ transformOrigin: `${bar.x + 7}px 240px` }}
              transition={{
                duration: durationSeconds('Slow'),
                delay: 0.3 + i * 0.03,
                ease: 'easeOut',
              }}
            />
          ))}

          <motion.path
            d={GHOST_PATH}
            fill="none"
            stroke="url(#heroLineGhost)"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: reduceMotion ? 0.25 : 0.45 }}
            transition={{ duration: durationSeconds('Hero'), delay: 0.05, ease: 'easeInOut' }}
          />

          <motion.path
            d={SECONDARY_PATH}
            fill="none"
            stroke="url(#heroLineGhost)"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeDasharray="4 10"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: reduceMotion ? 0.3 : 0.5,
              strokeDashoffset: reduceMotion ? 0 : [0, -28],
            }}
            transition={{
              pathLength: { duration: durationSeconds('Hero'), delay: 0.1, ease: 'easeInOut' },
              opacity: { duration: durationSeconds('Hero'), delay: 0.1 },
              strokeDashoffset: {
                duration: 6,
                repeat: Infinity,
                ease: 'linear',
                delay: 1.5,
              },
            }}
          />

          <motion.path
            d={PRIMARY_PATH}
            fill="none"
            stroke="url(#heroLineMain)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#heroLineGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: durationSeconds('Hero'), delay: 0.08, ease: 'easeInOut' }}
          />

          {!reduceMotion && (
            <circle
              r={4}
              className="hero-ambient-traveler"
              style={{ offsetPath: `path("${PRIMARY_PATH}")` } as React.CSSProperties}
            />
          )}

          {NODES.map((node, i) => (
            <g key={i}>
              <motion.circle
                cx={node.cx}
                cy={node.cy}
                r={12}
                className="hero-ambient-node-pulse"
                initial={{ opacity: 0 }}
                animate={{ opacity: reduceMotion ? 0.12 : 0.28 }}
                transition={{ delay: node.delay + 0.8, duration: durationSeconds('Standard') }}
                style={{ animationDelay: `${node.delay}s` }}
              />
              <motion.circle
                cx={node.cx}
                cy={node.cy}
                r={3.75}
                className="hero-ambient-node"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: node.delay + 0.9,
                  duration: durationSeconds('Fast'),
                  type: 'spring',
                  stiffness: 260,
                }}
              />
            </g>
          ))}
        </svg>

        <div className="hero-ambient-chips">
          {chips.map((chip) => (
            <motion.div
              key={chip.label}
              className="hero-ambient-chip"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.8 + chip.delay,
                duration: durationSeconds('Standard'),
                ease: MOTION_EASING.Smooth as unknown as number[],
              }}
              style={{ top: chip.top, left: chip.left }}
            >
              <span className="hero-ambient-chip-label">{chip.label}</span>
              <span className="hero-ambient-chip-value">{chip.value}</span>
            </motion.div>
          ))}
        </div>

        {!reduceMotion && layer !== 'static' && (
          <div className="hero-ambient-particles">
            {Array.from({ length: mount3d ? 14 : 6 }).map((_, i) => (
              <span
                key={i}
                className="hero-ambient-particle"
                style={{
                  top: `${12 + ((i * 7) % 78)}%`,
                  left: `${10 + ((i * 11) % 82)}%`,
                  animationDelay: `${i * 0.42}s`,
                  animationDuration: `${4 + (i % 3)}s`,
                }}
              />
            ))}
          </div>
        )}

        {showScan && !reduceMotion && <div className="hero-ambient-scan" />}
      </div>
    </motion.div>
  );
}
