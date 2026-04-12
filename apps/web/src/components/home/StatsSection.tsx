"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CountUp } from "@/components/animations";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const stats = [
  { label: "Cumulative Trading Volume", value: 4.8, suffix: "B+", prefix: "$" },
  { label: "Active Algorithmic Traders", value: 120, suffix: "K+", prefix: "" },
  { label: "Average Alpha Generation", value: 12.4, suffix: "%", prefix: "+" },
  { label: "Order Execution Speed", value: 45, suffix: "ms", prefix: "" },
];

export function StatsSection() {
  return (
    <section className="pt-20 pb-32 bg-black relative overflow-hidden">
      {/* Background Decorative Architecture */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-0 w-[400px] h-100 bg-p/20 blur-[150px] rounded-full -translate-x-1/2" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] mix-blend-overlay opacity-30" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
          {stats.map((stat) => (
            <div key={stat.label} className="group flex flex-col items-center">
              <div className="text-7xl md:text-9xl font-bold mb-6 text-white flex items-center justify-center tracking-[-0.08em] group-hover:drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-1000">
                <span className="text-p text-3xl md:text-5xl mr-1 opacity-30 select-none">
                  {stat.prefix}
                </span>
                <CountUp
                  value={stat.value}
                  decimals={stat.value % 1 !== 0 ? 1 : 0}
                />
                <span className="text-p text-3xl md:text-5xl ml-2">
                  {stat.suffix}
                </span>
              </div>
              <div className="flex flex-col items-center gap-6">
                <div className="h-0.5 w-16 bg-white/5 relative overflow-hidden group-hover:w-32 transition-all duration-1000">
                  <div className="absolute inset-0 bg-p opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/30 group-hover:text-p/80 transition-all duration-700 text-center max-w-[200px] leading-relaxed break-words">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Industrial Scanline for section transition */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-p/20 to-transparent" />
    </section>
  );
}

// Simulated data for the LiveTicker
const initialTrades = [
  {
    id: "1",
    pair: "BTC/USDT",
    type: "buy",
    amount: "0.45",
    price: "64,210.50",
    time: "Just now",
  },
  {
    id: "2",
    pair: "ETH/USDT",
    type: "sell",
    amount: "12.2",
    price: "3,450.20",
    time: "2s ago",
  },
  {
    id: "3",
    pair: "SOL/USDT",
    type: "buy",
    amount: "145.0",
    price: "142.15",
    time: "5s ago",
  },
  {
    id: "4",
    pair: "BNB/USDT",
    type: "buy",
    amount: "25.5",
    price: "580.40",
    time: "8s ago",
  },
];

export function LiveTicker() {
  const [trades, setTrades] = useState(initialTrades);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrades((prev) => {
        const newTrade = {
          ...prev[prev.length - 1],
          id: Math.random().toString(),
          time: "Just now",
          amount: (Math.random() * 5 + 0.1).toFixed(2),
          price: (Math.random() * 60000 + 1000).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          }),
          type: Math.random() > 0.4 ? "buy" : "sell",
        };
        return [newTrade, ...prev.slice(0, 4)];
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center w-full relative z-20">
      <div className="w-full bg-black/80 backdrop-blur-3xl border-y border-white/5 py-5 overflow-hidden relative group z-0">
        <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-r from-black via-transparent to-black z-10 pointer-events-none" />

        <div className="container mx-auto px-6 flex items-center gap-16">
          <div className="flex items-center gap-6 shrink-0 z-20">
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="flex items-center gap-3 px-6 py-2.5 rounded-t-xl bg-black/80 border-t border-l border-r border-white/5 backdrop-blur-3xl transform translate-y-[1px] relative z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]"
            >
              <div className="w-2 h-2 rounded-full bg-p animate-pulse shadow-[0_0_10px_#6366f1]" />
              <span className="text-[10px] text-white/50 font-mono uppercase tracking-widest">
                STREAMING LIVE MARKET DATA
              </span>
            </motion.div>
          </div>

          <div className="flex-1 flex items-center gap-16 z-20 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
            <AnimatePresence mode="popLayout">
              {trades.map((trade) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-5 text-sm whitespace-nowrap group/trade"
                >
                  <span className="font-semibold text-white tracking-tight uppercase">
                    {trade.pair}
                  </span>
                  <div
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-[0.1em]",
                      trade.type === "buy"
                        ? "bg-p/10 text-p border border-p/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                        : "bg-white/5 text-white/40 border border-white/10",
                    )}
                  >
                    {trade.type}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-white/20 font-semibold uppercase tracking-widest">
                      {trade.amount} UNITS
                    </span>
                    <span className="text-white font-mono text-sm font-bold tracking-tight">
                      @ <span className="text-p">{trade.price}</span>
                    </span>
                  </div>
                  <div className="w-px h-6 bg-white/5 mx-2" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
