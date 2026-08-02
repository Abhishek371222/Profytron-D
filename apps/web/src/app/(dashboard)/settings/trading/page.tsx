'use client';

import React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SettingsSection,
  SettingsToggle,
  SettingsField,
  SettingsInput,
} from '@/components/settings/SettingsUi';
import { DashButton, DashErrorState } from '@/components/dashboard/DashboardPrimitives';
import { riskApi, type RiskPolicy } from '@/lib/api/risk';
import { AlertTriangle } from 'lucide-react';

type FormState = {
  maxDailyLossUsd: string;
  maxDailyLossPct: string;
  maxDrawdownPct: string;
  maxOpenTrades: string;
  riskPerTradePct: string;
  minWinRate: string;
  dailyWinTargetUsd: string;
  autoStopAfterLoss: boolean;
  autoStopAfterWin: boolean;
};

const EMPTY: FormState = {
  maxDailyLossUsd: '',
  maxDailyLossPct: '',
  maxDrawdownPct: '',
  maxOpenTrades: '',
  riskPerTradePct: '',
  minWinRate: '',
  dailyWinTargetUsd: '',
  autoStopAfterLoss: false,
  autoStopAfterWin: false,
};

function policyToForm(p: RiskPolicy | null): FormState {
  if (!p) return EMPTY;
  return {
    maxDailyLossUsd: p.maxDailyLossUsd != null ? String(p.maxDailyLossUsd) : '',
    maxDailyLossPct: p.maxDailyLossPct != null ? String(p.maxDailyLossPct) : '',
    maxDrawdownPct: p.maxDrawdownPct != null ? String(p.maxDrawdownPct) : '',
    maxOpenTrades: p.maxOpenTrades != null ? String(p.maxOpenTrades) : '',
    riskPerTradePct: p.riskPerTradePct != null ? String(p.riskPerTradePct) : '',
    minWinRate: p.minWinRate != null ? String(p.minWinRate) : '',
    dailyWinTargetUsd: p.dailyWinTargetUsd != null ? String(p.dailyWinTargetUsd) : '',
    autoStopAfterLoss: !!p.autoStopAfterLoss,
    autoStopAfterWin: !!p.autoStopAfterWin,
  };
}

