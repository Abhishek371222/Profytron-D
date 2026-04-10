'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CountUp } from '@/components/animations';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

const stats = [
  { label: 'Cumulative Trading Volume', value: 4.8, suffix: 'B+', prefix: '$' },
  { label: 'Active Algorithmic Traders', value: 120, suffix: 'K+', prefix: '' },
  { label: 'Average Alpha Generation', value: 12.4, suffix: '%', prefix: '+' },
  { label: 'Order Execution Speed', value: 45, suffix: 'ms', prefix: '' },
];

export function StatsSection() {
  return (
    <section className="py-40 bg-black relative overflow-hidden">
      {/* Background Decorative Architecture */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
         <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-p/20 blur-[150px] rounded-full -translate-x-1/2" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay opacity-30" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
          {stats.map((stat) => (
            <div key={stat.label} className="group flex flex-col items-center">
              <div className="text-6xl md:text-8xl font-syne font-black mb-6 text-white flex items-center justify-center tracking-[-0.08em] italic group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-700">
                <span className="text-p text-3xl md:text-4xl mr-1 italic opacity-50">{stat.prefix}</span>
                <CountUp value={stat.value} decimals={stat.value % 1 !== 0 ? 1 : 0} />
                <span className="text-p text-3xl md:text-4xl ml-2 italic">{stat.suffix}</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                 <div className="h-px w-12 bg-white/10 group-hover:w-24 group-hover:bg-p transition-all duration-700" />
                 <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-white/30 group-hover:text-white transition-all duration-500 font-syne text-center">
                   {stat.label}
                 </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Industrial Scanline for section transition */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-p/20 to-transparent" />
    </section>
  );
}

// Simulated data for the LiveTicker
const initialTrades = [
  { id: '1', pair: 'BTC/USDT', type: 'buy', amount: '0.45', price: '64,210.50', time: 'Just now' },
  { id: '2', pair: 'ETH/USDT', type: 'sell', amount: '12.2', price: '3,450.20', time: '2s ago' },
  { id: '3', pair: 'SOL/USDT', type: 'buy', amount: '145.0', price: '142.15', time: '5s ago' },
  { id: '4', pair: 'BNB/USDT', type: 'buy', amount: '25.5', price: '580.40', time: '8s ago' },
];

export function LiveTicker() {
  const [trades, setTrades] = useState(initialTrades);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrades((prev) => {
        const newTrade = {
          ...prev[prev.length - 1],
          id: Math.random().toString(),
          time: 'Just now',
          amount: (Math.random() * 5 + 0.1).toFixed(2),
          price: (Math.random() * 60000 + 1000).toLocaleString(undefined, { minimumFractionDigits: 2 }),
          type: Math.random() > 0.4 ? 'buy' : 'sell'
        };
        return [newTrade, ...prev.slice(0, 4)];
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-black/80 backdrop-blur-3xl border-b border-white/5 py-5 overflow-hidden relative group">
      <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10 pointer-events-none" />
      
      <div className="container mx-auto px-6 flex items-center gap-16">
        <div className="flex items-center gap-4 shrink-0 z-20">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-p animate-pulse" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-p animate-ping opacity-40" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-p font-syne italic">Network_Alpha_Pulse</span>
        </div>
        
        <div className="flex-1 flex items-center gap-16 z-20 overflow-x-auto no-scrollbar scroll-smooth">
          <AnimatePresence mode="popLayout">
            {trades.map((trade) => (
              <motion.div 
                key={trade.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-5 text-sm whitespace-nowrap group/trade"
              >
                <span className="font-syne font-black text-white italic tracking-tighter uppercase">{trade.pair}</span>
                <div className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] font-syne",
                  trade.type === 'buy' ? "bg-p/10 text-p border border-p/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "bg-white/5 text-white/40 border border-white/10"
                )}>
                  {trade.type}
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] text-white/20 font-black uppercase tracking-widest font-syne">{trade.amount} UNITS</span>
                   <span className="text-white font-mono text-[11px] font-bold tracking-tighter">@ <span className="text-p">{trade.price}</span></span>
                </div>
                <div className="w-px h-6 bg-white/5 mx-2" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
