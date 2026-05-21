"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLiveMarketFeed } from "@/hooks/useLiveMarketFeed";

/* ── Animated counter that triggers on viewport entry ── */
function AnimatedStat({
  value,
  suffix,
  prefix,
  decimals = 0,
}: {
  value: number;
  suffix: string;
  prefix: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(value * ease);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const stats = [
  { label: "Cumulative Trading Volume", value: 4.8, suffix: "B+", prefix: "$", decimals: 1, accent: "violet" },
  { label: "Active Algorithmic Traders",  value: 120, suffix: "K+", prefix: "",  decimals: 0, accent: "cyan"   },
  { label: "Average Alpha Generation",    value: 12.4, suffix: "%", prefix: "+", decimals: 1, accent: "emerald" },
  { label: "Order Execution Speed",       value: 45,  suffix: "ms", prefix: "",  decimals: 0, accent: "indigo"  },
];

const ACCENT_COLORS: Record<string, string> = {
  violet:  "text-violet-400",
  cyan:    "text-cyan-400",
  emerald: "text-emerald-400",
  indigo:  "text-indigo-400",
};

const ACCENT_GLOW: Record<string, string> = {
  violet:  "rgba(167,139,250,0.3)",
  cyan:    "rgba(34,211,238,0.3)",
  emerald: "rgba(52,211,153,0.3)",
  indigo:  "rgba(99,102,241,0.3)",
};

export function StatsSection() {
  return (
    <section className="pt-24 pb-32 bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-[-10%] w-[40vw] h-[40vw] bg-indigo-500/[0.06] blur-[160px] rounded-full -translate-y-1/2" />
        <div className="absolute top-1/2 right-[-10%] w-[40vw] h-[40vw] bg-violet-500/[0.04] blur-[160px] rounded-full -translate-y-1/2" />
      </div>

      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="group flex flex-col items-center text-center"
            >
              {/* Big number */}
              <div
                className={cn(
                  "text-[clamp(3rem,7vw,5.5rem)] font-extrabold mb-5 font-mono tracking-[-0.06em] transition-all duration-700",
                  ACCENT_COLORS[stat.accent],
                )}
                style={{
                  filter: `drop-shadow(0 0 0px ${ACCENT_GLOW[stat.accent]})`,
                  transition: "filter 0.4s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.filter = `drop-shadow(0 0 30px ${ACCENT_GLOW[stat.accent]})`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.filter = `drop-shadow(0 0 0px ${ACCENT_GLOW[stat.accent]})`;
                }}
              >
                <AnimatedStat
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  decimals={stat.decimals}
                />
              </div>

              {/* Animated line */}
              <motion.div
                initial={{ width: "2rem" }}
                whileInView={{ width: "4rem" }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.7 }}
                className={cn("h-[1.5px] rounded-full mb-4", `bg-gradient-to-r from-transparent via-current to-transparent`, ACCENT_COLORS[stat.accent], "opacity-50 group-hover:opacity-100 transition-opacity")}
              />

              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/30 group-hover:text-white/55 transition-colors duration-500 max-w-[160px] leading-relaxed">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />
    </section>
  );
}

/* ── Live ticker bar (unchanged API) ── */
export function LiveTicker() {
  const { quotes, wsConnected } = useLiveMarketFeed(["BTCUSDT", "EURUSD", "XAUUSD"]);

  const trades = Object.values(quotes)
    .filter(Boolean)
    .map((quote) => ({
      id: quote!.symbol,
      pair:
        quote!.symbol === "BTCUSDT"
          ? "BTC/USDT"
          : quote!.symbol === "EURUSD"
          ? "EUR/USD"
          : "XAU/USD",
      type: quote!.change24hPct >= 0 ? "buy" : "sell",
      price: quote!.price.toLocaleString(undefined, {
        minimumFractionDigits: quote!.symbol === "EURUSD" ? 5 : 2,
        maximumFractionDigits: quote!.symbol === "EURUSD" ? 6 : 2,
      }),
      change: quote!.change24hPct,
    }));

  return (
    <div className="flex flex-col items-center w-full relative z-20">
      <div className="w-full bg-black/80 backdrop-blur-3xl border-y border-white/[0.05] py-5 overflow-hidden relative group z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10 pointer-events-none" />

        <div className="container mx-auto px-6 flex items-center gap-12">
          <div className="flex items-center gap-6 shrink-0 z-20">
            <motion.div
              animate={{ opacity: [0.4, 0.85, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="flex items-center gap-3 px-5 py-2 rounded-xl bg-black/80 border border-white/[0.06] backdrop-blur-xl shadow-lg"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-indigo-400"
                style={{ boxShadow: "0 0 8px #6366f1" }}
              />
              <span className="text-[10px] text-white/45 font-mono uppercase tracking-widest">
                {wsConnected ? "Streaming live (WS)" : "Live market data"}
              </span>
            </motion.div>
          </div>

          <div className="flex-1 flex items-center gap-14 z-20 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <AnimatePresence mode="popLayout">
              {trades.map((trade) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-4 text-sm whitespace-nowrap"
                >
                  <span className="font-bold text-white tracking-tight uppercase">{trade.pair}</span>
                  <div
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-[0.1em]",
                      trade.type === "buy"
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        : "bg-white/[0.04] text-white/35 border border-white/[0.08]",
                    )}
                  >
                    {trade.type}
                  </div>
                  <span className="text-white font-mono text-sm font-bold tracking-tight">
                    <span className="text-indigo-400">{trade.price}</span>{" "}
                    <span className={trade.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {trade.change >= 0 ? "+" : ""}{trade.change.toFixed(2)}%
                    </span>
                  </span>
                  <div className="w-px h-5 bg-white/[0.06] mx-1" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
