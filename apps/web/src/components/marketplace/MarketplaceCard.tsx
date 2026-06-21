'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Star, Zap, Activity, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useCurrency } from '@/lib/hooks/useCurrency';

interface MarketplaceCardProps {
  strategy: {
    id: string;
    name: string;
    category: string;
    creator: string;
    verified?: boolean;
    returns: number;
    sharpe: number;
    risk: string;
    subscribers: number;
    price: number;
    rating?: number;
    reviewCount?: number;
  };
  onSubscribe: (strategy: MarketplaceCardProps['strategy']) => void;
}

export function MarketplaceCard({ strategy, onSubscribe }: MarketplaceCardProps) {
  const { returns, sharpe, risk, subscribers, price, rating = 0, reviewCount = 0 } = strategy;
  const { currency, formatPrice } = useCurrency();
  const roundedRating = Math.round(rating);

  return (
    <div className="dashboard-card p-5 flex flex-col gap-4 interactive-lift border border-[var(--card-border)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] border border-[color-mix(in_srgb,var(--primary)_15%,transparent)] text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{strategy.category}</p>
            <h3 className="text-sm font-bold text-foreground truncate">{strategy.name}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Win Rate" value={returns > 0 ? `${returns.toFixed(1)}%` : '—'} className="text-chart-3" />
        <Stat label="Sharpe" value={sharpe > 0 ? sharpe.toFixed(2) : '—'} />
        <Stat label="Risk" value={risk} />
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[var(--card-border)]">
        <div>
          <p className="text-lg font-bold text-foreground">{formatPrice(price)}</p>
          {price > 0 && (
            <p className="text-[10px] text-muted-foreground uppercase">
              / month · {currency.code}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-semibold tabular-nums">{subscribers.toLocaleString()}</span> subs
        </div>
      </div>

      <div className="flex items-center gap-2">
        <UserAvatar name={strategy.creator} size="sm" />
        <div className="flex-1 min-w-0 flex items-center gap-1">
          <span className="text-xs font-semibold text-foreground truncate">{strategy.creator}</span>
          {strategy.verified && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
        </div>
        {reviewCount > 0 ? (
          <div className="flex items-center gap-1" title={`${rating.toFixed(1)} from ${reviewCount} review${reviewCount !== 1 ? 's' : ''}`}>
            <div className="flex gap-0.5 text-chart-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn('h-2.5 w-2.5', s <= roundedRating && 'fill-current')} />
              ))}
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{rating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">No reviews</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onSubscribe(strategy)}
        className="w-full h-10 rounded-xl bg-gradient-to-r from-[#47a7aa] to-[#1e6d48] text-white text-[11px] font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_2px_8px_rgba(71,167,170,0.25)] hover:shadow-[0_4px_16px_rgba(71,167,170,0.38)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Zap className="h-3.5 w-3.5" />
        Subscribe
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
      <Link
        href={`/marketplace/${strategy.id}`}
        className="text-center text-[10px] font-semibold text-muted-foreground hover:text-primary uppercase tracking-wide"
      >
        View Details →
      </Link>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-muted/20 p-2">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn('text-xs font-bold tabular-nums mt-0.5', className ?? 'text-foreground')}>{value}</p>
    </div>
  );
}
