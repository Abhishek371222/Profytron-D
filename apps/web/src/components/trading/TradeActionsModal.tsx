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
import { X, Scissors, SlidersHorizontal, ShieldCheck, MoveDown } from 'lucide-react';

export type TradeActionMode = 'close' | 'partial' | 'modify' | 'breakeven' | 'trailing';

export interface ActionTrade {
  id: string;
  asset: string;
  type: 'Long' | 'Short';
  amount: number;
  entry: number;
  pnl: number;
}

const MODE_META: Record<TradeActionMode, { title: string; desc: string; icon: React.ComponentType<{ className?: string }> }> = {
  close: { title: 'Close position', desc: 'Submit a full market close for this position.', icon: X },
  partial: { title: 'Partial close', desc: 'Close part of the position and keep the rest open.', icon: Scissors },
  modify: { title: 'Modify SL / TP', desc: 'Update the stop-loss and take-profit levels.', icon: SlidersHorizontal },
  breakeven: { title: 'Break-even stop', desc: 'Move the stop-loss to the entry price (+ optional buffer).', icon: ShieldCheck },
  trailing: { title: 'Trailing stop', desc: 'Attach a stop that follows the market by a fixed distance.', icon: MoveDown },
};

function numOrUndef(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function TradeActionsModal({
  trade,
  mode,
  onClose,
}: {
  trade: ActionTrade | null;
  mode: TradeActionMode | null;
  onClose: () => void;
}) {
  const actions = useTradeActions();
  const [volume, setVolume] = React.useState('');
  const [stopLoss, setStopLoss] = React.useState('');
  const [takeProfit, setTakeProfit] = React.useState('');
  const [offsetPips, setOffsetPips] = React.useState('');
  const [distance, setDistance] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const open = !!trade && !!mode;

  React.useEffect(() => {
    if (open) {
      setVolume('');
      setStopLoss('');
      setTakeProfit('');
      setOffsetPips('');
      setDistance('');
      setError(null);
    }
  }, [open, trade?.id, mode]);

  if (!trade || !mode) return null;
  const meta = MODE_META[mode];
  const Icon = meta.icon;

  const pending =
    actions.closeTrade.isPending ||
    actions.modifyTrade.isPending ||
    actions.breakEven.isPending ||
    actions.trailingStop.isPending;

  const handleSubmit = async () => {
    setError(null);
    try {
      if (mode === 'close') {
        await actions.closeTrade.mutateAsync({ id: trade.id });
      } else if (mode === 'partial') {
        const v = numOrUndef(volume);
        if (v == null || v <= 0) return setError('Enter a volume greater than 0.');
        if (v >= trade.amount) return setError(`Volume must be less than the position size (${trade.amount}). Use full close instead.`);
        await actions.closeTrade.mutateAsync({ id: trade.id, volume: v });
      } else if (mode === 'modify') {
        const sl = numOrUndef(stopLoss);
        const tp = numOrUndef(takeProfit);
        if (sl == null && tp == null) return setError('Enter a stop-loss and/or take-profit.');
        await actions.modifyTrade.mutateAsync({ id: trade.id, payload: { stopLoss: sl, takeProfit: tp } });
      } else if (mode === 'breakeven') {
        const off = numOrUndef(offsetPips);
        if (off != null && off < 0) return setError('Offset cannot be negative.');
        await actions.breakEven.mutateAsync({ id: trade.id, offsetPips: off });
      } else if (mode === 'trailing') {
        const d = numOrUndef(distance);
        if (d == null || d <= 0) return setError('Enter a trailing distance greater than 0.');
        await actions.trailingStop.mutateAsync({ id: trade.id, distance: d });
      }
      onClose();
    } catch {
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle>{meta.title}</DialogTitle>
          </div>
          <DialogDescription>{meta.desc}</DialogDescription>
        </DialogHeader>

        { }
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-foreground">{trade.asset}</span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest',
                trade.type === 'Long'
                  ? 'bg-chart-3/10 text-chart-3 border-chart-3/20'
                  : 'bg-destructive/10 text-destructive border-destructive/20',
              )}
            >
              {trade.type}
            </span>
            <span className="text-xs font-mono text-muted-foreground">{trade.amount} lots</span>
          </div>
          <span className={cn('text-sm font-bold font-mono', trade.pnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
            {trade.pnl >= 0 ? '+' : ''}
            {trade.pnl.toFixed(2)}
          </span>
        </div>

        { }
        <div className="space-y-3">
          {mode === 'close' && (
            <p className="text-sm text-muted-foreground">
              This sends a market order to close all {trade.amount} lots of {trade.asset}. The fill price depends on
              live market conditions.
            </p>
          )}

          {mode === 'partial' && (
            <Field label={`Volume to close (lots) — max ${trade.amount}`}>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder={`e.g. ${(trade.amount / 2).toFixed(2)}`}
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                autoFocus
              />
            </Field>
          )}

          {mode === 'modify' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stop-loss">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="price"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  autoFocus
                />
              </Field>
              <Field label="Take-profit">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="price"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                />
              </Field>
            </div>
          )}

          {mode === 'breakeven' && (
            <Field label="Buffer beyond entry (pips, optional)">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                placeholder="0"
                value={offsetPips}
                onChange={(e) => setOffsetPips(e.target.value)}
                autoFocus
              />
            </Field>
          )}

          {mode === 'trailing' && (
            <Field label="Trailing distance (price)">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                placeholder="e.g. 0.0015"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                autoFocus
              />
            </Field>
          )}

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={mode === 'close' || mode === 'partial' ? 'destructive' : 'primary'}
            onClick={handleSubmit}
            isLoading={pending}
          >
            {mode === 'close' ? 'Close position' : mode === 'partial' ? 'Partial close' : 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
