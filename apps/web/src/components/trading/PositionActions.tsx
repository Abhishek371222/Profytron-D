'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTradeActions } from '@/hooks/useTradeActions';
import type { BulkCloseScope } from '@/lib/api/trading';
import type { TradeActionMode } from './TradeActionsModal';
import {
  MoreHorizontal,
  X,
  Scissors,
  SlidersHorizontal,
  ShieldCheck,
  MoveDown,
} from 'lucide-react';

const ROW_ACTIONS: { mode: TradeActionMode; label: string; icon: React.ComponentType<{ className?: string }>; danger?: boolean }[] = [
  { mode: 'close', label: 'Close position', icon: X, danger: true },
  { mode: 'partial', label: 'Partial close', icon: Scissors },
  { mode: 'modify', label: 'Modify SL / TP', icon: SlidersHorizontal },
  { mode: 'breakeven', label: 'Break-even stop', icon: ShieldCheck },
  { mode: 'trailing', label: 'Trailing stop', icon: MoveDown },
];

export function PositionActionsMenu({ onAction }: { onAction: (mode: TradeActionMode) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Position actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuLabel>Manage position</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROW_ACTIONS.map(({ mode, label, icon: Icon, danger }) => (
          <DropdownMenuItem
            key={mode}
            onClick={() => onAction(mode)}
            className={danger ? 'text-destructive hover:bg-destructive/10' : ''}
          >
            <Icon className="w-3.5 h-3.5 mr-2.5 shrink-0" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const BULK_SCOPES: { scope: BulkCloseScope; label: string }[] = [
  { scope: 'ALL', label: 'All' },
  { scope: 'PROFITABLE', label: 'Winners' },
  { scope: 'LOSING', label: 'Losers' },
  { scope: 'BUYS', label: 'Buys' },
  { scope: 'SELLS', label: 'Sells' },
];

export function BulkCloseBar() {
  const { bulkClose } = useTradeActions();
  const [confirmScope, setConfirmScope] = React.useState<BulkCloseScope | null>(null);

  const confirm = async () => {
    if (!confirmScope) return;
    try {
      await bulkClose.mutateAsync(confirmScope);
    } catch {
      /* toast handled in hook */
    } finally {
      setConfirmScope(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-[var(--card-border)] bg-muted/20">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mr-1">
          Bulk close
        </span>
        {BULK_SCOPES.map(({ scope, label }) => (
          <Button
            key={scope}
            variant="outline"
            size="xs"
            onClick={() => setConfirmScope(scope)}
            disabled={bulkClose.isPending}
          >
            {label}
          </Button>
        ))}
      </div>

      <Dialog open={confirmScope != null} onOpenChange={(next) => !next && setConfirmScope(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Close positions?</DialogTitle>
            <DialogDescription>
              This sends market-close orders for{' '}
              <span className="font-semibold text-foreground">
                {confirmScope === 'ALL'
                  ? 'all open positions'
                  : confirmScope === 'PROFITABLE'
                    ? 'all profitable positions'
                    : confirmScope === 'LOSING'
                      ? 'all losing positions'
                      : confirmScope === 'BUYS'
                        ? 'all long positions'
                        : 'all short positions'}
              </span>
              . This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmScope(null)} disabled={bulkClose.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirm} isLoading={bulkClose.isPending}>
              Close positions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
