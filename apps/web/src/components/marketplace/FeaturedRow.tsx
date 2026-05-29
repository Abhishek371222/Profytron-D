'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Sparkles, ArrowRight, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedStrategy {
  id: string;
  name: string;
  returns: string;
  subscribers: string;
  chartData: { val: number }[];
  creator?: string;
  category?: string;
  verified?: boolean;
  monthlyPrice?: number;
  annualPrice?: number;
  lifetimePrice?: number;
  trialDays?: number;
  price?: number;
  risk?: string;
  sharpe?: number;
  returnsValue?: number;
  subscribersValue?: number;
}

const FEATURED_DATA: FeaturedStrategy[] = [
  {
    id: 'f1',
    name: 'MomentumPro Ultra',
    returns: '+18.4%',
    subscribers: '1,247 traders',
    chartData: [
      { val: 10 }, { val: 25 }, { val: 15 }, { val: 40 }, { val: 35 }, { val: 60 }, { val: 55 }, { val: 80 }
    ]
  },
  {
    id: 'f2',
    name: 'Neural Nexus Alpha',
    returns: '+12.5%',
    subscribers: '847 traders',
    chartData: [
      { val: 20 }, { val: 18 }, { val: 35 }, { val: 30 }, { val: 45 }, { val: 42 }, { val: 55 }, { val: 58 }
    ]
  },
  {
    id: 'f3',
    name: 'Black Swan Shield',
    returns: '+8.2%',
    subscribers: '2,100 traders',
    chartData: [
      { val: 10 }, { val: 12 }, { val: 15 }, { val: 18 }, { val: 20 }, { val: 25 }, { val: 28 }, { val: 30 }
    ]
  }
];

interface FeaturedRowProps {
  strategies?: FeaturedStrategy[];
  onSubscribe?: (strategy: FeaturedStrategy) => void;
}

export function FeaturedRow({ strategies, onSubscribe }: FeaturedRowProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);

  const data = strategies && strategies.length > 0 ? strategies : FEATURED_DATA;

  return (
    <div className="space-y-4 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 grid place-items-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-400"
              style={{ boxShadow: '0 0 6px #818cf8' }}
            />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-[0.14em] leading-none">
              Featured Strategies
            </h2>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.18em] mt-1">Verified High Performers</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 6px #34d399' }} />
          <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-[0.18em] hidden md:inline">Live</span>
        </div>
      </div>

      {/* Cards row */}
      <div className="flex gap-4 md:gap-5 overflow-x-auto px-5 md:px-8 pb-6 no-scrollbar scroll-smooth snap-x">
        {data.map((strategy, idx) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ y: -6 }}
            className={cn(
              'relative flex-shrink-0 w-[300px] md:w-[340px] h-[200px] rounded-3xl overflow-hidden group snap-start cursor-pointer',
              'bg-[#0c0c14] border border-white/[0.08]',
              'hover:border-indigo-400/30',
              'transition-[border-color,box-shadow] duration-300',
              'hover:shadow-[0_16px_56px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,102,241,0.12)]',
            )}
            onClick={() => onSubscribe?.(strategy)}
          >
            {/* Equity chart background */}
            <div className="absolute inset-0 opacity-35 group-hover:opacity-55 transition-opacity duration-500">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <AreaChart data={strategy.chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`gradient-${strategy.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.45} />
                        <stop offset="60%"  stopColor="#6366f1" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="val"
                      stroke="#818cf8"
                      strokeWidth={2.5}
                      fill={`url(#gradient-${strategy.id})`}
                      animationDuration={1800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Beam sweep on hover */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-y-0 -inset-x-full w-1/3 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-[-20deg] translate-x-[-200%] group-hover:translate-x-[400%] transition-transform duration-1000 ease-in-out" />
            </div>

            {/* Bottom-up gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

            {/* Top hairline (on hover) */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Featured badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 text-indigo-200 text-[9px] font-bold uppercase tracking-[0.18em] shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Sparkles className="w-2.5 h-2.5" />
              Featured
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <h3 className="text-base md:text-lg font-bold text-white tracking-tight truncate">
                    {strategy.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs font-bold tabular-nums font-mono">{strategy.returns}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/35">
                      <Users className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{strategy.subscribers}</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={(e) => { e.stopPropagation(); onSubscribe?.(strategy); }}
                  className={cn(
                    'group/btn relative shrink-0 h-9 px-3.5 rounded-xl overflow-hidden',
                    'bg-white/[0.06] backdrop-blur-md border border-white/[0.12]',
                    'text-white text-[10px] font-bold uppercase tracking-[0.14em]',
                    'flex items-center gap-1.5',
                    'hover:bg-indigo-500/15 hover:border-indigo-400/40 hover:text-indigo-200',
                    'transition-all duration-200',
                  )}
                >
                  Subscribe
                  <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
