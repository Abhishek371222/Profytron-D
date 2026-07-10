'use client';

import { motion } from 'framer-motion';
import { MARKET_ARCS, MARKET_NODES } from '@/components/auth/terminal/constants';

/** Simplified continental dot clusters for SVG world map */
const CONTINENT_DOTS: readonly (readonly [number, number])[] = [
  /* North America */
  [220, 140], [240, 130], [260, 125], [280, 135], [300, 150], [250, 160], [270, 175], [290, 185],
  [230, 170], [210, 155], [245, 145], [265, 155], [285, 165], [255, 190], [275, 200],
  /* South America */
  [310, 280], [320, 300], [305, 320], [315, 340], [325, 360], [300, 310], [318, 330],
  /* Europe */
  [470, 130], [490, 125], [510, 135], [530, 145], [480, 150], [500, 160], [520, 155],
  [485, 140], [505, 145], [515, 165], [495, 170],
  /* Africa */
  [500, 220], [510, 250], [520, 280], [505, 300], [515, 320], [490, 260], [525, 240],
  /* Asia */
  [620, 140], [660, 130], [700, 125], [740, 135], [780, 145], [820, 155], [860, 165],
  [640, 160], [680, 170], [720, 165], [760, 175], [800, 180], [840, 190], [700, 150],
  [750, 200], [790, 220], [730, 210], [770, 240], [810, 250],
  /* Australia */
  [820, 320], [840, 335], [860, 345], [830, 350], [850, 360],
];

function arcPath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - 60 - Math.abs(x2 - x1) * 0.08;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

export function AuthTerminalWorldMap() {
  const nodeMap = Object.fromEntries(MARKET_NODES.map((n) => [n.id, n]));

  return (
    <div className="at-map" aria-hidden>
      <svg className="at-map__svg" viewBox="0 0 1000 420" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="at-node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#348398" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#348398" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="at-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#348398" stopOpacity="0" />
            <stop offset="50%" stopColor="#9FE1F3" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#348398" stopOpacity="0" />
          </linearGradient>
        </defs>

        {CONTINENT_DOTS.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="1.8" fill="#AAB6BE" opacity="0.18" />
        ))}

        {MARKET_ARCS.map(({ from, to }, i) => {
          const a = nodeMap[from];
          const b = nodeMap[to];
          const d = arcPath(a.x, a.y, b.x, b.y);
          return (
            <g key={`${from}-${to}`}>
              <path d={d} fill="none" stroke="url(#at-arc-grad)" strokeWidth="1" opacity="0.35" />
              <motion.path
                d={d}
                fill="none"
                stroke="#9FE1F3"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeDasharray="6 14"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5, strokeDashoffset: [0, -40] }}
                transition={{
                  pathLength: { duration: 2.5, delay: i * 0.2 },
                  opacity: { duration: 1 },
                  strokeDashoffset: { duration: 20, repeat: Infinity, ease: 'linear' },
                }}
              />
            </g>
          );
        })}

        {MARKET_NODES.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <circle r="14" fill="url(#at-node-glow)" opacity="0.5" />
            <circle r="4" fill="#348398" opacity="0.9" />
            <circle r="7" fill="none" stroke="#9FE1F3" strokeWidth="0.75" opacity="0.45" />
            <text x="0" y="-14" textAnchor="middle" className="at-map__node-label">
              {node.label}
            </text>
            <text x="0" y="-2" textAnchor="middle" className="at-map__node-sub">
              {node.exchange}
            </text>
            <text x="0" y="10" textAnchor="middle" className="at-map__node-time">
              {node.time}
            </text>
          </g>
        ))}
      </svg>

      <div className="at-map__particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="at-map__particle"
            style={{
              left: `${8 + (i * 17) % 88}%`,
              top: `${12 + (i * 23) % 70}%`,
              animationDelay: `${i * 2.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
