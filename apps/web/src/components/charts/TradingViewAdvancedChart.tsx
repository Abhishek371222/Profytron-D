'use client';

import React, { memo, useEffect, useId, useRef, useState } from 'react';
import { useThemeDark } from '@/components/auth/earth/hooks';
import { cn } from '@/lib/utils';

type TradingViewAdvancedChartProps = {
  symbol?: string;
  className?: string;
  height?: number | string;
};

const WATCHLIST = [
  'OANDA:XAUUSD',
  'OANDA:EURUSD',
  'OANDA:GBPUSD',
  'OANDA:GBPJPY',
] as const;

function TradingViewAdvancedChart({
  symbol = 'OANDA:XAUUSD',
  className,
  height = 620,
}: TradingViewAdvancedChartProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const isDark = useThemeDark();
  const [ready, setReady] = useState(false);
  const instanceId = useId().replace(/:/g, '');
  const numericHeight = typeof height === 'number' ? height : 620;
  const chartBodyHeight = Math.max(400, numericHeight - 36);

  // Avoid mounting the widget before theme is known (prevents blank white chart).
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 50);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const widgetHost = widgetRef.current;
    if (!widgetHost) return;

    widgetHost.innerHTML = '';

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.dataset.tvWidget = instanceId;
    // TradingView reads JSON from the script text node (not a JS object attribute).
    script.text = JSON.stringify({
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      // Zoomed-in start: 15m bars over ~5 trading days.
      interval: '15',
      locale: 'en',
      save_image: false,
      style: '1',
      symbol,
      theme: isDark ? 'dark' : 'light',
      timezone: 'Asia/Kolkata',
      backgroundColor: isDark ? '#0F0F0F' : '#ffffff',
      gridColor: isDark
        ? 'rgba(242, 242, 242, 0.06)'
        : 'rgba(46, 46, 46, 0.06)',
      watchlist: [...WATCHLIST],
      withdateranges: true,
      range: '5D',
      compareSymbols: [],
      show_popup_button: true,
      popup_height: '650',
      popup_width: '1000',
      studies: [],
      // Fixed size — autosize often renders a blank body in nested dashboards.
      autosize: false,
      height: chartBodyHeight,
      width: '100%',
    });

    widgetHost.appendChild(script);

    return () => {
      widgetHost.innerHTML = '';
    };
  }, [ready, isDark, symbol, chartBodyHeight, instanceId]);

  const symbolPath = symbol.includes(':') ? symbol.split(':')[1] : symbol;

  return (
    <div
      className={cn(
        'tradingview-widget-container relative flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-card shadow-sm',
        className,
      )}
      style={{ height: numericHeight }}
    >
      <div
        className="tradingview-widget-container__widget w-full overflow-hidden"
        style={{ height: chartBodyHeight, minHeight: chartBodyHeight }}
        ref={widgetRef}
      />
      {!ready ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 animate-pulse bg-muted/40"
          style={{ height: chartBodyHeight }}
          aria-hidden
        />
      ) : null}
      <div className="flex h-9 shrink-0 items-center border-t border-[var(--card-border)] px-3 text-[11px] text-muted-foreground">
        <a
          href={`https://www.tradingview.com/symbols/${symbolPath}/?exchange=OANDA`}
          rel="noopener nofollow"
          target="_blank"
          className="font-medium text-primary hover:underline"
        >
          {symbolPath} chart
        </a>
        <span className="ml-1">by TradingView</span>
      </div>
    </div>
  );
}

export default memo(TradingViewAdvancedChart);
