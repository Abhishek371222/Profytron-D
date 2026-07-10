'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { generateMarketCandles, sma, type Candle } from '@/components/auth/terminal/constants';

const CANDLES = generateMarketCandles(76);

function chartScale(candles: Candle[]) {
  const lows = candles.map((c) => c.l);
  const highs = candles.map((c) => c.h);
  const min = Math.floor(Math.min(...lows) / 10) * 10 - 10;
  const max = Math.ceil(Math.max(...highs) / 10) * 10 + 10;
  const chartH = 200;
  const volH = 36;
  const y = (v: number) => chartH - ((v - min) / (max - min)) * chartH;
  return { min, max, chartH, volH, y, totalH: chartH + volH + 24 };
}

export function AuthTerminalMarketChart() {
  const { min, max, chartH, volH, y, totalH } = chartScale(CANDLES);
  const closes = CANDLES.map((c) => c.c);
  const ma20 = sma(closes, 20);
  const ma8 = sma(closes, 8);
  const candleW = 8;
  const gap = 3.5;
  const width = CANDLES.length * (candleW + gap) + 60;
  const maxVol = Math.max(...CANDLES.map((c) => c.v));

  const gridSteps = 5;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const price = min + ((max - min) / gridSteps) * i;
    return { price, py: y(price) };
  });

  const maPath = (data: (number | null)[]) => {
    const pts = data
      .map((v, i) => {
        if (v === null) return null;
        const px = 30 + i * (candleW + gap) + candleW / 2;
        return `${px},${y(v)}`;
      })
      .filter(Boolean) as string[];
    if (!pts.length) return '';
    return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`;
  };

  return (
    <div className="at-chart" aria-hidden>
      <motion.svg
        className="at-chart__svg"
        viewBox={`0 0 ${width} ${totalH}`}
        preserveAspectRatio="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0, 0, 0.2, 1] }}
      >
        <defs>
          <linearGradient id="at-chart-fade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B1118" stopOpacity="0" />
            <stop offset="35%" stopColor="#0B1118" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0B1118" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="at-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9FE1F3" stopOpacity="0" />
            <stop offset="50%" stopColor="#9FE1F3" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#9FE1F3" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {gridLines.map(({ price, py }) => (
          <g key={price} opacity="0.35">
            <line x1="24" y1={py} x2={width - 36} y2={py} stroke="#AAB6BE" strokeWidth="0.5" opacity="0.12" />
            <text x={width - 32} y={py + 3} className="at-chart__price" textAnchor="start">
              {price.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Volume */}
        {CANDLES.map((c, i) => {
          const x = 30 + i * (candleW + gap);
          const vh = (c.v / maxVol) * volH;
          const up = c.c >= c.o;
          return (
            <rect
              key={`v-${i}`}
              x={x}
              y={chartH + 8 + (volH - vh)}
              width={candleW}
              height={vh}
              rx="1"
              fill={up ? '#348398' : '#973336'}
              opacity="0.18"
            />
          );
        })}

        {/* Candles */}
        {CANDLES.map((c, i) => {
          const x = 30 + i * (candleW + gap);
          const up = c.c >= c.o;
          const color = up ? '#348398' : '#973336';
          const bodyTop = y(Math.max(c.o, c.c));
          const bodyH = Math.max(Math.abs(y(c.o) - y(c.c)), 1.5);
          return (
            <g key={i} opacity="0.85">
              <line
                x1={x + candleW / 2}
                y1={y(c.h)}
                x2={x + candleW / 2}
                y2={y(c.l)}
                stroke={color}
                strokeWidth="1"
                opacity="0.7"
              />
              <rect x={x} y={bodyTop} width={candleW} height={bodyH} rx="1.5" fill={color} opacity="0.75" />
            </g>
          );
        })}

        {/* Moving averages */}
        <motion.path
          d={maPath(ma20)}
          fill="none"
          stroke="#9FE1F3"
          strokeWidth="1.25"
          opacity="0.35"
          animate={{ opacity: [0.28, 0.42, 0.28] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <path d={maPath(ma8)} fill="none" stroke="#348398" strokeWidth="1" opacity="0.3" />

        {/* Time labels */}
        {['08 Apr', '09 Apr', '10 Apr', '11 Apr', '12 Apr'].map((label, i) => (
          <text
            key={label}
            x={30 + i * Math.floor(CANDLES.length / 4) * (candleW + gap)}
            y={totalH - 2}
            className="at-chart__time"
          >
            {label}
          </text>
        ))}

        <rect x="0" y="0" width={width} height={totalH} fill="url(#at-chart-fade)" pointerEvents="none" />
      </motion.svg>
    </div>
  );
}
