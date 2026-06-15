'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  value: {
    priceMax: number;
    selectedRisks: string[];
    selectedAssets: string[];
    selectedTimeframes: string[];
    verifiedOnly: boolean;
  };
  onChange: (value: {
    priceMax: number;
    selectedRisks: string[];
    selectedAssets: string[];
    selectedTimeframes: string[];
    verifiedOnly: boolean;
  }) => void;
  onApply: () => void;
  onSavePreset: () => void;
}

const RISK_LEVELS = [
  { id: 'low',    label: 'Low',    color: 'bg-chart-3' },
  { id: 'medium', label: 'Medium', color: 'bg-chart-4'   },
  { id: 'high',   label: 'High',   color: 'bg-red-500'     },
  { id: 'expert', label: 'Expert', color: 'bg-purple-500'  },
];

const ASSETS     = ['Forex', 'Crypto', 'Indices', 'Commodities'];
const TIMEFRAMES = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];

function FilterContent({
  value,
  onChange,
  onApply,
  onSavePreset,
  onClose,
}: Omit<FilterSidebarProps, 'isOpen'>) {
  const { priceMax: price, selectedRisks, selectedAssets, selectedTimeframes, verifiedOnly } = value;

  const toggleRisk = (id: string) => {
    const next = selectedRisks.includes(id)
      ? selectedRisks.filter(r => r !== id)
      : [...selectedRisks, id];
    onChange({ ...value, selectedRisks: next });
  };

  const toggleTimeframe = (timeframe: string) => {
    const upper = timeframe.toUpperCase();
    const next = selectedTimeframes.includes(upper)
      ? selectedTimeframes.filter(item => item !== upper)
      : [...selectedTimeframes, upper];
    onChange({ ...value, selectedTimeframes: next });
  };

  const activeCount = selectedRisks.length + selectedAssets.length + selectedTimeframes.length;

  return (
    <>
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
              {activeCount}
            </span>
          )}
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-muted/6 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-7 scrollbar-hide">
        {/* Price Range */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground">Monthly Fee</h4>
            <span className="text-caption font-semibold text-foreground font-mono">
              {price === 0 ? 'All prices' : `₹0 – ₹${price.toLocaleString()}`}
            </span>
          </div>
          <div className="relative pt-2">
            <input
              type="range"
              min="0"
              max="10000"
              step="500"
              value={price}
              onChange={e => onChange({ ...value, priceMax: parseInt(e.target.value) })}
              className="w-full h-1 bg-foreground/10 rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="text-xs font-medium text-muted-foreground">Free</span>
              <span className="text-xs font-medium text-muted-foreground">Premium Elite</span>
            </div>
          </div>
        </div>

        {/* Risk Level */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground">Risk Exposure</h4>
          <div className="grid grid-cols-2 gap-2">
            {RISK_LEVELS.map(risk => (
              <button
                key={risk.id}
                onClick={() => toggleRisk(risk.id)}
                className={cn(
                  'p-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2.5 relative overflow-hidden',
                  selectedRisks.includes(risk.id)
                    ? 'bg-foreground/5 border-border shadow-xl'
                    : 'bg-transparent border-border hover:border-border',
                )}
              >
                <div className={cn('w-2 h-2 rounded-full', risk.color, selectedRisks.includes(risk.id) ? 'shadow-[0_0_8px_currentColor]' : 'opacity-30')} />
                <span className={cn('text-xs font-semibold', selectedRisks.includes(risk.id) ? 'text-foreground' : 'text-muted-foreground')}>
                  {risk.label}
                </span>
                <AnimatePresence>
                  {selectedRisks.includes(risk.id) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute top-2 right-2"
                    >
                      <Check className="w-3 h-3 text-primary" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </div>

        {/* Asset Class */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground">Asset Universe</h4>
          <div className="flex flex-wrap gap-2">
            {ASSETS.map(asset => (
              <button
                key={asset}
                onClick={() => {
                  const next = selectedAssets.includes(asset)
                    ? selectedAssets.filter(a => a !== asset)
                    : [...selectedAssets, asset];
                  onChange({ ...value, selectedAssets: next });
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  selectedAssets.includes(asset)
                    ? 'bg-primary/20 border-primary/50 text-primary border'
                    : 'bg-foreground/5 border border-border text-foreground/30 hover:border-border',
                )}
              >
                {asset}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframes */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground">Resolution</h4>
          <div className="grid grid-cols-3 gap-2">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => toggleTimeframe(tf)}
                className={cn(
                  'py-2 rounded-lg border text-xs font-semibold transition-all',
                  selectedTimeframes.includes(tf)
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-foreground/5 border-border text-foreground/25 hover:text-foreground hover:border-border',
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Verification */}
        <div className="pt-1">
          <div className="p-3 rounded-xl glass-strong border border-border flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Verified Only</span>
              <span className="text-xs text-muted-foreground mt-0.5">Show only audited creators</span>
            </div>
            <button
              onClick={() => onChange({ ...value, verifiedOnly: !verifiedOnly })}
              className={cn(
                'w-10 h-5 rounded-full relative cursor-pointer p-1 transition-colors',
                verifiedOnly ? 'bg-primary/40 hover:bg-primary/50' : 'bg-foreground/10 hover:bg-foreground/20',
              )}
            >
              <div className={cn('w-3 h-3 rounded-full bg-foreground/90 transition-transform', verifiedOnly && 'translate-x-5')} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-5 space-y-2.5 border-t border-border shrink-0">
        <Button
          onClick={onApply}
          className="w-full h-10 rounded-xl bg-primary hover:bg-primary text-primary-foreground font-semibold text-sm"
        >
          Apply Filters
        </Button>
        <button
          onClick={onSavePreset}
          className="w-full text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1"
        >
          Save Preset
        </button>
        <button
          onClick={() => onChange({ ...value, selectedRisks: [], selectedAssets: [], selectedTimeframes: [], verifiedOnly: false, priceMax: 0 })}
          className="w-full text-xs font-semibold text-destructive/70 hover:text-destructive transition-colors py-1"
        >
          Reset All
        </button>
      </div>
    </>
  );
}

export function FilterSidebar({ isOpen, onClose, value, onChange, onApply, onSavePreset }: FilterSidebarProps) {
  return (
    <>
      {/* ── Desktop inline sidebar (lg+) ───────────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex w-[292px] border-r border-[var(--card-border)] bg-card/80 backdrop-blur-3xl flex-col shrink-0 transition-all duration-300 relative z-40',
          !isOpen && '-ml-[280px]',
        )}
      >
        <FilterContent
          value={value}
          onChange={onChange}
          onApply={onApply}
          onSavePreset={onSavePreset}
          onClose={onClose}
        />
      </aside>

      {/* ── Mobile bottom-sheet overlay (< lg) ─────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="filter-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              key="filter-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="lg:hidden fixed bottom-0 inset-x-0 z-[61] flex flex-col bg-card border-t border-[var(--card-border)] rounded-t-3xl max-h-[82dvh] overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-foreground/15" />
              </div>
              <FilterContent
                value={value}
                onChange={onChange}
                onApply={() => { onApply(); onClose(); }}
                onSavePreset={onSavePreset}
                onClose={onClose}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
