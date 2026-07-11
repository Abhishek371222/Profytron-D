'use client';

import React, { memo, useEffect, useRef } from 'react';
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
  height = 560,
}: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = useThemeDark();
  const numericHeight = typeof height === 'number' ? height : 420;
  const chartBodyHeight = Math.max(280, numericHeight - 28);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetHost = document.createElement('div');
    widgetHost.className = 'tradingview-widget-container__widget';
    widgetHost.style.height = `${chartBodyHeight}px`;
    widgetHost.style.minHeight = `${chartBodyHeight}px`;
    widgetHost.style.width = '100%';
    container.appendChild(widgetHost);

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      allow_symbol_change: true,
      calendar: false,
      details: true,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: true,
      interval: '60',
      locale: 'en',
      save_image: true,
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
      range: '1M',
      compareSymbols: [],
      show_popup_button: true,
      popup_height: '650',
      popup_width: '1000',
      studies: ['Volume@tv-basicstudies'],
      autosize: true,
      height: chartBodyHeight,
      width: '100%',
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [isDark, symbol, chartBodyHeight]);

  const symbolPath = symbol.includes(':')
    ? symbol.split(':')[1]
    : symbol;

  return (
    <div
      className={cn(
        'tradingview-widget-container relative flex flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-card',
        className,
      )}
      style={{ height: numericHeight, width: '100%' }}
    >
      <div
        ref={containerRef}
        className="w-full shrink-0"
        style={{ height: chartBodyHeight, minHeight: chartBodyHeight }}
      />
      <div className="shrink-0 border-t border-[var(--card-border)] px-3 py-1.5 text-[11px] text-muted-foreground">
        <a
          href={`https://www.tradingview.com/symbols/${symbolPath}/?exchange=OANDA`}
          rel="noopener nofollow"
          target="_blank"
          className="text-primary hover:underline"
        >
          {symbolPath} chart
        </a>
        <span> by TradingView</span>
      </div>
    </div>
  );
}

export default memo(TradingViewAdvancedChart);
