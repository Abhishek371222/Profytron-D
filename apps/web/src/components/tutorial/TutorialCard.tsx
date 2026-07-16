'use client';

import { ChevronLeft, X, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TourStep } from '@/lib/tours/mainTour';

type Props = {
  step: TourStep;
  index: number;
  total: number;
  /** Whether step.waitForAction has been satisfied. Advisory only — never blocks Next. */
  actionSatisfied: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  className?: string;
};

export function TutorialCard({ step, index, total, actionSatisfied, onBack, onNext, onSkip, className }: Props) {
  return (
    <div
      className={cn(
        'w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-primary/20 bg-popover p-4 shadow-[var(--shadow-modal)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-caption font-bold uppercase tracking-widest text-primary">
          Step {index + 1} of {total}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="text-foreground/30 hover:text-foreground/60 transition-colors"
          aria-label="Skip tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-heading-4 font-serif font-semibold text-foreground mb-1.5">{step.title}</h3>
      <p className="text-body-sm text-muted-foreground mb-3">{step.body}</p>

      {step.waitForAction && (
        <div
          className={cn(
            'mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-caption font-medium',
            actionSatisfied
              ? 'bg-chart-3/10 text-chart-3'
              : 'bg-primary/8 text-foreground/60',
          )}
        >
          {actionSatisfied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Done — nice work
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              Recommended now — but you can also do this later and click Next.
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-4">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              i <= index ? 'bg-primary' : 'bg-foreground/10',
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip tour
        </Button>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <Button variant="outline" size="icon-sm" onClick={onBack} aria-label="Previous step">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" onClick={onNext}>
            {index === total - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
