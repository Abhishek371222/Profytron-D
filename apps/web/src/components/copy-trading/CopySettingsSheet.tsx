'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copyTradingApi, type SizingMode } from '@/lib/api/copy-trading';
import { formatBotName } from '@/lib/bot-labels';
import { toast } from 'sonner';

interface Props {
  subscription: {
    id: string;
    lotMultiplier: number;
    status: string;
    strategy?: { name: string };
    sizingMode?: SizingMode;
    fixedLot?: number | null;
  };
  onClose: () => void;
}

const SIZING_MODES: { id: SizingMode; label: string; hint: string }[] = [
  { id: 'MULTIPLIER', label: 'Multiplier', hint: 'Scale the master’s lot by a fixed factor.' },
  { id: 'EQUITY_RATIO', label: 'Equity ratio', hint: 'Size relative to your equity vs the master’s.' },
  { id: 'FIXED', label: 'Fixed lot', hint: 'Trade the same lot on every copied signal.' },
];

const PLAN_MAX_LOT: Record<string, number> = {
  'Basic Bot': 0.5,
  'Basic Copy': 0.5,
  'Pro Bot': 2.0,
  'Pro Copy': 2.0,
  'VIP Bot': 5.0,
  'VIP Copy': 5.0,
  'Profytron Master Bot': 2.0,
  'Profytron Master Copy': 2.0,
};

export function CopySettingsSheet({ subscription, onClose }: Props) {
  const maxLot = PLAN_MAX_LOT[subscription.strategy?.name ?? ''] ?? 2.0;
  const [lotMultiplier, setLotMultiplier] = React.useState(subscription.lotMultiplier ?? 1.0);
  const [sizingMode, setSizingMode] = React.useState<SizingMode>(
    subscription.sizingMode ?? 'MULTIPLIER',
  );
  const [fixedLot, setFixedLot] = React.useState(subscription.fixedLot ?? 0.1);
  const [isPaused, setIsPaused] = React.useState(subscription.status === 'PAUSED');
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await copyTradingApi.setSizing(subscription.id, {
        sizingMode,
        multiplier: lotMultiplier,
        fixedLot: sizingMode === 'FIXED' ? fixedLot : undefined,
      });
      // Pause/resume is owned by the subscription endpoint.
      if (isPaused !== (subscription.status === 'PAUSED')) {
        await copyTradingApi.updateSubscription(subscription.id, { isPaused });
      }
      toast.success('Settings saved');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          className="w-full sm:w-96 h-full sm:max-h-[100dvh] flex flex-col border-l border-border-default bg-bg-elevated glass shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Bot Settings</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {formatBotName(subscription.strategy?.name ?? 'Bot')}
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-foreground/5 text-text-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {/* Sizing mode */}
            <div>
              <label className="text-sm font-medium text-text-primary">Position sizing</label>
              <div className="grid grid-cols-3 gap-1.5 mt-2 p-1 rounded-xl border border-border-default bg-foreground/5">
                {SIZING_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSizingMode(m.id)}
                    className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      sizingMode === m.id
                        ? 'bg-chart-2 text-white shadow'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-2">
                {SIZING_MODES.find((m) => m.id === sizingMode)?.hint}
              </p>
            </div>

            {/* Fixed lot input */}
            {sizingMode === 'FIXED' ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-primary">Fixed lot size</label>
                  <span className="text-sm font-semibold text-chart-2">{fixedLot.toFixed(2)}</span>
                </div>
                <input
                  type="number"
                  min={0.01}
                  max={maxLot}
                  step={0.01}
                  value={fixedLot}
                  onChange={(e) => setFixedLot(Number(e.target.value))}
                  className="w-full rounded-lg border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-chart-2/40"
                />
                <p className="text-xs text-text-secondary mt-2">
                  Every copied trade opens exactly {fixedLot.toFixed(2)} lot, regardless of the master’s size.
                </p>
              </div>
            ) : (
              /* Lot multiplier (MULTIPLIER + EQUITY_RATIO) */
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-primary">
                    {sizingMode === 'EQUITY_RATIO' ? 'Risk multiplier' : 'Lot Multiplier'}
                  </label>
                  <span className="text-sm font-semibold text-chart-2">{lotMultiplier.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={maxLot}
                  step={0.01}
                  value={lotMultiplier}
                  onChange={(e) => setLotMultiplier(Number(e.target.value))}
                  className="w-full accent-chart-2"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>0.01x</span>
                  <span>{maxLot}x (plan max)</span>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  {sizingMode === 'EQUITY_RATIO'
                    ? `Lots scale with your equity vs the master’s, then ×${lotMultiplier.toFixed(2)}.`
                    : `When the operator bot opens 1.0 lot, your bot trades ${lotMultiplier.toFixed(2)} lot.`}
                </p>
              </div>
            )}

            {/* Pause toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border-default">
              <div>
                <p className="text-sm font-medium text-text-primary">Pause bot</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  No new trades while paused. Existing open trades are unaffected.
                </p>
              </div>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isPaused ? 'bg-chart-4' : 'bg-muted-foreground/40'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    isPaused ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border-default flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Settings
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
