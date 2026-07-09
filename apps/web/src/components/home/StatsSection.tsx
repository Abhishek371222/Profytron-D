"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLiveMarketFeed } from "@/hooks/useLiveMarketFeed";
import { DollarSign, Users, TrendingUp, Timer } from "lucide-react";

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
    <span ref={ref} className="tabular-nums">
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const stats = [
  {
    label: "Cumulative Trading Volume",
    value: 4.8,
    suffix: "B+",
    prefix: "$",
    decimals: 1,
    icon: DollarSign,
  },
  {
    label: "Active Algorithmic Traders",
    value: 120,
    suffix: "K+",
    prefix: "",
    decimals: 0,
    icon: Users,
  },
  {
    label: "Average Annual Return (Live)",
    value: 12.4,
    suffix: "%",
    prefix: "+",
    decimals: 1,
    icon: TrendingUp,
  },
  {
    label: "Average Execution Latency",
    value: 45,
    suffix: "ms",
    prefix: "",
    decimals: 0,
    icon: Timer,
  },
];

export function StatsSection() {
  return (
    <section className="landing-section !py-12 sm:!py-16">
      <div className="page-container relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[24px] border border-[var(--card-border)] bg-card shadow-[0_10px_40px_rgba(15,23,42,0.06)] overflow-hidden"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[var(--card-border)]">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  className="flex flex-col items-center text-center px-4 py-8 sm:py-10"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="brand-gradient-text mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    <AnimatedStat
                      value={stat.value}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                      decimals={stat.decimals}
                    />
                  </p>
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground max-w-[180px] leading-relaxed">
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const FALLBACK_TICKER = [
  { id: "BTCUSDT", pair: "BTC/USDT", type: "buy", price: "67,342.00", change: 2.41 },
  { id: "EURUSD", pair: "EUR/USD", type: "buy", price: "1.08420", change: 0.18 },
  { id: "XAUUSD", pair: "XAU/USD", type: "buy", price: "2,341.50", change: 0.32 },
] as const;

export function LiveTicker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { margin: "200px 0px" });
  const { quotes, wsConnected } = useLiveMarketFeed(["BTCUSDT", "EURUSD", "XAUUSD"], {
    enabled: inView,
  });

  const liveTrades = Object.values(quotes)
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

  const trades = liveTrades.length > 0 ? liveTrades : [...FALLBACK_TICKER];

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full relative z-20">
      <div className="w-full border-y border-[var(--card-border)] bg-card/80 py-4 sm:py-5 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-secondary)] via-transparent to-[var(--bg-secondary)] z-10 pointer-events-none" />

        <div className="page-container flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 z-20">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border border-[var(--card-border)] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
                {wsConnected ? "Streaming live (WS)" : "Live market data"}
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-8 sm:gap-14 z-20 overflow-x-auto scrollbar-hide w-full">
            <AnimatePresence mode="popLayout">
              {trades.map((trade) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-4 text-sm whitespace-nowrap"
                >
                  <span className="font-bold text-foreground tracking-tight uppercase">{trade.pair}</span>
                  <div
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                      trade.type === "buy"
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground border border-border",
                    )}
                  >
                    {trade.type}
                  </div>
                  <span className="font-mono text-sm font-bold">
                    <span className="text-primary">{trade.price}</span>{" "}
                    <span className={trade.change >= 0 ? "text-emerald-600" : "text-destructive"}>
                      {trade.change >= 0 ? "+" : ""}
                      {trade.change.toFixed(2)}%
                    </span>
                  </span>
                  <div className="w-px h-5 bg-border mx-1" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
