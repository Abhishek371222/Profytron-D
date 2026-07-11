'use client';

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIsoDate(value: string) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDisplay(value: string) {
  const parsed = parseIsoDate(value);
  if (!parsed) return 'Select date';
  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function WalletDatePicker({
  value,
  onChange,
  min,
  max,
  ariaLabel,
  placeholder = 'Select date',
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  ariaLabel: string;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const today = React.useMemo(() => toIsoDate(new Date()), []);
  const effectiveMax = max && max < today ? max : max || today;

  const initialMonth = parseIsoDate(value) ?? parseIsoDate(effectiveMax) ?? new Date();
  const [viewYear, setViewYear] = React.useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(initialMonth.getMonth());

  React.useEffect(() => {
    if (!open) return;
    const anchor = parseIsoDate(value) ?? parseIsoDate(min) ?? parseIsoDate(effectiveMax) ?? new Date();
    setViewYear(anchor.getFullYear());
    setViewMonth(anchor.getMonth());
  }, [open, value, min, effectiveMax]);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const minDate = parseIsoDate(min || '');
  const maxDate = parseIsoDate(effectiveMax);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const cells: Array<{ iso: string; day: number; disabled: boolean; outOfRange: boolean } | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(viewYear, viewMonth, day);
    const iso = toIsoDate(date);
    const beforeMin = Boolean(minDate && date < minDate);
    const afterMax = Boolean(maxDate && date > maxDate);
    const disabled = beforeMin || afterMax;
    cells.push({ iso, day, disabled, outOfRange: disabled });
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const canGoPrev = (() => {
    if (!minDate) return true;
    const prevLast = new Date(viewYear, viewMonth, 0);
    return prevLast >= minDate;
  })();

  const canGoNext = (() => {
    if (!maxDate) return true;
    const nextFirst = new Date(viewYear, viewMonth + 1, 1);
    return nextFirst <= maxDate;
  })();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex h-8 items-center gap-2 rounded-lg border border-[var(--card-border)] bg-card pl-2.5 pr-3 text-xs outline-none transition-colors',
          'hover:border-primary/30 focus-visible:border-primary/40',
          value ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="whitespace-nowrap">{value ? formatDisplay(value) : placeholder}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className="absolute left-0 z-50 mt-2 w-[272px] rounded-xl border border-[var(--card-border)] bg-popover p-3 shadow-[var(--shadow-lg)]"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              disabled={!canGoPrev}
              onClick={() => {
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear((y) => y - 1);
                } else {
                  setViewMonth((m) => m - 1);
                }
              }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg border border-transparent transition-colors',
                canGoPrev
                  ? 'text-foreground hover:bg-muted'
                  : 'cursor-not-allowed text-muted-foreground/40',
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-xs font-semibold text-foreground">{monthLabel}</p>
            <button
              type="button"
              aria-label="Next month"
              disabled={!canGoNext}
              onClick={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear((y) => y + 1);
                } else {
                  setViewMonth((m) => m + 1);
                }
              }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg border border-transparent transition-colors',
                canGoNext
                  ? 'text-foreground hover:bg-muted'
                  : 'cursor-not-allowed text-muted-foreground/40',
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((label) => (
              <div
                key={label}
                className="flex h-7 items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, index) => {
              if (!cell) {
                return <div key={`empty-${index}`} className="h-8" />;
              }
              const selected = cell.iso === value;
              const isToday = cell.iso === today;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={cell.disabled}
                  aria-disabled={cell.disabled}
                  aria-pressed={selected}
                  onClick={() => {
                    if (cell.disabled) return;
                    onChange(cell.iso);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex h-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                    cell.disabled &&
                      'cursor-not-allowed bg-muted/40 text-muted-foreground/45 pointer-events-none',
                    !cell.disabled && !selected && 'text-foreground hover:bg-muted',
                    selected && 'bg-primary text-primary-foreground hover:bg-primary',
                    !cell.disabled && !selected && isToday && 'ring-1 ring-primary/40',
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="mt-2 w-full rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
