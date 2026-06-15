"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

  const color = positive ? "#16A34A" : "#DC2626";

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
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
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
        color: flash === "up" ? "#16A34A" : flash === "down" ? "#DC2626" : "var(--foreground)",
      }}
      transition={{ duration: 0.35 }}
      className={cn("text-xl font-bold tabular-nums leading-none", className)}
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
    iconClass: "bg-orange-500 text-white",
  },
  {
    key: "EURUSD",
    label: "EUR/USD",
    precision: 5,
    icon: "€",
    iconClass: "bg-blue-500 text-white",
  },
  {
    key: "XAUUSD",
    label: "XAU/USD",
    precision: 2,
    icon: "Au",
    iconClass: "bg-amber-500 text-white text-[10px]",
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
}: {
  quotes: Record<string, Quote | undefined>;
  isLoading?: boolean;
  live?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {ASSETS.map(({ key, label, precision, icon, iconClass }, index) => {
        const q = quotes[key];
        const isUp = (q?.change24hPct ?? 0) >= 0;
        const spark = q
          ? buildSparklinePoints(q.sparkline, q.price, q.change24hPct)
          : [];
        const formattedPrice = q
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
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="dashboard-card card-lift overflow-hidden flex flex-col"
          >
            <div className="p-4 flex-1">
              {isLoading && !q ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-28" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
                      iconClass,
                    )}
                  >
                    {icon}
                  </div>
                  <div className="flex flex-1 min-w-0 items-center gap-2 sm:gap-3">
                    <div className="shrink-0 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground leading-none">{label}</p>
                      <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
                        {q ? (
                          <AnimatedPrice value={q.price} formatted={formattedPrice} />
                        ) : (
                          <span className="text-xl font-bold text-foreground">—</span>
                        )}
                        {q && (
                          <span
                            className={cn(
                              "text-sm font-semibold tabular-nums whitespace-nowrap",
                              isUp ? "text-chart-3" : "text-destructive",
                            )}
                          >
                            {isUp ? "▲" : "▼"} {Math.abs(q.change24hPct).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-[90px] pl-1">
                      <MarketSparkline data={spark} positive={isUp} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <motion.div
              className={cn(
                "h-[3px] w-full shrink-0",
                q ? (isUp ? "bg-chart-3" : "bg-destructive") : "bg-muted",
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
        className="dashboard-card card-lift overflow-hidden flex flex-col hidden sm:flex"
      >
        <div className="p-4 flex flex-col justify-center flex-1 min-h-[76px]">
          <p className="text-sm font-medium text-muted-foreground">Markets</p>
          <div className="flex items-center gap-2 mt-2">
            <motion.span
              animate={{ opacity: live ? [1, 0.35, 1] : 1, scale: live ? [1, 1.15, 1] : 1 }}
              transition={{ repeat: live ? Infinity : 0, duration: 2 }}
              className={cn("h-2 w-2 rounded-full", live ? "bg-chart-3" : "bg-muted-foreground/40")}
            />
            <span className={cn("text-sm font-semibold", live ? "text-chart-3" : "text-muted-foreground")}>
              {live ? "Live" : "Updating…"}
            </span>
          </div>
        </div>
        <div className={cn("h-[3px] w-full shrink-0", live ? "bg-chart-3" : "bg-muted")} />
      </motion.div>
    </div>
  );
}
