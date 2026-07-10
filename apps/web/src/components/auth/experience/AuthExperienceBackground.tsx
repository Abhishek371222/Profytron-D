'use client';

import { motion } from 'framer-motion';

type Candle = { x: number; h: number; body: number; up: boolean };

function buildCandles(offset: number, count: number): Candle[] {
  const pattern = [72, 48, 88, 55, 95, 42, 110, 65, 78, 52, 92, 58];
  return Array.from({ length: count }, (_, i) => {
    const h = pattern[i % pattern.length];
    const up = i % 3 !== 1;
    return { x: offset + i * 28, h, body: Math.round(h * 0.38), up };
  });
}

function CandlestickChart({ candles, id }: { candles: Candle[]; id: string }) {
  return (
    <svg className="ax-bg-candles" viewBox="0 0 360 200" preserveAspectRatio="xMidYMax meet" aria-hidden>
      <defs>
        <linearGradient id={`${id}-fade`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${id}-depth`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="var(--ax-chart-up)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--ax-chart-up)" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {candles.map((c, i) => {
        const y = 168 - c.h;
        const color = c.up ? `url(#${id}-depth)` : 'var(--ax-chart-down)';
        const wick = c.up ? 'var(--ax-chart-up)' : 'var(--ax-chart-down)';
        return (
          <g key={i} className="ax-bg-candle">
            <line x1={c.x + 9} y1={y} x2={c.x + 9} y2={y + c.h} stroke={wick} strokeWidth="1.25" opacity="0.7" />
            <rect
              x={c.x}
              y={y + (c.h - c.body) / 2}
              width="18"
              height={c.body}
              rx="2.5"
              fill={color}
              stroke={c.up ? 'var(--ax-chart-up)' : 'transparent'}
              strokeWidth="0.5"
            />
          </g>
        );
      })}
    </svg>
  );
}

function WaveChart() {
  return (
    <svg className="ax-bg-wave-svg" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="ax-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--ax-primary)" stopOpacity="0" />
          <stop offset="28%" stopColor="var(--ax-primary)" stopOpacity="0.45" />
          <stop offset="72%" stopColor="var(--ax-secondary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--ax-primary)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ax-wave-mask-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0.2" />
          <stop offset="50%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0.2" />
        </linearGradient>
        <mask id="ax-wave-mask">
          <rect width="1200" height="200" fill="url(#ax-wave-mask-grad)" />
        </mask>
      </defs>
      <g mask="url(#ax-wave-mask)">
        <motion.path
          className="ax-bg-wave-line"
          d="M0,118 C180,78 380,158 580,98 S980,58 1200,108"
          fill="none"
          stroke="url(#ax-wave-grad)"
          strokeWidth="1.75"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.8, ease: [0, 0, 0.2, 1] }}
        />
        <path
          d="M0,138 C240,98 490,168 740,118 S1060,88 1200,128"
          fill="none"
          stroke="var(--ax-primary)"
          strokeWidth="1"
          opacity="0.2"
        />
      </g>
    </svg>
  );
}

function StarField() {
  const stars = [
    [8, 12], [22, 8], [35, 18], [48, 6], [62, 14], [78, 9], [88, 20], [15, 28], [42, 32],
    [68, 25], [92, 35], [5, 45], [28, 52], [55, 48], [82, 55], [12, 68], [38, 72], [72, 65],
    [90, 78], [18, 85], [50, 88], [75, 82],
  ] as const;

  return (
    <svg className="ax-bg-stars" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {stars.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i % 4 === 0 ? 0.22 : 0.14}
          fill="var(--ax-secondary)"
          opacity={0.15 + (i % 5) * 0.06}
        />
      ))}
    </svg>
  );
}

type PillConfig = {
  label: string;
  placement: string;
  delay: number;
};

const CENTERED_PILLS: PillConfig[] = [
  { label: '+12.45%', placement: 'ax-bg-pill--edge-tl', delay: 0 },
  { label: '+78.24', placement: 'ax-bg-pill--edge-ml', delay: 1.4 },
  { label: '4ms', placement: 'ax-bg-pill--edge-br', delay: 0.7 },
];

const SPLIT_PILLS: PillConfig[] = [
  { label: '+12.45%', placement: 'ax-bg-pill--split-tl', delay: 0 },
  { label: '+78.24', placement: 'ax-bg-pill--split-mid', delay: 1.1 },
  { label: '+23.67%', placement: 'ax-bg-pill--split-tr', delay: 0.5 },
];

type AuthExperienceBackgroundProps = {
  variant?: 'centered' | 'split';
};

export function AuthExperienceBackground({ variant = 'centered' }: AuthExperienceBackgroundProps) {
  const pills = variant === 'split' ? SPLIT_PILLS : CENTERED_PILLS;
  const leftCandles = buildCandles(24, 8);
  const rightCandles = buildCandles(20, 12);

  return (
    <div className={`ax-bg ax-bg--${variant}`} aria-hidden>
      <div className="ax-bg-depth" />
      <div className="ax-bg-mesh" />
      <div className="ax-bg-haze" />
      <StarField />
      <div className="ax-bg-vignette" />
      <div className="ax-bg-noise" />
      <div className="ax-bg-orb ax-bg-orb--1" />
      <div className="ax-bg-orb ax-bg-orb--2" />
      <div className="ax-bg-orb ax-bg-orb--3" />
      <div className="ax-bg-dots" />
      <div className="ax-bg-card-shield" />

      <div className="ax-bg-market">
        <motion.div
          className="ax-bg-chart-left"
          animate={{ x: [0, -10, 0] }}
          transition={{ duration: 42, repeat: Infinity, ease: 'easeInOut' }}
        >
          <CandlestickChart candles={leftCandles} id="ax-chart-l" />
        </motion.div>
        <motion.div
          className="ax-bg-chart-right"
          animate={{ x: [0, 12, 0] }}
          transition={{ duration: 38, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        >
          <CandlestickChart candles={rightCandles} id="ax-chart-r" />
        </motion.div>
        <div className="ax-bg-wave">
          <WaveChart />
        </div>
      </div>

      {pills.map(({ label, placement, delay }) => (
        <motion.span
          key={label}
          className={`ax-bg-pill ${placement}`}
          animate={{
            y: [0, -3, 0],
            opacity: [0.72, 0.92, 0.72],
          }}
          transition={{
            duration: 8 + delay * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay,
          }}
        >
          {label}
        </motion.span>
      ))}
    </div>
  );
}
