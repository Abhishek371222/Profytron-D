'use client';

import React from 'react';
import { toast } from 'sonner';
import {
  SettingsSection,
  SettingsToggle,
} from '@/components/settings/SettingsUi';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';

export default function TradingSettingsPage() {
  const [paperMode, setPaperMode] = React.useState(true);
  const [autoScale, setAutoScale] = React.useState(false);
  const [slippage, setSlippage] = React.useState(0.5);
  const [maxDrawdown, setMaxDrawdown] = React.useState(10);
  const [isDirty, setIsDirty] = React.useState(false);

  const markDirty = () => setIsDirty(true);

  const handleSave = () => {
    setIsDirty(false);
    toast.success('Trading preferences saved');
  };

  return (
    <div className="space-y-8">
      <SettingsSection title="Execution mode" description="Control how trades are routed and simulated.">
        <div className="space-y-3">
          <SettingsToggle
            label="Paper trading"
            description="Execute against simulated fills without live broker risk."
            checked={paperMode}
            onChange={(v) => { setPaperMode(v); markDirty(); }}
          />
          <SettingsToggle
            label="Auto-scale position size"
            description="Adjust lot size based on account equity and strategy risk profile."
            checked={autoScale}
            onChange={(v) => { setAutoScale(v); markDirty(); }}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Risk limits" description="Hard caps applied before any order is sent.">
        <div className="grid gap-6 sm:grid-cols-2 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Max slippage (%)</label>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.1}
              value={slippage}
              onChange={(e) => { setSlippage(Number(e.target.value)); markDirty(); }}
              className="w-full accent-primary"
            />
            <p className="text-sm font-semibold text-primary tabular-nums">{slippage.toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Max drawdown (%)</label>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={maxDrawdown}
              onChange={(e) => { setMaxDrawdown(Number(e.target.value)); markDirty(); }}
              className="w-full accent-primary"
            />
            <p className="text-sm font-semibold text-primary tabular-nums">{maxDrawdown}%</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Connected brokers" description="Brokers linked for live execution.">
        <p className="text-sm text-muted-foreground">
          Manage broker connections from{' '}
          <a href="/copy-trading" className="text-primary hover:underline">Copy Trading</a>
          {' '}or the dashboard connect flow.
        </p>
      </SettingsSection>

      <div className="flex justify-end pt-2 border-t border-[var(--card-border)]">
        <DashButton onClick={handleSave} disabled={!isDirty}>Save Preferences</DashButton>
      </div>
    </div>
  );
}
