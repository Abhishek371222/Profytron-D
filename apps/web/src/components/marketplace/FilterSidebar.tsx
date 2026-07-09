"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  { id: "low", label: "Low", tone: "bg-primary" },
  { id: "medium", label: "Medium", tone: "bg-secondary" },
  { id: "high", label: "High", tone: "bg-destructive" },
  { id: "expert", label: "Expert", tone: "bg-[var(--primary-active)]" },
];

const ASSETS = ["Forex", "Crypto", "Indices", "Commodities"];
const TIMEFRAMES = ["M1", "M5", "M15", "H1", "H4", "D1"];

function FilterContent({
  value,
  onChange,
  onApply,
  onSavePreset,
  onClose,
}: Omit<FilterSidebarProps, "isOpen">) {
  const { priceMax: price, selectedRisks, selectedAssets, selectedTimeframes, verifiedOnly } = value;

  const toggleRisk = (id: string) => {
    const next = selectedRisks.includes(id)
      ? selectedRisks.filter((r) => r !== id)
      : [...selectedRisks, id];
    onChange({ ...value, selectedRisks: next });
  };

  const toggleTimeframe = (timeframe: string) => {
    const upper = timeframe.toUpperCase();
    const next = selectedTimeframes.includes(upper)
      ? selectedTimeframes.filter((item) => item !== upper)
      : [...selectedTimeframes, upper];
    onChange({ ...value, selectedTimeframes: next });
  };

  const activeCount = selectedRisks.length + selectedAssets.length + selectedTimeframes.length;

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--card-border)] p-5">
        <div className="flex items-center gap-2.5">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Filters</h3>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] text-[11px] font-bold text-primary">
              {activeCount}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-8 w-8 items-center justify-center rounded-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto p-5 scrollbar-hide">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Pricing</h4>
            <span className="font-mono text-caption font-semibold text-foreground">
              {price === 0 ? "All prices" : `$0 – $${price.toLocaleString()}`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10000"
            step="500"
            value={price}
            onChange={(e) => onChange({ ...value, priceMax: parseInt(e.target.value, 10) })}
            aria-label="Maximum price"
            className="marketplace-range h-1.5 w-full cursor-pointer appearance-none rounded-full"
          />
          <div className="flex justify-between px-1 text-[11px] font-medium text-muted-foreground">
            <span>Free</span>
            <span>Premium</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Risk</h4>
          <div className="grid grid-cols-2 gap-2">
            {RISK_LEVELS.map((risk) => {
              const active = selectedRisks.includes(risk.id);
              return (
                <button
                  key={risk.id}
                  type="button"
                  onClick={() => toggleRisk(risk.id)}
                  className={cn(
                    "relative flex items-center gap-2.5 overflow-hidden rounded-[14px] border p-2.5 transition-all duration-200",
                    active
                      ? "border-[color-mix(in_srgb,var(--primary)_35%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]"
                      : "border-[var(--card-border)] bg-transparent hover:border-[color-mix(in_srgb,var(--primary)_18%,var(--card-border))] hover:bg-[color-mix(in_srgb,var(--teal-tint-1)_8%,transparent)]",
                  )}
                >
                  <div className={cn("h-2 w-2 rounded-full", risk.tone, !active && "opacity-35")} />
                  <span className={cn("text-xs font-semibold", active ? "text-foreground" : "text-muted-foreground")}>
                    {risk.label}
                  </span>
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-2 right-2"
                      >
                        <Check className="h-3 w-3 text-primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Markets</h4>
          <div className="flex flex-wrap gap-2">
            {ASSETS.map((asset) => {
              const active = selectedAssets.includes(asset);
              return (
                <button
                  key={asset}
                  type="button"
                  onClick={() => {
                    const next = selectedAssets.includes(asset)
                      ? selectedAssets.filter((a) => a !== asset)
                      : [...selectedAssets, asset];
                    onChange({ ...value, selectedAssets: next });
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                    active
                      ? "border-[color-mix(in_srgb,var(--primary)_40%,var(--card-border))] bg-primary text-primary-foreground"
                      : "border-[var(--card-border)] bg-[color-mix(in_srgb,var(--muted)_35%,transparent)] text-muted-foreground hover:border-[color-mix(in_srgb,var(--primary)_20%,var(--card-border))] hover:text-foreground",
                  )}
                >
                  {asset}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Timeframe</h4>
          <div className="grid grid-cols-3 gap-2">
            {TIMEFRAMES.map((tf) => {
              const active = selectedTimeframes.includes(tf);
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => toggleTimeframe(tf)}
                  className={cn(
                    "rounded-[12px] border py-2 text-xs font-semibold transition-all duration-200",
                    active
                      ? "border-[color-mix(in_srgb,var(--primary)_40%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary"
                      : "border-[var(--card-border)] text-muted-foreground hover:border-[color-mix(in_srgb,var(--primary)_18%,var(--card-border))] hover:text-foreground",
                  )}
                >
                  {tf}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[14px] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--muted)_30%,transparent)] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-sm font-semibold text-foreground">Verified Only</span>
              <p className="mt-0.5 text-xs text-muted-foreground">Audited creators and live track records</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...value, verifiedOnly: !verifiedOnly })}
              className={cn(
                "relative h-6 w-11 rounded-full p-0.5 transition-colors duration-200",
                verifiedOnly ? "bg-primary" : "bg-[color-mix(in_srgb,var(--muted)_80%,transparent)]",
              )}
              aria-pressed={verifiedOnly}
              aria-label="Show verified creators only"
            >
              <div
                className={cn(
                  "h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                  verifiedOnly && "translate-x-5",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-[var(--card-border)] p-5">
        <Button variant="primary" onClick={onApply} className="w-full">
          Apply Filters
        </Button>
        <button
          type="button"
          onClick={onSavePreset}
          className="w-full py-1 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          Save Preset
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              selectedRisks: [],
              selectedAssets: [],
              selectedTimeframes: [],
              verifiedOnly: false,
              priceMax: 0,
            })
          }
          className="w-full py-1 text-xs font-semibold text-destructive/80 transition-colors hover:text-destructive"
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
      <aside
        className={cn(
          "relative z-40 hidden shrink-0 overflow-hidden transition-[width] duration-300 lg:sticky lg:top-0 lg:block lg:max-h-[calc(100dvh-5.5rem)] lg:self-start",
          isOpen ? "lg:w-[clamp(16rem,18vw,18.25rem)]" : "lg:w-0",
        )}
        aria-hidden={!isOpen}
      >
        <div
          className={cn(
            "marketplace-filter-panel flex h-full min-h-[20rem] w-[clamp(16rem,18vw,18.25rem)] flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card/95 shadow-[var(--shadow-md)] backdrop-blur-xl marketplace-elevation-filter",
            "py-4 pl-[var(--dashboard-p)] pr-2",
            !isOpen && "pointer-events-none opacity-0",
          )}
        >
          <FilterContent
            value={value}
            onChange={onChange}
            onApply={onApply}
            onSavePreset={onSavePreset}
            onClose={onClose}
          />
        </div>
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="filter-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-[60] bg-[var(--overlay)] backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="filter-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="marketplace-filter-panel fixed bottom-0 inset-x-0 z-[61] flex max-h-[82dvh] flex-col overflow-hidden rounded-t-[24px] border-t border-[var(--card-border)] lg:hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex shrink-0 justify-center pb-1 pt-3">
                <div className="h-1 w-10 rounded-full bg-muted" />
              </div>
              <FilterContent
                value={value}
                onChange={onChange}
                onApply={() => {
                  onApply();
                  onClose();
                }}
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
