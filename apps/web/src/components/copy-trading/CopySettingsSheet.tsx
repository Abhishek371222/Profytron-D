'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copyTradingApi } from '@/lib/api/copy-trading';
import { toast } from 'sonner';

interface Props {
  subscription: {
    id: string;
    lotMultiplier: number;
    status: string;
    strategy?: { name: string };
  };
  onClose: () => void;
}

const PLAN_MAX_LOT: Record<string, number> = {
  'Basic Copy': 0.5,
  'Pro Copy': 2.0,
  'VIP Copy': 5.0,
};

export function CopySettingsSheet({ subscription, onClose }: Props) {
  const maxLot = PLAN_MAX_LOT[subscription.strategy?.name ?? ''] ?? 2.0;
  const [lotMultiplier, setLotMultiplier] = React.useState(subscription.lotMultiplier ?? 1.0);
  const [isPaused, setIsPaused] = React.useState(subscription.status === 'PAUSED');
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await copyTradingApi.updateSubscription(subscription.id, { lotMultiplier, isPaused });
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
              <h2 className="text-base font-semibold text-text-primary">Copy Settings</h2>
              <p className="text-xs text-text-secondary mt-0.5">{subscription.strategy?.name ?? 'Subscription'}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-text-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {/* Lot multiplier */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-primary">Lot Multiplier</label>
                <span className="text-sm font-semibold text-violet-400">{lotMultiplier.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={maxLot}
                step={0.01}
                value={lotMultiplier}
                onChange={(e) => setLotMultiplier(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>0.01x</span>
                <span>{maxLot}x (plan max)</span>
              </div>
              <p className="text-xs text-text-secondary mt-2">
                If the master opens 1.0 lot, you trade {lotMultiplier.toFixed(2)} lot.
              </p>
            </div>

            {/* Pause toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border-default">
              <div>
                <p className="text-sm font-medium text-text-primary">Pause copying</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  No new trades while paused. Existing open trades are unaffected.
                </p>
              </div>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isPaused ? 'bg-amber-500' : 'bg-gray-600'
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
