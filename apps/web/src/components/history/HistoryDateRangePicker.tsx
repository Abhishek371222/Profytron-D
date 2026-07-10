'use client';

import React from 'react';
import { Calendar, Check } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';

export type HistoryPresetRange = '30D' | '60D' | '90D';

export type HistoryDateRange =
  | { type: 'preset'; preset: HistoryPresetRange }
  | { type: 'custom'; start: string; end: string };

const PRESET_OPTIONS: { key: HistoryPresetRange; label: string; days: number }[] = [
  { key: '30D', label: 'Last 30 days', days: 30 },
  { key: '60D', label: 'Last 60 days', days: 60 },
  { key: '90D', label: 'Last 90 days', days: 90 },
];

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getHistoryRangeDays(range: HistoryDateRange): number | null {
  if (range.type === 'preset') {
    return PRESET_OPTIONS.find((option) => option.key === range.preset)?.days ?? null;
  }
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T23:59:59.999`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export function isTradeWithinHistoryRange(tradeAt: string, range: HistoryDateRange, now = new Date()) {
  const tradeDate = new Date(tradeAt);
  if (Number.isNaN(tradeDate.getTime())) return false;

  if (range.type === 'preset') {
    const days = getHistoryRangeDays(range);
    if (!days) return true;
    const diffMs = now.getTime() - tradeDate.getTime();
    return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
  }

  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T23:59:59.999`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
  return tradeDate >= start && tradeDate <= end;
}

export function getHistoryRangeButtonLabel(range: HistoryDateRange) {
  if (range.type === 'preset') {
    const option = PRESET_OPTIONS.find((item) => item.key === range.preset);
    return option?.label ?? 'Select range';
  }
  if (!range.start || !range.end) return 'Custom range';
  return `${formatDisplayDate(range.start)} – ${formatDisplayDate(range.end)}`;
}

export function HistoryDateRangePicker({
  value,
  onChange,
  className,
}: {
  value: HistoryDateRange;
  onChange: (range: HistoryDateRange) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'menu' | 'custom'>(value.type === 'custom' ? 'custom' : 'menu');
  const [draftStart, setDraftStart] = React.useState(
    value.type === 'custom' ? value.start : formatInputDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
  );
  const [draftEnd, setDraftEnd] = React.useState(
    value.type === 'custom' ? value.end : formatInputDate(new Date()),
  );
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (value.type === 'custom') {
      setDraftStart(value.start);
      setDraftEnd(value.end);
    }
  }, [value]);

  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setMode(value.type === 'custom' ? 'custom' : 'menu');
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, value.type]);

  const selectPreset = (preset: HistoryPresetRange) => {
    onChange({ type: 'preset', preset });
    setMode('menu');
    setOpen(false);
  };

  const openCustomPanel = () => {
    setMode('custom');
    if (value.type === 'custom') {
      setDraftStart(value.start);
      setDraftEnd(value.end);
    }
  };

  const applyCustomRange = () => {
    if (!draftStart || !draftEnd) return;
    const start = new Date(`${draftStart}T00:00:00`);
    const end = new Date(`${draftEnd}T23:59:59.999`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    if (start > end) {
      onChange({ type: 'custom', start: draftEnd, end: draftStart });
    } else {
      onChange({ type: 'custom', start: draftStart, end: draftEnd });
    }
    setOpen(false);
    setMode('menu');
  };

  const customRangeError =
    draftStart && draftEnd && new Date(`${draftStart}T00:00:00`) > new Date(`${draftEnd}T23:59:59.999`)
      ? 'Start date must be on or before end date.'
      : null;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <DashButton
        type="button"
        variant="outline"
        className="gap-2 h-11 w-full justify-start"
        onClick={() => {
          setOpen((current) => {
            const next = !current;
            if (next) setMode(value.type === 'custom' ? 'custom' : 'menu');
            return next;
          });
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Calendar className="w-4 h-4 shrink-0" />
        <span className="truncate">{getHistoryRangeButtonLabel(value)}</span>
      </DashButton>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--card-border)] bg-popover/95 p-2 shadow-[var(--shadow-lg)] backdrop-blur-2xl">
          {mode === 'menu' ? (
            <div className="space-y-1">
              {PRESET_OPTIONS.map((option) => {
                const active = value.type === 'preset' && value.preset === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => selectPreset(option.key)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-[var(--radius-button)] px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <span>{option.label}</span>
                    {active && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={openCustomPanel}
                className={cn(
                  'flex w-full items-center justify-between rounded-[var(--radius-button)] px-3 py-2.5 text-sm transition-colors',
                  value.type === 'custom'
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                <span>Custom range</span>
                {value.type === 'custom' && <Check className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom range</p>
                <p className="text-xs text-muted-foreground">Choose a start and end date to filter trade history.</p>
              </div>

              <div className="space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">From</span>
                  <input
                    type="date"
                    value={draftStart}
                    max={draftEnd || undefined}
                    onChange={(event) => setDraftStart(event.target.value)}
                    className="dash-input h-11 w-full cursor-pointer"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">To</span>
                  <input
                    type="date"
                    value={draftEnd}
                    min={draftStart || undefined}
                    max={formatInputDate(new Date())}
                    onChange={(event) => setDraftEnd(event.target.value)}
                    className="dash-input h-11 w-full cursor-pointer"
                  />
                </label>
              </div>

              {customRangeError && (
                <p className="text-xs text-destructive">{customRangeError}</p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <DashButton
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setMode('menu');
                    if (value.type === 'custom') {
                      setDraftStart(value.start);
                      setDraftEnd(value.end);
                    }
                  }}
                >
                  Back
                </DashButton>
                <DashButton
                  type="button"
                  variant="primary"
                  className="flex-1"
                  disabled={!draftStart || !draftEnd}
                  onClick={applyCustomRange}
                >
                  Apply
                </DashButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
