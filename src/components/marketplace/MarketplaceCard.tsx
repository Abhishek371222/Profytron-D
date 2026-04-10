'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, Star, Zap, Activity, Users, MoreHorizontal, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MarketplaceCardProps {
  strategy: any;
  onSubscribe: (strategy: any) => void;
}

export function MarketplaceCard({ strategy, onSubscribe }: MarketplaceCardProps) {
  const isTrending = strategy.subscribers > 2000;
  const isTopRated = strategy.sharpe > 2.0;
  const isNew = strategy.id === 's_8'; // Just for demo

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="group bg-[#0d0d12]/60 backdrop-blur-3xl border border-white/[0.05] hover:border-white/10 rounded-[28px] overflow-hidden transition-all duration-500"
    >
      {/* Header / Badges */}
      <div className="relative p-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-p/10 group-hover:border-p/20 transition-colors">
              <Activity className="w-5 h-5 text-white/40 group-hover:text-p transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{strategy.category}</span>
              <h3 className="text-sm font-bold text-white tracking-tight leading-none mt-0.5">{strategy.name}</h3>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
             {isTrending && (
               <div className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                 <TrendingUp className="w-2.5 h-2.5" />
                 Trending
               </div>
             )}
             {isTopRated && (
               <div className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                 <Star className="w-2.5 h-2.5 fill-current" />
                 Top Rated
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4">
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.03]">
          <span className="text-[9px] text-white/20 font-black uppercase tracking-widest block mb-1">30D Return</span>
          <span className="text-xs font-bold text-emerald-400">+{strategy.returns}%</span>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.03]">
          <span className="text-[9px] text-white/20 font-black uppercase tracking-widest block mb-1">Risk Score</span>
          <span className="text-xs font-bold text-white/60">{strategy.risk}</span>
        </div>
      </div>

      {/* Pricing & Creator Section */}
      <div className="px-6 py-6 bg-black/20 border-t border-white/[0.03] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-jet-mono tracking-tighter">
                {strategy.price > 0 ? `₹${strategy.price.toLocaleString()}` : "FREE"}
              </span>
              {strategy.price > 0 && <span className="text-[10px] font-bold text-white/20 uppercase">/ MO</span>}
            </div>
            {strategy.price > 0 && (
                <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-tighter">
                   -20% billed annually
                </span>
            )}
          </div>
          {strategy.price > 2000 && (
             <div className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest animate-pulse">
                7-Day Trial
             </div>
          )}
        </div>

        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 p-0.5 overflow-hidden">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${strategy.creator}`} 
                      alt="creator" 
                      className="w-full h-full rounded-full"
                    />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white/80">{strategy.creator}</span>
                        {strategy.verified && <ShieldCheck className="w-3 h-3 text-indigo-400" />}
                    </div>
                    <div className="flex items-center gap-1 opacity-30">
                        <Star className="w-2 h-2 fill-current" />
                        <span className="text-[8px] font-bold">4.8 (124 ratings)</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1 text-white/20">
                <Users className="w-3 h-3" />
                <span className="text-[10px] font-black">{strategy.subscribers}</span>
            </div>
        </div>

        <div className="flex flex-col gap-2">
            <Button 
                onClick={() => onSubscribe(strategy)}
                className="w-full h-11 rounded-xl bg-white text-bg-base hover:bg-white/90 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98]"
            >
                Subscribe <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
            <button className="text-[9px] font-black text-white/20 hover:text-white uppercase tracking-[0.2em] transition-colors py-2">
                View Details
            </button>
        </div>
      </div>
    </motion.div>
  );
}
