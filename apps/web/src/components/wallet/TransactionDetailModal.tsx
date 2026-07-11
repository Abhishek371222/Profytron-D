'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { WalletTransaction } from '@/lib/api/wallet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  CONFIRMED: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Successful',
  FAILED: 'Failed',
};

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  SUBSCRIPTION_PAYMENT: 'Subscription',
  TRADING_PNL: 'Trading P&L',
  COMMISSION: 'Commission',
  MARKETPLACE_SALE: 'Marketplace Sale',
};

function formatCurrency(amount: number, currency: string) {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function DetailRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  copyable?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    if (!copyable) return;
    try {
      await navigator.clipboard.writeText(copyable);
      setCopied(true);
      toast.success('Copied to clipboard');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div className="grid grid-cols-[6.25rem_1fr] gap-2 border-b border-[var(--card-border)] py-1.5 last:border-b-0 sm:grid-cols-[7.5rem_1fr]">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-5">
        {label}
      </dt>
      <dd className="min-w-0 flex items-center gap-1.5">
        <span
          className={cn(
            'text-[13px] leading-5 text-foreground break-all',
            mono && 'font-mono text-[11px] leading-4',
          )}
        >
          {value || '—'}
        </span>
        {copyable && (
          <button
            type="button"
            onClick={onCopy}
            aria-label={`Copy ${label}`}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3 text-chart-3" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </dd>
    </div>
  );
}

export function TransactionDetailModal({
  open,
  onOpenChange,
  transaction,
  currency = 'INR',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: WalletTransaction | null;
  currency?: string;
}) {
  if (!transaction) return null;

  const date = new Date(transaction.createdAt);
  const isOut = transaction.direction === 'OUT';
  const statusStyle =
    STATUS_STYLES[transaction.status] ?? 'bg-muted text-muted-foreground border-[var(--card-border)]';
  const statusLabel = STATUS_LABELS[transaction.status] ?? transaction.status;
  const gateway =
    typeof transaction.metadata?.gateway === 'string'
      ? transaction.metadata.gateway
      : null;

  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-2.5 p-3.5 sm:max-w-md sm:p-4 max-h-[min(82dvh,34rem)] overflow-y-auto">
        <DialogHeader className="gap-1 space-y-0">
          <DialogTitle className="text-base leading-tight sm:text-lg">Payment details</DialogTitle>
          <DialogDescription className="text-xs leading-snug">
            Quote the Billing ID to support for this exact payment.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Billing ID
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <code className="flex-1 break-all font-mono text-[12px] font-semibold leading-4 text-foreground">
              {transaction.billingId || '—'}
            </code>
            {transaction.billingId && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(transaction.billingId);
                    toast.success('Billing ID copied');
                  } catch {
                    toast.error('Could not copy');
                  }
                }}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Copy Billing ID"
              >
                <Copy className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              statusStyle,
            )}
          >
            <span className="h-1 w-1 rounded-full bg-current" />
            {statusLabel}
          </span>
          <span className="inline-flex rounded-md border border-[var(--card-border)] bg-muted/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
            {TYPE_LABELS[transaction.type] ?? transaction.type}
          </span>
        </div>

        <dl className="rounded-lg border border-[var(--card-border)] bg-muted/15 px-2.5 py-0.5">
          <DetailRow label="Date" value={`${dateLabel} · ${timeLabel}`} />
          <DetailRow
            label="Amount"
            value={
              <span className={cn('font-bold tabular-nums', isOut ? 'text-destructive' : 'text-chart-3')}>
                {isOut ? '−' : '+'}
                {formatCurrency(Number(transaction.amount), currency)}
              </span>
            }
          />
          <DetailRow
            label="Category"
            value={transaction.paymentCategory || TYPE_LABELS[transaction.type] || transaction.type}
          />
          <DetailRow
            label="Sender"
            value={transaction.senderAddress || '—'}
            mono
            copyable={transaction.senderAddress || undefined}
          />
          <DetailRow
            label="Receiver"
            value={transaction.receiverAddress || '—'}
            mono
            copyable={transaction.receiverAddress || undefined}
          />
          <DetailRow
            label="Txn ID"
            value={transaction.externalTxnId || transaction.reference || '—'}
            mono
            copyable={transaction.externalTxnId || transaction.reference || undefined}
          />
          <DetailRow
            label="Balance after"
            value={formatCurrency(Number(transaction.balanceAfter), currency)}
          />
          {gateway && <DetailRow label="Gateway" value={String(gateway)} />}
          {transaction.description && (
            <DetailRow label="Notes" value={transaction.description} />
          )}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