const numOrUndef = (v: string): number | undefined => {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export default function TradingSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [isDirty, setIsDirty] = React.useState(false);

  const policyQuery = useQuery({
    queryKey: ['risk-policy'],
    queryFn: () => riskApi.getPolicy(),
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (policyQuery.data !== undefined) {
      setForm(policyToForm(policyQuery.data));
      setIsDirty(false);
    }
  }, [policyQuery.data]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setIsDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      riskApi.updatePolicy({
        maxDailyLossUsd: numOrUndef(form.maxDailyLossUsd) ?? null,
        maxDailyLossPct: numOrUndef(form.maxDailyLossPct) ?? null,
        maxDrawdownPct: numOrUndef(form.maxDrawdownPct) ?? null,
        maxOpenTrades: numOrUndef(form.maxOpenTrades) ?? null,
        riskPerTradePct: numOrUndef(form.riskPerTradePct) ?? null,
        minWinRate: numOrUndef(form.minWinRate) ?? null,
        dailyWinTargetUsd: numOrUndef(form.dailyWinTargetUsd) ?? null,
        autoStopAfterLoss: form.autoStopAfterLoss,
        autoStopAfterWin: form.autoStopAfterWin,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-policy'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-risk'] });
      setIsDirty(false);
      toast.success('Risk policy saved', {
        description: 'Limits are now enforced before every trade.',
      });
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      toast.error('Could not save risk policy', {
        description: err?.response?.data?.error || err?.message || 'Please try again.',
      });
    },
  });

  if (policyQuery.isPending) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading risk settings">
        <div className="dashboard-card h-28" />
        <div className="dashboard-card h-48" />
        <div className="dashboard-card h-32" />
      </div>
    );
  }

  if (policyQuery.isError) {
    return (
      <DashErrorState
        message="Couldn't load your risk policy."
        onRetry={() => void policyQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">How these limits work</p>
        <p className="mt-1 leading-relaxed">
          Hard caps are checked before orders. Leave a field blank to disable that limit. Automatic
          protection can pause copying and flatten when a breach is detected — enable thoughtfully.
        </p>
      </div>

      <SettingsSection
        title="Risk limits"
        description="Hard caps enforced before every order — on bots, copy trades, and manual entries."
      >
        <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
          <SettingsField
            label="Max daily loss (USD)"
            hint="Halts trading once today's realized loss reaches this amount."
          >
            <SettingsInput
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="e.g. 500"
              value={form.maxDailyLossUsd}
              onChange={(e) => set('maxDailyLossUsd', e.target.value)}
            />
          </SettingsField>

          <SettingsField
            label="Max daily loss (%)"
            hint="Blocks entries when today's loss exceeds this % of equity."
          >
            <SettingsInput
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              placeholder="e.g. 5"
              value={form.maxDailyLossPct}
              onChange={(e) => set('maxDailyLossPct', e.target.value)}
            />
          </SettingsField>

          <SettingsField
            label="Min win rate (%)"
            hint="Optional gate — blocks new trades when rolling win rate falls below this."
          >
            <SettingsInput
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              placeholder="e.g. 40"
              value={form.minWinRate}
              onChange={(e) => set('minWinRate', e.target.value)}
            />
          </SettingsField>

          <SettingsField
            label="Max drawdown (%)"
            hint="Blocks new entries once account drawdown exceeds this percentage."
          >
            <SettingsInput
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              placeholder="e.g. 15"
              value={form.maxDrawdownPct}
              onChange={(e) => set('maxDrawdownPct', e.target.value)}
            />
          </SettingsField>

          <SettingsField
            label="Max open trades"
            hint="Rejects new positions while this many trades are already open."
          >
            <SettingsInput
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="e.g. 10"
              value={form.maxOpenTrades}
              onChange={(e) => set('maxOpenTrades', e.target.value)}
            />
          </SettingsField>

          <SettingsField
            label="Risk per trade (%)"
            hint="Used by position-size suggestions and analytics."
          >
            <SettingsInput
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              placeholder="e.g. 1"
              value={form.riskPerTradePct}
              onChange={(e) => set('riskPerTradePct', e.target.value)}
            />
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Automatic protection"
        description="When a hard limit is breached, Profytron can pause bots/copy and close open positions."
      >
        {(form.autoStopAfterLoss || form.autoStopAfterWin) && (
          <div
            role="status"
            className="mb-4 flex gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-foreground"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <p>
              Auto-stop is enabled. A limit breach can close open positions and pause automation —
              confirm thresholds carefully before saving.
            </p>
          </div>
        )}
        <SettingsToggle
          label="Auto-stop on limit breach"
          description="Pause active bot/copy subscriptions and close open trades when a daily-loss or drawdown limit is hit."
          checked={form.autoStopAfterLoss}
          onChange={(v) => set('autoStopAfterLoss', v)}
        />
        <SettingsToggle
          label="Auto-stop after daily win target"
          description="Pause automation when today's realized profit exceeds your win threshold."
          checked={form.autoStopAfterWin}
          onChange={(v) => set('autoStopAfterWin', v)}
        />
        {form.autoStopAfterWin && (
          <SettingsField
            label="Daily win target ($)"
            hint="Once today's realized profit reaches this amount, new trades are blocked for the rest of the day."
          >
            <SettingsInput
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="e.g. 200"
              value={form.dailyWinTargetUsd}
              onChange={(e) => set('dailyWinTargetUsd', e.target.value)}
            />
          </SettingsField>
        )}
      </SettingsSection>

      <SettingsSection title="Connected brokers" description="Brokers linked for live execution.">
        <p className="text-sm text-muted-foreground">
          Manage broker connections from{' '}
          <Link
            href="/connected-accounts"
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Connected accounts
          </Link>
          {' '}or{' '}
          <Link
            href="/get-bots"
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Get Bots
          </Link>
          .
        </p>
      </SettingsSection>

      <div className="flex flex-col-reverse items-stretch gap-3 border-t border-[var(--card-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
        </p>
        <DashButton
          onClick={() => saveMutation.mutate()}
          disabled={!isDirty || saveMutation.isPending || policyQuery.isLoading}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save risk policy'}
        </DashButton>
      </div>
    </div>
  );
}
