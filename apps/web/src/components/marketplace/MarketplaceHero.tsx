'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Zap, TrendingUp, Users, ShieldCheck } from 'lucide-react';

const STATS = [
  { label: 'subscribers today', value: '847',   prefix: '',  icon: Users,       color: 'text-cyan-400'    },
  { label: 'revenue generated', value: '12.4Cr', prefix: '₹', icon: TrendingUp,  color: 'text-emerald-400' },
  { label: 'new this week',     value: '23',     prefix: '+', icon: Zap,         color: 'text-violet-400'  },
];

const CARDS = [
  { id: 1, rotate: -7, x: -44, z: 10, y: 0,  name: 'Neural Alpha',  ret: '+124%', price: '₹2,499', positive: true  },
  { id: 2, rotate:  0, x:   0, z: 20, y: 8,  name: 'Fast Arb',      ret: '+42%',  price: 'FREE',   positive: true  },
  { id: 3, rotate:  7, x:  44, z: 10, y: 0,  name: 'Gamma Sniper',  ret: '+412%', price: '₹5,499', positive: true  },
];

export function MarketplaceHero() {
  return (
    <section className="relative w-full overflow-hidden border-b border-white/[0.06]" style={{ minHeight: 176 }}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0e1244] via-[#0b1035] to-[#09090f]" />

      {/* Animated indigo blob */}
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -24, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -top-1/3 right-1/4 w-[600px] h-[400px] rounded-full blur-[100px] bg-indigo-600/15"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="pointer-events-none absolute bottom-0 left-1/4 w-[400px] h-[200px] rounded-full blur-[80px] bg-cyan-500/10"
      />

      {/* Fine dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top shimmer line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

      <div className="relative z-10 flex h-full items-center justify-between px-5 py-6 md:px-8 md:py-7">
        {/* ── LEFT ── */}
        <div className="flex flex-col gap-1.5 max-w-xl">
          {/* Label badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-0.5 inline-flex w-fit items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1"
          >
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
              style={{ boxShadow: '0 0 6px #818cf8' }}
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-300">Marketplace</span>
            <ShieldCheck className="w-3 h-3 text-indigo-400/60 ml-0.5" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-2xl md:text-[32px] font-bold text-white tracking-[-0.02em] leading-tight"
          >
            Discover Proven{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #22d3ee)' }}
            >
              Strategies
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="text-[13px] text-white/45 font-medium"
          >
            50+ verified strategies from elite quantitative creators.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="flex items-center gap-5 mt-3"
          >
            {STATS.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <div className="flex items-center gap-2">
                  <stat.icon className={cn('w-3.5 h-3.5 shrink-0', stat.color)} />
                  <div>
                    <p className="text-sm font-bold text-white font-mono tabular-nums leading-none">
                      <span className="text-white/35 mr-0.5">{stat.prefix}</span>
                      {stat.value}
                    </p>
                    <p className="text-[9px] text-white/28 uppercase font-bold tracking-[0.14em] mt-0.5 leading-none">{stat.label}</p>
                  </div>
                </div>
                {i < STATS.length - 1 && (
                  <div className="h-5 w-px bg-white/[0.08]" />
                )}
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT — floating card stack ── */}
        <div className="relative w-52 h-36 pointer-events-none hidden xl:block">
          <div className="absolute inset-0 flex items-center justify-center">
            {CARDS.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.85, rotate: card.rotate, x: card.x }}
                animate={{ opacity: 1, scale: 1, rotate: card.rotate, x: card.x, y: [card.y, card.y - 10, card.y] }}
                transition={{
                  opacity: { duration: 0.5, delay: card.id * 0.15 },
                  scale: { duration: 0.5, delay: card.id * 0.15 },
                  y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: card.id * 0.6 },
                }}
                style={{ zIndex: card.z }}
                className="absolute w-[148px] h-[76px] rounded-2xl border border-white/[0.1] bg-[#0d1240]/80 backdrop-blur-md p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between"
              >
                {/* Top shine */}
                <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="flex items-center justify-between">
                  <div className="w-5 h-5 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                    <Zap className="w-2.5 h-2.5 text-indigo-400" />
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-md border',
                    card.positive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  )}>
                    {card.ret}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] text-white/25 uppercase tracking-widest font-bold leading-none">Strategy</p>
                  <p className="text-[11px] font-bold text-white truncate mt-0.5">{card.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
