'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, RefreshCcw, Radio, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { brokerApi } from '@/lib/api/broker';
import { toast } from 'sonner';

export interface AccountDetailsData {
  id: string;
  brokerName: string;
  accountNumber: string;
  accountType: 'Live' | 'Demo' | 'Paper';
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
  serverName?: string;
  currency?: string;
  balance?: number;
  initialEquity?: number;
  isDefault?: boolean;
  isMasterSource?: boolean;
  activeBotCount?: number;
  lastSyncedAt?: string;
}

interface Props {
  account: AccountDetailsData | null;
  onClose: () => void;
  onReconnect: (account: AccountDetailsData) => void;
  maskAccount: (num?: string) => string;
  formatAmount: (amount: number, currency?: string) => string;
  timeAgo: (dateStr: string) => string;
}

const STATUS_STYLE: Record<string, string> = {
  CONNECTED: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  DISCONNECTED: 'bg-destructive/10 text-destructive border-destructive/20',
  SYNCING: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
};
const STATUS_DOT: Record<string, string> = {
  CONNECTED: 'bg-chart-3',
  DISCONNECTED: 'bg-destructive',
  SYNCING: 'bg-chart-4 animate-pulse',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground">{children}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-muted/10 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">{title}</p>
      <div className="divide-y divide-[var(--card-border)]">{children}</div>
    </div>
  );
}

export function AccountDetailsModal({
  account,
  onClose,
  onReconnect,
  maskAccount,
  formatAmount,
  timeAgo,
}: Props) {
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ connected: boolean; error?: string } | null>(null);

  React.useEffect(() => {
    // Reset the live-check result whenever a different account is opened.
    setTestResult(null);
    setTesting(false);
  }, [account?.id]);

  if (!account) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await brokerApi.testConnection(account.id);
      setTestResult({ connected: !!result?.connected, error: result?.error });
      if (!result?.connected) {
        toast.error('Connection test failed', { description: result?.error || 'Unable to reach broker.' });
      }
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Connection test failed';
      setTestResult({ connected: false, error: message });
      toast.error('Connection test failed', { description: message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <AnimatePresence>
      {account && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">{account.brokerName}</h2>
                  <p className="text-xs text-muted-foreground">Account Details</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <SectionCard title="Account Information">
                <Row label="Account Number">{maskAccount(account.accountNumber)}</Row>
                <Row label="Broker Type">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold uppercase">
                    {account.accountType}
                  </span>
                </Row>
                <Row label="Server Name">{account.serverName || '—'}</Row>
                <Row label="Currency">{account.currency || '—'}</Row>
              </SectionCard>

              <SectionCard title="Account Status">
                <Row label="Connection Status">
                  <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border', STATUS_STYLE[account.status])}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[account.status])} />
                    {account.status === 'CONNECTED' ? 'Connected' : account.status === 'SYNCING' ? 'Syncing' : 'Disconnected'}
                  </span>
                </Row>
                <Row label="Default Account">
                  <span className={account.isDefault ? 'text-chart-3' : 'text-destructive'}>{account.isDefault ? 'Yes' : 'No'}</span>
                </Row>
                <Row label="Master Copy-Source">
                  <span className={account.isMasterSource ? 'text-chart-3' : 'text-destructive'}>{account.isMasterSource ? 'Yes' : 'No'}</span>
                </Row>
              </SectionCard>

              <SectionCard title="Balance Details">
                <Row label="Balance">{account.balance != null ? formatAmount(account.balance, account.currency) : '—'}</Row>
                <Row label="Initial Equity">{account.initialEquity != null ? formatAmount(account.initialEquity, account.currency) : '—'}</Row>
                <Row label="Current Equity">{account.balance != null ? formatAmount(account.balance, account.currency) : '—'}</Row>
                <Row label="Currency">{account.currency || '—'}</Row>
              </SectionCard>

              <SectionCard title="Activity Details">
                <Row label="Active Bots">{account.activeBotCount ?? 0}</Row>
                <Row label="Last Synced">{account.lastSyncedAt ? timeAgo(account.lastSyncedAt) : '—'}</Row>
                <Row label="Last Sync Status">
                  <span className={account.status === 'CONNECTED' ? 'text-chart-3' : account.status === 'SYNCING' ? 'text-chart-4' : 'text-destructive'}>
                    {account.status === 'CONNECTED' ? 'Success' : account.status === 'SYNCING' ? 'Pending' : 'Failed'}
                  </span>
                </Row>
              </SectionCard>

              {/* Live Connection Check */}
              <div className="rounded-xl border border-[var(--card-border)] bg-muted/10 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Live Connection Check</p>
                <p className="text-xs text-muted-foreground mb-3">Test connection with the broker right now.</p>

                {testResult && (
                  <div
                    className={cn(
                      'flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-xs font-semibold border',
                      testResult.connected
                        ? 'bg-chart-3/10 text-chart-3 border-chart-3/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20',
                    )}
                  >
                    {testResult.connected ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0" />}
                    {testResult.connected ? 'Connection healthy — broker responded successfully.' : (testResult.error || 'Connection failed.')}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
                  {testing ? 'Testing…' : 'Test Connection'}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-6 py-4 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-9 rounded-lg border border-[var(--card-border)] bg-card text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => onReconnect(account)}
                className="flex-1 h-9 rounded-lg border border-[var(--card-border)] bg-card text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Reconnect
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
