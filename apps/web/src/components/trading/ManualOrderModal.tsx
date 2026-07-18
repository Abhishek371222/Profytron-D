'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTradeActions } from '@/hooks/useTradeActions';
import { TrendingUp, TrendingDown } from 'lucide-react';

const SYMBOL_SUGGESTIONS = ['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD', 'USDJPY'];

function numOrUndef(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function ManualOrderModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { placeOrder } = useTradeActions();
  const [symbol, setSymbol] = React.useState('');
  const [side, setSide] = React.useState<'BUY' | 'SELL'>('BUY');
  const [volume, setVolume] = React.useState('');
  const [stopLoss, setStopLoss] = React.useState('');
  const [takeProfit, setTakeProfit] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setSymbol('');
      setSide('BUY');
      setVolume('');
      setStopLoss('');
      setTakeProfit('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    const sym = symbol.trim().toUpperCase();
    if (!sym) return setError('Enter a symbol.');
    const v = numOrUndef(volume);
    if (v == null || v <= 0) return setError('Enter a volume greater than 0.');
    try {
      await placeOrder.mutateAsync({
        symbol: sym,
        side,
        volume: v,
        stopLoss: numOrUndef(stopLoss),
        takeProfit: numOrUndef(takeProfit),
      });
      onOpenChange(false);
    } catch {
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New market order</DialogTitle>
          <DialogDescription>Place a manual market order on your connected account.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          { }
          <div className="grid grid-cols-2 gap-2">
            {(['BUY', 'SELL'] as const).map((s) => {
              const active = side === s;
              const isBuy = s === 'BUY';
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={cn(
                    'flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-bold uppercase tracking-wide transition-all',
                    active && isBuy && 'bg-chart-3/15 border-chart-3/40 text-chart-3',
                    active && !isBuy && 'bg-destructive/15 border-destructive/40 text-destructive',
                    !active && 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {s}
                </button>
              );
            })}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Symbol</span>
            <Input
              placeholder="EURUSD"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SYMBOL_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSymbol(s)}
                  className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Volume (lots)</span>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.10"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Stop-loss (optional)</span>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="price"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Take-profit (optional)</span>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="price"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
              />
            </label>
          </div>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={placeOrder.isPending}>
            Cancel
          </Button>
          <Button
            variant={side === 'BUY' ? 'success' : 'destructive'}
            onClick={handleSubmit}
            isLoading={placeOrder.isPending}
          >
            Place {side} order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
