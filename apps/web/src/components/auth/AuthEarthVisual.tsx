'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains('dark'));
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const NODES: [number, number, number][] = [
  [185, 195, 0], [265, 175, 0.4], [310, 230, 0.8], [220, 285, 1.2], [170, 250, 1.6],
  [340, 210, 2], [130, 220, 2.5], [290, 160, 3],
];

const STARS: [number, number, number][] = [
  [42, 38, 0], [120, 22, 1.2], [280, 45, 2.4], [350, 80, 0.8], [90, 120, 3.1],
  [220, 95, 1.8], [310, 160, 4], [55, 200, 2.2], [400, 120, 1.5], [160, 60, 2.8],
];

function EarthDark() {
  return (
    <svg viewBox="0 0 480 480" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="ed-sphere" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#1a3540" />
          <stop offset="45%" stopColor="#0c1820" />
          <stop offset="100%" stopColor="#030608" />
        </radialGradient>
        <radialGradient id="ed-atmo" cx="50%" cy="50%" r="52%">
          <stop offset="68%" stopColor="transparent" />
          <stop offset="85%" stopColor="#348398" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ADFFFC" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id="ed-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#348398" stopOpacity="0.35" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="ed-lights" cx="42%" cy="38%" r="45%">
          <stop offset="0%" stopColor="#ffd080" stopOpacity="0.35" />
          <stop offset="40%" stopColor="#ff9040" stopOpacity="0.12" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="ed-bloom">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="240" cy="240" r="220" fill="url(#ed-glow)" className="auth-glow-breathe" />
      <g className="auth-earth-rotate" style={{ transformOrigin: '240px 240px' }}>
        <circle cx="240" cy="240" r="155" fill="url(#ed-sphere)" />
        <circle cx="240" cy="240" r="155" fill="url(#ed-lights)" />
        <circle cx="240" cy="240" r="155" fill="url(#ed-atmo)" />
        {[48, 88, 128].map((ry) => (
          <ellipse
            key={`lat-${ry}`}
            cx="240"
            cy="240"
            rx="155"
            ry={ry}
            stroke="#348398"
            strokeWidth="0.6"
            opacity={0.32 - ry * 0.001}
          />
        ))}
        {[48, 88, 128].map((rx) => (
          <ellipse
            key={`lon-${rx}`}
            cx="240"
            cy="240"
            rx={rx}
            ry="155"
            stroke="#348398"
            strokeWidth="0.5"
            opacity={0.25 - rx * 0.001}
          />
        ))}
        <path
          d="M115 195 Q165 155 225 170 T345 185 Q315 225 255 240 T125 255 Z"
          fill="#348398"
          opacity="0.22"
        />
        <path
          d="M145 285 Q205 265 275 280 T365 295 Q325 325 245 330 T135 305 Z"
          fill="#5FB2C4"
          opacity="0.16"
        />
        { }
        {[
          [180, 190], [210, 175], [240, 185], [270, 178], [300, 195],
          [195, 220], [230, 235], [265, 228], [290, 245],
          [170, 260], [220, 275], [260, 268], [310, 285],
        ].map(([cx, cy], i) => (
          <circle key={`city-${i}`} cx={cx} cy={cy} r="1.5" fill="#ffd080" opacity="0.85" filter="url(#ed-bloom)" />
        ))}
        {NODES.map(([cx, cy, delay], i) => (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r="10"
              fill="#348398"
              opacity="0.14"
              className="auth-node-pulse"
              style={{ animationDelay: `${delay}s` }}
            />
            <circle
              cx={cx}
              cy={cy}
              r="3.5"
              fill="#ADFFFC"
              className="auth-node-pulse"
              style={{ animationDelay: `${delay}s` }}
            />
          </g>
        ))}
        <path
          d="M185 195 Q230 160 310 230"
          stroke="#ADFFFC"
          strokeWidth="1.2"
          opacity="0.45"
          strokeDasharray="6 10"
          className="auth-connection-dash"
        />
        <path
          d="M170 250 Q240 200 265 175"
          stroke="#348398"
          strokeWidth="1"
          opacity="0.4"
          strokeDasharray="5 8"
          className="auth-connection-dash"
          style={{ animationDelay: '1s' }}
        />
        <path
          d="M220 285 Q280 250 360 300"
          stroke="#973336"
          strokeWidth="0.9"
          opacity="0.35"
          strokeDasharray="5 8"
          className="auth-connection-dash"
          style={{ animationDelay: '2s' }}
        />
        <path
          d="M130 220 Q200 180 340 210"
          stroke="#26a69a"
          strokeWidth="0.8"
          opacity="0.3"
          strokeDasharray="4 8"
          className="auth-connection-dash"
          style={{ animationDelay: '3s' }}
        />
      </g>
      {STARS.map(([cx, cy, delay], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="1.3"
          fill="#ADFFFC"
          className="auth-star"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </svg>
  );
}

function EarthLight() {
  return (
    <svg viewBox="0 0 480 480" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="el-sphere" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#F4F9FB" />
          <stop offset="100%" stopColor="#E8F4F8" />
        </radialGradient>
        <radialGradient id="el-atmo" cx="50%" cy="50%" r="52%">
          <stop offset="72%" stopColor="transparent" />
          <stop offset="90%" stopColor="#9FE1F3" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#348398" stopOpacity="0.18" />
        </radialGradient>
        <radialGradient id="el-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ADFFFC" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#348398" stopOpacity="0.1" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <pattern id="el-dots" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.1" fill="#348398" opacity="0.22" />
        </pattern>
      </defs>
      <circle cx="240" cy="240" r="215" fill="url(#el-glow)" className="auth-glow-breathe" />
      <g className="auth-earth-rotate" style={{ transformOrigin: '240px 240px' }}>
        <circle cx="240" cy="240" r="155" fill="url(#el-sphere)" stroke="#C4E8E7" strokeWidth="1.2" />
        <circle cx="240" cy="240" r="155" fill="url(#el-atmo)" />
        {[48, 88, 128].map((ry) => (
          <ellipse
            key={`llat-${ry}`}
            cx="240"
            cy="240"
            rx="155"
            ry={ry}
            stroke="#348398"
            strokeWidth="1"
            opacity={0.4 - ry * 0.001}
          />
        ))}
        {[48, 88, 128].map((rx) => (
          <ellipse
            key={`llon-${rx}`}
            cx="240"
            cy="240"
            rx={rx}
            ry="155"
            stroke="#348398"
            strokeWidth="0.75"
            opacity={0.3 - rx * 0.001}
          />
        ))}
        <path d="M125 205 Q175 168 235 182 T345 195 Q315 235 255 248 T135 262 Z" fill="url(#el-dots)" />
        <path
          d="M155 295 Q215 275 285 290 T365 305 Q325 335 245 340 T145 315 Z"
          fill="#FFFFFF"
          stroke="#BFECEB"
          strokeWidth="0.8"
          opacity="0.92"
        />
        <ellipse cx="200" cy="175" rx="32" ry="14" fill="#FFFFFF" opacity="0.65" transform="rotate(-18 200 175)" />
        {NODES.map(([cx, cy, delay], i) => (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r="8"
              fill="#348398"
              opacity="0.12"
              className="auth-node-pulse"
              style={{ animationDelay: `${delay}s` }}
            />
            <circle
              cx={cx}
              cy={cy}
              r="3"
              fill="#348398"
              opacity="0.55"
              className="auth-node-pulse"
              style={{ animationDelay: `${delay}s` }}
            />
          </g>
        ))}
        <path
          d="M190 198 Q235 165 305 225"
          stroke="#348398"
          strokeWidth="0.9"
          opacity="0.45"
          strokeDasharray="4 7"
          className="auth-connection-dash"
        />
        <path
          d="M175 252 Q245 205 268 180"
          stroke="#9FE1F3"
          strokeWidth="0.8"
          opacity="0.55"
          strokeDasharray="3 6"
          className="auth-connection-dash"
          style={{ animationDelay: '1.5s' }}
        />
        <path
          d="M220 285 Q280 250 340 295"
          stroke="#26a69a"
          strokeWidth="0.7"
          opacity="0.4"
          strokeDasharray="4 7"
          className="auth-connection-dash"
          style={{ animationDelay: '2.5s' }}
        />
      </g>
    </svg>
  );
}

export function AuthEarthVisual({ className }: { className?: string }) {
  const isDark = useIsDark();

  return (
    <div className={cn('relative mx-auto aspect-square w-full max-w-[min(520px,95vw)]', className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-full opacity-20"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/auth/noise.svg" alt="" className="h-full w-full object-cover mix-blend-overlay" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[2%] auth-glow-breathe rounded-full bg-[radial-gradient(circle,#348398_0%,transparent_72%)] opacity-40"
      />
      <div className="relative z-10 h-full w-full">{isDark ? <EarthDark /> : <EarthLight />}</div>
    </div>
  );
}
