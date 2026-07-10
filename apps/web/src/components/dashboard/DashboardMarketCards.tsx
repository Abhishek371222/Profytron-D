"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const BULL = "#348398";
const BEAR = "#973336";

/** Builds a jagged sparkline — uses live history when varied, else a natural zigzag from 24h change. */
export function buildSparklinePoints(
  history: number[] | undefined,
  price: number,
  change24hPct: number,
): number[] {
  const pointCount = 22;
  if (history && history.length >= 4) {
    const slice = history.slice(-pointCount);
    const min = Math.min(...slice);
    const max = Math.max(...slice);
    const range = max - min;
    const minVisual = Math.max(price * 0.0006, 0.00001);
    if (range >= minVisual) return slice;
  }

  const start = price / (1 + change24hPct / 100);
  return Array.from({ length: pointCount }, (_, i) => {
    const t = i / (pointCount - 1);
    const trend = start + (price - start) * t;
    const wiggle =
      Math.sin(i * 1.65 + price * 0.0001) * price * 0.00055 +
      Math.sin(i * 3.2) * price * 0.0003 +
      Math.cos(i * 0.85) * price * 0.0002;
    return i === pointCount - 1 ? price : trend + wiggle;
  });
}

function MarketSparkline({
  data,
  positive = true,
  className,
}: {
  data: number[];
  positive?: boolean;
  className?: string;
}) {
  const id = React.useId();
  const width = 140;
  const height = 40;

  const { linePath, fillPath } = React.useMemo(() => {
    if (data.length < 2) return { linePath: "", fillPath: "" };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || Math.max(data[0] * 0.001, 1);
    const padY = 4;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - padY - ((v - min) / range) * (height - padY * 2);
      return { x, y };
    });
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
    const fill = `${line} L ${width} ${height} L 0 ${height} Z`;
    return { linePath: line, fillPath: fill };
  }, [data, width, height]);

  const color = positive ? BULL : BEAR;

  if (data.length < 2) {
    return <div className={cn("h-10", className)} aria-hidden />;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-10 w-full max-w-[140px] overflow-visible", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.24" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        key={fillPath}
        d={fillPath}
        fill={`url(#${id}-fill)`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      />
      <motion.path
        key={linePath}
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.6 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      />
    </svg>
  );
}

function AnimatedPrice({
  value,
  formatted,
  className,
}: {
  value: number;
  formatted: string;
  className?: string;
}) {
  const prev = React.useRef(value);
  const [flash, setFlash] = React.useState<"up" | "down" | null>(null);

  React.useEffect(() => {
    if (prev.current === value) return;
    setFlash(value > prev.current ? "up" : "down");
    prev.current = value;
    const t = window.setTimeout(() => setFlash(null), 600);
    return () => window.clearTimeout(t);
  }, [value]);

  return (
    <motion.span
      animate={{
        color: flash === "up" ? BULL : flash === "down" ? BEAR : "var(--foreground)",
      }}
      transition={{ duration: 0.35 }}
      className={cn("text-[clamp(1.125rem,1.2vw,1.25rem)] font-bold tabular-nums leading-none", className)}
    >
      {formatted}
    </motion.span>
  );
}

const ASSETS = [
  {
    key: "BTCUSDT",
    label: "BTC/USD",
    precision: 0,
    icon: "₿",
    iconBg: "bg-[linear-gradient(135deg,#348398_0%,#2D7284_100%)]",
  },
  {
    key: "EURUSD",
    label: "EUR/USD",
    precision: 5,
    icon: "€",
    iconBg: "bg-[linear-gradient(135deg,#9FE1F3_0%,#348398_100%)]",
  },
  {
    key: "XAUUSD",
    label: "XAU/USD",
    precision: 2,
    icon: "Au",
    iconBg: "bg-[linear-gradient(135deg,#B6F5F3_0%,#348398_100%)]",
  },
] as const;

type Quote = {
  price: number;
  change24hPct: number;
  sparkline?: number[];
};

export function DashboardMarketCards({
  quotes,
  isLoading = false,
  live = false,
  showConnectHint = false,
}: {
  quotes: Record<string, Quote | undefined>;
  isLoading?: boolean;
  live?: boolean;
  showConnectHint?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[var(--dashboard-gap)]">
      {ASSETS.map(({ key, label, precision, icon, iconBg }, index) => {
        const q = quotes[key];
        const isUp = (q?.change24hPct ?? 0) >= 0;
        const spark = q
          ? buildSparklinePoints(q.sparkline, q.price, q.change24hPct)
          : [];
        const formattedPrice =
          q && Number.isFinite(q.price) && q.price > 0
            ? q.price.toLocaleString("en-US", {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision,
              })
            : "—";

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.22 } }}
            className="dashboard-card card-lift overflow-hidden flex flex-col group"
          >
            <div className="p-[var(--card-p)] flex-1 relative">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, transparent, ${isUp ? BULL : BEAR}, transparent)`,
                }}
              />
              {isLoading && !q ? (
                <div className="space-y-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-28" />
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-[clamp(2rem,2.2vw,2.25rem)] w-[clamp(2rem,2.2vw,2.25rem)] shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm",
                      iconBg,
                    )}
                  >
                    {icon}
                  </div>
                  <div className="flex flex-1 min-w-0 flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-muted-foreground leading-none">{label}</p>
                      {q && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full",
                            isUp
                              ? "text-primary bg-primary/10"
                              : "text-destructive bg-destructive/10",
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isUp ? "bg-primary" : "bg-destructive",
                            )}
                          />
                          {isUp ? "▲" : "▼"} {Math.abs(q.change24hPct).toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        {q ? (
                          <AnimatedPrice value={q.price} formatted={formattedPrice} />
                        ) : showConnectHint ? (
                          <span className="text-sm font-medium text-muted-foreground">Connect account</span>
                        ) : (
                          <span className="text-xl font-bold text-foreground">—</span>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-1">24h change</p>
                      </div>
                      <MarketSparkline data={spark} positive={isUp} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <motion.div
              className={cn(
                "h-[3px] w-full shrink-0",
                q ? (isUp ? "bg-primary" : "bg-destructive") : "bg-muted",
              )}
              layout
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="dashboard-card card-lift overflow-hidden flex flex-col hidden sm:flex group"
      >
        <div className="p-[var(--card-p)] flex flex-col justify-center flex-1 min-h-[5rem]">
          <p className="text-sm font-medium text-muted-foreground">Markets</p>
          <div className="flex items-center gap-2 mt-2.5">
            <motion.span
              animate={{ opacity: live ? [1, 0.35, 1] : 1, scale: live ? [1, 1.12, 1] : 1 }}
              transition={{ repeat: live ? Infinity : 0, duration: 2 }}
              className={cn("h-2 w-2 rounded-full", live ? "bg-primary" : "bg-muted-foreground/40")}
            />
            <span className={cn("text-sm font-semibold", live ? "text-primary" : "text-muted-foreground")}>
              {live ? "Live" : "Updating…"}
            </span>
          </div>
        </div>
        <div className={cn("h-[3px] w-full shrink-0", live ? "bg-primary" : "bg-muted")} />
      </motion.div>
    </div>
  );
}
