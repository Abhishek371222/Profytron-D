'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Shield, Zap } from 'lucide-react';

interface CardProps {
  title: string;
  value: string;
  winRate: number;
  icon: any;
  angle: number;
  opacity: number;
  yOffset: number;
  duration: number;
  delay?: number;
}

const StrategyCard = ({ title, value, winRate, icon: Icon, angle, opacity, yOffset, duration, delay = 0 }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: angle }}
      animate={{ 
        opacity,
        rotate: angle,
        y: [0, yOffset, 0]
      }}
      transition={{
        opacity: { duration: 0.8, delay },
        rotate: { duration: 0 },
        y: { 
          duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay 
        }
      }}
      className="absolute w-64 glass p-4 rounded-2xl border-white/5 shadow-2xl backdrop-blur-xl"
      style={{ rotate: `${angle}deg` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-p/20 flex items-center justify-center text-p">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{title}</h4>
          <p className="text-sm font-bold text-white tracking-tight">{value}</p>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-white/60">
          <span>Win Rate</span>
          <span className="text-p font-bold">{winRate}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${winRate}%` }}
            transition={{ duration: 1.5, delay: 0.5 + delay }}
            className="h-full bg-gradient-to-r from-p to-s"
          />
        </div>
      </div>
    </motion.div>
  );
};

interface Item {
  title: string;
  value: string;
  winRate: number;
  icon: any;
  angle: number;
  opacity: number;
  yOffset: number;
  duration: number;
  delay?: number;
}

export const FloatingCards = ({ type = 'strategies' }: { type?: 'strategies' | 'achievements' }) => {
  const strategyItems: Item[] = [
    { title: "Neural Nexus", value: "+124.5% APR", winRate: 68, icon: Zap, angle: -8, opacity: 0.3, yOffset: -12, duration: 3 },
    { title: "Quantum Arb", value: "+42.8% APR", winRate: 94, icon: TrendingUp, angle: 8, opacity: 0.6, yOffset: -16, duration: 4, delay: 0.5 },
    { title: "Black Swan", value: "+12.4% APR", winRate: 99, icon: Shield, angle: 0, opacity: 1, yOffset: -8, duration: 5, delay: 1 },
  ];

  const achievementItems: Item[] = [
    { title: "Alpha Hunter", value: "Level 4", winRate: 85, icon: Zap, angle: -8, opacity: 0.3, yOffset: -12, duration: 3 },
    { title: "Risk Master", value: "Level 9", winRate: 100, icon: Shield, angle: 8, opacity: 0.6, yOffset: -16, duration: 4, delay: 0.5 },
    { title: "Profit Pilot", value: "Level 7", winRate: 72, icon: TrendingUp, angle: 0, opacity: 1, yOffset: -8, duration: 5, delay: 1 },
  ];

  const items = type === 'strategies' ? strategyItems : achievementItems;

  return (
    <div className="relative w-full h-80 flex items-center justify-center">
      {items.map((item, i) => (
        <StrategyCard key={i} {...item} />
      ))}
    </div>
  );
};
