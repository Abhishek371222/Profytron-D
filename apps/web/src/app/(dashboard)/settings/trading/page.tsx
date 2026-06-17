'use client';

import React from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SettingsSection,
  SettingsToggle,
  SettingsField,
  SettingsInput,
} from '@/components/settings/SettingsUi';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';
import { riskApi, type RiskPolicy } from '@/lib/api/risk';

type FormState = {
  maxDailyLossUsd: string;
  maxDrawdownPct: string;
  maxOpenTrades: string;
  riskPerTradePct: string;
  autoStopAfterLoss: boolean;
};

const EMPTY: FormState = {
  maxDailyLossUsd: '',
  maxDrawdownPct: '',
  maxOpenTrades: '',
  riskPerTradePct: '',
  autoStopAfterLoss: false,
};

function policyToForm(p: RiskPolicy | null): FormState {
  if (!p) return EMPTY;
  return {
    maxDailyLossUsd: p.maxDailyLossUsd != null ? String(p.maxDailyLossUsd) : '',
    maxDrawdownPct: p.maxDrawdownPct != null ? String(p.maxDrawdownPct) : '',
    maxOpenTrades: p.maxOpenTrades != null ? String(p.maxOpenTrades) : '',
    riskPerTradePct: p.riskPerTradePct != null ? String(p.riskPerTradePct) : '',
    autoStopAfterLoss: !!p.autoStopAfterLoss,
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
        maxDrawdownPct: numOrUndef(form.maxDrawdownPct) ?? null,
        maxOpenTrades: numOrUndef(form.maxOpenTrades) ?? null,
        riskPerTradePct: numOrUndef(form.riskPerTradePct) ?? null,
        autoStopAfterLoss: form.autoStopAfterLoss,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-policy'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-risk'] });
      setIsDirty(false);
      toast.success('Risk policy saved', {
        description: 'Limits are now enforced before every trade.',
      });
    },
    onError: (e: any) =>
      toast.error('Could not save risk policy', {
        description: e?.response?.data?.error || e?.message,
      }),
  });

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Risk limits"
        description="Hard caps enforced before every order — on copy trades, signals, and manual entries. Leave a field blank to disable that limit."
      >
        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
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
        description="When a hard limit (daily loss or drawdown) is breached, automatically pause copying and close open positions."
      >
        <SettingsToggle
          label="Auto-stop on limit breach"
          description="Pause all active copy subscriptions and close open trades when a daily-loss or drawdown limit is hit."
          checked={form.autoStopAfterLoss}
          onChange={(v) => set('autoStopAfterLoss', v)}
        />
      </SettingsSection>

      <SettingsSection title="Connected brokers" description="Brokers linked for live execution.">
        <p className="text-sm text-muted-foreground">
          Manage broker connections from{' '}
          <a href="/copy-trading" className="text-primary hover:underline">Copy Trading</a>
          {' '}or the dashboard connect flow.
        </p>
      </SettingsSection>

      <div className="flex justify-end pt-2 border-t border-[var(--card-border)]">
        <DashButton
          onClick={() => saveMutation.mutate()}
          disabled={!isDirty || saveMutation.isPending || policyQuery.isLoading}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save Risk Policy'}
        </DashButton>
      </div>
    </div>
  );
}
