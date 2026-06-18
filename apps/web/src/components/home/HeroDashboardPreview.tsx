"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Library,
  Bot,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  ChevronDown,
} from "lucide-react";
import { AnimatedLineChart } from "@/components/animations/AnimatedLineChart";
import { cn } from "@/lib/utils";

type DemoTab = "overview" | "analytics" | "strategies" | "bots" | "portfolio";

const NAV: { id: DemoTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "strategies", label: "Strategies", icon: Library },
  { id: "bots", label: "Bots", icon: Bot },
  { id: "portfolio", label: "Portfolio", icon: Wallet },
];

const TOP_STATS = {
  overview: [
    { label: "Total P&L", value: "₹4.82Cr", change: "+12.54%", up: true },
    { label: "Win Rate", value: "73.4%", change: "+8.21%", up: true },
    { label: "Sharpe Ratio", value: "2.14", change: "+0.31", up: true },
    { label: "Max Drawdown", value: "-4.2%", change: "+1.12%", up: false },
  ],
  analytics: [
    { label: "Alpha", value: "1.84", change: "+0.22", up: true },
    { label: "Beta", value: "0.62", change: "-0.04", up: false },
    { label: "Sortino", value: "2.91", change: "+0.18", up: true },
    { label: "Volatility", value: "11.2%", change: "-1.4%", up: true },
  ],
  strategies: [
    { label: "Active", value: "12", change: "+3", up: true },
    { label: "Backtests", value: "847", change: "+42", up: true },
    { label: "Avg Return", value: "+18.4%", change: "+2.1%", up: true },
    { label: "Risk Score", value: "Low", change: "Stable", up: true },
  ],
  bots: [
    { label: "Running", value: "3", change: "Live", up: true },
    { label: "Uptime", value: "99.99%", change: "+0.01%", up: true },
    { label: "Orders/min", value: "142", change: "+18", up: true },
    { label: "Latency", value: "<12ms", change: "-2ms", up: true },
  ],
  portfolio: [
    { label: "Equity", value: "$284,120", change: "+5.8%", up: true },
    { label: "Positions", value: "12", change: "Active", up: true },
    { label: "Exposure", value: "68%", change: "-4%", up: true },
    { label: "P&L Today", value: "+$2,840", change: "+1.2%", up: true },
  ],
};

const BOTTOM_STATS = {
  overview: [
    { label: "Active Bots", value: "3", sub: "Running" },
    { label: "Open Positions", value: "12", sub: "Active" },
    { label: "Trades Executed", value: "4,281", sub: "This Month" },
    { label: "Success Rate", value: "89.7%", sub: "Profitable" },
  ],
  analytics: [
    { label: "ROI", value: "+34.2%", sub: "YTD" },
    { label: "Trades", value: "1,204", sub: "Analyzed" },
    { label: "Avg Hold", value: "4.2h", sub: "Per Trade" },
    { label: "Risk/Reward", value: "1:2.8", sub: "Ratio" },
  ],
  strategies: [
    { label: "Deployed", value: "8", sub: "Live" },
    { label: "Paper", value: "4", sub: "Testing" },
    { label: "Signals", value: "156", sub: "Today" },
    { label: "Hit Rate", value: "71%", sub: "30d" },
  ],
  bots: [
    { label: "Scalper X", value: "ON", sub: "BTC/USD" },
    { label: "Trend Pro", value: "ON", sub: "ETH/USD" },
    { label: "Grid Bot", value: "ON", sub: "SOL/USD" },
    { label: "Copies", value: "847", sub: "Followers" },
  ],
  portfolio: [
    { label: "Crypto", value: "42%", sub: "Allocation" },
    { label: "Forex", value: "28%", sub: "Allocation" },
    { label: "Indices", value: "18%", sub: "Allocation" },
    { label: "Cash", value: "12%", sub: "Reserve" },
  ],
};

function tabTitle(tab: DemoTab, overviewTitle: string): string {
  if (tab === "overview") return overviewTitle;
  const labels: Record<Exclude<DemoTab, "overview">, string> = {
    analytics: "Analytics",
    strategies: "Strategies",
    bots: "Trading Bots",
    portfolio: "Portfolio",
  };
  return labels[tab];
}

function StatCard({
  label,
  value,
  change,
  up,
}: {
  label: string;
  value: string;
  change: string;
  up: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-card p-3 min-w-0 card-lift transition-shadow hover:shadow-card-premium">
      <p className="text-[11px] text-muted-foreground font-medium truncate">{label}</p>
      <p className="text-sm font-bold text-foreground mt-0.5 truncate">{value}</p>
      <div className={cn("flex items-center gap-1 mt-1 text-[11px] font-semibold", up ? "text-[var(--success)]" : "text-destructive")}>
        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {change}
      </div>
    </div>
  );
}

function BottomStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-card/80 p-3 card-lift">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

export function HeroDashboardPreview({
  showHint = true,
  overviewTitle = "Overview",
}: {
  showHint?: boolean;
  overviewTitle?: string;
}) {
  const [tab, setTab] = React.useState<DemoTab>("overview");

  return (
    <motion.div
      className="animate-float w-full max-w-[580px] xl:max-w-[640px]"
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="relative rounded-[20px] border border-[var(--card-border)] bg-card overflow-hidden shadow-card-premium glass-sweep"
        style={{ boxShadow: "0 10px 30px rgba(15,23,42,0.05), 0 20px 60px rgba(71,167,170,0.08)" }}
      >
        <div className="flex min-h-[380px] sm:min-h-[420px]">
          {/* Sidebar */}
          <aside className="hidden sm:flex flex-col w-[148px] shrink-0 border-r border-[var(--card-border)] bg-[#EEF2FF]/80 dark:bg-[var(--sidebar)] py-4 px-2 gap-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[11px] font-medium transition-colors",
                  tab === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-3">
            {/* Mobile tab pills */}
            <div className="flex sm:hidden gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {NAV.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors",
                    tab === id
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "text-muted-foreground border-border",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <AnimatePresence mode="wait">
                  <motion.h3
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="text-sm font-bold text-foreground"
                  >
                    {tabTitle(tab, overviewTitle)}
                  </motion.h3>
                </AnimatePresence>
                {tab === "overview" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-2 py-0.5 mt-1 text-[9px] font-semibold text-[var(--success)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                    Live
                  </span>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Welcome back, Alex</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--card-border)] text-[10px] text-muted-foreground"
                >
                  <Calendar className="w-3 h-3" />
                  May 15 – Jun 15
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--card-border)] text-[10px] font-medium text-foreground"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
                <div className="w-7 h-7 rounded-full bg-gradient-cta flex items-center justify-center text-[9px] font-bold text-white">
                  AM
                </div>
              </div>
            </div>

            {/* Top stats */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`top-${tab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-2"
              >
                {TOP_STATS[tab].map((s) => (
                  <StatCard key={s.label} {...s} />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Chart */}
            <div className="flex-1 min-h-[100px] rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-3 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-foreground">Performance Chart</span>
                <span className="text-[10px] text-primary font-mono">+12.54%</span>
              </div>
              <div className="h-[80px] sm:h-[100px]">
                <AnimatedLineChart />
              </div>
            </div>

            {/* Bottom stats */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`bottom-${tab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-2"
              >
                {BOTTOM_STATS[tab].map((s) => (
                  <BottomStat key={s.label} {...s} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {showHint && (
        <p className="text-center text-caption text-muted-foreground mt-3 hidden sm:block">
          Click sidebar tabs to explore — Analytics, Strategies, Bots, Portfolio
        </p>
      )}
    </motion.div>
  );
}
