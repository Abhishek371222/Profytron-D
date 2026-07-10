'use client';

const ARCS = [
  { d: 'M -120 280 Q 180 120 420 200 T 780 160', dur: 28, opacity: 0.12 },
  { d: 'M -80 360 Q 220 240 480 280 T 820 220', dur: 22, opacity: 0.12 },
  { d: 'M -40 200 Q 260 80 520 140 T 860 100', dur: 35, opacity: 0.12 },
  { d: 'M 20 420 Q 300 300 560 340 T 900 300', dur: 24, opacity: 0.1 },
  { d: 'M 60 160 Q 340 40 600 100 T 940 60', dur: 31, opacity: 0.12 },
  { d: 'M 100 320 Q 380 200 640 240', dur: 20, opacity: 0.11 },
  { d: 'M 140 240 Q 400 160 680 200', dur: 26, opacity: 0.1 },
] as const;

export function AuthOrbitalArcs() {
  return (
    <svg
      className="auth-orbital-arcs"
      viewBox="0 0 960 520"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="auth-arc-fade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#348398" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#348398" stopOpacity="0.18" />
          <stop offset="78%" stopColor="#348398" stopOpacity="0.06" />
          <stop offset="92%" stopColor="#348398" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ARCS.map(({ d, dur, opacity }, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="url(#auth-arc-fade)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={opacity}
          pathLength={1}
          strokeDasharray="0.12 0.88"
          className="auth-orbital-arc-path"
          style={{ animationDuration: `${dur}s` }}
        />
      ))}
    </svg>
  );
}
