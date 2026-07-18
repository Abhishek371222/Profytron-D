"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const PRIMARY_PATH =
  "M 0 210 C 45 198, 95 182, 145 162 S 215 118, 275 88 S 335 52, 400 28";

const SECONDARY_PATH =
  "M 0 225 C 55 210, 115 195, 165 178 S 235 145, 295 122 S 355 92, 400 72";

const GHOST_PATH =
  "M 0 198 C 38 186, 78 174, 128 160 S 188 128, 248 102 S 308 68, 400 44";

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
  { label: "BTC/USDT", value: "+2.84%", top: "22%", left: "52%", delay: 0 },
  { label: "AI Signal", value: "Active", top: "38%", left: "68%", delay: 0.4 },
  { label: "Portfolio", value: "+12.6%", top: "58%", left: "44%", delay: 0.8 },
] as const;

const CTA_CHIPS = [
  { label: "Win Rate", value: "73.4%", top: "28%", left: "55%", delay: 0 },
  { label: "Sharpe", value: "2.14", top: "52%", left: "62%", delay: 0.5 },
] as const;

export function HeroAmbientVisual({ variant = "hero" }: { variant?: "hero" | "cta" }) {
  const reduceMotion = useReducedMotion();
  const chips = variant === "cta" ? CTA_CHIPS : LIVE_CHIPS;
  const showScan = variant === "hero";

  return (
    <motion.div
      className={variant === "cta" ? "hero-ambient hero-ambient-cta" : "hero-ambient"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      <div className="hero-ambient-core">
        <div className="hero-ambient-mesh" />
        <div className="hero-ambient-mesh hero-ambient-mesh-b" />

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
              transition={{ duration: 0.8, delay: 0.6 + i * 0.04, ease: "easeOut" }}
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
            transition={{ duration: 2.6, delay: 0.1, ease: "easeInOut" }}
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
              pathLength: { duration: 2.4, delay: 0.2, ease: "easeInOut" },
              opacity: { duration: 2.4, delay: 0.2 },
              strokeDashoffset: { duration: 6, repeat: Infinity, ease: "linear", delay: 2.8 },
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
            transition={{ duration: 2.2, delay: 0.15, ease: "easeInOut" }}
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
                transition={{ delay: node.delay + 1.8, duration: 0.5 }}
                style={{ animationDelay: `${node.delay}s` }}
              />
              <motion.circle
                cx={node.cx}
                cy={node.cy}
                r={3.75}
                className="hero-ambient-node"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: node.delay + 2, duration: 0.4, type: "spring", stiffness: 260 }}
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
              transition={{ delay: 1.6 + chip.delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ top: chip.top, left: chip.left }}
            >
              <span className="hero-ambient-chip-label">{chip.label}</span>
              <span className="hero-ambient-chip-value">{chip.value}</span>
            </motion.div>
          ))}
        </div>

        <div className="hero-ambient-particles">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="hero-ambient-particle"
              style={{
                top: `${12 + (i * 7) % 78}%`,
                left: `${10 + (i * 11) % 82}%`,
                animationDelay: `${i * 0.42}s`,
                animationDuration: `${4 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        {showScan && <div className="hero-ambient-scan" />}
      </div>
    </motion.div>
  );
}
